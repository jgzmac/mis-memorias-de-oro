/**
 * api/media.js - Archivos audiovisuales: guardado, enlace de acceso y borrado.
 * Los archivos viven en data/uploads/<usuario>/ y solo los puede abrir su dueño.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'data', 'uploads');

// Tipos aceptados -> extensión con la que se guardan (nunca se usa el nombre original)
const AUDIO_TYPES = {
  'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a',
  'audio/m4a': '.m4a', 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/wav': '.wav',
  'audio/x-wav': '.wav', 'audio/wave': '.wav', 'audio/aac': '.aac', 'audio/flac': '.flac',
  'video/webm': '.webm'
};

function absPath(relative) {
  const full = path.resolve(UPLOAD_ROOT, relative);
  // Defensa: jamás salir de la carpeta de subidas
  if (!full.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) throw new Error('Ruta no válida');
  return full;
}

function saveFile(userId, buffer, ext) {
  const rel = path.join(String(userId), `${crypto.randomBytes(16).toString('hex')}${ext}`);
  const full = absPath(rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buffer);
  return rel;
}

function registerMedia({ userId, kind, mime, originalName, buffer, ext, durationS }) {
  const rel = saveFile(userId, buffer, ext);
  const r = db.prepare(`
    INSERT INTO media (user_id, kind, mime, original_name, file_path, size, duration_s)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, kind, mime, String(originalName || '').slice(0, 200), rel, buffer.length, durationS || null);
  return r.lastInsertRowid;
}

// GET /api/media/:id  (enlace de acceso; admite reproducción con saltos)
function serveMedia(req, res) {
  const m = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!m) return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.sendFile(absPath(m.file_path), { headers: { 'Content-Type': m.mime } }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ success: false, error: 'Archivo no disponible' });
  });
}

// DELETE /api/media/:id  (solo archivos aún sin confirmar; los de un recuerdo se borran con él)
function discardMedia(req, res) {
  const m = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ? AND memory_id IS NULL').get(req.params.id, req.user.id);
  if (!m) return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
  db.prepare('DELETE FROM media WHERE id = ?').run(m.id);
  try { fs.unlinkSync(absPath(m.file_path)); } catch (e) { /* ya no existía */ }
  res.json({ success: true });
}

// Limpieza: archivos subidos y nunca confirmados (más de 24 h)
function cleanupOrphans() {
  try {
    const old = db.prepare(`SELECT id, file_path FROM media WHERE memory_id IS NULL AND created_at < datetime('now', '-1 day')`).all();
    old.forEach(m => {
      db.prepare('DELETE FROM media WHERE id = ?').run(m.id);
      try { fs.unlinkSync(absPath(m.file_path)); } catch (e) { /* ya no existía */ }
    });
  } catch (err) {
    console.error('Error limpiando archivos sin confirmar:', err.message);
  }
}
cleanupOrphans();
setInterval(cleanupOrphans, 3600 * 1000).unref();

module.exports = { AUDIO_TYPES, absPath, registerMedia, serveMedia, discardMedia };
