# Hoja de ruta - Mis Memorias de Oro

Actualizada: 2026-10-28. Orden propuesto (se puede cambiar).

## Hecho
- Recuerdos manuales (crear, editar, borrar, lista), base de datos persistente
- Lanzador para Mac sin permisos de administrador
- Cuentas de usuario (correo + contraseña), recuerdos privados por persona
- Audio: grabar o subir, transcripción local (Whisper), extracción de fecha/periodo, personas y relación, lugar y tipo, pantalla de revisión y confirmación, reproductor y enlace en cada recuerdo

## Fase A - Cambio de imagen (rápido, bajo riesgo)
1. Sustituir el morado por un verde suave en toda la aplicación (colores definidos en un solo sitio para poder ajustarlos).
2. Estadísticas: sacarlas de la zona principal. Propuesta: botón o pestaña discreta "Resumen" o una franja pequeña al pie.
3. Navegación por pestañas: **Recuerdos** (lista actual) y **Línea de vida** (nueva). Las fotos y vídeos entrarán dentro de cada recuerdo.

## Fase B - Línea de vida (timeline horizontal)
Datos nuevos necesarios:
- Sección "Mi vida" donde la persona indica sus **etapas**: tipo (escolar/profesional, personal, residencia), nombre, lugar, fecha de inicio y de fin. El audio también podrá proponer etapas.
- Cada recuerdo se asigna a una **línea** (perspectiva): propuesta inicial = Escolar/Profesional, Personal (incluye familia). Se deduce de la categoría actual y se puede cambiar al revisar.

Pantalla:
- Eje horizontal de años con desplazamiento y zoom (década / año).
- Una fila por perspectiva, cada una de un color (tonos de la paleta verde y complementarios).
- Fila superior: dónde vivía en cada periodo (bandas con nombre del lugar).
- Marcas de recuerdos sobre cada fila; los de periodo (fecha inicio-fin) se dibujan como tramo.
- Al pulsar una marca: se abre el recuerdo (con su audio, fotos, etc.).
- Recuerdos sin fecha: no aparecen en el timeline, con aviso para completarlos.

### Ampliaciones de la línea de vida (pedidas 2026-10-28, segunda tanda)
- **Perspectivas decididas:** filas separadas para **Escolar** y **Profesional** (cada una con posibles interrupciones, es decir, varios tramos con huecos), más **Personal** y la franja de **Residencia**.
- **Fila de acontecimientos históricos:** al marcar una fecha se muestra qué ocurrió de relevante en el mundo ese día (y alrededor). Necesita una base de datos de efemérides: se descargará desde el sandbox (p. ej. Wikipedia/Wikidata, en español) y se guardará en `data/` para usarla sin internet. Preguntar al usuario qué ámbito prefiere (mundial, España, ambos).
- **Seleccionar una fecha en las líneas propias:** al pulsar una fecha se listan los recuerdos y archivos (audio, fotos, vídeos) vinculados a ese día o que la abarcan. Misma interacción para la fila histórica.

## Fase B2 - Resumen de vida automático (pedido 2026-10-28)
- Genera por escrito la historia de la vida del usuario a partir de sus recuerdos, siempre con tono positivo.
- Estilos a elegir: amable, alegre, entusiasta, nostálgico-cálido, etc. (todos positivos). Opciones de alcance: toda la vida, una etapa, un año, una persona.
- Salida: texto en pantalla, copiable y descargable (Word/PDF más adelante); cada resumen guarda con qué recuerdos se hizo y puede regenerarse.
- **Condiciona el diseño:** redactar bien requiere un modelo de lenguaje potente. El motor local actual solo hace voz a texto y reglas, no sirve para esto. Opciones: (1) OpenAI u otro servicio de pago por uso (mejor calidad; hay que resolver el certificado de la red de empresa), (2) un modelo local pequeño descargado desde el sandbox (gratis, calidad media, lento en el Mac). Decidir al empezar esta fase; probablemente adelanta la "opción OpenAI" de la fase E.
- Para que el resumen sea bueno, los recuerdos necesitan fecha, personas, lugar y etapa: refuerza el orden Línea de vida -> Resumen.
- Privacidad: si se usa un servicio externo, los textos de los recuerdos salen del ordenador; avisarlo y pedir consentimiento.

## Fase C - Fotos
- Subir una o varias fotos; leer fecha y lugar de los metadatos (EXIF); análisis de imagen para proponer descripción, personas/escena y tipo.
- Misma pantalla de revisión y confirmación que el audio.
- Foto vinculada al recuerdo y accesible por enlace; miniaturas en la lista y en el timeline.
- Nota técnica: cualquier modelo de imagen debe descargarse desde el sandbox a `data/` y cargarse sin internet (la red de la empresa bloquea las descargas de Node).

## Fase D - Vídeos
- Audio del vídeo -> transcripción y extracción (como el audio) + fecha y lugar de los metadatos. No se analiza la imagen.
- Misma pantalla de revisión; vídeo reproducible y accesible por enlace.

## Fase E - Mejoras transversales
- Calidad de la extracción del audio con ejemplos reales del usuario.
- Opción de pasar a OpenAI como proveedor de IA (el sistema ya está preparado; requiere clave de pago por uso y comprobar el certificado de la red de empresa).
- Seguridad: quitar el token de GitHub de la configuración del repositorio y revocar tokens antiguos.
- Pruebas automáticas y documentación (ARCHITECTURE, API, SETUP).
- Búsqueda y filtros en la lista (por persona, lugar, fecha, tipo) - se beneficia de los datos nuevos.

## Decisiones abiertas (preguntar al usuario al empezar cada fase)
- Fase A: ¿qué verde exacto? (se enseñará una muestra de 2-3 tonos).
- Fase B: perspectivas ya decididas (Escolar, Profesional, Personal, Residencia); falta ver si se quiere alguna más (Familia, Viajes).
- Fase B: ámbito de los acontecimientos históricos (mundial, España, ambos).
- Fase B2: servicio de IA para redactar el resumen (pago por uso o modelo local) y estilos positivos que quiere ver.
- Fase B: ¿las etapas de residencia se escriben a mano, o se prefiere que la IA las proponga desde los audios?
