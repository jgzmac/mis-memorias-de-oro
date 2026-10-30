/**
 * api/life.js - Datos para la línea de vida: perfil (nacimiento), etapas y hechos históricos.
 * Todo es privado por usuario salvo los hechos históricos, que son un fichero común.
 */

const db = require('../db');
const history = require('../data/history.json').events;

const KINDS = ['school', 'work', 'residence'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

function isRealDate(v) {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y >= 1850 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

// ===== Perfil =====
function getProfile(req, res) {
  const u = db.prepare('SELECT id, name, email, birth_date, birth_place FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, data: u });
}

function updateProfile(req, res) {
  const b = req.body || {};
  const birth = clean(b.birth_date, 10);
  if (birth && !isRealDate(birth)) return fail(res, 'La fecha de nacimiento no es válida');
  if (birth && birth > new Date().toISOString().slice(0, 10)) return fail(res, 'La fecha de nacimiento no puede ser futura');
  if (birth) {
    const lim = (Number(birth.slice(0, 4)) + 120) + birth.slice(4);
    const bad = db.prepare('SELECT COUNT(*) AS c FROM memories WHERE user_id = ? AND (date_happened > ? OR date_end > ?)').get(req.user.id, lim, lim).c;
    if (bad) return fail(res, 'Tienes recuerdos más allá de los 120 años desde esa fecha de nacimiento');
  }
  db.prepare('UPDATE users SET birth_date = ?, birth_place = ? WHERE id = ?')
    .run(birth || null, clean(b.birth_place, 120) || null, req.user.id);
  getProfile(req, res);
}

// ===== Etapas (escolar, profesional, residencia) =====
function readStage(b) {
  const kind = clean(b.kind, 20);
  if (!KINDS.includes(kind)) return { error: 'Tipo de etapa no válido' };
  const start = clean(b.start_date, 10);
  const end = clean(b.end_date, 10);
  if (!isRealDate(start)) return { error: 'Indica una fecha de inicio válida' };
  if (end && !isRealDate(end)) return { error: 'La fecha de fin no es válida' };
  if (end && end < start) return { error: 'El fin no puede ser anterior al inicio' };
  const title = clean(b.title, 120);
  const place = clean(b.place, 120);
  if (!title && !place) return { error: 'Escribe un nombre o un lugar' };
  return { value: { kind, title, place, start_date: start, end_date: end || null } };
}

function listStages(req, res) {
  const rows = db.prepare('SELECT id, kind, title, place, start_date, end_date FROM life_stages WHERE user_id = ? ORDER BY start_date, id').all(req.user.id);
  res.json({ success: true, data: rows });
}

function createStage(req, res) {
  const { error, value } = readStage(req.body || {});
  if (error) return fail(res, error);
  const n = db.prepare('SELECT COUNT(*) AS c FROM life_stages WHERE user_id = ?').get(req.user.id).c;
  if (n >= 300) return fail(res, 'Has alcanzado el máximo de etapas');
  const r = db.prepare('INSERT INTO life_stages (user_id, kind, title, place, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, value.kind, value.title, value.place, value.start_date, value.end_date);
  res.status(201).json({ success: true, data: { id: r.lastInsertRowid, ...value } });
}

function updateStage(req, res) {
  const cur = db.prepare('SELECT id FROM life_stages WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!cur) return fail(res, 'Etapa no encontrada', 404);
  const { error, value } = readStage(req.body || {});
  if (error) return fail(res, error);
  db.prepare('UPDATE life_stages SET kind = ?, title = ?, place = ?, start_date = ?, end_date = ? WHERE id = ? AND user_id = ?')
    .run(value.kind, value.title, value.place, value.start_date, value.end_date, cur.id, req.user.id);
  res.json({ success: true, data: { id: cur.id, ...value } });
}

function deleteStage(req, res) {
  const r = db.prepare('DELETE FROM life_stages WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!r.changes) return fail(res, 'Etapa no encontrada', 404);
  res.json({ success: true });
}

// ===== Hechos históricos =====
const dayNum = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;

// Elige hasta 3: el más relevante de cada ámbito (mundo / España) y rellena con el siguiente
function pick(list, n = 3) {
  const byImp = [...list].sort((a, b) => b.importance - a.importance || (a.date < b.date ? -1 : 1));
  const chosen = [];
  for (const scope of ['mundo', 'españa']) {
    const e = byImp.find(x => x.scope === scope);
    if (e) chosen.push(e);
  }
  for (const e of byImp) if (chosen.length < n && !chosen.includes(e)) chosen.push(e);
  return chosen.slice(0, n).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function nearest(center, from, to) {
  const c = dayNum(center);
  const limit = 3660; // unos 10 años
  const near = history
    .map(e => ({ e, d: from && to && e.date >= from && e.date <= to ? 0 : Math.abs(dayNum(e.date) - c) }))
    .filter(x => x.d <= limit)
    .sort((a, b) => a.d - b.d)
    .slice(0, 8).map(x => x.e);
  return pick(near);
}

function getHistory(req, res) {
  const from = clean(req.query.from, 10);
  const to = clean(req.query.to || req.query.from, 10);
  if (!isRealDate(from) || !isRealDate(to) || to < from) return fail(res, 'Fechas no válidas');
  const strip = (arr) => arr.map(({ date, scope, importance, text }) => ({ date, scope, importance, text }));

  if (from === to) {
    const day = history.filter(e => e.date === from);
    if (day.length) return res.json({ success: true, data: { level: 'dia', events: strip(pick(day)) } });
    for (const [level, len] of [['mes', 7], ['año', 4]]) {
      const part = history.filter(e => e.date.slice(0, len) === from.slice(0, len));
      if (part.length) return res.json({ success: true, data: { level, events: strip(pick(part)) } });
    }
    return res.json({ success: true, data: { level: 'cercano', events: strip(nearest(from)) } });
  }

  const inside = history.filter(e => e.date >= from && e.date <= to);
  if (inside.length) return res.json({ success: true, data: { level: 'periodo', events: strip(pick(inside)) } });
  const mid = new Date((dayNum(from) + dayNum(to)) / 2 * 86400000).toISOString().slice(0, 10);
  res.json({ success: true, data: { level: 'cercano', events: strip(nearest(mid)) } });
}

module.exports = { getProfile, updateProfile, listStages, createStage, updateStage, deleteStage, getHistory };
