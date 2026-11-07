# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [2.1.0] - 2026-11-07 - Nuevo nombre

### Changed
- La aplicación pasa a llamarse **Mi Círculo del Tiempo** (app, presentación web, PowerPoint y documentación).
- Debajo de cada buscador (Recuerdos y Línea de vida) aparece una frase que explica qué se está mostrando: búsqueda, filtros, orden y, en la línea de vida, la etapa o periodo seleccionado.

## [2.0.2] - 2026-11-05

### Changed
- Perfil: "Cambiar foto" y "Quitar foto" vuelven a un tamaño pequeño y con el mismo aspecto.

## [2.0.1] - 2026-11-05

### Changed
- Perfil: "Quitar foto" con el mismo aspecto que "Cambiar foto".

## [2.0.0] - 2026-11-05 (Release candidate)

### Added
- Modo privado (sustituye a "Ocultar mi edad"): no muestra la edad y cambia fotos, vídeos y audios por un icono de candado en toda la app y en el resumen compartido (los archivos dejan de servirse por el enlace). Icono "i" con la explicación.

### Changed
- Saludo "Hola xxx" de Inicio más legible (verde oscuro sobre franja translúcida).

## [1.2.0] - 2026-11-04 (Release candidate)

### Added
- Registro con casilla obligatoria de condiciones de uso y política de privacidad (ventana con texto borrador); se guarda la fecha de aceptación.
- Botón "ver contraseña" propio en registro y cambio de contraseña.
- Botón de registro/acceso deshabilitado hasta completar correctamente los datos obligatorios.
- Hechos históricos ampliados (226): guerras, deporte, libros Nobel y películas.
- Primer fotograma del vídeo en "¿Te acuerdas de este día?".
- Anexo técnico (`docs/ANEXO-TECNICO.md`).

### Changed
- Fecha de fotos y vídeos: si el metadato y el nombre no coinciden, se propone el metadato.
- "Últimos recuerdos añadidos" con los mismos iconos de tipo que el listado de recuerdos.
- Sin botón "Cerrar" mientras se procesa un audio.
- Resumen "Amable" sustituido por "Literario"; categorías Deporte, Aniversario y Turismo; sentimiento "Emocionado" retirado.

### Fixed
- Fondo transparente al hacer scroll en la pantalla de revisión en móvil.
- Casilla de condiciones mal formateada.

### Documentation
- README actualizado.

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
