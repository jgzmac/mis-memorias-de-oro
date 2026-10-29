/**
 * api/visual.js - Analiza fotos y vídeos: guarda el archivo, lee sus metadatos
 * (fecha, lugar GPS, cámara), reconoce qué aparece y, en vídeos, transcribe lo que se dice.
 *
 * El navegador envía: "file" (original, se conserva), "frames" (1-4 imágenes JPEG reducidas para
 * el análisis visual: la propia foto o fotogramas del vídeo) y, en vídeo, "pcm" (audio a 16 kHz).
 */

const multer = require('multer');
const exifr = require('exifr');
const provider = require('../providers');
const vision = require('../providers/vision');
const { registerMedia } = require('./media');
const { startJob, logError } = require('./audio');
const { nearestPlace } = require('./places');

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif', 'image/gif': '.gif' };
const VIDEO_TYPES = { 'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm', 'video/x-m4v': '.m4v', 'video/3gpp': '.3gp' };
const SAMPLE_RATE = 16000;
const MAX_FILE = 300 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE, files: 6, fields: 6 }
}).fields([{ name: 'file', maxCount: 1 }, { name: 'frames', maxCount: 4 }, { name: 'pcm', maxCount: 1 }]);

function receive(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo es demasiado grande (máximo 300 MB)' : 'No se pudo recibir el archivo';
    res.status(400).json({ success: false, error: msg });
  });
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const validYear = (d) => d instanceof Date && !isNaN(d) && d.getFullYear() >= 1850 && d <= new Date(Date.now() + 86400000);

// Metadatos de una foto (EXIF)
async function readPhotoMeta(buffer) {
  try {
    const t = (await exifr.parse(buffer, ['DateTimeOriginal', 'CreateDate', 'Make', 'Model'])) || {};
    const g = (await exifr.gps(buffer).catch(() => null)) || {};
    const d = [t.DateTimeOriginal, t.CreateDate].find(validYear);
    return {
      date: d ? ymd(d) : '',
      lat: typeof g.latitude === 'number' ? g.latitude : null,
      lon: typeof g.longitude === 'number' ? g.longitude : null,
      camera: [t.Make, t.Model].filter(Boolean).join(' ').trim()
    };
  } catch (e) { return {}; }
}

