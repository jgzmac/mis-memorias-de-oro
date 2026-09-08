# Arquitectura - Mis Memorias de Oro

## Descripción General

Aplicación web fullstack para gestionar recuerdos personales con categorización, timeline interactiva y filtrado avanzado.

## Stack Tecnológico

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: SQLite (better-sqlite3)
- **Autenticación**: bcrypt para hash de contraseñas
- **Middleware**: CORS, body-parser

### Frontend
- **Framework**: React 18 (incluido con CDN)
- **Transpilación**: Babel standalone
- **Estilos**: CSS vanilla con diseño responsive
- **Almacenamiento**: LocalStorage (navegador)

## Arquitectura de Datos

### Diagrama de Tablas

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │
│ username    │
│ password    │
│ email       │
│ created_at  │
└─────────────┘
      │
      │ 1:N
      │
┌─────────────────────┐
│     memories        │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ title               │
│ description         │
│ category            │
│ location            │
│ date                │
│ created_at          │
│ updated_at          │
└─────────────────────┘
      │         │
      │ 1:N     │ 1:N
      │         │
┌─────────────────────┐    ┌──────────────────┐
│   memory_people     │    │  memory_files    │
├─────────────────────┤    ├──────────────────┤
│ id (PK)             │    │ id (PK)          │
│ memory_id (FK)      │    │ memory_id (FK)   │
│ person_name         │    │ file_path        │
└─────────────────────┘    │ file_type        │
                           │ file_name        │
                           │ uploaded_at      │
                           └──────────────────┘
```

## Flujos principales

### 1. Autenticación
```
Usuario ingresa credenciales
         ↓
POST /api/login
         ↓
Validar en base de datos
         ↓
Retornar token (base64)
         ↓
Cliente almacena token en memoria/localStorage
```

### 2. Crear Recuerdo
```
Usuario completa formulario
         ↓
POST /api/memories (con token)
         ↓
Validar usuario autenticado
         ↓
Insertar en tabla memories
         ↓
Insertar personas en memory_people
         ↓
Retornar recuerdo creado
         ↓
Frontend recarga lista
```

### 3. Obtener Timeline
```
GET /api/memories?filters (con token)
         ↓
Validar autenticación
         ↓
Query con filtros opcionales
         ↓
JOIN con memory_people para obtener personas
         ↓
GROUP BY memory y CONCAT personas
         ↓
Retornar lista ordenada por fecha
```

## Componentes Frontend

### LoginPage
- Formulario de autenticación
- Credenciales por defecto (test/test)
- Manejo de errores

### Dashboard
- **Sidebar**: Navegación entre vistas
- **Content**: Área principal de contenido
- **Timeline**: Lista de recuerdos filtrable
- **Stats**: Tarjetas con estadísticas

### MemoryForm
- Entrada para todos los campos
- Gestión de personas (añadir/eliminar)
- Validación básica

### MemoryDetail
- Modal con vista completa
- Opciones de editar/eliminar
- Vista de archivos asociados

## API Endpoints

### Autenticación
```
POST /api/login
  Body: { username, password }
  Response: { id, username, email, token }

POST /api/register
  Body: { username, password, email }
  Response: { id, username, email, token }
```

### Recuerdos
```
GET /api/memories
  Headers: Authorization: Bearer {token}
  Query: ?category=personal&location=Madrid&startDate=2024-01-01
  Response: [{ id, title, description, category, location, date, people }]

GET /api/memories/:id
  Headers: Authorization: Bearer {token}
  Response: { id, title, description, category, location, date, people, files }

POST /api/memories
  Headers: Authorization: Bearer {token}
  Body: { title, description, category, location, date, people: [] }
  Response: { id, ...body }

PUT /api/memories/:id
  Headers: Authorization: Bearer {token}
  Body: { title, description, category, location, date, people: [] }
  Response: { id, ...body }

DELETE /api/memories/:id
  Headers: Authorization: Bearer {token}
  Response: { success: true }

GET /api/memories/stats
  Headers: Authorization: Bearer {token}
  Response: { total, profesional, personal, general }
```

### Archivos (futuro)
```
POST /api/memories/:memoryId/files
  Headers: Authorization: Bearer {token}
  Body: FormData { file, fileType }

DELETE /api/files/:fileId
  Headers: Authorization: Bearer {token}
  Response: { success: true }
```

## Características Actuales

✅ Autenticación básica
✅ CRUD de recuerdos
✅ Categorización (Personal, Profesional, General)
✅ Filtrado por categoría, ubicación y fechas
✅ Timeline visual
✅ Gestión de personas asociadas
✅ Estadísticas
✅ Interfaz responsive

## Características Futuras

- [ ] Subida de archivos multimedia
- [ ] Búsqueda por texto completo (full-text search)
- [ ] Tags y etiquetas personalizadas
- [ ] Exportar a PDF
- [ ] Compartir recuerdos con otros usuarios
- [ ] Sincronización en la nube
- [ ] Autenticación OAuth (Google, etc)
- [ ] Notificaciones y recordatorios
- [ ] Integración con mapas (ubicaciones)
- [ ] Análisis y estadísticas avanzadas

## Consideraciones de Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Isolamiento de datos por usuario
- ✅ Validación en servidor
- ✅ CORS configurado
- 📋 Token validation básico (mejorar)
- 📋 Rate limiting (agregar)
- 📋 HTTPS en producción
- 📋 Validación de entrada más robusta

## Escalabilidad

### Mejoras futuras
- Migrar SQLite a PostgreSQL
- Agregar Redis para caché
- Implementar paginación
- Agregar índices en base de datos
- CDN para archivos estáticos
- Compresión de respuestas API

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar con hot-reload
npm run dev

# Producción
NODE_ENV=production npm start
```

## Deploy

### Opciones
1. **Heroku**: Deploying Node.js app con SQLite
2. **Vercel**: Frontend React + serverless backend
3. **Docker**: Containerizar aplicación
4. **VPS**: Auto-hosting en servidor dedicado
