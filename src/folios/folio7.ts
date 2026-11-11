import '../styles/folio7.css';
import { copy7, endOpen7, endShut7, open7, opened7, said7, shut7, ui7 } from '../copy/folio7';
import { figure, h, hatch, ink, line, path, s, stageSvg } from '../draw/svg';
import { rng } from '../sim/prng';
import { F7, F7_CEILING, gap, init, inside, mark, over, step, worth, type F7State } from '../sim/folio7';
import type { FolioCtx, FolioModule } from '../shell/types';

const W = 360;
const H = 300;
/** Panel origin and size on the stage. */
const PX = 22;
const PY = 26;
const PW = 150;
const PH = 190;
/** How far a line strays from the imagined one per unit of gap. */
const STRAY = 34;

type Pt = [number, number];

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The piece, as a few lines. `off(i)` displaces point i; with no displacement this is the imagined piece. */
function piece(off: (i: number) => Pt, fixed: number): SVGElement[] {
  let i = 0;
  const p = (x: number, y: number): string => {
    const [dx, dy] = off(i++);
    return `${(PX + x + dx).toFixed(1)} ${(PY + y + dy).toFixed(1)}`;
  };
  const c = (x: number, y: number): Pt => {
    const [dx, dy] = off(i++);
    return [PX + x + dx, PY + y + dy];
  };
  // fault two: the far arch leans, until a stranger says so and it is mended
  const lean = fixed >= 2 ? 0 : 7;
  const out: SVGElement[] = [];
  out.push(path(`M${p(20, 172)} L${p(20, 82)} Q${p(75, 8)} ${p(130, 82)} L${p(130 + lean, 172)}`));
  out.push(path(`M${p(50, 172)} Q${p(55, 112)} ${p(75, 97)} Q${p(95, 112)} ${p(100, 172)}`));
  // fault three: the left sleeve has no arm in it
  out.push(path(`M${p(88, 122)} Q${p(76, 134)} ${p(fixed >= 3 ? 60 : 70, fixed >= 3 ? 124 : 130)}`));
  const head = c(75, 80);
  out.push(s('circle', { cx: head[0], cy: head[1], r: 13 }));
  const halo = c(75, 80);
  out.push(s('circle', { cx: halo[0], cy: halo[1], r: 21, class: 'faint' }));
  out.push(path(`M${p(20, 150)} L${p(50, 150)}`), path(`M${p(100, 150)} L${p(130, 150)}`));
  const sun = c(112, 50);
  out.push(s('circle', { cx: sun[0], cy: sun[1], r: 5 }));
  return out;
}

