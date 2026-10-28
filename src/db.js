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

  // Cuentas de usuario y sesiones
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Cada recuerdo pertenece a un usuario (migración para bases ya existentes)
  const cols = db.prepare('PRAGMA table_info(memories)').all().map(c => c.name);
  if (!cols.includes('user_id')) {
    db.exec('ALTER TABLE memories ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id)');

  // Datos extraídos de audio/foto/vídeo: periodo, lugar y tipo de recuerdo
  for (const [col, type] of [['date_end', 'TEXT'], ['place', 'TEXT'], ['event_type', 'TEXT']]) {
    if (!cols.includes(col)) db.exec(`ALTER TABLE memories ADD COLUMN ${col} ${type}`);
  }

  // Personas que participan en un recuerdo y relación con el usuario
  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id INTEGER NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      relation TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_people_memory ON memory_people(memory_id)');

  // Material audiovisual. memory_id vacío = subido pero aún sin confirmar
  db.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      memory_id INTEGER,
      kind TEXT NOT NULL,
      mime TEXT NOT NULL,
      original_name TEXT,
      file_path TEXT NOT NULL,
      size INTEGER,
      duration_s REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_media_memory ON media(memory_id)');

  console.log('✅ Base de datos SQLite inicializada');
}

initializeDatabase();

module.exports = db;
