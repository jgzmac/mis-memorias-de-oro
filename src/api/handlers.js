/**
 * api/handlers.js - Manejadores para endpoints de memorias
 * Usa SQLite como backend
 */

const db = require('../db');

// ===== CREATE =====
function createMemory(req, res) {
  try {
    const { title, content, date_happened, category, tags = [], mood = 'neutral' } = req.body;

    // Validación
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Título es requerido' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Contenido es requerido' });
    }

    const tagsJson = JSON.stringify(tags);
    const dateHappened = date_happened || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO memories (title, content, date_happened, category, tags, mood)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      content.trim(),
      dateHappened,
      category || 'General',
      tagsJson,
      mood
    );

    const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: {
        ...memory,
        tags: JSON.parse(memory.tags)
      },
      message: 'Memoria creada exitosamente'
    });
  } catch (err) {
    console.error('Error en createMemory:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al crear memoria',
      details: err.message
    });
  }
}

// ===== READ - LIST =====
function listMemories(req, res) {
  try {
    const { category, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM memories WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const memories = db.prepare(query).all(...params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as count FROM memories WHERE 1=1';
    const countParams = [];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    const countResult = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: memories.map(m => ({
        ...m,
        tags: JSON.parse(m.tags || '[]')
      })),
      pagination: {
        total: countResult.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Error en listMemories:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al listar memorias',
      details: err.message
    });
  }
}

// ===== READ - DETAIL =====
function getMemory(req, res) {
  try {
    const { id } = req.params;

    const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);

    if (!memory) {
      return res.status(404).json({ success: false, error: 'Memoria no encontrada' });
    }

    res.json({
      success: true,
      data: {
        ...memory,
        tags: JSON.parse(memory.tags || '[]')
      }
    });
  } catch (err) {
    console.error('Error en getMemory:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener memoria',
      details: err.message
    });
  }
}

// ===== UPDATE =====
function updateMemory(req, res) {
  try {
    const { id } = req.params;
    const { title, content, date_happened, category, tags, mood } = req.body;

    // Verificar que existe
    const existing = db.prepare('SELECT id FROM memories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Memoria no encontrada' });
    }

    // Obtener datos actuales
    const current = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);

    // Actualizar solo campos proporcionados
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title.trim());
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content.trim());
    }
    if (date_happened !== undefined) {
      updateFields.push('date_happened = ?');
      updateValues.push(date_happened);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(tags));
    }
    if (mood !== undefined) {
      updateFields.push('mood = ?');
      updateValues.push(mood);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    if (updateFields.length === 0) {
      return res.json({ success: true, data: { ...current, tags: JSON.parse(current.tags || '[]') } });
    }

    updateValues.push(id);

    const stmt = db.prepare(`UPDATE memories SET ${updateFields.join(', ')} WHERE id = ?`);
    stmt.run(...updateValues);

    const updated = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        ...updated,
        tags: JSON.parse(updated.tags || '[]')
      },
      message: 'Memoria actualizada exitosamente'
    });
  } catch (err) {
    console.error('Error en updateMemory:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar memoria',
      details: err.message
    });
  }
}

// ===== DELETE =====
function deleteMemory(req, res) {
  try {
    const { id } = req.params;

    // Verificar que existe
    const existing = db.prepare('SELECT id FROM memories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Memoria no encontrada' });
    }

    db.prepare('DELETE FROM memories WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Memoria eliminada exitosamente'
    });
  } catch (err) {
    console.error('Error en deleteMemory:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar memoria',
      details: err.message
    });
  }
}

// ===== STATS =====
function getStats(req, res) {
  try {
    const memories = db.prepare('SELECT category, mood FROM memories').all();

    const stats = {
      total: memories.length,
      byCategory: {},
      byMood: {}
    };

    memories.forEach(m => {
      if (m.category) {
        stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
      }
      if (m.mood) {
        stats.byMood[m.mood] = (stats.byMood[m.mood] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error en getStats:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      details: err.message
    });
  }
}

module.exports = {
  createMemory,
  listMemories,
  getMemory,
  updateMemory,
  deleteMemory,
  getStats
};