// Metadatos de un vídeo MP4/MOV: fecha de creación (átomo mvhd) y posición GPS (©xyz)
function readVideoMeta(buffer) {
  const out = {};
  try {
    const len = buffer.length;
    const chunks = [buffer.subarray(0, Math.min(len, 8 * 1024 * 1024))];
    if (len > 16 * 1024 * 1024) chunks.push(buffer.subarray(len - 8 * 1024 * 1024));
    for (const c of chunks) {
      const i = c.indexOf('mvhd');
      if (i > 0 && !out.date) {
        const version = c[i + 4];
        const secs = version === 1 ? Number(c.readBigUInt64BE(i + 8)) : c.readUInt32BE(i + 8);
        const d = new Date((secs - 2082844800) * 1000); // de 1904 a 1970
        if (secs > 0 && validYear(d)) out.date = ymd(d);
      }
      const x = c.indexOf(Buffer.from([0xa9, 0x78, 0x79, 0x7a])); // ©xyz
      if (x > 0 && out.lat == null) {
        const m = c.toString('latin1', x + 4, x + 60).match(/([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/);
        if (m) { out.lat = parseFloat(m[1]); out.lon = parseFloat(m[2]); }
      }
    }
  } catch (e) { /* sin metadatos */ }
  return out;
}

function analyze(req, res) {
  const f = req.files && req.files.file && req.files.file[0];
  if (!f) return res.status(400).json({ success: false, error: 'Falta el archivo' });
  const mime = String(f.mimetype || '').split(';')[0].toLowerCase();
  const isImage = !!IMAGE_TYPES[mime];
  const isVideo = !!VIDEO_TYPES[mime];
  if (!isImage && !isVideo) return res.status(400).json({ success: false, error: 'Formato no admitido. Prueba con JPG, PNG o un vídeo MP4/MOV.' });

  const frames = (req.files.frames || []).filter(x => x.size > 0 && x.size < 8 * 1024 * 1024).map(x => x.buffer);
  const pcm = req.files.pcm && req.files.pcm[0];
  const lastModified = /^\d{10,14}$/.test(String(req.body.lastModified || '')) ? new Date(+req.body.lastModified) : null;
  const kind = isImage ? 'image' : 'video';
  const ext = (isImage ? IMAGE_TYPES : VIDEO_TYPES)[mime];
  const buffer = f.buffer;
  const duration = parseFloat(req.body.duration) || null;

  const mediaId = registerMedia({
    userId: req.user.id, kind, mime, originalName: f.originalname, buffer, ext, durationS: isVideo ? duration : null
  });

  const jobId = startJob(req.user.id, mediaId, async () => {
    const notes = [];
    const meta = isImage ? await readPhotoMeta(buffer) : readVideoMeta(buffer);

    // Fecha: metadatos > fecha del archivo (menos fiable)
    let date = meta.date || '';
    if (date) notes.push(`Fecha tomada de los datos ${isImage ? 'de la foto' : 'del vídeo'}.`);
    else if (validYear(lastModified)) { date = ymd(lastModified); notes.push('La foto no trae fecha propia: he usado la fecha del archivo, que puede no ser la real. Compruébala.'.replace('La foto', isImage ? 'La foto' : 'El vídeo')); }
    else notes.push('No he encontrado la fecha. Indícala tú.');

    // Lugar: GPS -> ciudad cercana (sin internet)
    let place = '';
    if (meta.lat != null && meta.lon != null) {
      const near = nearestPlace(meta.lat, meta.lon);
      place = near ? near : `${meta.lat.toFixed(3)}, ${meta.lon.toFixed(3)}`;
      notes.push(near ? 'Lugar deducido de la ubicación GPS (aproximado).' : 'La ubicación GPS no corresponde a una ciudad conocida: dejo las coordenadas.');
    } else notes.push('No hay ubicación en el archivo. Indica el lugar si lo recuerdas.');

    // Análisis visual (si el navegador pudo preparar imágenes)
    let scenes = [];
    if (frames.length) {
      try { scenes = await vision.describe(frames); }
      catch (e) { logError('análisis visual', e); notes.push('No pude analizar el contenido de la imagen; solo uso los datos del archivo.'); }
    } else notes.push('No se pudo preparar la imagen para analizarla; solo uso los datos del archivo.');
    const top = scenes.filter(s => s.score >= 0.12);
    const seen = top.length ? top : scenes.slice(0, 1);
    const sceneText = seen.map(s => s.es).join(', ');
    if (sceneText) notes.push(`Lo que creo ver: ${sceneText}. Es una estimación.`);

    // Vídeo: transcribir lo que se dice
    let speech = '';
    let draft = { title: '', content: '', event_type: '', category: 'General', mood: 'neutral', people: [] };
    if (isVideo && pcm && pcm.size >= SAMPLE_RATE * 4 * 0.5 && pcm.size % 4 === 0) {
      const samples = new Float32Array(pcm.buffer.buffer.slice(pcm.buffer.byteOffset, pcm.buffer.byteOffset + pcm.buffer.byteLength));
      try {
        speech = await provider.transcribe(samples);
        if (speech) { draft = await provider.extract(speech); notes.push('He transcrito lo que se oye en el vídeo.'); }
      } catch (e) { logError('transcribir vídeo', e); notes.push('No pude transcribir el audio del vídeo.'); }
    } else if (isVideo) notes.push('No se pudo leer el audio del vídeo.');

    const best = seen[0];
    const type = draft.event_type || (best && best.type) || '';
    const category = draft.category && draft.category !== 'General' ? draft.category : (best && best.category) || 'General';
    const label = isImage ? 'Foto' : 'Vídeo';
    const when = place ? ` en ${place}` : '';
    const title = (draft.title && speech)
      ? draft.title
      : (seen[0] ? `${label} de ${seen[0].es}${when}` : `${label}${when}`);
    const content = speech
      ? speech
      : (sceneText ? `${label} donde aparece ${sceneText}.` : '');

    return {
      ...draft, title, content, event_type: type, category, place: draft.place || place,
      date_happened: draft.date_happened || date, date_end: draft.date_end || '',
      media_id: mediaId, kind, mime, notes, camera: meta.camera || '', scenes: seen.map(s => s.es)
    };
  });

  res.status(202).json({ success: true, data: { jobId, mediaId } });
}

module.exports = { receive, analyze, IMAGE_TYPES, VIDEO_TYPES };
