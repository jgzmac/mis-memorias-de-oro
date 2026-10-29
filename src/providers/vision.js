/**
 * vision.js - Reconoce qué hay en una imagen, gratis y en el propio ordenador.
 * Usa CLIP (se descarga una sola vez a data/models y luego funciona sin internet):
 * compara la imagen con una lista de escenas y devuelve las más probables.
 */

const path = require('path');
const fs = require('fs');

const MODEL = 'Xenova/clip-vit-base-patch32';
const CACHE_DIR = path.join(__dirname, '..', '..', 'data', 'models');

// es: cómo se muestra · en: frase que entiende el modelo · type/category: pistas para el recuerdo
const SCENES = [
  { es: 'playa', en: 'a photo of a beach by the sea', type: 'Viaje', category: 'Viajes' },
  { es: 'montaña', en: 'a photo of mountains and nature', type: 'Viaje', category: 'Viajes' },
  { es: 'campo', en: 'a photo of countryside and fields', type: '', category: 'General' },
  { es: 'ciudad', en: 'a photo of a city street', type: 'Viaje', category: 'Viajes' },
  { es: 'monumento', en: 'a photo of a famous monument or cathedral', type: 'Viaje', category: 'Viajes' },
  { es: 'una boda', en: 'a photo of a wedding with a bride and groom', type: 'Boda', category: 'Familia' },
  { es: 'un cumpleaños', en: 'a photo of a birthday party with a cake and candles', type: 'Cumpleaños', category: 'Familia' },
  { es: 'una celebración navideña', en: 'a photo of christmas decorations and a christmas tree', type: 'Fiestas', category: 'Familia' },
  { es: 'una comida o una mesa', en: 'a photo of a family meal at a table', type: 'Comida familiar', category: 'Familia' },
  { es: 'comida', en: 'a photo of food on a plate', type: 'Comida familiar', category: 'Familia' },
  { es: 'una graduación', en: 'a photo of a graduation ceremony', type: 'Estudios', category: 'Personal' },
  { es: 'un colegio o una clase', en: 'a photo of a school classroom with children', type: 'Estudios', category: 'Personal' },
  { es: 'una oficina', en: 'a photo of an office workplace', type: 'Trabajo', category: 'Trabajo' },
  { es: 'deporte', en: 'a photo of people playing sports', type: 'Deporte', category: 'Personal' },
  { es: 'un bebé', en: 'a photo of a baby', type: 'Nacimiento', category: 'Familia' },
  { es: 'niños jugando', en: 'a photo of children playing', type: '', category: 'Familia' },
  { es: 'un grupo de personas', en: 'a photo of a group of people posing together', type: '', category: 'Familia' },
  { es: 'una familia', en: 'a photo of a family together', type: '', category: 'Familia' },
  { es: 'una persona', en: 'a portrait photo of one person', type: '', category: 'Personal' },
  { es: 'una pareja', en: 'a photo of a couple', type: 'Pareja', category: 'Personal' },
  { es: 'una mascota', en: 'a photo of a pet dog or cat', type: '', category: 'Familia' },
  { es: 'animales', en: 'a photo of wild animals', type: '', category: 'General' },
  { es: 'un jardín o flores', en: 'a photo of a garden with flowers', type: '', category: 'General' },
  { es: 'una casa', en: 'a photo of a house exterior', type: 'Mudanza', category: 'Personal' },
  { es: 'el interior de una casa', en: 'a photo of the inside of a home living room', type: '', category: 'Familia' },
  { es: 'un coche o un viaje por carretera', en: 'a photo of a car on the road', type: 'Viaje', category: 'Viajes' },
  { es: 'un avión o un aeropuerto', en: 'a photo of an airplane or airport', type: 'Viaje', category: 'Viajes' },
  { es: 'un barco', en: 'a photo of a boat or ship', type: 'Viaje', category: 'Viajes' },
  { es: 'una iglesia', en: 'a photo of the inside of a church', type: 'Celebración religiosa', category: 'Familia' },
  { es: 'una fiesta', en: 'a photo of a party with people celebrating', type: '', category: 'Familia' },
  { es: 'un atardecer', en: 'a photo of a sunset', type: '', category: 'General' },
  { es: 'nieve', en: 'a photo of snow in winter', type: '', category: 'General' },
  { es: 'un documento o una foto antigua', en: 'a scanned old document or old black and white photograph', type: '', category: 'General' }
];

let pipePromise = null;
let status = { state: 'idle' };

function getClassifier() {
  if (!pipePromise) {
    status = { state: 'loading' };
    pipePromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.cacheDir = CACHE_DIR;
      if (fs.existsSync(path.join(CACHE_DIR, MODEL, 'onnx', 'model_quantized.onnx'))) {
        env.allowRemoteModels = false;
        env.localModelPath = CACHE_DIR;
      }
      const p = await pipeline('zero-shot-image-classification', MODEL, { dtype: 'q8' });
      status = { state: 'ready' };
      return p;
    })().catch((err) => {
      status = { state: 'error', message: err.message };
      pipePromise = null;
      throw err;
    });
  }
  return pipePromise;
}

// Una imagen a la vez para no saturar el ordenador
let queue = Promise.resolve();

/** buffers: array de Buffer (jpg/png/webp). Devuelve las escenas más probables, promediando varias imágenes. */
function describe(buffers) {
  const run = queue.then(async () => {
    const clf = await getClassifier();
    const totals = new Map();
    for (const buf of buffers) {
      const out = await clf(new Blob([buf]), SCENES.map(s => s.en), { hypothesis_template: '{}' });
      out.forEach(o => totals.set(o.label, (totals.get(o.label) || 0) + o.score / buffers.length));
    }
    return [...totals.entries()]
      .map(([en, score]) => ({ ...SCENES.find(s => s.en === en), score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  });
  queue = run.catch(() => {});
  return run;
}

module.exports = { describe, warmUp: () => getClassifier().catch(() => {}), getStatus: () => status, SCENES };
