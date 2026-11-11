/**
 * Small drawing kit. Everything in the notebook is a few ink strokes in SVG:
 * figures are sticks with a slouch, easels are trapezoids, shade is hatching.
 * Sanguine (class "err") is for errors and for the law, nothing else.
 */
const NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined>;
type Kid = Node | string | null | undefined | false;

/** Create an SVG element. */
export function s<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Attrs = {},
  ...kids: Kid[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) el.setAttribute(k, String(v));
  for (const kid of kids) if (kid) el.append(kid);
  return el;
}

/** Create an HTML element. */
export function h<K extends keyof HTMLElementTagNameMap>(
  name: K,
  attrs: Attrs = {},
  ...kids: Kid[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) el.setAttribute(k, String(v));
  for (const kid of kids) if (kid) el.append(kid);
  return el;
}

/** A stage drawing: fills its container, decorative by default (the result line carries the meaning). */
export function stageSvg(width: number, height: number, label?: string): SVGSVGElement {
  const svg = s('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: 'drawing',
    role: label ? 'img' : undefined,
    'aria-label': label,
    'aria-hidden': label ? undefined : 'true',
    focusable: 'false',
  });
  return svg;
}

/** A group of ink line work, roughened by the page's #rough filter. */
export function ink(attrs: Attrs = {}, ...kids: Kid[]): SVGGElement {
  return s('g', { class: 'ink', ...attrs }, ...kids);
}

export function line(x1: number, y1: number, x2: number, y2: number, attrs: Attrs = {}): SVGLineElement {
  return s('line', { x1, y1, x2, y2, ...attrs });
}

export function path(d: string, attrs: Attrs = {}): SVGPathElement {
  return s('path', { d, ...attrs });
}

/** An easel: three legs, a ledge. The panel is drawn separately so it can change. Origin: panel top-left. */
export function easel(x: number, y: number, w = 32, hgt = 40): SVGGElement {
  const g = s('g', { class: 'easel' });
  g.append(
    line(x + 3, y + hgt, x - 4, y + hgt + 28),
    line(x + w - 3, y + hgt, x + w + 4, y + hgt + 28),
    line(x + w / 2, y + hgt, x + w / 2 + 1, y + hgt + 22, { class: 'faint' }),
    line(x - 4, y + hgt + 1, x + w + 4, y + hgt + 1),
  );
  return g;
}

/** A panel on an easel. */
export function panel(x: number, y: number, w = 32, hgt = 40, attrs: Attrs = {}): SVGRectElement {
  return s('rect', { x, y, width: w, height: hgt, class: 'panel', ...attrs });
}

/**
 * A figure in a few strokes. (x, y) is the top of the head.
 * `reach` is where the working hand goes, relative to the shoulder.
 */
export function figure(
  x: number,
  y: number,
  opts: { reach?: [number, number]; facing?: 1 | -1; seated?: boolean; cls?: string } = {},
): SVGGElement {
  const f = opts.facing ?? 1;
  const [rx, ry] = opts.reach ?? [14 * f, -4];
  const g = s('g', { class: `figure ${opts.cls ?? ''}`.trim() });
  const sx = x - 1 * f;
  const sy = y + 12;
  const hip = opts.seated ? y + 30 : y + 32;
  g.append(
    s('circle', { cx: x, cy: y + 5, r: 5 }),
    path(`M${sx} ${y + 10} Q${sx - 4 * f} ${y + 22} ${sx - 1 * f} ${hip}`),
    path(`M${sx} ${sy} Q${sx + rx * 0.5} ${sy + ry * 0.5 + 4} ${sx + rx} ${sy + ry}`),
  );
  if (opts.seated) {
    g.append(
      path(`M${sx - 1 * f} ${hip} L${sx + 8 * f} ${hip + 1} L${sx + 9 * f} ${hip + 16}`),
      line(sx - 6 * f, hip + 3, sx + 4 * f, hip + 3, { class: 'faint' }),
      line(sx - 5 * f, hip + 3, sx - 6 * f, hip + 16, { class: 'faint' }),
    );
  } else {
    g.append(line(sx - 1 * f, hip, sx - 5 * f, hip + 16), line(sx - 1 * f, hip, sx + 5 * f, hip + 16));
  }
  return g;
}

/** Diagonal hatching inside a rectangle, for shade. */
export function hatch(x: number, y: number, w: number, hgt: number, gap = 4, attrs: Attrs = {}): SVGGElement {
  const g = s('g', { class: 'hatch', ...attrs });
  for (let o = -hgt; o < w; o += gap) {
    const x1 = Math.max(x, x + o);
    const y1 = o < 0 ? y - o : y;
    const x2 = Math.min(x + w, x + o + hgt);
    const y2 = o + hgt > w ? y + (w - o) : y + hgt;
    g.append(line(x1, y1, x2, y2));
  }
  return g;
}

/** The master's eye: an almond, an iris, three lashes. Centered on (0, 0); position with transform. */
export function eye(): SVGGElement {
  const g = s('g', { class: 'eye' });
  g.append(
    path('M-12 0 Q0 -10 12 0 Q0 9 -12 0 Z', { class: 'eye-white' }),
    s('circle', { cx: 0, cy: -0.5, r: 4, class: 'fill' }),
    line(-5, -6.5, -7, -10),
    line(0, -8, 0, -12),
    line(5, -6.5, 7, -10),
  );
  return g;
}

/** A red-chalk smudge: the mark of something gone wrong. */
export function smudge(cx: number, cy: number, r = 5, turn = 0): SVGPathElement {
  const d =
    `M${cx - r} ${cy} C${cx - r} ${cy - r * 0.9} ${cx - r * 0.2} ${cy - r * 1.1} ${cx + r * 0.5} ${cy - r * 0.6}` +
    ` C${cx + r * 1.2} ${cy - r * 0.2} ${cx + r} ${cy + r * 0.8} ${cx + r * 0.2} ${cy + r * 0.9}` +
    ` C${cx - r * 0.5} ${cy + r * 1.1} ${cx - r} ${cy + r * 0.7} ${cx - r} ${cy} Z`;
  return path(d, { class: 'smudge', transform: turn ? `rotate(${turn} ${cx} ${cy})` : undefined });
}

/** A wax seal, used on every folio's law. Centered on (0, 0), radius about 22. */
export function waxSeal(numeral: string): SVGSVGElement {
  const svg = s('svg', { viewBox: '-28 -28 56 56', class: 'seal', 'aria-hidden': 'true', focusable: 'false' });
  const blob =
    'M-21 -6 C-23 -16 -12 -24 -2 -22 C8 -25 20 -17 21 -7 C25 2 20 14 11 19 C3 25 -10 23 -16 17 C-24 12 -24 2 -21 -6 Z';
  const left = s('g', { class: 'seal-half seal-left' }, path(blob), s('circle', { r: 14, class: 'seal-ring' }));
  const right = s('g', { class: 'seal-half seal-right' }, path(blob), s('circle', { r: 14, class: 'seal-ring' }));
  left.setAttribute('clip-path', 'polygon(0 0, 52% 0, 44% 35%, 55% 60%, 46% 100%, 0 100%)');
  right.setAttribute('clip-path', 'polygon(52% 0, 100% 0, 100% 100%, 46% 100%, 55% 60%, 44% 35%)');
  const num = s('text', { x: 0, y: 5, 'text-anchor': 'middle', class: 'seal-num' }, numeral);
  svg.append(left, right, num);
  return svg;
}
