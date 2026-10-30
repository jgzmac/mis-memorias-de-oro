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
const { requireAuth, register, login, logout, me, updateName, changePassword } = require('./auth');
const { serveMedia, discardMedia } = require('./api/media');
const { receive, analyzeAudio, getJob } = require('./api/audio');
const { getProfile, updateProfile, listStages, createStage, updateStage, deleteStage, getHistory } = require('./api/life');
const visual = require('./api/visual');
const summaryApi = require('./api/summary');
const share = require('./api/share');
const vision = require('./providers/vision');
const provider = require('./providers');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MIDDLEWARE =====
app.use(cors({ origin: false }));
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

// ===== CUENTAS DE USUARIO =====
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', requireAuth, me);
app.put('/api/auth/name', requireAuth, updateName);
app.put('/api/auth/password', requireAuth, changePassword);

// ===== API ROUTES - MEMORIAS =====

// POST - Crear memoria
app.post('/api/memories', requireAuth, createMemory);

// GET - Listar memorias (con filtros)
app.get('/api/memories', requireAuth, listMemories);

// GET - Estadísticas
app.get('/api/stats', requireAuth, getStats);

// GET - Detalle de una memoria
app.get('/api/memories/:id', requireAuth, getMemory);

// PUT - Actualizar memoria
app.put('/api/memories/:id', requireAuth, updateMemory);

// DELETE - Eliminar memoria
app.delete('/api/memories/:id', requireAuth, deleteMemory);

// ===== ARCHIVOS Y ANÁLISIS DE AUDIO =====
app.post('/api/audio/analyze', requireAuth, receive, analyzeAudio);
app.get('/api/audio/jobs/:id', requireAuth, getJob);
app.post('/api/visual/analyze', requireAuth, visual.receive, visual.analyze);
app.get('/api/media/:id', requireAuth, serveMedia);
app.delete('/api/media/:id', requireAuth, discardMedia);

app.get('/api/places', (req, res) => res.json(require('./data/places.json')));

// ===== LÍNEA DE VIDA =====
app.get('/api/profile', requireAuth, getProfile);
app.put('/api/profile', requireAuth, updateProfile);
app.get('/api/stages', requireAuth, listStages);
app.post('/api/stages', requireAuth, createStage);
app.put('/api/stages/:id', requireAuth, updateStage);
app.delete('/api/stages/:id', requireAuth, deleteStage);
app.get('/api/history', requireAuth, getHistory);

// ===== RESUMEN DE VIDA =====
app.get('/api/summary/styles', requireAuth, (req, res) => res.json({ success: true, data: summaryApi.styles() }));
app.post('/api/summary', requireAuth, summaryApi.summary);

// ===== COMPARTIR (enlace secreto) =====
app.post('/api/share', requireAuth, share.create);
app.get('/api/share', requireAuth, share.list);
app.delete('/api/share/:token', requireAuth, share.remove);
app.get('/c/:token', share.page);
app.get('/c/:token/media/:id', share.media);

// ===== FALLBACK PARA SPA =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`💾 Base de datos: SQLite Local`);
  // Descargar/cargar el motor de voz en segundo plano para que el primer audio no espere
  provider.warmUp();
  vision.warmUp();
});
