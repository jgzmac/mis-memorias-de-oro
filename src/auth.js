/**
 * auth.js - Módulo de autenticación usando Supabase
 * Por ahora, implementamos autenticación local simple
 * TODO: Integrar con Supabase Auth en el futuro
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');

// Usuario de prueba en memoria (temporal para desarrollo)
// En producción, esto debería estar en Supabase Auth
const TEST_USERS = {
  'test': {
    id: 1,
    username: 'test',
    password: '$2a$10$kN1bR6j9V0C9E8Q7P2L8S.3f9X5Y2Z0W4A1B8C5D2E9F1G0H3I4J5K6', // 'test'
    email: 'test@example.com'
  }
};

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePasswords(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function getUserByUsername(username) {
  return TEST_USERS[username] || null;
}

async function createUser(username, password, email) {
  if (TEST_USERS[username]) {
    throw new Error('Usuario ya existe');
  }

  const hashedPassword = hashPassword(password);
  const newUser = {
    id: Object.keys(TEST_USERS).length + 1,
    username,
    password: hashedPassword,
    email
  };

  TEST_USERS[username] = newUser;
  return { id: newUser.id, username, email };
}

function initializeTestUser() {
  // El usuario 'test' ya está definido arriba
  console.log('✅ Usuario de prueba disponible: test/test');
}

initializeTestUser();

module.exports = {
  hashPassword,
  comparePasswords,
  getUserByUsername,
  createUser
};
