/**
 * extract-es.js - Extracción de datos de un recuerdo a partir de su texto (español).
 * Reglas sencillas y sin coste: fecha/periodo, personas y relación, lugar, tipo y ánimo.
 * Todo es opcional: lo que no se detecta queda vacío para que el usuario lo complete.
 */

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
};
const MONTH_RE = Object.keys(MONTHS).join('|');
const SEASONS = { primavera: [3, 5], verano: [6, 8], otoño: [9, 11], invierno: [12, 2] };
const NUM_WORDS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50
};
const DECADES = { sesenta: 1960, setenta: 1970, ochenta: 1980, noventa: 1990 };

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const cap = '[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+';

// ===== Fecha o periodo =====
function extractDate(text, today = new Date()) {
  const nowYear = today.getFullYear();
  let m;

  if ((m = text.match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${MONTH_RE})\\s+(?:de|del)\\s+(\\d{4})\\b`, 'i')))) {
    const d = Number(m[1]), mo = MONTHS[m[2].toLowerCase()], y = Number(m[3]);
    if (d >= 1 && d <= lastDay(y, mo)) return { date_happened: iso(y, mo, d), date_end: null, date_text: m[0] };
  }
  if ((m = text.match(new RegExp(`\\b(${MONTH_RE})\\s+(?:de|del)\\s+(\\d{4})\\b`, 'i')))) {
    const mo = MONTHS[m[1].toLowerCase()], y = Number(m[2]);
    return { date_happened: iso(y, mo, 1), date_end: iso(y, mo, lastDay(y, mo)), date_text: m[0] };
  }
  if ((m = text.match(/\b(primavera|verano|otoño|invierno)\s+(?:de|del)\s+(\d{4})\b/i))) {
    const [a, b] = SEASONS[m[1].toLowerCase()], y = Number(m[2]);
    const endYear = b < a ? y + 1 : y;
    return { date_happened: iso(y, a, 1), date_end: iso(endYear, b, lastDay(endYear, b)), date_text: m[0] };
  }
  if ((m = text.match(/\blos\s+(?:años\s+)?(sesenta|setenta|ochenta|noventa)\b/i))) {
    const y = DECADES[m[1].toLowerCase()];
    return { date_happened: iso(y, 1, 1), date_end: iso(y + 9, 12, 31), date_text: m[0] };
  }
  if ((m = text.match(/\blos\s+años\s+([6-9]0)\b/i))) {
    const y = 1900 + Number(m[1]);
    return { date_happened: iso(y, 1, 1), date_end: iso(y + 9, 12, 31), date_text: m[0] };
  }
  if ((m = text.match(/\b(19\d{2}|20[0-4]\d)\b/))) {
    const y = Number(m[1]);
    if (y <= nowYear) return { date_happened: iso(y, 1, 1), date_end: iso(y, 12, 31), date_text: m[0] };
  }
  if ((m = text.match(/\bhace\s+(\d{1,2}|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta|cuarenta|cincuenta)\s+años\b/i))) {
    const n = /^\d/.test(m[1]) ? Number(m[1]) : NUM_WORDS[m[1].toLowerCase()];
    const y = nowYear - n;
    return { date_happened: iso(y, 1, 1), date_end: iso(y, 12, 31), date_text: m[0] };
  }
  if (/\bel\s+año\s+pasado\b/i.test(text)) {
    const y = nowYear - 1;
    return { date_happened: iso(y, 1, 1), date_end: iso(y, 12, 31), date_text: 'el año pasado' };
  }
  if (/\bayer\b/i.test(text)) {
    const d = new Date(today.getTime() - 86400000);
    return { date_happened: iso(d.getFullYear(), d.getMonth() + 1, d.getDate()), date_end: null, date_text: 'ayer' };
  }
  return { date_happened: null, date_end: null, date_text: '' };
}

// ===== Personas y relación =====
const RELATIONS = [
  'abuela', 'abuelo', 'abuelos', 'yaya', 'yayo', 'madre', 'mamá', 'padre', 'papá', 'padres', 'hermano', 'hermana',
  'hermanos', 'tío', 'tía', 'tíos', 'primo', 'prima', 'primos', 'hijo', 'hija', 'hijos', 'nieto', 'nieta', 'nietos',
  'marido', 'esposo', 'esposa', 'mujer', 'pareja', 'novio', 'novia', 'amigo', 'amiga', 'amigos', 'compañero',
  'compañera', 'jefe', 'jefa', 'vecino', 'vecina', 'suegro', 'suegra', 'cuñado', 'cuñada', 'sobrino', 'sobrina',
  'madrina', 'padrino', 'profesor', 'profesora', 'maestro', 'maestra'
];
const NOT_NAMES = new Set([
  ...Object.keys(MONTHS).map(s => s[0].toUpperCase() + s.slice(1)),
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Navidad', 'Nochebuena', 'Nochevieja',
  'Después', 'Luego', 'Entonces', 'También', 'Allí', 'Aquí', 'Era', 'Estaba', 'Estábamos', 'Fue', 'Ese', 'Esa',
  'Todo', 'Todos', 'Recuerdo', 'Cuando', 'Pero', 'Aquel', 'Aquella', 'Fuimos', 'Esto', 'Eso', 'Hoy', 'Ayer', 'Mi',
  'Mis', 'Nos', 'Me', 'Ahora', 'Siempre', 'Nunca', 'Dios', 'España'
]);

const nameRe = `(${cap}(?:\\s+${cap})?)`;

function extractPeople(text) {
  const found = []; // {name, relation}
  const relRe = new RegExp(
    `\\b(?:[Mm]i|[Mm]is|[Nn]uestr[oa]s?)\\s+(${[...RELATIONS].sort((a, b) => b.length - a.length).join('|')})(?![a-záéíóúñ])(?:\\s+(?:llamad[oa]\\s+)?${nameRe})?`, 'g');
  let m;
  while ((m = relRe.exec(text))) {
    let name = m[2] || '';
    if (name && NOT_NAMES.has(name.split(' ')[0])) name = '';
    found.push({ name, relation: m[1].toLowerCase() });
  }

  const withRe = new RegExp(`\\b(?:con|junto\\s+(?:a|con))\\s+(${cap}(?:\\s+${cap})?(?:(?:,\\s*|\\s+y\\s+)${cap}(?:\\s+${cap})?)*)`, 'g');
  while ((m = withRe.exec(text))) {
    for (const raw of m[1].split(/,\s*|\s+y\s+/)) {
      const name = raw.trim();
      if (name && !NOT_NAMES.has(name.split(' ')[0])) found.push({ name, relation: '' });
    }
  }

  // Unificar: un mismo nombre se queda con la relación si alguna entrada la trae
  const byName = new Map();
  const relationOnly = [];
  for (const p of found) {
    if (!p.name) { relationOnly.push(p); continue; }
    const key = p.name.toLowerCase();
    const prev = byName.get(key);
    if (!prev || (!prev.relation && p.relation)) byName.set(key, p);
  }
  const people = [...byName.values()];
  for (const p of relationOnly) {
    // "mi abuela" sin nombre se descarta si ya hay una abuela con nombre
    if (!people.some(q => q.relation === p.relation) && !people.some(q => q.relation === p.relation && q.name)) {
      if (!people.some(q => !q.name && q.relation === p.relation)) people.push(p);
    }
  }
  return people.slice(0, 20);
}

// ===== Lugar =====
const GENERIC_PLACES = [
  'playa', 'pueblo', 'casa', 'colegio', 'escuela', 'instituto', 'universidad', 'iglesia', 'montaña', 'campo',
  'ciudad', 'jardín', 'parque', 'hospital', 'cocina', 'restaurante', 'hotel', 'piscina', 'río', 'lago', 'granja',
  'finca', 'barrio', 'calle', 'oficina', 'bar', 'mercado', 'plaza', 'terraza', 'salón'
];

function extractPlace(text, peopleNames) {
  const taken = new Set(peopleNames.map(n => n.toLowerCase()));
  let proper = '';
  const properRe = new RegExp(
    `\\b(?:[Ee]n|por|hacia|(?:viaje|viajamos|fuimos|fui|llegamos|llegué|vacaciones|mudamos|mudé)\\s+a)\\s+(${cap}(?:\\s+(?:de|del|de\\s+la|de\\s+los|de\\s+las)\\s+${cap}|\\s+${cap})*)`, 'g');
  let m;
  while ((m = properRe.exec(text))) {
    const first = m[1].split(' ')[0];
    if (NOT_NAMES.has(first) || taken.has(m[1].toLowerCase())) continue;
    proper = m[1];
    break;
  }

  let generic = '';
  const gm = text.match(new RegExp(
    `\\b[Ee]n\\s+((?:la|el|las|los|un|una)\\s+)?(${GENERIC_PLACES.join('|')})(\\s+de\\s+(?:mis?\\s+)?[a-záéíóúñ]+(?:\\s+${cap})?)?`));
  if (gm) generic = `${gm[1] || ''}${gm[2]}${gm[3] || ''}`.trim();

  if (proper && generic) return `${proper} (${generic})`;
  return proper || generic;
}

// ===== Tipo de recuerdo =====
const EVENT_TYPES = [
  { re: /cumplea[ñn]os/gi, label: 'Cumpleaños', category: 'Familia', w: 3 },
  { re: /\b(boda|casamos|casamiento|nos casamos)\b/gi, label: 'Boda', category: 'Familia', w: 3 },
  { re: /\b(bautizo|comuni[oó]n)\b/gi, label: 'Celebración religiosa', category: 'Familia', w: 3 },
  { re: /\b(navidad|nochebuena|nochevieja|año nuevo|reyes magos)\b/gi, label: 'Fiestas', category: 'Familia', w: 3 },
  { re: /\b(naci[oó]|nacimiento|dar a luz|dio a luz)\b/gi, label: 'Nacimiento', category: 'Familia', w: 3 },
  { re: /\b(funeral|falleci[oó]|muri[oó]|entierro|velatorio)\b/gi, label: 'Despedida', category: 'Familia', w: 3 },
  { re: /\b(aniversario)\b/gi, label: 'Aniversario', category: 'Familia', w: 3 },
  { re: /\b(graduaci[oó]n|graduamos|licenciatura|selectividad|examen)\b/gi, label: 'Estudios', category: 'Personal', w: 3 },
  { re: /\b(mudanza|nos mudamos|me mud[eé]|nueva casa)\b/gi, label: 'Mudanza', category: 'Personal', w: 3 },
  { re: /\b(primera cita|nos conocimos|me enamor[eé])\b/gi, label: 'Pareja', category: 'Personal', w: 3 },
  { re: /\b(viaje|viajamos|vacaciones|excursi[oó]n|crucero|aeropuerto|hotel)\b/gi, label: 'Viaje', category: 'Viajes', w: 2 },
  { re: /\b(comida|cena|barbacoa|paella|reuni[oó]n familiar)\b/gi, label: 'Comida familiar', category: 'Familia', w: 1 },
  { re: /\b(trabajo|empleo|oficina|contrataron|despido|ascenso|empresa)\b/gi, label: 'Trabajo', category: 'Trabajo', w: 2 },
  { re: /\b(colegio|escuela|instituto|universidad|clase)\b/gi, label: 'Estudios', category: 'Personal', w: 1 },
  { re: /\b(partido|torneo|carrera|entrenamiento)\b/gi, label: 'Deporte', category: 'Personal', w: 1 }
];

function extractType(text) {
  let best = null;
  for (const t of EVENT_TYPES) {
    const n = (text.match(t.re) || []).length;
    if (n && (!best || n * t.w > best.score)) best = { ...t, score: n * t.w };
  }
  return best ? { event_type: best.label, category: best.category } : { event_type: '', category: 'General' };
}

// ===== Etiquetas =====
// Solo se marca una etiqueta cuando el texto la nombra con claridad; los nombres coinciden con los de la app.
const TAG_RULES = [
  [/\b(playa|mar|arena|chiringuito|orilla)\b/i, 'Playa'],
  [/\b(vacaciones|veraneo|verano)\b/i, 'Vacaciones'],
  [/\b(viaje|viajamos|viajar|excursi[oó]n|crucero|aeropuerto|hotel|avi[oó]n)\b/i, 'Viaje'],
  [/\b(familia|familiar|abuel[oa]s?|madre|padre|mam[aá]|pap[aá]|herman[oa]s?|t[ií][oa]s?|prim[oa]s?|hij[oa]s?|niet[oa]s?)\b/i, 'Familia'],
  [/\b(amig[oa]s?|colegas|cuadrilla)\b/i, 'Amigos'],
  [/cumplea[ñn]os/i, 'Cumpleaños'],
  [/\b(boda|casamos|casamiento|novia|novio)\b/i, 'Boda'],
  [/\b(trabajo|empleo|oficina|empresa|jefe|compa[ñn]eros de trabajo)\b/i, 'Trabajo'],
  [/\b(colegio|escuela|instituto|universidad|graduaci[oó]n|examen|clase)\b/i, 'Estudios'],
  [/\b(monta[ñn]a|campo|bosque|r[ií]o|senderismo|naturaleza)\b/i, 'Naturaleza'],
  [/\b(perro|perra|gato|gata|mascota)\b/i, 'Mascotas'],
  [/\b(comida|cena|barbacoa|paella|restaurante|almuerzo)\b/i, 'Comida'],
  [/\b(navidad|nochebuena|nochevieja|reyes magos)\b/i, 'Navidad']
];
function extractTags(text, people = []) {
  const out = TAG_RULES.filter(([re]) => re.test(text)).map(([, t]) => t);
  if (people.length > 1 && !out.includes('Amigos') && !out.includes('Familia')) out.push(people.some(p => /amig/.test(p.relation || '')) ? 'Amigos' : 'Familia');
  return [...new Set(out)];
}

// ===== Estado de ánimo =====
function extractMood(text) {
  const t = text.toLowerCase();
  if (/(el mejor d[ií]a|felic[ií]sim|lo mejor de mi vida|inolvidable)/.test(t)) return 'muy feliz';
  if (/(triste|llor[eé]|falleci|muri[oó]|echo de menos|echamos de menos|perdimos|dolor)/.test(t)) return 'triste';
  if (/(emocionad|nervios|ilusi[oó]n|emoci[oó]n)/.test(t)) return 'emocionado';
  if (/(feliz|alegr|contento|divert|genial|maravill|bonito|precios)/.test(t)) return 'feliz';
  return 'neutral';
}

// ===== Título =====
function buildTitle(text, { event_type, place, date_happened }) {
  if (event_type) {
    let t = event_type;
    const short = place ? place.split(' (')[0] : '';
    if (short) t += `${event_type === 'Viaje' ? ' a' : ' en'} ${short}`;
    if (date_happened) t += ` (${date_happened.slice(0, 4)})`;
    return t;
  }
  const first = text.split(/(?<=[.!?])\s+/)[0] || text;
  return first.length > 60 ? first.slice(0, 57).trim() + '…' : first;
}

// ===== Punto de entrada =====
function extractMemory(rawText, today = new Date()) {
  const text = String(rawText || '').replace(/\s+/g, ' ').trim();
  const date = extractDate(text, today);
  const people = extractPeople(text);
  const place = extractPlace(text, people.map(p => p.name).filter(Boolean));
  const type = extractType(text);
  let category = type.category;
  if (category === 'General' && people.some(p => /abuel|madre|mamá|padre|papá|herman|tío|tía|prim|hij|nieto|nieta|suegr|cuñad|sobrin|yay/.test(p.relation))) {
    category = 'Familia';
  }
  const mood = extractMood(text);
  const title = buildTitle(text, { event_type: type.event_type, place, date_happened: date.date_happened });
  const tags = extractTags(text, people);
  return { title, content: text, ...date, place, event_type: type.event_type, category, mood, people, tags };
}

module.exports = { extractTags, extractMemory, extractDate, extractPeople, extractPlace, extractType };
