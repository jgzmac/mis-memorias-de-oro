/**
 * dates.js - Fechas exactas y aproximadas de un recuerdo (se usa en el servidor y en la pantalla).
 * Una fecha aproximada se guarda como periodo (inicio y fin) más su precisión:
 * day (exacta) | month | season | year | range (periodo libre).
 * Así la línea de vida, los filtros y la edad funcionan igual con cualquier precisión.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Dates = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const PRECISIONS = ['day', 'month', 'season', 'year', 'range'];
  // Meses de inicio y fin; el invierno cruza el año (diciembre a febrero)
  const SEASONS = { primavera: [3, 5], verano: [6, 8], otoño: [9, 11], invierno: [12, 2] };
  const SEASON_NAMES = { primavera: 'Primavera', verano: 'Verano', otoño: 'Otoño', invierno: 'Invierno' };

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  // p: { day } | { month: 'AAAA-MM' } | { season, year } | { year } | { start, end }
  function fromParts(prec, p) {
    p = p || {};
    if (prec === 'day') return DATE_RE.test(p.day || '') ? { date_happened: p.day, date_end: '' } : null;
    if (prec === 'month') {
      const m = /^(\d{4})-(\d{2})$/.exec(p.month || '');
      if (!m) return null;
      const y = +m[1], mo = +m[2];
      return mo >= 1 && mo <= 12 ? { date_happened: iso(y, mo, 1), date_end: iso(y, mo, lastDay(y, mo)) } : null;
    }
    if (prec === 'season') {
      const s = SEASONS[p.season], y = parseInt(p.year, 10);
      if (!s || !(y >= 1000 && y <= 9999)) return null;
      const ey = s[1] < s[0] ? y + 1 : y;
      return { date_happened: iso(y, s[0], 1), date_end: iso(ey, s[1], lastDay(ey, s[1])) };
    }
    if (prec === 'year') {
      const y = parseInt(p.year, 10);
      return y >= 1000 && y <= 9999 ? { date_happened: iso(y, 1, 1), date_end: iso(y, 12, 31) } : null;
    }
    if (prec === 'range') {
      if (!DATE_RE.test(p.start || '')) return null;
      return { date_happened: p.start, date_end: DATE_RE.test(p.end || '') && p.end > p.start ? p.end : '' };
    }
    return null;
  }

  // Deduce la precisión a partir de inicio y fin (recuerdos antiguos o salidas del extractor de texto)
  function infer(start, end) {
    if (!start) return 'day';
    if (!end || end === start) return 'day';
    const [y, m, d] = start.split('-').map(Number), [ey, em, ed] = end.split('-').map(Number);
    if (d === 1 && m === 1 && em === 12 && ed === 31 && ey === y) return 'year';
    if (d === 1 && ey === y && em === m && ed === lastDay(y, m)) return 'month';
    if (d === 1) {
      for (const k of Object.keys(SEASONS)) {
        const s = SEASONS[k], eyy = s[1] < s[0] ? y + 1 : y;
        if (m === s[0] && ey === eyy && em === s[1] && ed === lastDay(ey, em)) return 'season';
      }
    }
    return 'range';
  }

  function toParts(start, end, prec) {
    prec = PRECISIONS.includes(prec) ? prec : infer(start, end);
    if (!start) return { prec, parts: {} };
    const [y, m] = start.split('-').map(Number);
    if (prec === 'day') return { prec, parts: { day: start } };
    if (prec === 'month') return { prec, parts: { month: start.slice(0, 7) } };
    if (prec === 'year') return { prec, parts: { year: y } };
    if (prec === 'season') {
      const k = Object.keys(SEASONS).find(n => SEASONS[n][0] === m) || 'primavera';
      return { prec, parts: { season: k, year: y } };
    }
    return { prec, parts: { start, end: end || '' } };
  }

  // Punto medio del periodo (para calcular la edad aproximada)
  function midpoint(start, end) {
    if (!start || !end || end <= start) return start || '';
    const a = Date.parse(start + 'T00:00:00Z'), b = Date.parse(end + 'T00:00:00Z');
    return new Date((a + b) / 2).toISOString().slice(0, 10);
  }

  // Revisa y completa lo que llega del cliente. Devuelve null si algo no es válido.
  function normalize(start, end, prec) {
    start = start || ''; end = end || '';
    if (start && !DATE_RE.test(start)) return null;
    if (end && !DATE_RE.test(end)) return null;
    if (end && start && end < start) return null;
    const p = PRECISIONS.includes(prec) ? prec : infer(start, end);
    if (!start) return { date_happened: '', date_end: '', date_precision: 'day' };
    if (p === 'day') return { date_happened: start, date_end: end && end > start ? end : '', date_precision: end && end > start ? 'range' : 'day' };
    if (p === 'range') return { date_happened: start, date_end: end, date_precision: 'range' };
    // month / season / year: el fin se recalcula desde el inicio para que sea coherente
    const t = toParts(start, end, p);
    const full = fromParts(p, t.parts);
    return full ? { ...full, date_precision: p } : null;
  }

  const fmtShort = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES');
  const fmtLong = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  // Texto para mostrar: "12/05/1999", "mayo de 1999", "Verano de 1999", "1999", "1999 – 2001"
  function label(start, end, prec, opts) {
    if (!start) return '';
    const fmt = opts && opts.long ? fmtLong : fmtShort;
    const p = PRECISIONS.includes(prec) ? prec : infer(start, end);
    const y = start.slice(0, 4);
    if (p === 'day') return fmt(start);
    if (p === 'month') return new Date(start + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    if (p === 'year') return y;
    if (p === 'season') {
      const m = +start.slice(5, 7);
      const k = Object.keys(SEASONS).find(n => SEASONS[n][0] === m);
      if (!k) return y;
      return k === 'invierno' ? `Invierno de ${y} a ${+y + 1}` : `${SEASON_NAMES[k]} de ${y}`;
    }
    return end && end !== start ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  }

  return { PRECISIONS, SEASONS, SEASON_NAMES, fromParts, toParts, infer, midpoint, normalize, label };
});
