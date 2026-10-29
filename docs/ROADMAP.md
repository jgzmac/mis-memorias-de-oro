# Hoja de ruta - Mis Memorias de Oro

Actualizada: 2026-10-29. Orden propuesto (se puede cambiar).

## Hecho
- Recuerdos manuales (crear, editar, borrar, lista), base de datos persistente
- Lanzador para Mac sin permisos de administrador
- Cuentas de usuario (correo + contraseña), recuerdos privados por persona
- Audio: grabar o subir, transcripción local (Whisper), extracción de fecha/periodo, personas, lugar y tipo, revisión y confirmación
- Nueva imagen (paleta salvia) y dos botones grandes: "Contar con mi voz" y "Escribir"
- Línea de vida: etapas, perfil de nacimiento, hechos históricos (mundo y España), vista horizontal móvil (pendiente de que el usuario la pruebe)
- Fotos y vídeos: metadatos (fecha, GPS, cámara), reconocimiento de escenas con CLIP local, transcripción del audio del vídeo, revisión y visualización (probado solo con una foto de ejemplo)

- Menú inferior con iconos (Inicio, Recuerdos, Crear, Línea de vida, Perfil con salir), buscador y orden (más reciente primero por defecto) en Recuerdos y Línea de vida; probado con simulación del navegador, pendiente de que el usuario lo vea en pantalla

- Resumen de vida (B2): sección "Resumen" en el menú; 4 estilos positivos (amable, alegre, nostálgico-cálido, entusiasta); de toda la vida, un año o una persona; copiar y descargar. Redacción local con plantillas (gratis); proveedor intercambiable en `src/providers/summary.js`.
- Filtros avanzados (año, tipo, lugar, persona) en Recuerdos y Línea de vida.
- Presentación web para Dirección/patrocinadores: `docs/presentacion.html` (autocontenida, con demo de voz, línea de vida y resúmenes interactivos). También existe `docs/Mis-Memorias-de-Oro-presentacion.pptx`.
- Onboarding (A0): en pausa, el usuario aún no lo tiene claro.

## Principios de diseño
- **Mobile-first:** se diseña primero para el móvil. Botones grandes, una acción principal por pantalla, formularios cortos.
- **Coste cero en el MVP, con opción de cambiar:** motores locales/gratuitos; cada servicio de IA detrás de un "proveedor" intercambiable.
- **Colores:** variables CSS en `:root`.
- **Residencias y etapas:** la aplicación las propone y la persona las completa o corrige.

## Siguiente: Fase N - Navegación inferior (pedida 2026-10-29)
- **Menú inferior fijo con iconos** para elegir funcionalidad: 🏠 Inicio · 📖 Recuerdos · 🕰️ Línea de vida · ➕ Crear (voz/texto/foto/vídeo) · 👤 Perfil.
- **Inicio:** pantalla de bienvenida con los accesos principales (crear recuerdo, últimos recuerdos); el icono Inicio siempre vuelve aquí.
- **Perfil:** datos de la persona (nombre, nacimiento, lugar), ajustes y **Cerrar sesión / salir** (se retira el botón actual de salir de la cabecera).
- Una sola sección visible a la vez; los botones de crear salen de la pantalla principal y pasan al menú o a Inicio.
- Es la base para el resto de fases (cada nueva función = un icono o una sección), por eso conviene hacerla antes del onboarding y del resumen.

## Línea de vida: orden y buscador (pedido 2026-10-29)
- **Orden elegible** en la línea de vida y en sus listas de recuerdos: por defecto del **más reciente al más antiguo** (según la fecha en que ocurrió, no cuando se subió); se puede cambiar a más antiguo primero.
- **Buscador** (texto libre: título, contenido, personas, lugar) dentro de la línea de vida y de la lista de recuerdos; después filtros por persona, lugar, año y tipo.
- Encaja con la Fase N: el buscador y el orden irían en la parte superior de Recuerdos y Línea de vida. Se hace junto a la navegación o justo después.

## Ajustes 2026-10-29 (hechos en local, pendiente de commit y de que el usuario los vea)
- Perfil: cambiar nombre y contraseña (pide la actual y la nueva dos veces; cierra otras sesiones).
- Registro: contraseña repetida e indicador de seguridad (débil / media / fuerte), también al cambiarla.
- Iconos de trazo fino monocromo (sprite SVG) en lugar de emojis; el usuario dirá si le gusta el estilo.
- Línea de vida: fila "General" con una marca en cada fecha que tiene algún recuerdo.

## Fases pendientes (orden propuesto)
1. **Fase N - Navegación inferior** (arriba). Tamaño medio, solo interfaz.
2. **Pruebas y ajustes de lo ya hecho:** feedback del usuario sobre la línea de vida y sobre fotos/vídeos reales; probar vídeo con voz; fotos HEIC (iPhone).
3. **Fase A0 - Onboarding inicial:** asistente paso a paso la primera vez (nombre, nacimiento, lugar, dónde vive; explicación breve de funciones), se puede saltar y completar luego en Perfil. Prioridad media-baja.
4. **Fase B2 - Resumen de vida automático:** historia por escrito con tono siempre positivo y estilos a elegir (amable, alegre, entusiasta, nostálgico-cálido); alcance: toda la vida, una etapa, un año o una persona. Modelo local gratuito con opción de pasar a OpenAI. Si se usa servicio externo, avisar y pedir consentimiento.
5. **Fase E - Mejoras transversales:**
   - Filtros avanzados en la lista y la línea de vida (persona, lugar, fecha, tipo); el buscador básico y el orden van antes (ver sección arriba)
   - Mejor extracción del audio con ejemplos reales; ampliar ciudades y escenas de fotos
   - Opción de OpenAI como proveedor de IA
   - Seguridad: quitar el token de GitHub de la configuración del repositorio y revocar los antiguos
   - Pruebas automáticas y documentación (ARCHITECTURE, API, SETUP); revisar `package-lock.json`
   - Ampliar `history.json` más allá de 2022

## Notas técnicas
- Una máquina nueva necesita el modelo CLIP (~150 MB) en `data/models/Xenova/clip-vit-base-patch32/onnx/model_quantized.onnx`, el modelo de voz en `data/models` y la dependencia `exifr`. La red de la empresa bloquea las descargas de Node: los modelos se descargan desde el sandbox.
- Residencias: las propone la aplicación y el usuario completa lo que falte.

## Decisiones abiertas
- Fase N: ¿qué iconos/orden exactos del menú? (propuesta arriba; ¿"Crear" como botón central destacado?)
- Fase B2: estilos positivos que quiere ver.
- Línea de vida: si se quiere alguna perspectiva más (Familia, Viajes).
