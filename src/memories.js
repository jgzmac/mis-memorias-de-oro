/**
 * memories.js - Módulo de gestión de memorias usando Supabase
 */

const { supabase } = require('../config/supabase');

/**
 * Obtener todos los recuerdos del usuario (con filtros opcionales)
 */
async function getUserMemories(userId, filters = {}) {
  try {
    let query = supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.location) {
      query = query.ilike('content', `%${filters.location}%`);
    }

    if (filters.startDate) {
      query = query.gte('date_happened', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date_happened', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error al obtener memorias:', err.message);
    throw err;
  }
}

/**
 * Obtener un recuerdo específico con todos sus detalles
 */
async function getMemoryDetail(memoryId, userId) {
  try {
    const { data: memory, error: memError } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (memError || !memory) return null;

    // Obtener fotos asociadas
    const { data: photos, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('memory_id', memoryId);

    if (photoError) throw photoError;

    return {
      ...memory,
      photos: photos || []
    };
  } catch (err) {
    console.error('Error al obtener detalle de memoria:', err.message);
    throw err;
  }
}

/**
 * Crear un nuevo recuerdo
 */
async function createMemory(userId, memoryData) {
  try {
    const { title, content, date_happened, category, tags, mood } = memoryData;

    // Validación
    if (!title || !content) {
      throw new Error('Título y contenido son requeridos');
    }

    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          title: title.trim(),
          content: content.trim(),
          date_happened: date_happened || new Date().toISOString().split('T')[0],
          category: category || 'General',
          tags: tags || [],
          mood: mood || 'neutral',
          is_public: false
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error al crear memoria:', err.message);
    throw err;
  }
}

/**
 * Actualizar un recuerdo
 */
async function updateMemory(memoryId, userId, memoryData) {
  try {
    // Verificar que existe
    const { data: existing, error: checkError } = await supabase
      .from('memories')
      .select('id')
      .eq('id', memoryId)
      .single();

    if (checkError || !existing) return null;

    const updateData = {};
    if (memoryData.title) updateData.title = memoryData.title.trim();
    if (memoryData.content) updateData.content = memoryData.content.trim();
    if (memoryData.date_happened) updateData.date_happened = memoryData.date_happened;
    if (memoryData.category) updateData.category = memoryData.category;
    if (memoryData.tags) updateData.tags = memoryData.tags;
    if (memoryData.mood) updateData.mood = memoryData.mood;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('memories')
      .update(updateData)
      .eq('id', memoryId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error al actualizar memoria:', err.message);
    throw err;
  }
}

/**
 * Eliminar un recuerdo
 */
async function deleteMemory(memoryId, userId) {
  try {
    // Verificar que existe
    const { data: existing, error: checkError } = await supabase
      .from('memories')
      .select('id')
      .eq('id', memoryId)
      .single();

    if (checkError || !existing) return false;

    // Eliminar fotos asociadas (cascade lo hace automáticamente)
    const { error: deleteError } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId);

    if (deleteError) throw deleteError;
    return true;
  } catch (err) {
    console.error('Error al eliminar memoria:', err.message);
    throw err;
  }
}

/**
 * Obtener estadísticas de recuerdos
 */
async function getMemoriesStats(userId) {
  try {
    const { data: memories, error } = await supabase
      .from('memories')
      .select('category, mood');

    if (error) throw error;

    const stats = {
      total: memories.length,
      byCategory: {},
      byMood: {}
    };

    memories.forEach(m => {
      // Contar por categoría
      if (m.category) {
        stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
      }
      // Contar por mood
      if (m.mood) {
        stats.byMood[m.mood] = (stats.byMood[m.mood] || 0) + 1;
      }
    });

    return stats;
  } catch (err) {
    console.error('Error al obtener estadísticas:', err.message);
    throw err;
  }
}

module.exports = {
  getUserMemories,
  getMemoryDetail,
  createMemory,
  updateMemory,
  deleteMemory,
  getMemoriesStats
};
