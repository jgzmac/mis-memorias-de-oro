/**
 * api/share.js - Compartir el resumen como una web con enlace secreto.
 * Cualquiera con el enlace puede verla; el dueño puede desactivarlo cuando quiera.
 * Solo se muestran los recuerdos incluidos al compartir y sus fotos, vídeos y audios.
 */
const crypto = require('crypto');
const db = require('../db');
const { absPath } = require('./media');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      memory_ids TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}
init();

const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// POST /api/share  { text, memoryIds }  -> { url path, token }
function create(req, res) {
  try {
    const text = String((req.body || {}).text || '').trim().slice(0, 50000);
    if (!text) return res.status(400).json({ success: false, error: 'Primero crea un resumen' });
    const ids = (Array.isArray(req.body.memoryIds) ? req.body.memoryIds : []).map(Number).filter(Number.isInteger).slice(0, 2000);
    // Solo recuerdos del propio usuario
    const own = new Set(db.prepare('SELECT id FROM memories WHERE user_id = ?').all(req.user.id).map(r => r.id));
    const memoryIds = ids.filter(i => own.has(i));
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
    const token = crypto.randomBytes(24).toString('base64url');
    db.prepare('INSERT INTO shares (token, user_id, title, text, memory_ids) VALUES (?, ?, ?, ?, ?)')
      .run(token, req.user.id, `Los recuerdos de ${user.name}`, text, JSON.stringify(memoryIds));
    res.json({ success: true, data: { token, path: `/c/${token}` } });
  } catch (err) {
    console.error('Error en share:', err.message);
    res.status(500).json({ success: false, error: 'No se pudo crear el enlace' });
  }
}

// GET /api/share  -> enlaces activos del usuario
function list(req, res) {
  const rows = db.prepare('SELECT token, title, created_at FROM shares WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  res.json({ success: true, data: rows.map(r => ({ ...r, path: `/c/${r.token}` })) });
}

// DELETE /api/share/:token  -> desactiva el enlace
function remove(req, res) {
  db.prepare('DELETE FROM shares WHERE token = ? AND user_id = ?').run(req.params.token, req.user.id);
  res.json({ success: true });
}

function findShare(token) {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token || '') ? db.prepare('SELECT * FROM shares WHERE token = ?').get(token) : null;
}

// GET /c/:token  (pública)
function page(req, res) {
  const s = findShare(req.params.token);
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (!s) return res.status(404).send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:sans-serif;padding:40px;text-align:center"><h2>Este enlace ya no está disponible</h2>');
  const ids = JSON.parse(s.memory_ids);
  let cards = '';
  if (ids.length) {
    const mems = db.prepare(`SELECT id, title, content, date_happened, place FROM memories WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')}) ORDER BY date_happened`).all(s.user_id, ...ids);
    cards = mems.map(m => {
      const media = db.prepare('SELECT id, kind, mime FROM media WHERE memory_id = ? ORDER BY id').all(m.id).map(x => {
        const u = `/c/${s.token}/media/${x.id}`;
        if (x.mime.startsWith('image/')) return `<img src="${u}" alt="" loading="lazy">`;
        if (x.mime.startsWith('video/') && x.kind !== 'audio') return `<video src="${u}" controls preload="metadata" playsinline></video>`;
        return `<audio src="${u}" controls preload="none"></audio>`;
      }).join('');
      return `<article id="r${m.id}"><h3>${esc(m.title)}</h3><div class="meta">${esc([m.date_happened, m.place].filter(Boolean).join(' · '))}</div><p>${esc(m.content)}</p>${media}</article>`;
    }).join('');
  }
  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(s.title)}</title>
<style>body{font-family:Georgia,serif;background:#f4f8fc;color:#0D1846;margin:0}main{max-width:720px;margin:0 auto;padding:24px 16px 60px}h1{font-size:1.6em}.sum{background:#fff;border-radius:14px;padding:18px;line-height:1.7;white-space:pre-wrap}article{background:#fff;border-radius:14px;padding:16px;margin:16px 0}article h3{margin:0 0 4px}.meta{color:#667;font-size:.9em;margin-bottom:8px}img,video{max-width:100%;border-radius:10px;margin-top:8px;display:block}audio{width:100%;margin-top:8px}h2{margin-top:28px}</style></head>
<body><main><h1>${esc(s.title)}</h1><div class="sum">${esc(s.text)}</div>${cards ? `<h2>Sus recuerdos</h2>${cards}` : ''}</main></body></html>`);
}

// GET /c/:token/media/:id  (pública, solo archivos de los recuerdos compartidos)
function media(req, res) {
  const s = findShare(req.params.token);
  if (!s) return res.status(404).end();
  const ids = JSON.parse(s.memory_ids);
  const m = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(req.params.id, s.user_id);
  if (!m || !ids.includes(m.memory_id)) return res.status(404).end();
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=600');
  res.sendFile(absPath(m.file_path), { headers: { 'Content-Type': m.mime } }, (err) => { if (err && !res.headersSent) res.status(404).end(); });
}

module.exports = { create, list, remove, page, media };
