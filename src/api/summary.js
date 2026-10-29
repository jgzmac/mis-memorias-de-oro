/**
 * api/summary.js - Resumen de vida: de toda la vida, de un año o de una persona.
 */
const db = require('../db');
const { compose, STYLES } = require('../providers/summary');

function loadMemories(userId) {
  const mems = db.prepare('SELECT * FROM memories WHERE user_id = ?').all(userId);
  const people = db.prepare('SELECT memory_id, name FROM memory_people WHERE memory_id IN (SELECT id FROM memories WHERE user_id = ?)').all(userId);
  return mems.map(m => ({ ...m, people: people.filter(p => p.memory_id === m.id) }));
}

function summary(req, res) {
  try {
    const b = req.body || {};
    const styleKey = STYLES[b.style] ? b.style : 'amable';
    const scope = ['all', 'year', 'person'].includes(b.scope) ? b.scope : 'all';
    const value = String(b.value || '').trim().slice(0, 80);
    const user = db.prepare('SELECT name, birth_date, birth_place FROM users WHERE id = ?').get(req.user.id);
    const stages = db.prepare('SELECT * FROM life_stages WHERE user_id = ?').all(req.user.id);
    let memories = loadMemories(req.user.id);
    let scopeLabel = '';
    if (scope === 'year') {
      if (!/^\d{4}$/.test(value)) return res.status(400).json({ success: false, error: 'Elige un año' });
      memories = memories.filter(m => (m.date_happened || '').startsWith(value));
      scopeLabel = `el año ${value}`;
    } else if (scope === 'person') {
      if (!value) return res.status(400).json({ success: false, error: 'Elige una persona' });
      memories = memories.filter(m => m.people.some(p => p.name.toLowerCase() === value.toLowerCase()));
      scopeLabel = `tus recuerdos con ${value}`;
    }
    res.json({ success: true, data: { text: compose({ user, memories, stages, styleKey, scopeLabel }), count: memories.length, provider: 'local' } });
  } catch (err) {
    console.error('Error en summary:', err.message);
    res.status(500).json({ success: false, error: 'No se pudo crear el resumen' });
  }
}

module.exports = { summary, styles: () => Object.entries(STYLES).map(([key, s]) => ({ key, label: s.label })) };
