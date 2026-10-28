/**
 * api/audio.js - Analiza un audio: lo guarda, lo transcribe y propone los datos del recuerdo.
 * El análisis puede tardar, así que se hace en segundo plano y el cliente consulta el estado.
 *
 * El navegador envía dos partes: "audio" (el archivo original, que se conserva) y "pcm"
 * (el mismo audio ya decodificado a 16 kHz mono, para no depender de programas externos).
 */

const crypto = require('crypto');
const multer = require('multer');
const provider = require('../providers');
const { AUDIO_TYPES, registerMedia } = require('./media');
const db = require('../db');
const fs = require('fs');
const path = require('path');

// Registro de errores en data/errores.log (para diagnosticar sin ver la consola)
function logError(where, err) {
  const line = `[${new Date().toISOString()}] ${where}: ${err && err.stack ? err.stack : err}${err && err.cause ? ' | causa: ' + (err.cause.stack || err.cause) : ''}\n`;
  try { fs.appendFileSync(path.join(__dirname, '..', '..', 'data', 'errores.log'), line); } catch (e) { /* sin registro */ }
}

const MAX_AUDIO_BYTES = 150 * 1024 * 1024;
const SAMPLE_RATE = 16000;
const MAX_SECONDS = 20 * 60;
const MAX_PCM_BYTES = SAMPLE_RATE * MAX_SECONDS * 4;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 2, fields: 5 }
}).fields([{ name: 'audio', maxCount: 1 }, { name: 'pcm', maxCount: 1 }]);

const jobs = new Map(); // jobId -> { userId, status, mediaId, result?, error?, createdAt }

// Los trabajos terminados se olvidan pasada una hora
setInterval(() => {
  const limit = Date.now() - 3600 * 1000;
  for (const [id, j] of jobs) if (j.createdAt < limit) jobs.delete(id);
}, 600 * 1000).unref();

function receive(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo es demasiado grande (máximo 150 MB)' : 'No se pudo recibir el audio';
    res.status(400).json({ success: false, error: msg });
  });
}

function analyzeAudio(req, res) {
  const audio = req.files && req.files.audio && req.files.audio[0];
  const pcm = req.files && req.files.pcm && req.files.pcm[0];
  if (!audio || !pcm) return res.status(400).json({ success: false, error: 'Falta el audio' });

  const mime = String(audio.mimetype || '').split(';')[0].toLowerCase();
  const ext = AUDIO_TYPES[mime];
  if (!ext) return res.status(400).json({ success: false, error: 'Formato de audio no admitido' });
  if (pcm.size % 4 !== 0 || pcm.size < SAMPLE_RATE * 4 * 0.5) {
    return res.status(400).json({ success: false, error: 'El audio está vacío o es demasiado corto' });
  }
  if (pcm.size > MAX_PCM_BYTES) {
    return res.status(400).json({ success: false, error: `El audio supera los ${MAX_SECONDS / 60} minutos` });
  }

  const durationS = pcm.size / 4 / SAMPLE_RATE;
  const mediaId = registerMedia({
    userId: req.user.id, kind: 'audio', mime, originalName: audio.originalname,
    buffer: audio.buffer, ext, durationS
  });

  const jobId = crypto.randomBytes(12).toString('hex');
  const job = { userId: req.user.id, status: 'processing', mediaId, createdAt: Date.now() };
  jobs.set(jobId, job);

  // Copia alineada: el buffer de multer puede no empezar en múltiplo de 4
  const samples = new Float32Array(pcm.buffer.buffer.slice(pcm.buffer.byteOffset, pcm.buffer.byteOffset + pcm.buffer.byteLength));

  (async () => {
    try {
      const text = await provider.transcribe(samples);
      const draft = await provider.extract(text);
      job.result = { ...draft, media_id: mediaId, duration_s: durationS };
      job.status = 'done';
    } catch (err) {
      console.error('Error analizando audio:', err.message);
      logError('analizar audio', err);
      const net = /fetch|network|ENOTFOUND|ECONN|ETIMEDOUT|EAI_AGAIN|certificate|proxy|403|401|unable to get|Could not locate|download/i.test(String(err.message) + String(err.cause || ''));
      job.status = 'error';
      job.error = net
        ? 'No se pudo descargar el reconocimiento de voz (parece un problema de conexión o de la red de tu empresa). Puedes escribir el recuerdo a mano.'
        : 'No se pudo analizar el audio. Puedes escribir el recuerdo a mano.';
    }
  })();

  res.status(202).json({ success: true, data: { jobId, mediaId, duration_s: durationS } });
}

function getJob(req, res) {
  const job = jobs.get(req.params.id);
  if (!job || job.userId !== req.user.id) return res.status(404).json({ success: false, error: 'Trabajo no encontrado' });
  const engine = provider.getStatus();
  res.json({
    success: true,
    data: { status: job.status, result: job.result || null, error: job.error || null, engine: engine.state, engine_error: engine.message || null }
  });
}

module.exports = { receive, analyzeAudio, getJob };
