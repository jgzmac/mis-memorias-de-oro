/**
 * providers/index.js - Elige el motor de IA según la variable AI_PROVIDER.
 * Cada proveedor ofrece: transcribe(float32Audio), extract(texto), warmUp(), getStatus().
 * Hoy solo existe "local" (gratuito). Para pasar a un servicio de pago bastará con
 * añadir aquí otro archivo con la misma interfaz y poner AI_PROVIDER=nombre en .env.
 */

const name = (process.env.AI_PROVIDER || 'local').toLowerCase();

let provider;
if (name === 'local') {
  provider = require('./local');
} else {
  throw new Error(`AI_PROVIDER="${name}" no está disponible todavía. Usa "local".`);
}

module.exports = provider;
