# Anexo técnico - Resumen (versión 2.0.0, Release candidate)

## 1. Dónde se guardan los datos

Todo se guarda en local, en la carpeta `data/` del proyecto, en el equipo donde corre la app. `data/` está en `.gitignore`: nada de esto se sube a GitHub y no se usa ningún servicio en la nube.

| Qué | Dónde |
|---|---|
| Base de datos | `data/memorias.db` (más `-wal` y `-shm`) |
| Audios, fotos y vídeos de los recuerdos | `data/uploads/<id de usuario>/` |
| Foto de perfil | `data/uploads/<id de usuario>/avatar.jpg` |
| Modelos de IA descargados | `data/models/` |
| Registro de errores | `data/errores.log` |
| Hechos históricos y lugares (fijos, van en el código) | `src/data/history.json`, `src/data/places.json` |

Variables opcionales: `DB_PATH` (ruta de la BBDD), `UPLOAD_DIR` (ruta de los archivos), `PORT` (por defecto 3001), `LOCAL_STT_MODEL`.

**Copia de seguridad:** copiar la carpeta `data/` entera. Sin ella no hay recuerdos.

## 2. Base de datos

SQLite (fichero único) mediante `better-sqlite3`, modo WAL. Las tablas se crean y migran solas al arrancar (`src/db.js`).

| Tabla | Contenido |
|---|---|
| `users` | correo, nombre, contraseña cifrada (bcrypt), nacimiento (fecha y lugar), ruta de la foto de perfil, modo privado (columna hide_age), `terms_accepted_at` |
| `sessions` | huella (SHA-256) del token de sesión y caducidad (30 días) |
| `memories` | recuerdos: título, texto, fecha y precisión, lugar, etiquetas, sentimiento, usuario |
| `memory_people` | personas de cada recuerdo (nombre y relación) |
| `media` | un registro por audio/foto/vídeo: tipo, nombre original, tamaño, duración, ruta del fichero |
| `life_stages` | etapas de la vida (escolar, profesional, residencia) |
| `circle_people` | círculo de personas del usuario |
| `shares` | resúmenes compartidos con enlace secreto |
| `photos` | tabla antigua, sin uso |

Los archivos no están dentro de la BBDD: solo su ruta. Cada dato pertenece a un usuario y solo él puede verlo.

## 3. Servidor

- Node.js 22+ con Express 4, un único proceso (`src/server.js`), puerto 3001.
- Sirve la API REST (`/api/...`) y la aplicación web estática (`public/`) desde el mismo servidor.
- Sesión por cookie con token aleatorio (se guarda solo su huella); límite de 5 intentos fallidos de acceso.
- Arranque: `npm start` o el acceso directo `Iniciar Memorias.command` (Mac).
- Hoy corre solo en el Mac del autor (sin https; el micrófono en móvil necesita https).

## 4. Modelos de IA

Ambos se ejecutan en local (librería `@huggingface/transformers`, formato ONNX cuantizado); ningún dato sale del equipo.

| Uso | Modelo |
|---|---|
| Voz a texto (español) | `Xenova/whisper-small` (Whisper de OpenAI) |
| Reconocer el contenido de fotos y vídeos y sugerir etiquetas | `Xenova/clip-vit-base-patch32` (CLIP de OpenAI) |

No hay IA generativa: extraer título, fecha, personas, lugar y sentimiento del texto se hace con reglas propias (`src/providers/extract-es.js`), y los resúmenes de vida (Literario, Alegre, Cálido, Entusiasta, Ejecutivo) se generan con plantillas y hechos históricos de una lista cerrada (`src/providers/summary.js`). Los proveedores son intercambiables (`src/providers/index.js`) para poder pasar a modelos en la nube más adelante.

## 5. Lenguajes y librerías

- **JavaScript** en todo el proyecto: backend (Node.js) y frontend (JavaScript sin framework, en un único `public/index.html` con HTML + CSS + JS).
- **SQL** (SQLite) para la base de datos.
- Librerías principales: express, better-sqlite3, bcryptjs, multer (subida de archivos), exifr (fecha y GPS de las fotos), body-parser, cors, dotenv, @huggingface/transformers. QR en el navegador con `public/qrcode.js` (MIT).
- Fuentes e iconos propios incluidos (`public/fonts`, sprite SVG), sin dependencias externas en el navegador.
- La dependencia `@supabase/supabase-js` queda sin uso en el piloto (previsto para una fase posterior).

## 6. Limitaciones conocidas del piloto

- Datos solo en un equipo, sin copia automática.
- Sin https ni despliegue público; el micrófono en móvil real requiere https.
- Textos legales de condiciones y privacidad en borrador: requieren revisión legal antes de abrir al público.
- Sin pruebas automáticas.
- Token de GitHub pendiente de renovar (caduca hacia el 2026-11-29).
