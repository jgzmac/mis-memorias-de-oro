# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.0.0] - 2026-09-08

### ✨ Added
- MVP funcional completo
- Backend API REST con Express.js
- Base de datos SQLite local
- 6 endpoints CRUD completos (POST, GET, PUT, DELETE)
- Frontend SPA con vanilla JavaScript
- Sistema de etiquetas dinámicas
- Categorización de memorias
- Mood tracking (5 estados)
- Estadísticas en tiempo real
- Validación de entrada
- UI responsiva y moderna
- Health check endpoint

### 🔧 Changed
- Decisión arquitectónica: SQLite para desarrollo local (Supabase para producción)
- Frontend: vanilla JS sin dependencias externas

### 🐛 Fixed
- Problemas de conectividad en sandbox
- Error de I/O en SQLite
- Permisos de archivo en entorno de desarrollo

### 📚 Documentation
- README.md completo
- API.md con ejemplos
- SETUP.md con instrucciones
- ARCHITECTURE.md con decisiones técnicas
- README-SESSION.md con detalles de desarrollo

## [0.1.0] - 2026-07-30

### Initial Setup
- Estructura del proyecto
- Stack definido (Node + Express + SQLite → Supabase)
- Configuración de Supabase
- Schema SQL creado
- Variables de entorno

---

## Próximas versiones

### [1.1.0] - Previsto Q4 2026
- [ ] Upload de fotos
- [ ] Búsqueda full-text
- [ ] Exportar/Importar datos
- [ ] Integración con Supabase

### [2.0.0] - Previsto 2027
- [ ] Autenticación real
- [ ] Multi-usuario
- [ ] Apps móvil (React Native)
- [ ] Colaboración en tiempo real

---

## Convenciones de Versionado

Este proyecto sigue [Semantic Versioning](https://semver.org/):

- **MAJOR**: Cambios incompatibles
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Bug fixes

## Cómo contribuir

Ver [CONTRIBUTING.md](docs/CONTRIBUTING.md) para instrucciones detalladas.
