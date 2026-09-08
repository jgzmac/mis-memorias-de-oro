/**
 * Configuración de Supabase
 *
 * INSTRUCCIONES:
 * 1. Ve a https://supabase.com
 * 2. Crea una cuenta gratuita
 * 3. Crea un nuevo proyecto (elige PostgreSQL)
 * 4. Ve a Settings > API > Copy las credenciales
 * 5. Pega SUPABASE_URL y SUPABASE_ANON_KEY en .env
 */

const { createClient } = require('@supabase/supabase-js');

// Variables de entorno requeridas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_ANON_KEY no están configuradas');
  console.error('   Lee config/supabase.js para instrucciones');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
