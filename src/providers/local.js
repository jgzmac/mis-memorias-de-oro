/**
 * local.js - Proveedor gratuito que funciona en el propio ordenador.
 * Voz a texto con Whisper (se descarga una sola vez); extracción con reglas.
 */

const path = require('path');
const { extractMemory } = require('./extract-es');

const MODEL = process.env.LOCAL_STT_MODEL || 'Xenova/whisper-small';
const CACHE_DIR = path.join(__dirname, '..', '..', 'data', 'models');

let asrPromise = null;
let status = { state: 'idle' };

function getAsr() {
  if (!asrPromise) {
    status = { state: 'loading' };
    asrPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.cacheDir = CACHE_DIR;
      // Si el modelo ya está en disco no se usa internet (evita fallos de red/certificados de empresa)
      if (require('fs').existsSync(path.join(CACHE_DIR, MODEL, 'onnx', 'decoder_model_merged_quantized.onnx'))) {
        env.allowRemoteModels = false;
        env.localModelPath = CACHE_DIR;
      }
      const asr = await pipeline('automatic-speech-recognition', MODEL, { dtype: 'q8' });
      status = { state: 'ready' };
      return asr;
    })().catch((err) => {
      status = { state: 'error', message: err.message };
      try { require('fs').appendFileSync(path.join(CACHE_DIR, '..', 'errores.log'), `[${new Date().toISOString()}] cargar modelo: ${err.stack}${err.cause ? ' | causa: ' + (err.cause.stack || err.cause) : ''}\n`); } catch (e) { /* sin registro */ }
      asrPromise = null; // permitir reintento
      throw err;
    });
  }
  return asrPromise;
}

// Una transcripción a la vez: evita saturar el ordenador si hay varias peticiones
let queue = Promise.resolve();

function transcribe(float32Audio) {
  const run = queue.then(async () => {
    const asr = await getAsr();
    const out = await asr(float32Audio, {
      language: 'spanish',
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5
    });
    return String(out.text || '').trim();
  });
  queue = run.catch(() => {});
  return run;
}

module.exports = {
  name: 'local',
  transcribe,
  extract: async (text) => extractMemory(text),
  warmUp: () => getAsr().catch(() => {}),
  getStatus: () => status
};
