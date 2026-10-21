/**
 * db.js - Inicialización de base de datos SQLite
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

// La BD vive en data/ (ignorada por git) para que sobreviva a reinicios.
// DB_PATH permite sobrescribirla (tests, despliegues) sin tocar el código.
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'memorias.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

function openDatabase(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

let db;
let activePath = DB_PATH;
try {
  db = openDatabase(DB_PATH);
} catch (err) {
  // Último recurso (p. ej. sandbox sin permisos de escritura): usar tmp,
  // avisando claramente porque estos datos NO son persistentes.
  activePath = path.join(os.tmpdir(), 'memorias.db');
  console.warn(`⚠️  No se pudo abrir ${DB_PATH} (${err.message}). Usando ${activePath}: los datos se perderán al reiniciar.`);
  db = openDatabase(activePath);
}

// WAL mejora la concurrencia y reduce el riesgo de corrupción ante cierres bruscos,
// pero algunos sistemas de archivos (carpetas montadas en sandbox/red) no lo
// soportan: en ese caso seguimos con el modo de journal por defecto.
try {
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.warn(`⚠️  WAL no disponible (${err.message}); usando journal por defecto.`);
}

console.log(`📁 Base de datos: ${activePath}`);

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
