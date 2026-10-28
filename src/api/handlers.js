/**
 * api/handlers.js - Recuerdos (CRUD). Cada usuario solo accede a los suyos.
 */

const fs = require('fs');
const db = require('../db');
const { absPath } = require('./media');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

function hydrate(m) {
  let tags = [];
  try { tags = JSON.parse(m.tags || '[]'); } catch (e) { /* etiquetas dañadas: se ignoran */ }
  return {
    ...m,
    tags,
    people: db.prepare('SELECT name, relation FROM memory_people WHERE memory_id = ? ORDER BY id').all(m.id),
    media: db.prepare('SELECT id, kind, mime, original_name, duration_s FROM media WHERE memory_id = ? ORDER BY id')
      .all(m.id).map(x => ({ ...x, url: `/api/media/${x.id}` }))
  };
}

function normalizePeople(people) {
  if (!Array.isArray(people)) return null;
  return people
    .map(p => ({ name: clean(p && p.name, 80), relation: clean(p && p.relation, 60) }))
    .filter(p => p.name || p.relation)
    .slice(0, 30);
}

function validDate(v) {
  return v === undefined || v === null || v === '' || DATE_RE.test(v);
}

function fail(res, status, error) {
  return res.status(status).json({ success: false, error });
}

function serverError(res, where, err, msg) {
  console.error(`Error en ${where}:`, err.message);
  return res.status(500).json({ success: false, error: msg });
}

