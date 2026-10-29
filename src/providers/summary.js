/**
 * providers/summary.js - Redacta el resumen de vida con plantillas locales (gratis, sin red).
 * Tono siempre positivo: solo usa títulos, lugares y personas, nunca el estado de ánimo.
 * Para pasar a un modelo de pago bastará con otro proveedor con la misma función compose().
 */

const STYLES = {
  amable: {
    label: 'Amable',
    intro: (n, b) => `${n}, esta es la historia de tu vida, contada con cariño${b}.`,
    year: (y) => `En ${y}`, verb: ['guardaste', 'viviste', 'compartiste'],
    link: ['También', 'Además', 'Poco después'],
    outro: 'Cada recuerdo es un tesoro que merece ser contado. Gracias por compartirlos.'
  },
  alegre: {
    label: 'Alegre',
    intro: (n, b) => `¡Qué vida tan bonita, ${n}${b}! Mira todo lo que has vivido.`,
    year: (y) => `En ${y}`, verb: ['disfrutaste de', 'viviste', 'celebraste'],
    link: ['Y por si fuera poco', 'Además', 'Y también'],
    outro: '¡Y lo mejor es que la historia sigue! Cada día trae nuevos motivos para sonreír.'
  },
  nostalgico: {
    label: 'Nostálgico-cálido',
    intro: (n, b) => `Hay vidas que se recuerdan como un álbum antiguo; la tuya, ${n}${b}, huele a hogar.`,
    year: (y) => `Corría ${y}`, verb: ['atesoraste', 'viviste', 'guardaste en el corazón'],
    link: ['Más adelante', 'Y luego', 'Con el tiempo'],
    outro: 'Los años pasan, pero lo vivido queda dentro, cálido y brillante.'
  },
  entusiasta: {
    label: 'Entusiasta',
    intro: (n, b) => `${n}, tu trayectoria${b} está llena de momentos que celebrar.`,
    year: (y) => `En ${y}`, verb: ['lograste vivir', 'protagonizaste', 'viviste con intensidad'],
    link: ['Pero hay más', 'Y sigues sumando', 'A continuación'],
    outro: '¡Una vida llena de experiencias! Y todavía quedan muchas por escribir.'
  }
};

const fmtLong = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
const list = (a) => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];

function sentence(m, style, i) {
  const bits = [`«${m.title}»`];
  if (m.place) bits.push(`en ${m.place}`);
  const names = (m.people || []).map(p => p.name).filter(Boolean);
  if (names.length) bits.push(`con ${list(names)}`);
  const v = style.verb[i % style.verb.length];
  return `${v} ${bits.join(' ')}`;
}

function compose({ user, memories, stages, styleKey, scopeLabel }) {
  const style = STYLES[styleKey] || STYLES.amable;
  const out = [];
  const born = user.birth_date ? ` (naciste ${user.birth_place ? 'en ' + user.birth_place + ' ' : ''}el ${fmtLong(user.birth_date)} de ${user.birth_date.slice(0, 4)})` : '';
  out.push(scopeLabel ? `${user.name}, este es tu resumen: ${scopeLabel}.` : style.intro(user.name, born));

  const withDate = memories.filter(m => m.date_happened).sort((a, b) => a.date_happened.localeCompare(b.date_happened));
  const noDate = memories.filter(m => !m.date_happened);
  const byYear = {};
  withDate.forEach(m => (byYear[m.date_happened.slice(0, 4)] = byYear[m.date_happened.slice(0, 4)] || []).push(m));

  Object.keys(byYear).forEach((y, yi) => {
    const items = byYear[y];
    const stageNames = stages.filter(s => s.start_date.slice(0, 4) <= y && (!s.end_date || s.end_date.slice(0, 4) >= y) && (s.title || s.place))
      .map(s => s.title || s.place);
    let p = style.year(y) + ',';
    p += ' ' + (stageNames.length ? `en tu etapa de ${list(stageNames.slice(0, 2))}, ` : '');
    p += items.map((m, i) => (i === 0 ? '' : (i === 1 ? style.link[yi % style.link.length].toLowerCase() + ' ' : '')) + sentence(m, style, i + yi)).join(', ') + '.';
    out.push(p.replace(', , ', ', ').replace(/^(¡?[^,!]+[,!]) ([a-záéíóú])/, (a, b, c) => `${b} ${c}`));
  });
  if (noDate.length) out.push(`Y hay recuerdos que guardas sin fecha pero con mucho valor: ${list(noDate.map(m => `«${m.title}»`))}.`);
  if (!memories.length) out.push('Todavía no hay recuerdos para este resumen. En cuanto cuentes alguno, aquí aparecerá tu historia.');
  else out.push(style.outro);
  return out.join('\n\n');
}

module.exports = { compose, STYLES };
