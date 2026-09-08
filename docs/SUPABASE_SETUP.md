# Configuración de Supabase - Mis Memorias de Oro

## Paso 1: Crear Cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Regístrate con GitHub, Google o correo
4. Confirma tu correo

## Paso 2: Crear un Nuevo Proyecto

1. En el dashboard, haz clic en "New project"
2. Completa los datos:
   - **Name**: `mis-memorias-de-oro`
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a ti (ej: `Madrid` o `Europe`)
   - **Pricing Plan**: Selecciona "Free" (512 MB)
3. Haz clic en "Create new project"
4. **Espera 2-3 minutos** mientras se crea el proyecto

## Paso 3: Obtener Credenciales

1. Una vez creado, ve a **Settings** (engranaje en la esquina inferior izquierda)
2. Ve a **API** (en el menú izquierdo)
3. En la sección "Project API keys" encontrarás:
   - **Project URL** → Copia esto como `SUPABASE_URL`
   - **anon public** → Copia esto como `SUPABASE_ANON_KEY`

## Paso 4: Configurar el Proyecto Local

1. En tu carpeta `Mis Memorias de Oro`, abre el archivo `.env`
2. Reemplaza los valores con las credenciales de Supabase:
   ```
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Paso 5: Crear las Tablas en Supabase

1. En Supabase, ve a **SQL Editor** (en el menú izquierdo)
2. Haz clic en "New Query"
3. Abre el archivo `/config/init-database.sql` de este proyecto
4. **Copia TODO el contenido del archivo**
5. Pégalo en el editor SQL de Supabase
6. Haz clic en "Run" (botón azul)
7. Espera a que terminen las queries (verás mensajes de éxito)

## Paso 6: Verificar la Instalación

```bash
# En tu terminal, desde la carpeta del proyecto
npm install
npm run dev
```

Si ves:
```
✅ Server running on http://localhost:3001
✅ Connected to Supabase
```

¡Todo está listo!

## Solución de Problemas

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Error: "SUPABASE_URL is missing"
Verifica que:
- El archivo `.env` existe en la raíz del proyecto
- Las credenciales están copiadas correctamente
- Reinicia el servidor (`npm run dev`)

### Error: "Relation 'memories' does not exist"
- Verifica que ejecutaste el script SQL en Supabase
- Revisa que no hay errores en SQL Editor
- Vuelve a ejecutar el script

### ¿El Free Tier es suficiente?
Sí, para el piloto:
- **512 MB** es mucho para miles de memorias
- **50k líneas** de mensajes de error gratuitos/mes
- **2 GB** de datos no especificados
- Sin límite de usuarios (pero usar con cuidado)

## Próximos Pasos

Una vez configurado, puedes:
1. Ver datos en **Table Editor** (en Supabase)
2. Crear backups en **Backups** (en Settings)
3. Configurar seguridad en **Auth** (para usuarios)

---

**¿Problemas?** Contacta al administrador del proyecto con los detalles del error.