// ===== CREATE =====
function createMemory(req, res) {
  try {
    const b = req.body;
    let title = clean(b.title, 200);
    let content = clean(b.content, 20000);
    if (!title && !content) return fail(res, 400, 'Escribe al menos un título o un contenido');
    if (!title) title = content.length > 60 ? content.slice(0, 57) + '…' : content;
    if (!content) content = title;

    if (!validDate(b.date_happened) || !validDate(b.date_end)) return fail(res, 400, 'Fecha no válida');
    const tags = Array.isArray(b.tags) ? b.tags.map(t => clean(t, 40)).filter(Boolean).slice(0, 30) : [];
    const people = normalizePeople(b.people) || [];
    const mediaIds = Array.isArray(b.media_ids) ? b.media_ids.map(Number).filter(Number.isInteger) : [];

    const create = db.transaction(() => {
      const r = db.prepare(`
        INSERT INTO memories (title, content, date_happened, date_end, place, event_type, category, tags, mood, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        title, content,
        b.date_happened || new Date().toISOString().split('T')[0],
        b.date_end || null,
        clean(b.place, 200) || null,
        clean(b.event_type, 80) || null,
        clean(b.category, 40) || 'General',
        JSON.stringify(tags),
        clean(b.mood, 20) || 'neutral',
        req.user.id
      );
      const id = r.lastInsertRowid;
      const addPerson = db.prepare('INSERT INTO memory_people (memory_id, name, relation) VALUES (?, ?, ?)');
      people.forEach(p => addPerson.run(id, p.name, p.relation));
      // Solo se vinculan archivos propios y aún sin asignar
      const link = db.prepare('UPDATE media SET memory_id = ? WHERE id = ? AND user_id = ? AND memory_id IS NULL');
      mediaIds.forEach(mid => link.run(id, mid, req.user.id));
      return id;
    });
    const id = create();

    const memory = db.prepare('SELECT * FROM memories WHERE id = ? AND user_id = ?').get(id, req.user.id);
    res.status(201).json({ success: true, data: hydrate(memory), message: 'Memoria creada exitosamente' });
  } catch (err) {
    serverError(res, 'createMemory', err, 'Error al crear memoria');
  }
}

// ===== READ - LIST =====
function listMemories(req, res) {
  try {
    const { category } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    let where = 'user_id = ?';
    const params = [req.user.id];
    if (category) { where += ' AND category = ?'; params.push(category); }

    const rows = db.prepare(`SELECT * FROM memories WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) AS count FROM memories WHERE ${where}`).get(...params).count;

    res.json({ success: true, data: rows.map(hydrate), pagination: { total, limit, offset } });
  } catch (err) {
    serverError(res, 'listMemories', err, 'Error al listar memorias');
  }
}

// ===== READ - DETAIL =====
function getMemory(req, res) {
  try {
    const memory = db.prepare('SELECT * FROM memories WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!memory) return fail(res, 404, 'Memoria no encontrada');
    res.json({ success: true, data: hydrate(memory) });
  } catch (err) {
    serverError(res, 'getMemory', err, 'Error al obtener memoria');
  }
}

// ===== UPDATE =====
function updateMemory(req, res) {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM memories WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!current) return fail(res, 404, 'Memoria no encontrada');

    const b = req.body;
    if (!validDate(b.date_happened) || !validDate(b.date_end)) return fail(res, 400, 'Fecha no válida');

    const sets = [];
    const vals = [];
    const set = (col, val) => { sets.push(`${col} = ?`); vals.push(val); };

    if (b.title !== undefined) {
      const t = clean(b.title, 200);
      if (!t) return fail(res, 400, 'Título es requerido');
      set('title', t);
    }
    if (b.content !== undefined) {
      const c = clean(b.content, 20000);
      if (!c) return fail(res, 400, 'Contenido es requerido');
      set('content', c);
    }
    if (b.date_happened !== undefined) set('date_happened', b.date_happened || null);
    if (b.date_end !== undefined) set('date_end', b.date_end || null);
    if (b.place !== undefined) set('place', clean(b.place, 200) || null);
    if (b.event_type !== undefined) set('event_type', clean(b.event_type, 80) || null);
    if (b.category !== undefined) set('category', clean(b.category, 40) || 'General');
    if (b.mood !== undefined) set('mood', clean(b.mood, 20) || 'neutral');
    if (b.tags !== undefined) {
      const tags = Array.isArray(b.tags) ? b.tags.map(t => clean(t, 40)).filter(Boolean).slice(0, 30) : [];
      set('tags', JSON.stringify(tags));
    }
    sets.push('updated_at = CURRENT_TIMESTAMP');

    const people = normalizePeople(b.people);
    db.transaction(() => {
      db.prepare(`UPDATE memories SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).run(...vals, id, req.user.id);
      if (people) {
        db.prepare('DELETE FROM memory_people WHERE memory_id = ?').run(id);
        const add = db.prepare('INSERT INTO memory_people (memory_id, name, relation) VALUES (?, ?, ?)');
        people.forEach(p => add.run(id, p.name, p.relation));
      }
    })();

    const updated = db.prepare('SELECT * FROM memories WHERE id = ? AND user_id = ?').get(id, req.user.id);
    res.json({ success: true, data: hydrate(updated), message: 'Memoria actualizada exitosamente' });
  } catch (err) {
    serverError(res, 'updateMemory', err, 'Error al actualizar memoria');
  }
}

// ===== DELETE =====
function deleteMemory(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM memories WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) return fail(res, 404, 'Memoria no encontrada');

    // Los archivos no se borran solos con la fila: se eliminan aquí
    const files = db.prepare('SELECT file_path FROM media WHERE memory_id = ?').all(id);
    db.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').run(id, req.user.id);
    files.forEach(f => { try { fs.unlinkSync(absPath(f.file_path)); } catch (e) { /* ya no existía */ } });

    res.json({ success: true, message: 'Memoria eliminada exitosamente' });
  } catch (err) {
    serverError(res, 'deleteMemory', err, 'Error al eliminar memoria');
  }
}

// ===== STATS =====
function getStats(req, res) {
  try {
    const rows = db.prepare('SELECT category, mood FROM memories WHERE user_id = ?').all(req.user.id);
    const stats = { total: rows.length, byCategory: {}, byMood: {} };
    rows.forEach(m => {
      if (m.category) stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
      if (m.mood) stats.byMood[m.mood] = (stats.byMood[m.mood] || 0) + 1;
    });
    res.json({ success: true, data: stats });
  } catch (err) {
    serverError(res, 'getStats', err, 'Error al obtener estadísticas');
  }
}

module.exports = { createMemory, listMemories, getMemory, updateMemory, deleteMemory, getStats };
