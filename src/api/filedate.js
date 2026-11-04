/**
 * api/filedate.js - Fecha de un recuerdo a partir de su archivo.
 *
 * Muchos móviles y aplicaciones ponen la fecha en el nombre (IMG_20230415_101500.jpg,
 * VID-20230415-WA0001.mp4, 2023-04-15 10.20.30.m4a, 1681555200000.jpg...). Esa fecha suele ser
 * más fiable que la "fecha del archivo", que cambia al descargarlo o copiarlo.
 */

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function validDate(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
  return y >= 1900 && dt.getTime() <= Date.now() + 86400000;
}

// Devuelve 'AAAA-MM-DD' si el nombre parece llevar una fecha válida; si no, ''
function dateFromName(filename) {
  const base = String(filename || '').replace(/^.*[\\/]/, '').replace(/\.[A-Za-z0-9]{1,5}$/, '');
  if (!base) return '';
  let m;

  // Marca de tiempo Unix en milisegundos (13 cifras) o segundos (10 cifras)
  if ((m = base.match(/(?<!\d)(\d{13})(?!\d)/))) {
    const dt = new Date(Number(m[1]));
    if (!isNaN(dt) && dt.getFullYear() >= 1995 && dt.getTime() <= Date.now() + 86400000) return iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }
  if ((m = base.match(/(?<!\d)(\d{10})(?!\d)/))) {
    const dt = new Date(Number(m[1]) * 1000);
    if (!isNaN(dt) && dt.getFullYear() >= 1995 && dt.getTime() <= Date.now() + 86400000) return iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  // AAAAMMDD, AAAA-MM-DD, AAAA_MM_DD, AAAA.MM.DD
  const ymd = /(?<!\d)((?:19|20)\d{2})[-_. ]?(0[1-9]|1[0-2])[-_. ]?(0[1-9]|[12]\d|3[01])(?!\d)/g;
  while ((m = ymd.exec(base))) if (validDate(+m[1], +m[2], +m[3])) return iso(+m[1], +m[2], +m[3]);

  // DD-MM-AAAA (forma habitual en España)
  const dmy = /(?<!\d)(0[1-9]|[12]\d|3[01])[-_. ](0[1-9]|1[0-2])[-_. ]((?:19|20)\d{2})(?!\d)/g;
  while ((m = dmy.exec(base))) if (validDate(+m[3], +m[2], +m[1])) return iso(+m[3], +m[2], +m[1]);

  return '';
}

const show = (d) => d.split('-').reverse().join('/');
const dayDiff = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 86400000;

/**
 * Decide la fecha propuesta.
 *  - metaDate: fecha de los datos internos del archivo (EXIF, cabecera del vídeo)
 *  - nameDate: fecha del nombre del archivo
 *  - fileDate: fecha de modificación del archivo (la menos fiable)
 * Si datos y nombre coinciden, queda confirmada; si no, se propone la de los datos internos.
 * `what`: 'foto', 'vídeo' o 'audio' (solo para los mensajes).
 */
function resolveDate({ metaDate = '', nameDate = '', fileDate = '', what = 'archivo' }) {
  const notes = [];
  const art = what === 'foto' ? 'la foto' : what === 'vídeo' ? 'el vídeo' : 'el audio';
  const de = what === 'foto' ? 'de la foto' : what === 'vídeo' ? 'del vídeo' : 'del audio';
  if (metaDate && nameDate) {
    // Un día de margen: los datos internos suelen ir en hora universal y el nombre en hora local
    if (dayDiff(metaDate, nameDate) <= 1) {
      notes.push(`Fecha confirmada: coincide la de los datos ${de} con la del nombre del archivo.`);
      return { date: nameDate, confirmed: true, notes };
    }
    // El dato interno lo escribe el dispositivo al crear el archivo; el nombre se puede cambiar o arrastrar de otra copia
    notes.push(`La fecha de los datos ${de} (${show(metaDate)}) y la del nombre del archivo (${show(nameDate)}) no coinciden: propongo la de los datos ${de}, que es más fiable. Compruébala.`);
    return { date: metaDate, confirmed: false, notes };
  }
  if (metaDate) {
    notes.push(`Fecha tomada de los datos ${de}.`);
    return { date: metaDate, confirmed: false, notes };
  }
  if (nameDate) {
    if (fileDate && dayDiff(fileDate, nameDate) <= 1) notes.push(`Fecha confirmada: coincide la del nombre del archivo con la fecha del propio archivo (${show(nameDate)}).`);
    else notes.push(`Fecha tomada del nombre del archivo (${show(nameDate)}), porque ${art} no trae fecha propia. Compruébala.`);
    return { date: nameDate, confirmed: !!(fileDate && dayDiff(fileDate, nameDate) <= 1), notes };
  }
  if (fileDate) {
    notes.push(`${art[0].toUpperCase() + art.slice(1)} no trae fecha propia: he usado la fecha del archivo, que puede no ser la real. Compruébala.`);
    return { date: fileDate, confirmed: false, notes };
  }
  notes.push('No he encontrado la fecha. Indícala tú.');
  return { date: '', confirmed: false, notes };
}

module.exports = { dateFromName, resolveDate };
