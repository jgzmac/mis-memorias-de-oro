require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const {
  createMemory,
  listMemories,
  getMemory,
  updateMemory,
  deleteMemory,
  getStats
} = require('./api/handlers');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: '✅ Running',
    database: '✅ SQLite Local',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== AUTENTICACIÓN (TEMPORAL - PARA PRUEBAS) =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  if (username === 'test' && password === 'test') {
    res.json({
      id: 1,
      username: 'test',
      email: 'test@example.com',
      token: Buffer.from('1:test').toString('base64')
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  res.status(201).json({
    id: 2,
    username: username,
    email: email || '',
    token: Buffer.from(`2:${username}`).toString('base64')
  });
});

// ===== API ROUTES - MEMORIAS =====

// POST - Crear memoria
app.post('/api/memories', createMemory);

// GET - Listar memorias (con filtros)
app.get('/api/memories', listMemories);

// GET - Estadísticas
app.get('/api/stats', getStats);

// GET - Detalle de una memoria
app.get('/api/memories/:id', getMemory);

// PUT - Actualizar memoria
app.put('/api/memories/:id', updateMemory);

// DELETE - Eliminar memoria
app.delete('/api/memories/:id', deleteMemory);

// ===== FALLBACK PARA SPA =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📝 Usuario de prueba: test/test`);
  console.log(`💾 Base de datos: SQLite Local`);
  console.log(`📊 Documentación: http://localhost:${PORT}/docs`);
});
