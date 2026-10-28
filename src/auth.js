/**
 * auth.js - Cuentas de usuario: registro, entrada, salida y protección de rutas.
 * Sesiones con cookie HttpOnly; en la BD solo se guarda el hash del token.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const COOKIE_NAME = 'mmo_session';
const SESSION_DAYS = 30;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

// Intentos fallidos en memoria: suficiente para un piloto de un solo servidor
const failedLogins = new Map();

// ===== Política de contraseñas "típica" =====
function validatePassword(password, email) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (password.length > 72) return 'La contraseña no puede superar los 72 caracteres';
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir una minúscula';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir una mayúscula';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir un número';
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase()) && email.split('@')[0].length >= 4) {
    return 'La contraseña no puede contener tu correo';
  }
  return null;
}

function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== Sesiones =====
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, expires.toISOString());
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure}`);
}

function readToken(req) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE_NAME) return v.join('=');
  }
  return null;
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name };
}

// ===== Middleware =====
function requireAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    const row = db.prepare(`
      SELECT u.id, u.email, u.name, s.expires_at
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`).get(sha256(token));
    if (row && new Date(row.expires_at) > new Date()) {
      req.user = publicUser(row);
      return next();
    }
  }
  res.status(401).json({ success: false, error: 'Debes iniciar sesión' });
}

// ===== Rutas =====
async function register(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const password = req.body.password;

    if (!name || name.length > 80) return res.status(400).json({ success: false, error: 'Indica tu nombre' });
    if (!validEmail(email)) return res.status(400).json({ success: false, error: 'Correo no válido' });
    const pwError = validatePassword(password, email);
    if (pwError) return res.status(400).json({ success: false, error: pwError });

    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      return res.status(409).json({ success: false, error: 'Ya existe una cuenta con ese correo' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(email, name, hash);

    createSession(res, result.lastInsertRowid);
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid, email, name } });
  } catch (err) {
    console.error('Error en register:', err.message);
    res.status(500).json({ success: false, error: 'No se pudo crear la cuenta' });
  }
}

async function login(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const key = `${req.ip}|${email}`;

    const rec = failedLogins.get(key);
    if (rec && rec.count >= MAX_FAILED_LOGINS && Date.now() < rec.until) {
      return res.status(429).json({ success: false, error: `Demasiados intentos. Espera ${LOCK_MINUTES} minutos` });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Se compara siempre contra un hash para no revelar si el correo existe
    const hash = user ? user.password_hash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) {
      const count = (rec && Date.now() < (rec.until || 0) ? rec.count : 0) + 1;
      failedLogins.set(key, { count, until: Date.now() + LOCK_MINUTES * 60000 });
      return res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos' });
    }

    failedLogins.delete(key);
    createSession(res, user.id);
    res.json({ success: true, data: publicUser(user) });
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ success: false, error: 'No se pudo iniciar sesión' });
  }
}

function logout(req, res) {
  const token = readToken(req);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ success: true });
}

function me(req, res) {
  res.json({ success: true, data: req.user });
}

// Limpieza de sesiones caducadas al arrancar
db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());

module.exports = { requireAuth, register, login, logout, me, validatePassword };
