/**
 * providers/summary.js - Redacta el resumen de vida con plantillas locales (gratis, sin red).
 * Es narrativo: enlaza los años con transiciones, usa la edad, las personas con su relación,
 * el lugar y un fragmento de lo que la persona escribió. Nunca inventa hechos.
 * Tono siempre positivo: no usa el estado de ánimo. El estilo "ejecutivo" es una cronología seca.
 * Para pasar a un modelo de pago bastará con otro proveedor con la misma función compose().
 */

const STYLES = {
  amable: {
    label: 'Amable',
    intro: (n, b) => `${n}, esta es la historia de tu vida, contada con cariño${b}.`,
    open: ['En {y}{age},', 'Llegó {y}{age}, y', 'Ya en {y}{age},'],
    verbs: ['guardaste', 'viviste', 'compartiste'],
    quote: ['Lo recuerdas así: ', 'Lo contaste así: ', 'En tus palabras: '],
    link: ['También', 'Además', 'Poco después'],
    outro: 'Cada recuerdo es un tesoro que merece ser contado. Gracias por compartirlos.'
  },
  alegre: {
    label: 'Alegre',
    intro: (n, b) => `¡Qué vida tan bonita, ${n}${b}! Mira todo lo que has vivido.`,
    open: ['En {y}{age},', 'Llegó {y}{age} y,', 'Y en {y}{age},'],
    verbs: ['disfrutaste de', 'viviste', 'celebraste'],
    quote: ['Y tú lo cuentas así: ', 'Lo que escribiste: ', 'Con tus palabras: '],
    link: ['Y por si fuera poco', 'Además', 'Y también'],
    outro: '¡Y lo mejor es que la historia sigue! Cada día trae nuevos motivos para sonreír.'
  },
  nostalgico: {
    label: 'Cálido',
    intro: (n, b) => `Hay vidas que se recuerdan como un álbum antiguo; la tuya, ${n}${b}, huele a hogar.`,
    open: ['Corría {y}{age}:', 'Pasaron los años y llegó {y}{age}:', 'En {y}{age},'],
    verbs: ['atesoraste', 'viviste', 'guardaste en el corazón'],
    quote: ['Y así lo guardas: ', 'Con tus palabras: ', 'Lo recuerdas así: '],
    link: ['Más adelante', 'Y luego', 'Con el tiempo'],
    outro: 'Los años pasan, pero lo vivido queda dentro, cálido y brillante.'
  },
  entusiasta: {
    label: 'Entusiasta',
    intro: (n, b) => `${n}, tu trayectoria${b} está llena de momentos que celebrar.`,
    open: ['En {y}{age},', '{y}{age} fue un año de acción:', 'En {y}{age} dabas otro paso:'],
    verbs: ['lograste vivir', 'protagonizaste', 'viviste con intensidad'],
    quote: ['Tú lo resumes así: ', 'En tus palabras: ', 'Lo cuentas así: '],
    link: ['Pero hay más', 'Y sigues sumando', 'A continuación'],
    outro: '¡Una vida llena de experiencias! Y todavía quedan muchas por escribir.'
  },
  ejecutivo: {
    label: 'Ejecutivo',
    executive: true,
    intro: (n, b) => `Resumen de trayectoria de ${n}${b}.`,
    outro: ''
  }
};

const fmtLong = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
const list = (a) => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const ageAt = (birth, year) => (birth ? Number(year) - Number(birth.slice(0, 4)) : null);
const ageText = (a) => (a !== null && a >= 0 ? ` (con ${a} ${a === 1 ? 'año' : 'años'})` : '');

// Primera frase de lo que la persona escribió, recortada; sirve de cita real, no inventada
function snippet(text, max = 150) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const first = (t.match(/^.*?[.!?](\s|$)/) || [t])[0].trim();
  const cut = first.length > max ? first.slice(0, max).replace(/\s+\S*$/, '') + '…' : first;
  return cut;
}

function peopleText(m) {
  const ps = (m.people || []).filter(p => p.name);
  if (!ps.length) return '';
  return list(ps.map(p => (p.relation ? `${p.name}, ${p.relation}` : p.name)));
}

// Puente entre dos años consecutivos con recuerdos
function gap(prev, y, styleKey) {
  const d = Number(y) - Number(prev);
  if (d <= 0) return '';
  const words = { 1: 'Al año siguiente', 2: 'Dos años después', 3: 'Tres años más tarde' };
  if (words[d]) return words[d];
  return d < 10 ? `${d} años más tarde` : `Una década después`;
}

function narrative(m, style, i, first) {
  const place = m.place ? ` en ${m.place}` : '';
  const who = peopleText(m);
  const withWho = who ? `, con ${who}` : '';
  const verb = style.verbs[i % style.verbs.length];
  return `${verb} «${m.title}»${place}${withWho}`;
}

