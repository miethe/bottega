import '../styles/folio2.css';
import { copy2, resultA2, resultB2, ui2, type Clause2 } from '../copy/folio2';
import { figure, h, ink, line, path, s, smudge, stageSvg } from '../draw/svg';
import { F2, checks, done, init, step, summarize, type Check2, type Mode2, type State2 } from '../sim/folio2';
import type { FolioCtx, FolioModule } from '../shell/types';

const W = 360;
const H = 300;
const TICK_MS = 250;
const CLAUSES: Clause2[] = ['figures', 'gold', 'frame', 'dry', 'worthy', 'care'];
const MOODS: Clause2[] = ['worthy', 'care'];

/** An altarpiece outline: an arched panel. (x, y) is the top-left of its box. */
function arch(x: number, y: number, w: number, hgt: number): string {
  const r = hgt * 0.32;
  return `M${x} ${y + hgt} L${x} ${y + r} Q${x + w / 2} ${y - r * 0.9} ${x + w} ${y + r} L${x + w} ${y + hgt} Z`;
}

/** The six steps of an altarpiece, drawn one after another inside a box at (x, y). */
function stepsArt(x: number, y: number, n: number): SVGElement[] {
  const out: SVGElement[] = [];
  const add = (k: number, ...els: SVGElement[]) => {
    if (n >= k) out.push(...els);
  };
  add(1, line(x + 8, y + 84, x + 62, y + 84), line(x + 8, y + 88, x + 62, y + 88, { class: 'faint' }));
  add(
    2,
    path(`M${x + 22} ${y + 84} q-2 -26 0 -34`),
    path(`M${x + 35} ${y + 84} q-2 -32 0 -42`),
    path(`M${x + 48} ${y + 84} q2 -26 0 -34`),
  );
  add(
    3,
    s('circle', { cx: x + 22, cy: y + 45, r: 4 }),
    s('circle', { cx: x + 35, cy: y + 37, r: 4.5 }),
    s('circle', { cx: x + 48, cy: y + 45, r: 4 }),
  );
  add(4, path(`M${x + 16} ${y + 62} q6 6 12 0 M${x + 42} ${y + 62} q6 6 12 0 M${x + 28} ${y + 58} q7 7 14 0`));
  add(
    5,
    s('circle', { cx: x + 22, cy: y + 45, r: 7, class: 'faint' }),
    s('circle', { cx: x + 35, cy: y + 37, r: 8, class: 'faint' }),
    s('circle', { cx: x + 48, cy: y + 45, r: 7, class: 'faint' }),
  );
  add(
    6,
    line(x + 10, y + 22, x + 16, y + 16, { class: 'faint' }),
    line(x + 54, y + 16, x + 60, y + 22, { class: 'faint' }),
    line(x + 33, y + 12, x + 37, y + 12, { class: 'faint' }),
  );
  return out;
}

