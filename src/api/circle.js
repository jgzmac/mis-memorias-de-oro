/**
 * api/circle.js - "Círculo de personas": familia y amistades del usuario.
 * Nombre, parentesco y fecha de nacimiento son opcionales (basta con uno de los dos primeros).
 */
const db = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS circle_people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    relation TEXT NOT NULL DEFAULT '',
    birth_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_circle_user ON circle_people(user_id)');

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function isRealDate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y >= 1850 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function read(b) {
  const name = clean(b.name, 80), relation = clean(b.relation, 60), birth = clean(b.birth_date, 10);
  if (!name && !relation) return { error: 'Escribe al menos un nombre o un parentesco' };
  if (birth && !isRealDate(birth)) return { error: 'La fecha de nacimiento no es válida' };
  if (birth && birth > new Date().toISOString().slice(0, 10)) return { error: 'La fecha de nacimiento no puede ser futura' };
  return { value: { name, relation, birth_date: birth || null } };
}

function list(req, res) {
  res.json({ success: true, data: db.prepare('SELECT id, name, relation, birth_date FROM circle_people WHERE user_id = ? ORDER BY name COLLATE NOCASE, id').all(req.user.id) });
}

function create(req, res) {
  const { error, value } = read(req.body || {});
  if (error) return fail(res, error);
  if (db.prepare('SELECT COUNT(*) AS c FROM circle_people WHERE user_id = ?').get(req.user.id).c >= 500) return fail(res, 'Has alcanzado el máximo de personas');
  // Evita duplicados por nombre (al aceptar propuestas desde un recuerdo)
  if (value.name) {
    const dup = db.prepare('SELECT id, name FROM circle_people WHERE user_id = ?').all(req.user.id).find(p => norm(p.name) === norm(value.name));
    if (dup) return fail(res, `${value.name} ya está en tu círculo`, 409);
  }
  const r = db.prepare('INSERT INTO circle_people (user_id, name, relation, birth_date) VALUES (?, ?, ?, ?)').run(req.user.id, value.name, value.relation, value.birth_date);
  res.status(201).json({ success: true, data: { id: r.lastInsertRowid, ...value } });
}

function update(req, res) {
  const cur = db.prepare('SELECT id FROM circle_people WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!cur) return fail(res, 'Persona no encontrada', 404);
  const { error, value } = read(req.body || {});
  if (error) return fail(res, error);
  db.prepare('UPDATE circle_people SET name = ?, relation = ?, birth_date = ? WHERE id = ? AND user_id = ?').run(value.name, value.relation, value.birth_date, cur.id, req.user.id);
  res.json({ success: true, data: { id: cur.id, ...value } });
}

function remove(req, res) {
  const r = db.prepare('DELETE FROM circle_people WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!r.changes) return fail(res, 'Persona no encontrada', 404);
  res.json({ success: true });
}

module.exports = { list, create, update, remove };
