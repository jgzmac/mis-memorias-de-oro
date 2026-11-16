# Propiedad intelectual - Mi Círculo del Tiempo

Titular: **Jorge Gómez Zardaín**. Documento orientativo, no es asesoramiento legal: conviene validarlo con un abogado de propiedad intelectual.

## Medidas ya incluidas en el proyecto (v2.1.3)

- `LICENSE`: software propietario, todos los derechos reservados (ES/EN).
- `NOTICE`: licencias de terceros (dependencias, qrcode.js, Nunito, modelos Whisper y CLIP).
- Aviso © solo en las cabeceras internas de `src/`; en la app (Perfil), la presentación web y el PowerPoint figura de forma discreta "Proyecto personal de Jorge Gómez Zardaín". También en `package.json` (`UNLICENSED`, `private`) y en el README.

## Medidas recomendadas (las haces tú)

1. **Aclarar la autoría frente al empleador (prioritario).** En España, el software creado por un empleado en el ejercicio de sus funciones o siguiendo instrucciones del empleador pertenece a este (art. 97 del TRLPI). El proyecto se ha trabajado en un Mac corporativo y está previsto presentarlo a Dirección (todavía no se ha hecho): conviene aclararlo **antes** de presentarlo. Conviene revisar el contrato y pedir, si procede, una **declaración por escrito de que el proyecto es ajeno a tus funciones y a tus medios** (o una cesión/licencia expresa).
2. **Registro en el Registro de la Propiedad Intelectual** (Ministerio de Cultura, trámite online con certificado digital). No es obligatorio, pero da prueba de autoría y fecha. Se deposita un extracto del código (primeras y últimas ~25 páginas) más la memoria descriptiva; se puede ocultar parte del código como secreto.
3. **Prueba de fecha adicional y barata:** conservar el historial de Git (ya existe desde 2026-09) y, opcionalmente, un sello de tiempo o depósito notarial del código.
4. **Marca (nombre aún sin decidir):** hasta que el nombre sea definitivo no conviene registrarlo; mientras tanto, consultar la disponibilidad de "Mi Círculo del Tiempo" en la OEPM (oepm.es) y en EUIPO antes de comercializar; registrar en las clases 9, 42 y 45 si procede. Es lo que protege el nombre, no el copyright.
5. **Repositorio GitHub:** si el repositorio es público, cualquiera puede verlo pero sin licencia no puede usarlo. Si no hace falta, ponerlo **privado**.
6. **Contenido de las personas usuarias:** los recuerdos, fotos, audios y vídeos son de quien los sube. Los términos de uso deben decir que conservan su titularidad y que solo concedes la licencia mínima para prestar el servicio (alojar, procesar, mostrar al círculo). Revisar con la revisión legal pendiente de condiciones y privacidad.
7. **Datos personales (RGPD):** los recuerdos incluyen datos de terceros y posiblemente de salud. Es un tema distinto de la propiedad intelectual, pero se resuelve junto con los textos legales.
8. **Colaboradores futuros:** firmar un acuerdo de cesión de derechos y de confidencialidad antes de que alguien aporte código, diseño o textos.
9. **Terceros:** al actualizar dependencias, revisar `NOTICE`. Verificar en la ficha de Hugging Face la licencia de los modelos `Xenova/whisper-small` y `Xenova/clip-vit-base-patch32` antes de comercializar.
10. **Presentaciones y documentos:** el PowerPoint, la presentación web y la app solo indican "Proyecto personal de Jorge Gómez Zardaín" (sin ©, a propósito, por ser fase preliminar; el © no es obligatorio y los derechos existen igualmente). Al compartirlos fuera, marcarlos "Confidencial" y usar PDF.

## Pendiente de decisión

- Si se quiere abrir el código en el futuro (p. ej. AGPL con doble licencia), se cambia `LICENSE`; mientras tanto el titular único conserva todas las opciones.
