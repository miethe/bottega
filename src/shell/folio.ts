import { h, waxSeal } from '../draw/svg';
import { lawState, saveLaw, type LawRoute } from './progress';
import type { FolioCtx, FolioModule } from './types';

export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Build one folio page and mount its toy. */
export function mountFolio(mod: FolioModule, pageNo: number): HTMLElement {
  const { copy, id } = mod;
  const root = h('section', { class: 'folio', id: `folio-${id}`, 'data-folio': id, 'aria-labelledby': `title-${id}` });

  const head = h(
    'header',
    { class: 'folio-head' },
    h('span', { class: 'numeral', 'aria-hidden': 'true' }, copy.numeral),
    h('h2', { id: `title-${id}` }, h('span', { class: 'sr' }, `Folio ${copy.numeral}. `), copy.title),
  );
  const setup = h('div', { class: 'setup' }, ...copy.setup.map((p) => h('p', {}, p)));

  const stage = h('div', { class: 'stage' });
  const levers = h('div', { class: 'levers' });
  const toy = h('div', { class: 'toy' }, stage, levers);
  const result = h('p', { class: 'result', role: 'status', 'aria-live': 'polite', 'data-testid': 'result' });
  const extras = h('div', { class: 'extras' });

  // The law, sealed.
  const law = h('div', { class: 'law', 'data-revealed': 'false', 'data-testid': 'law' });
  const sealWrap = h('div', { class: 'law-seal' }, waxSeal(copy.numeral));
  const sealedText = h('p', { class: 'law-sealed-text' }, copy.sealed);
  const ask = h('button', { class: 'linklike', type: 'button', 'data-testid': 'show-law' }, 'show me the law');
  const sealedBox = h('div', { class: 'law-sealed' }, sealedText, ask);
  const lawText = h(
    'blockquote',
    { class: 'law-text', hidden: '' },
    h('p', { class: 'law-line' }, copy.law),
    copy.lawNote ? h('p', { class: 'law-note' }, copy.lawNote) : null,
  );
  const lawLabel = h('p', { class: 'law-label' }, 'The law');
  law.append(sealWrap, h('div', { class: 'law-body' }, lawLabel, sealedBox, lawText));

  const margin = h(
    'aside',
    { class: 'margin', 'aria-label': `Margin notes for folio ${copy.numeral}` },
    h('details', {}, h('summary', {}, 'The model'), ...copy.model.map((p) => h('p', {}, p))),
    h('details', {}, h('summary', {}, 'Where this toy lies'), ...copy.lies.map((p) => h('p', {}, p))),
  );

  const foot = h('p', { class: 'folio-foot', 'aria-hidden': 'true' }, `· ${pageNo} ·`);
  const main = h('div', { class: 'folio-main' }, head, setup, toy, result, extras, law);
  root.append(main, margin, foot);

  const listeners: (() => void)[] = [];
  let revealed = false;

  function reveal(route: LawRoute, animate: boolean): void {
    if (revealed) {
      if (route === 'played' && law.dataset.how !== 'played') {
        law.dataset.how = 'played';
        saveLaw(id, 'played');
      }
      return;
    }
    revealed = true;
    law.dataset.revealed = 'true';
    law.dataset.how = route;
    if (animate && !reducedMotion()) law.classList.add('cracking');
    sealedBox.hidden = true;
    lawText.hidden = false;
    saveLaw(id, route);
    root.dispatchEvent(new CustomEvent('bottega:law', { bubbles: true, detail: { id, route } }));
    for (const fn of listeners) fn();
  }

  ask.addEventListener('click', () => {
    reveal('asked', true);
    lawText.setAttribute('tabindex', '-1');
    lawText.focus({ preventScroll: true });
  });

  const ctx: FolioCtx = {
    root,
    stage,
    levers,
    extras,
    setResult: (html) => {
      result.innerHTML = html;
    },
    breakSeal: () => reveal('played', true),
    lawRevealed: () => revealed,
    onLaw: (fn) => {
      listeners.push(fn);
    },
    reducedMotion,
  };

  mod.mount(ctx);

  const saved = lawState(id);
  if (saved) reveal(saved, false);

  return root;
}