function mount(ctx: FolioCtx): void {
  let run = 0;
  let st: F7State = init(run);
  let phase: 'shut' | 'form' | 'open' | 'over' = 'shut';
  let name = ui7.nameDefault;
  // fixed scatter: where each line starts out, relative to where it belongs
  const jr = rng(F7.seed + 7);
  const scatter: Pt[] = Array.from({ length: 40 }, () => [jr() * 2 - 1, jr() * 2 - 1]);

  // ----- stage
  const svg = stageSvg(W, H);
  const fixedArt = ink();
  const imagined = s('g', { class: 'ink imagined' });
  const real = s('g', { class: 'ink live real' });
  const chalk = s('g', { class: 'chalk' });
  const door = ink({ class: 'ink door' });
  const crowdG = s('g', { class: 'ink live crowd' });
  const gauge = s('g', { class: 'gauge' });
  svg.append(fixedArt, imagined, real, chalk, door, crowdG, gauge);
  ctx.stage.append(svg);

  // ----- levers
  const strokeBtn = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f7-stroke' }, ui7.stroke);
  const openBtn = h('button', { type: 'button', class: 'btn', 'data-testid': 'f7-open' }, ui7.open);
  const skipBtn = h('button', { type: 'button', class: 'linklike', 'data-testid': 'f7-skip' }, ui7.polishOut);
  const againBtn = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f7-again' }, ui7.again);
  const row = h('div', { class: 'choices' }, strokeBtn, openBtn, againBtn);

  const nameIn = h('input', {
    type: 'text',
    id: 'f7-name',
    maxlength: 40,
    placeholder: ui7.namePlaceholder,
    autocomplete: 'off',
    'data-testid': 'f7-name',
  });
  const chips = h('div', { class: 'chips' });
  const ownIn = h('input', {
    type: 'text',
    id: 'f7-own',
    maxlength: 60,
    placeholder: ui7.icesOwn,
    'aria-label': `${ui7.icesLabel}: ${ui7.icesOwn}`,
    autocomplete: 'off',
    'data-testid': 'f7-ice-own',
  });
  const need = h('p', { class: 'need err-text', role: 'status' });
  const doorsBtn = h('button', { type: 'submit', class: 'btn primary', 'data-testid': 'f7-doors' }, ui7.doors);
  const notYet = h('button', { type: 'button', class: 'linklike', 'data-testid': 'f7-not-yet' }, ui7.notYet);
  const form = h(
    'form',
    { class: 'doors-form', hidden: '', novalidate: '' },
    h('p', { class: 'form-title' }, ui7.formTitle),
    h(
      'div',
      { class: 'form-line' },
      h('label', { for: 'f7-name' }, ui7.nameLabel),
      nameIn,
      h('span', { class: 'mark-one' }, ui7.markOne),
    ),
    h('fieldset', {}, h('legend', {}, ui7.icesLabel), h('p', { class: 'ices-hint' }, ui7.icesHint), chips, ownIn),
    need,
    h('div', { class: 'choices' }, doorsBtn, notYet),
  );
  ctx.levers.append(row, skipBtn, form);

  const saidList = h('ul', { class: 'said' });
  const saidBox = h('div', { class: 'said-box', hidden: '' }, h('p', { class: 'said-title' }, ui7.saidTitle), saidList);
  ctx.extras.append(saidBox);

  function say(text: string, bad = false): void {
    saidBox.hidden = false;
    saidList.append(h('li', bad ? { class: 'err-text' } : {}, text));
  }

  // ----- drawing
  function drawFixed(): void {
    fixedArt.replaceChildren(
      // floor
      line(8, 290, 352, 290),
      // easel
      line(PX + 16, PY + PH, PX + 2, 290),
      line(PX + PW - 16, PY + PH, PX + PW - 2, 290),
      line(PX + PW / 2, PY + PH, PX + PW / 2 + 2, 272, { class: 'faint' }),
      line(PX - 8, PY + PH + 1, PX + PW + 8, PY + PH + 1),
    );
  }

  function drawPiece(): void {
    const onShelf = phase === 'over' && !st.released;
    imagined.replaceChildren();
    real.replaceChildren();
    chalk.replaceChildren();
    if (onShelf) {
      // the easel is empty; the piece is up on a shelf under its dust
      real.append(
        line(PX - 6, 96, PX + PW + 6, 96),
        line(PX + 4, 96, PX + 4, 108),
        line(PX + PW - 4, 96, PX + PW - 4, 108),
        s(
          'g',
          { transform: `rotate(-7 ${PX + 62} 96)` },
          s('rect', { x: PX + 34, y: 22, width: 56, height: 74, class: 'panel' }),
          hatch(PX + 34, 22, 56, 74, 5, { class: 'hatch faint' }),
        ),
      );
      real.append(s('text', { x: PX + PW / 2, y: 124, 'text-anchor': 'middle', class: 'hand' }, ui7.shelf));
      return;
    }
    real.append(s('rect', { x: PX, y: PY, width: PW, height: PH, class: 'panel' }));
    imagined.append(...piece(() => [0, 0], 3));
    const g = gap(st) * STRAY;
    real.append(
      ...piece((i) => [scatter[i % scatter.length]![0] * g, scatter[i % scatter.length]![1] * g], st.hiddenFixed),
    );
    // fault one: the shadows fall two ways
    const fx = PX + 40;
    const fy = PY + 174;
    const twoWays = st.hiddenFixed < 1;
    for (let k = 0; k < 4; k++) {
      real.append(line(fx + k * 5, fy, fx + k * 5 - 6, fy + 9, { class: 'faint' }));
      real.append(line(fx + 44 + k * 5, fy, fx + 44 + k * 5 + (twoWays ? 6 : -6), fy + 9, { class: 'faint' }));
    }
    // red chalk rings where a stranger has pointed and it is not yet mended
    const rings: Pt[] = [
      [PX + 68, PY + 180],
      [PX + 133, PY + 150],
      [PX + 72, PY + 128],
    ];
    for (let k = st.hiddenFixed; k < st.hiddenShown; k++) {
      const [cx, cy] = rings[k]!;
      chalk.append(
        path(
          `M${cx - 15} ${cy + 2} C${cx - 16} ${cy - 13} ${cx + 12} ${cy - 16} ${cx + 15} ${cy - 1} C${cx + 17} ${cy + 13} ${cx - 10} ${cy + 16} ${cx - 15} ${cy + 4}`,
          {
            class: 'ring',
          },
        ),
      );
    }
  }

  function drawDoor(): void {
    const x0 = 256;
    const x1 = 346;
    const top = 74;
    door.replaceChildren(path(`M${x0} 290 L${x0} ${top} Q${(x0 + x1) / 2} ${top - 52} ${x1} ${top} L${x1} 290`));
    crowdG.replaceChildren();
    if (!st.released) {
      door.append(line((x0 + x1) / 2, top - 24, (x0 + x1) / 2, 290));
      for (let y = top + 14; y < 286; y += 26) door.append(line(x0 + 6, y, x1 - 6, y, { class: 'faint' }));
      door.append(
        s('circle', { cx: (x0 + x1) / 2 - 8, cy: 188, r: 3 }),
        s('circle', { cx: (x0 + x1) / 2 + 8, cy: 188, r: 3 }),
      );
      crowdG.append(
        s('text', { x: (x0 + x1) / 2, y: top - 40, 'text-anchor': 'middle', class: 'hand big' }, String(st.passedBy)),
        s('text', { x: (x0 + x1) / 2, y: top - 56, 'text-anchor': 'middle', class: 'hand' }, ui7.passed),
      );
    } else {
      // leaves swung back
      door.append(
        path(`M${x0} ${top} L${x0 - 12} ${top + 14} L${x0 - 12} 290`, { class: 'faint' }),
        path(`M${x1} ${top} L${x1 + 10} ${top + 14} L${x1 + 10} 290`, { class: 'faint' }),
      );
      // the piazza beyond: a far roofline and a sun
      door.append(
        path(`M${x0 + 4} 196 L${x0 + 30} 176 L${x0 + 52} 196 L${x0 + 70} 170 L${x1 - 4} 196`, { class: 'faint' }),
        s('circle', { cx: x1 - 24, cy: 124, r: 9, class: 'faint' }),
      );
      const n = Math.min(5, 2 + Math.floor(st.viewers / 30));
      const spots: Pt[] = [
        [206, 238],
        [278, 234],
        [306, 240],
        [330, 236],
        [232, 244],
      ];
      for (let k = 0; k < n; k++) {
        const [fx, fy] = spots[k]!;
        crowdG.append(figure(fx, fy, { facing: -1, reach: k === 0 ? [-16, -10] : [-5, 12] }));
      }
      crowdG.append(
        s('text', { x: (x0 + x1) / 2, y: top - 40, 'text-anchor': 'middle', class: 'hand big' }, String(st.viewers)),
        s('text', { x: (x0 + x1) / 2, y: top - 56, 'text-anchor': 'middle', class: 'hand' }, ui7.cameIn),
      );
    }
  }

  function drawGauge(): void {
    const x = 186;
    const y0 = PY + PH;
    const y1 = PY;
    const py = (v: number) => y0 - Math.max(0, Math.min(1, v)) * (y0 - y1);
    gauge.replaceChildren();
    if (phase === 'over' && !st.released) return;
    const g = ink({ class: 'ink live' });
    g.append(line(x, y0, x, y1));
    for (let t = 0; t <= 10; t++) g.append(line(x - (t % 5 === 0 ? 4 : 2), py(t / 10), x, py(t / 10)));
    gauge.append(g);
    const yi = py(inside(st));
    gauge.append(
      path(`M${x + 1} ${yi} l8 -4 l0 8 Z`, { class: 'mk' }),
      s('text', { x: x + 12, y: yi + 4, class: 'hand' }, ui7.asYouSee),
    );
    if (st.released) {
      const yw = py(worth(st));
      const far = yw - yi > 14;
      if (far) gauge.append(line(x + 5, yi + 5, x + 5, yw - 5, { class: 'drop' }));
      gauge.append(path(`M${x + 1} ${yw} l8 -4 l0 8 Z`, { class: far ? 'mk err' : 'mk' }));
      if (far) gauge.append(s('text', { x: x + 12, y: yw + 4, class: 'hand err' }, ui7.asItIs));
    }
  }

  function draw(): void {
    drawPiece();
    drawDoor();
    drawGauge();
  }

  // ----- phases
  function setPhase(p: typeof phase): void {
    phase = p;
    ctx.root.dataset.phase = p;
    const shut = p === 'shut';
    const open = p === 'open';
    strokeBtn.hidden = !(shut || open);
    strokeBtn.textContent = open ? ui7.work : ui7.stroke;
    openBtn.hidden = !shut;
    againBtn.hidden = p !== 'over';
    skipBtn.hidden = !(shut || open);
    skipBtn.textContent = open ? ui7.toLast : ui7.polishOut;
    form.hidden = p !== 'form';
    row.hidden = p === 'form';
  }

  function status(): void {
    if (!st.released) {
      ctx.setResult(
        shut7({ day: st.day, days: F7.days, inside: inside(st), strokes: st.strokes, passedBy: st.passedBy }),
      );
    } else {
      ctx.setResult(
        open7({ day: st.day, days: F7.days, name: esc(name), mark: mark(st), worth: worth(st), viewers: st.viewers }),
      );
    }
  }

  function end(): void {
    setPhase('over');
    draw();
    if (st.released) {
      ctx.setResult(
        endOpen7({ name: esc(name), mark: mark(st), worth: worth(st), viewers: st.viewers, ceiling: F7_CEILING }),
      );
    } else {
      ctx.setResult(endShut7({ inside: inside(st), passedBy: st.passedBy }));
      ctx.breakSeal();
    }
  }

  /** One day with the doors open: mend what was shown, hear the next thing. */
  function workDay(): void {
    const fixedBefore = st.hiddenFixed;
    const shownBefore = st.hiddenShown;
    step(st, 'stroke');
    if (st.hiddenFixed > fixedBefore) say(said7.mended(ui7.mends[fixedBefore]!, fixedBefore === 0));
    if (st.hiddenShown > shownBefore) say(said7.found(ui7.strangers[shownBefore]!, ui7.finds[shownBefore]!, 0, false));
  }

  function oneStroke(): void {
    if (phase === 'shut') {
      step(st, 'stroke');
      if (over(st)) return end();
      draw();
      status();
    } else if (phase === 'open') {
      workDay();
      if (over(st)) return end();
      draw();
      status();
    }
  }

  function skip(): void {
    if (phase === 'shut') {
      while (!over(st)) step(st, 'stroke');
      end();
    } else if (phase === 'open') {
      while (!over(st)) workDay();
      end();
    }
  }

  function tier(): number {
    return st.strokes <= 1 ? 0 : st.strokes <= 4 ? 1 : 2;
  }

  function showForm(): void {
    chips.replaceChildren(
      ...ui7.ices[tier()]!.map((label, k) => {
        const id = `f7-ice-${k}`;
        return h(
          'label',
          { class: 'chip', for: id },
          h('input', { type: 'checkbox', id, value: label, 'data-testid': id }),
          h('span', {}, label),
        );
      }),
    );
    need.textContent = '';
    setPhase('form');
    nameIn.focus({ preventScroll: true });
  }

  function openDoors(): void {
    const picked = Array.from(chips.querySelectorAll<HTMLInputElement>('input:checked')).map((c) => c.value);
    const own = ownIn.value.trim();
    if (picked.length === 0 && !own) {
      need.textContent = ui7.icesNeed;
      return;
    }
    name = nameIn.value.trim() || ui7.nameDefault;
    const thought = inside(st);
    const day = st.day;
    step(st, 'open');
    const came = st.crowd[day - 1] ?? 0;
    saidList.replaceChildren();
    for (const item of own ? [...picked, own] : picked) say(said7.posted(item));
    say(said7.found(ui7.strangers[0]!, ui7.finds[0]!, day, true), true);
    ctx.breakSeal();
    if (over(st)) return end();
    setPhase('open');
    draw();
    ctx.setResult(opened7({ day, name: esc(name), came, inside: thought, worth: worth(st) }));
  }

  strokeBtn.addEventListener('click', oneStroke);
  openBtn.addEventListener('click', showForm);
  skipBtn.addEventListener('click', skip);
  notYet.addEventListener('click', () => {
    setPhase('shut');
    openBtn.focus({ preventScroll: true });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    openDoors();
  });
  againBtn.addEventListener('click', () => {
    st = init(++run);
    name = ui7.nameDefault;
    nameIn.value = '';
    ownIn.value = '';
    saidList.replaceChildren();
    saidBox.hidden = true;
    setPhase('shut');
    draw();
    status();
  });

  drawFixed();
  setPhase('shut');
  draw();
  status();
}

export const folio7: FolioModule = { id: 'vii', copy: copy7, mount };
