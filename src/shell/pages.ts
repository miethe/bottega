import { colophon, cover } from '../copy/pages';
import { eye, h, ink, line, path, s } from '../draw/svg';
import { forgetAll, lawState } from './progress';
import type { FolioModule } from './types';

/** The seven titles, so the contents can list pages that are not drawn yet. */
export const PLAN: { id: string; numeral: string; title: string }[] = [
  { id: 'i', numeral: 'I', title: 'One pair of eyes' },
  { id: 'ii', numeral: 'II', title: 'The whole commission' },
  { id: 'iii', numeral: 'III', title: 'The gold and the sketch' },
  { id: 'iv', numeral: 'IV', title: 'He says it is finished' },
  { id: 'v', numeral: 'V', title: 'Bells' },
  { id: 'vi', numeral: 'VI', title: 'The leaking jar' },
  { id: 'vii', numeral: 'VII', title: 'Mark I' },
];

/** Frontispiece: an easel, a covered panel, a stool, and one eye over all of it. */
function frontispiece(): SVGSVGElement {
  const svg = s('svg', { viewBox: '0 0 300 190', class: 'drawing frontis', 'aria-hidden': 'true', focusable: 'false' });
  const g = ink();
  // floor
  g.append(
    line(18, 168, 282, 168),
    line(40, 174, 120, 174, { class: 'faint' }),
    line(170, 176, 262, 176, { class: 'faint' }),
  );
  // big easel
  g.append(
    line(118, 40, 96, 168),
    line(182, 40, 204, 168),
    line(150, 30, 150, 150, { class: 'faint' }),
    line(100, 128, 200, 128),
    s('rect', { x: 112, y: 46, width: 76, height: 82, class: 'panel' }),
  );
  // the imagined piece, faint, behind the real one
  g.append(
    path('M124 112 Q140 70 150 92 T176 62', { class: 'faint' }),
    path('M126 118 L174 118', { class: 'faint' }),
    s('circle', { cx: 150, cy: 80, r: 12, class: 'faint' }),
  );
  // stool
  g.append(
    line(46, 136, 78, 136),
    line(50, 136, 44, 168),
    line(74, 136, 80, 168),
    line(48, 152, 76, 152, { class: 'faint' }),
  );
  // a jar on a shelf, a bell on a hook
  g.append(
    line(222, 84, 284, 84),
    path('M238 84 L238 66 Q238 60 244 60 L252 60 Q258 60 258 66 L258 84'),
    line(240, 62, 256, 62, { class: 'faint' }),
    path('M268 20 Q268 34 262 40 L282 40 Q276 34 276 20 Z'),
    line(272, 10, 272, 20),
    s('circle', { cx: 272, cy: 43, r: 2, class: 'fill' }),
  );
  // hatching under the easel
  for (let i = 0; i < 9; i++) g.append(line(104 + i * 11, 170, 98 + i * 11, 180, { class: 'faint' }));
  svg.append(g);
  const e = eye();
  e.setAttribute('transform', 'translate(150 16) scale(1.25)');
  svg.append(e);
  return svg;
}

export function mountCover(mods: FolioModule[]): HTMLElement {
  const live = new Set(mods.map((m) => m.id));
  const items = PLAN.map((p) => {
    const li = h('li', { 'data-folio': p.id });
    const mark = h('span', { class: 'toc-seal', 'aria-hidden': 'true' });
    const num = h('span', { class: 'toc-num' }, p.numeral);
    if (live.has(p.id)) {
      li.append(mark, h('a', { href: `#folio-${p.id}` }, num, h('span', { class: 'toc-title' }, p.title)));
    } else {
      li.classList.add('absent');
      li.append(mark, h('span', {}, num, h('span', { class: 'toc-title' }, p.title), h('i', {}, ` (${cover.notYet})`)));
    }
    return li;
  });
  const first = mods[0];
  const root = h(
    'header',
    { class: 'cover', id: 'cover' },
    h('p', { class: 'cover-mark', 'aria-hidden': 'true' }, 'Mark I'),
    h('h1', {}, cover.title),
    h('p', { class: 'subtitle' }, cover.subtitle),
    h('p', { class: 'byline' }, cover.byline),
    frontispiece(),
    h('div', { class: 'intro' }, ...cover.intro.map((p) => h('p', {}, p))),
    h('nav', { class: 'toc', 'aria-label': cover.contents }, h('h2', {}, cover.contents), h('ol', {}, ...items)),
    first
      ? h('p', { class: 'begin' }, h('a', { class: 'btn primary', href: `#folio-${first.id}` }, cover.begin))
      : null,
    h('p', { class: 'small' }, cover.small),
  );

  const refresh = () => {
    for (const li of items) {
      const st = lawState(li.dataset.folio ?? '');
      li.dataset.law = st ?? 'sealed';
    }
  };
  refresh();
  document.addEventListener('bottega:law', refresh);
  document.addEventListener('bottega:forget', refresh);
  return root;
}

export function mountColophon(): HTMLElement {
  const forget = h('button', { type: 'button', class: 'linklike', 'data-testid': 'forget' }, colophon.forget);
  const said = h('span', { class: 'forgot', role: 'status' });
  forget.addEventListener('click', () => {
    forgetAll();
    document.dispatchEvent(new CustomEvent('bottega:forget'));
    said.textContent = ` ${colophon.forgot}`;
    window.setTimeout(() => window.location.reload(), 500);
  });
  return h(
    'footer',
    { class: 'colophon', id: 'colophon' },
    h('h2', {}, colophon.title),
    ...colophon.made.map((p) => h('p', {}, p)),
    h('p', { class: 'ices-title' }, colophon.markTitle),
    h('ul', { class: 'ices' }, ...colophon.ices.map((p) => h('li', {}, p))),
    ...colophon.disclaim.map((p) => h('p', {}, p)),
    h('p', {}, h('a', { href: colophon.sourceUrl, rel: 'noopener' }, colophon.source), '.'),
    h('p', { class: 'small' }, colophon.privacy, ' ', forget, said),
    h('p', { class: 'small' }, colophon.rights),
  );
}