function mount(ctx: FolioCtx): void {
  let mode: Mode2 = 'a';
  let day = 0;
  let state: State2 = init(mode, [], day);
  let phase: 'idle' | 'running' | 'done' = 'idle';
  let timer: number | undefined;
  let wantHandoff = false;
  const ran = { a: false, b: false };
  const moodsTried = new Set<Clause2>();

  const svg = stageSvg(W, H);
  const fixed = ink();
  const live = s('g', { class: 'ink live' });
  svg.append(fixed, live);
  ctx.stage.append(svg);

  // ----- levers
  const modeA = h(
    'button',
    { type: 'button', class: 'btn', 'data-testid': 'f2-mode-a', 'aria-pressed': 'true' },
    ui2.modeA,
  );
  const modeB = h(
    'button',
    { type: 'button', class: 'btn', 'data-testid': 'f2-mode-b', 'aria-pressed': 'false' },
    ui2.modeB,
  );
  const modes = h('div', { class: 'choices f2-modes', role: 'group', 'aria-label': ui2.modeLabel }, modeA, modeB);

  const boxes = new Map<Clause2, HTMLInputElement>();
  const notes = new Map<Clause2, HTMLElement>();
  const chips = h('div', { class: 'f2-chips' });
  for (const id of CLAUSES) {
    const input = h('input', { type: 'checkbox', id: `f2-clause-${id}`, value: id, 'data-testid': `f2-clause-${id}` });
    const note = h('small', { class: 'f2-nojig', hidden: '' }, ` (${ui2.noJig})`);
    input.addEventListener('change', onClauses);
    boxes.set(id, input);
    notes.set(id, note);
    chips.append(h('label', { class: 'f2-chip', for: `f2-clause-${id}` }, input, h('span', {}, ui2.clause[id], note)));
  }
  const cost = h('p', { class: 'f2-cost' });
  const sheet = h('fieldset', { class: 'f2-sheet', hidden: '' }, h('legend', {}, ui2.clausesLabel), chips, cost);

  const go = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f2-go' }, ui2.startA);
  const hand = h('button', { type: 'button', class: 'btn', 'data-testid': 'f2-hand', hidden: '' }, ui2.handNext);
  const actions = h('div', { class: 'choices' }, hand, go);
  ctx.levers.append(modes, sheet, actions);

  function chosen(): Clause2[] {
    return CLAUSES.filter((id) => boxes.get(id)!.checked);
  }

  function setPhase(next: typeof phase): void {
    phase = next;
    ctx.root.dataset.phase = next;
    go.dataset.state = next;
    const running = next === 'running';
    go.textContent = running ? ui2.skip : next === 'done' ? ui2.again : mode === 'a' ? ui2.startA : ui2.handOver;
    modeA.disabled = running;
    modeB.disabled = running;
    for (const b of boxes.values()) b.disabled = running;
    const handing = mode === 'a' && running;
    hand.hidden = !handing;
    // while he works step by step, the handoff is the main thing you do
    hand.className = handing ? 'btn primary' : 'btn';
    go.className = handing ? 'btn' : 'btn primary';
    sheet.hidden = mode !== 'b';
    modeA.setAttribute('aria-pressed', String(mode === 'a'));
    modeB.setAttribute('aria-pressed', String(mode === 'b'));
    cost.textContent = ui2.cost(1 + chosen().length);
    for (const id of MOODS) notes.get(id)!.hidden = !moodsTried.has(id);
  }

  function refreshHand(): void {
    const canHand =
      mode === 'a' && phase === 'running' && state.working === 0 && state.handoffs < F2.tokens && !wantHandoff;
    hand.disabled = !canHand;
  }

  // ----- drawing
  function drawFixed(): void {
    fixed.replaceChildren(
      // easel
      line(150, 150, 140, 196),
      line(214, 150, 224, 196),
      line(182, 150, 183, 184, { class: 'faint' }),
      line(140, 151, 224, 151),
      // delivered shelf
      line(12, 214, W - 12, 214, { class: 'faint' }),
    );
    fixed.append(s('text', { x: 14, y: 230, class: 'hand' }, ui2.delivered));
  }

  function draw(): void {
    live.replaceChildren();
    // your eight handoffs
    const spent = phase === 'idle' && mode === 'b' ? 1 + chosen().length : state.handoffs;
    for (let i = 0; i < F2.tokens; i++) {
      const cx = 22 + i * 19;
      live.append(s('circle', { cx, cy: 22, r: 7, class: i < spent ? 'f2-coin spent' : 'f2-coin' }));
      if (i < spent) live.append(line(cx - 6, 28, cx + 6, 16));
    }
    live.append(s('text', { x: 22 + F2.tokens * 19, y: 26, class: 'hand' }, ui2.handoffsLeft(F2.tokens - spent)));

    // the piece on the easel
    live.append(path(arch(147, 56, 70, 94), { class: 'panel' }));
    const stepsDone = mode === 'a' ? state.progress : Math.min(F2.steps, Math.floor(state.progress / F2.workTicks));
    live.append(...stepsArt(147, 56, stepsDone));

    // the apprentice
    const waiting = mode === 'a' && phase === 'running' && state.working === 0;
    if (waiting || phase !== 'running') live.append(figure(100, 128, { seated: true, reach: [8, 14] }));
    else live.append(figure(112, 96, { reach: [30, -4] }));
    if (phase === 'running') {
      const out = mode === 'a' && state.working === 0 && state.handoffs >= F2.tokens;
      const text = out ? ui2.outOfHandoffs : waiting ? ui2.waiting : ui2.working;
      live.append(s('text', { x: 14, y: 204, class: waiting ? 'hand err' : 'hand' }, text));
    }

    // the jig: one peg for every clause it can check
    if (mode === 'b') {
      const written = checks.filter((c) => boxes.get(c)!.checked);
      const jx = 262;
      const jy = 74;
      live.append(
        s('rect', { x: jx, y: jy, width: 62, height: 70, class: 'f2-jig' }),
        s('text', { x: jx + 31, y: jy + 86, 'text-anchor': 'middle', class: 'hand' }, ui2.jigLabel),
      );
      checks.forEach((c, i) => {
        if (!written.includes(c)) return;
        const py = jy + 12 + i * 15;
        live.append(line(jx - 7, py, jx + 9, py, { class: 'f2-peg' }));
        if (state.lastTested.includes(c) || (phase === 'done' && state.pieces.length > 0)) {
          live.append(path(`M${jx + 18} ${py} l4 4 7 -9`));
        }
      });
      if (written.length === 0) {
        live.append(
          line(jx + 10, jy + 10, jx + 52, jy + 60, { class: 'faint' }),
          line(jx + 52, jy + 10, jx + 10, jy + 60, { class: 'faint' }),
        );
      }
    }

    // delivered today
    state.pieces.forEach((p, i) => {
      const x = 24 + i * 66;
      const y = 238;
      const bad = p.faults.length > 0;
      live.append(path(arch(x, y, 30, 40), { class: 'panel' }));
      if (bad) {
        live.append(smudge(x + 15, y + 22, 8, i * 50));
        const first = ui2.fault[p.faults[0] as Check2];
        const more = p.faults.length > 1 ? ` +${p.faults.length - 1}` : '';
        live.append(
          s('text', { x: x + 15, y: y + 53, 'text-anchor': 'middle', class: 'hand err f2-fault' }, first + more),
        );
      } else if (mode === 'b' && p.tested.length > 0) {
        live.append(path(`M${x + 9} ${y + 24} l5 5 9 -12`));
      }
    });
    refreshHand();
  }

  // ----- play
  function finish(): void {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    while (!done(state)) step(state, mode === 'a' && state.working === 0);
    wantHandoff = false;
    const sum = summarize(state);
    ran[mode] = true;
    if (mode === 'b') for (const id of MOODS) if (state.clauses.includes(id)) moodsTried.add(id);
    setPhase('done');
    draw();
    if (mode === 'a') {
      ctx.setResult(
        resultA2({ handoffs: sum.handoffs, finished: sum.finished, idleTicks: sum.idleTicks, ticks: F2.ticks }),
      );
    } else {
      ctx.setResult(
        resultB2({
          checkable: sum.checkable,
          moods: sum.moods,
          tokens: sum.tokens,
          finished: sum.finished,
          wrong: sum.wrong,
        }),
      );
    }
    if ((mode === 'b' && sum.wrong >= 1) || (ran.a && ran.b)) ctx.breakSeal();
  }

  function tick(): void {
    const give = wantHandoff;
    wantHandoff = false;
    step(state, give);
    if (done(state)) return finish();
    draw();
  }

  function start(): void {
    state = init(mode, mode === 'b' ? chosen() : [], day++);
    wantHandoff = false;
    setPhase('running');
    ctx.setResult(mode === 'a' ? ui2.idleA : ui2.working);
    draw();
    timer = window.setInterval(tick, TICK_MS);
  }

  function reset(): void {
    state = init(mode, [], day);
    setPhase('idle');
    ctx.setResult(mode === 'a' ? ui2.idleA : ui2.idleB);
    draw();
  }

  function onClauses(): void {
    if (phase !== 'running') reset();
  }

  function setMode(next: Mode2): void {
    if (phase === 'running' || mode === next) return;
    mode = next;
    reset();
  }

  go.addEventListener('click', () => {
    if (phase === 'running') finish();
    else start();
  });
  hand.addEventListener('click', () => {
    wantHandoff = true;
    refreshHand();
  });
  modeA.addEventListener('click', () => setMode('a'));
  modeB.addEventListener('click', () => setMode('b'));

  drawFixed();
  reset();
}

export const folio2: FolioModule = { id: 'ii', copy: copy2, mount };
