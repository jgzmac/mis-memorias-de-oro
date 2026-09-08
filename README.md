# ✨ Mis Memorias de Oro

> Una aplicación web moderna para guardar y organizar tus recuerdos más preciosos.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v22%2B-green)]()
[![Status](https://img.shields.io/badge/Status-MVP%20v1.0-blue)]()

## 🎯 Características

### Crear Memorias
- ✅ Título y contenido detallado
- ✅ Fecha personalizable (default: hoy)
- ✅ Categorización (Viajes, Personal, Familia, Trabajo, General)
- ✅ Sistema de etiquetas dinámico
- ✅ Mood tracking (5 estados de ánimo)

### Gestionar Memorias
- ✅ Listar todas tus memorias ordenadas por fecha
- ✅ Ver detalles completos
- ✅ Editar memorias existentes
- ✅ Eliminar con confirmación
- ✅ Filtrar por categoría

### Estadísticas
- ✅ Total de memorias
- ✅ Distribución por categoría
- ✅ Distribución por estado de ánimo

## 🚀 Quick Start

### Requisitos
- Node.js v22+
- npm

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/mis-memorias-de-oro.git
cd mis-memorias-de-oro

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001) en tu navegador.

## 📊 Stack Tecnológico

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** (desarrollo) - Base de datos local
- **Supabase** (próximo) - PostgreSQL + Auth

### Frontend
- **Vanilla JavaScript** - Sin dependencias
- **HTML5 + CSS3** - Markup y estilos
- **Responsive Design** - Mobile-friendly

## 📁 Estructura del Proyecto

```
src/
├── server.js              # Express app + rutas
├── db.js                  # SQLite initialization
├── api/handlers.js        # Lógica CRUD
├── auth.js                # Autenticación
└── memories.js            # Operaciones

public/
└── index.html             # SPA completa (550+ líneas)

config/
├── supabase.js            # Supabase config
└── init-database.sql      # Schema PostgreSQL

docs/
├── API.md                 # Documentación API
├── SETUP.md               # Guía de setup
└── ARCHITECTURE.md        # Decisiones técnicas
```

## 🧪 API Endpoints

```
POST   /api/memories              Crear memoria
GET    /api/memories              Listar memorias
GET    /api/memories/:id          Obtener detalle
PUT    /api/memories/:id          Actualizar
DELETE /api/memories/:id          Eliminar
GET    /api/stats                 Estadísticas
GET    /api/health                Health check
```

## 🔧 Configuración

```bash
# Copiar variables de entorno
cp .env.example .env

# Editar .env si es necesario
# PORT=3001
# NODE_ENV=development
```

## 🗺️ Roadmap

### v1.0 ✅ (Actual)
- [x] CRUD básico de memorias
- [x] Frontend SPA
- [x] Categorización y etiquetas
- [x] Estadísticas
- [x] Responsive design

### v1.1 (Próximo)
- [ ] Upload de fotos
- [ ] Búsqueda full-text
- [ ] Exportar a JSON/CSV

### v2.0 (Supabase)
- [ ] Autenticación real
- [ ] Multi-usuario
- [ ] Sincronización en cloud
- [ ] Apps móvil

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT - Ver [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Javier Gómez**

---

Hecho con ❤️ por desarrolladores que valoran los recuerdos.