function composeExecutive({ user, memories, stages, scopeLabel }) {
  const out = [];
  const born = user.birth_date ? ` (n. ${user.birth_date.slice(0, 4)}${user.birth_place ? ', ' + user.birth_place : ''})` : '';
  out.push(scopeLabel ? `Resumen de ${user.name}: ${scopeLabel}.` : STYLES.ejecutivo.intro(user.name, born));
  const sorted = memories.filter(m => m.date_happened).sort((a, b) => a.date_happened.localeCompare(b.date_happened));
  const noDate = memories.filter(m => !m.date_happened);
  if (stages.length && !scopeLabel) {
    const st = stages.filter(s => s.title || s.place).sort((a, b) => a.start_date.localeCompare(b.start_date))
      .map(s => `${s.title || s.place} (${s.start_date.slice(0, 4)}–${s.end_date ? s.end_date.slice(0, 4) : 'actualidad'})`);
    if (st.length) out.push(`Etapas: ${st.join('; ')}.`);
  }
  if (sorted.length) out.push(`${memories.length} ${memories.length === 1 ? 'recuerdo' : 'recuerdos'} registrados entre ${sorted[0].date_happened.slice(0, 4)} y ${sorted[sorted.length - 1].date_happened.slice(0, 4)}.`);
  const lines = sorted.map(m => {
    const extra = [m.place, peopleText(m)].filter(Boolean).join('; ');
    return `${m.date_happened.slice(0, 4)}: ${m.title}${extra ? ' (' + extra + ')' : ''}.`;
  });
  if (lines.length) out.push(lines.join('\n'));
  if (noDate.length) out.push(`Sin fecha: ${noDate.map(m => m.title).join('; ')}.`);
  if (!memories.length) out.push('Sin recuerdos registrados para este resumen.');
  return out.join('\n\n');
}

function compose({ user, memories, stages, styleKey, scopeLabel }) {
  const style = STYLES[styleKey] || STYLES.amable;
  if (style.executive) return composeExecutive({ user, memories, stages, scopeLabel });

  const out = [];
  const born = user.birth_date ? ` (naciste ${user.birth_place ? 'en ' + user.birth_place + ' ' : ''}el ${fmtLong(user.birth_date)} de ${user.birth_date.slice(0, 4)})` : '';
  out.push(scopeLabel ? `${user.name}, este es tu resumen: ${scopeLabel}.` : style.intro(user.name, born));

  const withDate = memories.filter(m => m.date_happened).sort((a, b) => a.date_happened.localeCompare(b.date_happened));
  const noDate = memories.filter(m => !m.date_happened);
  const byYear = {};
  withDate.forEach(m => (byYear[m.date_happened.slice(0, 4)] = byYear[m.date_happened.slice(0, 4)] || []).push(m));

  let prevYear = null, lastStage = '';
  Object.keys(byYear).forEach((y, yi) => {
    const items = byYear[y];
    const stageNames = stages.filter(s => s.start_date.slice(0, 4) <= y && (!s.end_date || s.end_date.slice(0, 4) >= y) && (s.title || s.place))
      .map(s => s.title || s.place).slice(0, 2);
    const stageKey = stageNames.join('|');
    const parts = [];

    // Apertura del año: transición desde el anterior + edad + etapa (solo si cambia)
    let open = style.open[yi % style.open.length].replace('{y}', y).replace('{age}', ageText(ageAt(user.birth_date, y)));
    if (prevYear !== null && yi > 0 && yi % 2 === 1) open = `${gap(prevYear, y)}, en ${y}${ageText(ageAt(user.birth_date, y))},`;
    parts.push(open);
    if (stageNames.length && stageKey !== lastStage) parts.push(`en tu etapa de ${list(stageNames)},`);
    lastStage = stageKey;

    // Primer recuerdo con detalle; los demás enlazados con conectores
    let text = parts.join(' ') + ' ' + narrative(items[0], style, yi, true) + '.';
    const q = snippet(items[0].content);
    if (q && q.toLowerCase() !== items[0].title.toLowerCase()) text += ` ${style.quote[yi % style.quote.length]}«${q}»`;
    items.slice(1).forEach((m, i) => {
      const c = style.link[(yi + i) % style.link.length];
      text += ` ${c}, ${narrative(m, style, i + yi + 1)}.`;
      const qq = i === 0 ? snippet(m.content, 110) : '';
      if (qq && qq.toLowerCase() !== m.title.toLowerCase()) text += ` «${qq}»`;
    });
    out.push(text.replace(/\s+/g, ' ').replace(/ ,/g, ','));
    prevYear = y;
  });

  if (noDate.length) out.push(`Y hay recuerdos que guardas sin fecha pero con mucho valor: ${list(noDate.map(m => `«${m.title}»`))}.`);
  if (!memories.length) out.push('Todavía no hay recuerdos para este resumen. En cuanto cuentes alguno, aquí aparecerá tu historia.');
  else out.push(style.outro);
  return out.join('\n\n');
}

module.exports = { compose, STYLES };
