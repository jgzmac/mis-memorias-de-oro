/**
 * db.js - Inicialización de base de datos SQLite
 */

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Usar /tmp para evitar problemas de permisos en sandbox
const DB_PATH = path.join(os.tmpdir(), 'memorias.db');

// Crear/conectar a la base de datos
const db = new Database(DB_PATH);

console.log(`📁 Base de datos: ${DB_PATH}`);

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

// Crear tablas
function initializeDatabase() {
  // Tabla de memorias
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date_happened DATE,
      category TEXT DEFAULT 'General',
      tags TEXT DEFAULT '[]',
      mood TEXT DEFAULT 'neutral',
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de fotos (para futuro)
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Base de datos SQLite inicializada');
}

initializeDatabase();

module.exports = db;
