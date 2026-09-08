# Guía de Instalación - Mis Memorias de Oro

## Requisitos Previos

- Node.js (versión 14+)
- npm o yarn

## Instalación

### 1. Clonar o descargar el proyecto

```bash
cd "Mis Memorias de Oro"
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase (IMPORTANTE)

Sigue los pasos en [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md):

1. Crea una cuenta en https://supabase.com (plan Free)
2. Crea un nuevo proyecto PostgreSQL
3. Obtén tus credenciales (URL y API Key)
4. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
5. Edita `.env` y pega tus credenciales:
   ```
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   PORT=3001
   NODE_ENV=development
   ```
6. En Supabase > SQL Editor, ejecuta el script en `config/init-database.sql`

### 4. Ejecutar el servidor

```bash
npm run dev
```

El servidor iniciará en `http://localhost:3001`

## Primera Sesión

### Usuario de Prueba
- **Usuario**: `test`
- **Contraseña**: `test`

### Funcionalidades Disponibles

1. **Crear Recuerdos**
   - Especifica título, descripción y categoría
   - Añade ubicación, fecha y personas involucradas
   - Selecciona categoría: Personal, Profesional o General

2. **Ver Timeline**
   - Visualiza todos tus recuerdos ordenados por fecha
   - Recuerdos codificados por color según categoría

3. **Filtrar Recuerdos**
   - Por categoría (Personal, Profesional, General)
   - Por ubicación
   - Por rango de fechas

4. **Detalles del Recuerdo**
   - Haz clic en un recuerdo para ver todos los detalles
   - Edita o elimina recuerdos existentes

## Estructura de Base de Datos

Usamos **Supabase + PostgreSQL** (gratuito en la nube):

### Tablas Principales

- **memories**: Recuerdos con título, contenido, fecha y categoría
- **photos**: Fotos asociadas a cada recuerdo (relación 1-a-muchos)
- **memory_history**: Historial de cambios (auditoría)

Ver detalles completos en `config/init-database.sql`

## Próximas Funcionalidades

- [ ] Subida de archivos (fotos, vídeos, audios)
- [ ] Búsqueda por texto completo
- [ ] Compartir recuerdos
- [ ] Exportar datos
- [ ] Estadísticas y gráficos
- [ ] Integración con calendarios

## Solución de Problemas

### Puerto 3001 en uso
```bash
# Cambiar puerto en .env o:
PORT=3002 npm run dev
```

### Error de base de datos
Elimina la carpeta `data/` para reiniciar la base de datos:
```bash
rm -rf data/
npm run dev
```

### Dependencias no se instalan
```bash
rm -rf node_modules package-lock.json
npm install
```

## Estructura del Proyecto

```
Mis Memorias de Oro/
├── src/
│   ├── server.js        # Servidor Express principal
│   ├── db.js            # Inicialización de base de datos
│   ├── auth.js          # Autenticación y usuarios
│   └── memories.js      # Lógica de recuerdos
├── public/
│   └── index.html       # Aplicación React (frontend)
├── data/
│   └── memorias.db      # Base de datos SQLite
├── config/
│   └── .env.example     # Configuración de ejemplo
├── package.json         # Dependencias del proyecto
└── README.md            # Este archivo
```

## Notas de Desarrollo

- El frontend está incluido en `public/index.html` como una aplicación React de una sola página
- Se utiliza SQLite para almacenamiento de datos local
- Las contraseñas se hashean con bcrypt
- Los recuerdos están separados por usuario
