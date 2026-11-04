# Mis Memorias de Oro

Aplicación web (piloto) para guardar los recuerdos de una vida con la voz, el texto, fotos y vídeos, verlos en una línea de vida y obtener un resumen en distintos estilos. Versión **1.2.0 - Release candidate**.

## Qué hace

- **Crear recuerdos** hablando (grabación de hasta 2 minutos o archivo de audio), escribiendo, o subiendo fotos y vídeos. La IA local propone título, fecha, lugar, personas, etiquetas y sentimiento, y el usuario lo revisa antes de guardar.
- **Fechas** aproximadas (día, mes, estación, año o periodo) y edad en cada recuerdo. En fotos y vídeos se prioriza la fecha del metadato sobre la del nombre del archivo.
- **Línea de vida** con etapas (escolar, profesional, residencias), huecos y hechos históricos ("¿Quieres saber qué pasó ese año?").
- **Resumen de vida** en cinco estilos (Literario, Alegre, Cálido, Entusiasta, Ejecutivo), con enlace y QR para compartir.
- **Cuentas** con registro (aceptación de condiciones y privacidad), contraseña segura y foto de perfil; círculo de personas.
- **Inicio** con "¿Te acuerdas de este día?", últimos recuerdos y buscador.

## Arrancar

Requisitos: Node.js 22+ y npm.

```bash
npm install
npm start
```

Abre http://localhost:3001. En Mac también sirve `Iniciar Memorias.command`.

Los datos se guardan en `data/` (base de datos SQLite, archivos y modelos de IA). Los modelos se descargan antes la primera vez (ver `docs/ROADMAP.md`, notas técnicas).

## Documentación

- [Anexo técnico (datos, BBDD, servidor, IA, lenguajes)](docs/ANEXO-TECNICO.md)
- [Arquitectura](docs/ARCHITECTURE.md) (parte del diseño inicial; el anexo técnico es la referencia vigente)
- [Hoja de ruta](docs/ROADMAP.md)
- [Cambios por versión](CHANGELOG.md)

## Licencia

MIT. Ver `LICENSE`.
