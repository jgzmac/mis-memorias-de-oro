-- ============================================
-- MIS MEMORIAS DE ORO - Schema Base
-- Ejecuta este script en Supabase > SQL Editor
-- ============================================

-- Crear tabla de Memorias
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  date_happened DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  mood VARCHAR(50),
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT FALSE
);

-- Crear tabla de Fotos (relación con Memorias)
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX idx_memories_tags ON memories USING GIN(tags);
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_photos_memory_id ON photos(memory_id);

-- Crear tabla de auditoría (opcional, para historial)
CREATE TABLE IF NOT EXISTS memory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  old_content TEXT,
  new_content TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_type VARCHAR(50) -- 'created', 'updated', 'deleted'
);

-- Enable Row Level Security (opcional, para seguridad)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
