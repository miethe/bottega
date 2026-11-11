import '../styles/folio4.css';
import { copy4, result4, ui4, type Checker4 } from '../copy/folio4';
import { figure, h, ink, line, panel, path, s, stageSvg } from '../draw/svg';
import { F4, done, init, step, summarize, type Day4, type Eye4, type State4 } from '../sim/folio4';
import type { FolioCtx, FolioModule } from '../shell/types';

const OPTIONS: Checker4[] = ['nobody', 'bench1', 'bench3', 'outsider', 'pair'];
const TICK_MS = 500;
const W = 360;
const H = 300;

/** Where each checker stands behind the bench. */
const SPOT: Record<Eye4, number> = { bench1: 158, bench2: 196, bench3: 234, outsider: 304 };

function eyesFor(who: Checker4): Eye4[] {
  if (who === 'bench1') return ['bench1'];
  if (who === 'bench3') return ['bench1', 'bench2', 'bench3'];
  if (who === 'outsider') return ['outsider'];
  if (who === 'pair') return ['bench1', 'outsider'];
  return [];
}

function mount(ctx: FolioCtx): void {
  let who: Checker4 = 'nobody';
  // The same twenty panels come back for each checker you try. A new set arrives
  // only when you ask the same checker twice.
  let day = 0;
  let tried = new Set<Checker4>();
  let state: State4 = init(who, day);
  let phase: 'idle' | 'running' | 'done' = 'idle';
  let timer: number | undefined;
  const history: { day: number; r: Day4 }[] = [];

  const svg = stageSvg(W, H);
  const scene = ink();
  const wall = s('g', { class: 'ink live' });
  svg.append(scene, wall);
  ctx.stage.append(svg);

  const group = h('fieldset', { class: 'f4-options' }, h('legend', {}, ui4.whoLabel));
  const radios: HTMLInputElement[] = [];
  for (const option of OPTIONS) {
    const input = h('input', { type: 'radio', name: 'f4-who', value: option, 'data-testid': `f4-who-${option}` });
    input.checked = option === who;
    input.addEventListener('change', () => {
      who = option;
      state = init(who, day);
      setPhase('idle');
      draw();
      ctx.setResult(ui4.idle);
    });
    radios.push(input);
    group.append(h('label', {}, input, h('span', {}, ui4.who[option])));
  }
  const go = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f4-go' }, ui4.run);
  ctx.levers.append(group, go);

  const tally = h('div', { class: 'f4-tally', hidden: '' });
  ctx.extras.append(tally);

  function setPhase(next: typeof phase): void {
    phase = next;
    ctx.root.dataset.phase = next;
    go.dataset.state = next;
    go.textContent = next === 'running' ? ui4.skip : next === 'done' ? ui4.again : ui4.run;
    for (const r of radios) r.disabled = next === 'running';
  }

  function drawScene(): void {
    scene.replaceChildren();
    // the apprentice and his covered panel, with its ribbon
    scene.append(
      figure(24, 34, { reach: [22, 6] }),
      panel(50, 36, 42, 56),
      path('M46 40 q12 -9 24 -2 t26 -1 l2 22 q-4 4 -6 -2 M46 40 l-2 20 q4 5 6 -2'),
      path('M71 56 l-9 -6 1 12 8 -4 8 4 1 -12 z', { class: 'fill' }),
      line(52, 92, 48, 112),
      line(90, 92, 94, 112),
      s('text', { x: 71, y: 126, 'text-anchor': 'middle', class: 'hand' }, ui4.ribbon),
    );
    // the bench
    const last = phase === 'running' ? state.panels[state.panels.length - 1] : undefined;
    for (const eye of eyesFor(who)) {
      const x = SPOT[eye];
      const outsider = eye === 'outsider';
      scene.append(figure(x, 30, { reach: [-12, 14], facing: -1, cls: outsider ? 'f4-outsider' : '' }));
      if (outsider) scene.append(line(x - 10, 31, x + 10, 31), path(`M${x - 6} 31 q6 -13 12 0`));
      if (last?.caughtBy.includes(eye)) {
        scene.append(line(x, 6, x, 18, { class: 'f4-bang' }), s('circle', { cx: x, cy: 23, r: 1.2, class: 'fill' }));
      }
    }
    // the bench, in front of whoever stands at it
    scene.append(
      s('rect', { x: 128, y: 70, width: 212, height: 10, class: 'f4-bench' }),
      line(138, 80, 135, 114),
      line(330, 80, 333, 114),
      line(146, 92, 322, 92, { class: 'faint' }),
    );
  }

  function drawWall(): void {
    wall.replaceChildren();
    wall.append(s('text', { x: 14, y: 152, class: 'hand' }, ui4.unveiled), line(14, 158, W - 14, 158, { class: 'faint' }));
    const revealed = phase === 'done';
    for (let i = 0; i < F4.panels; i++) {
      const p = state.panels[i];
      const x = 15 + (i % 10) * 33.5;
      const y = 168 + Math.floor(i / 10) * 44;
      if (!p) {
        wall.append(s('rect', { x, y, width: 27, height: 34, class: 'f4-slot' }));
        continue;
      }
      const bad = revealed && p.shippedFlawed;
      wall.append(s('rect', { x, y, width: 27, height: 34, class: bad ? 'tile err' : 'tile' }));
      if (!revealed) wall.append(path(`M${x - 1} ${y + 4} q7 -6 14 0 t15 0`, { class: 'faint' }));
      if (revealed && p.caughtBy.length) wall.append(path(`M${x + 7} ${y + 18} l5 5 8 -11`));
      if (bad && p.state !== 'sound') {
        wall.append(s('text', { x: x + 13.5, y: y + 23, 'text-anchor': 'middle', class: 'f4-letter' }, ui4.flaw[p.state][0]!));
      }
    }
    if (revealed) {
      const sum = summarize(state);
      const parts = [
        `${ui4.flaw.hands} ${sum.hands}`,
        `${ui4.flaw.perspective} ${sum.perspective}`,
        `${ui4.flaw.drapery} ${sum.drapery}`,
      ];
      wall.append(s('text', { x: 14, y: 272, class: sum.shipped ? 'hand err' : 'hand' }, parts.join('  ·  ')));
    }
  }

  function draw(): void {
    drawScene();
    drawWall();
  }

  function drawTally(): void {
    tally.hidden = history.length === 0;
    const days = [...new Set(history.map((e) => e.day))];
    tally.replaceChildren(
      ...days.map((d) =>
        h(
          'div',
          { class: 'f4-day' },
          h('p', { class: 'f4-day-title' }, ui4.sameTwenty),
          h(
            'ul',
            {},
            ...history
              .filter((e) => e.day === d)
              .map((e) => h('li', {}, h('span', {}, ui4.short[e.r.who]), h('b', { class: e.r.shipped ? 'err' : '' }, String(e.r.shipped)))),
          ),
        ),
      ),
    );
  }

  function finish(): void {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    while (!done(state)) step(state);
    setPhase('done');
    draw();
    const result = summarize(state);
    const at = history.findIndex((e) => e.day === day && e.r.who === who);
    if (at >= 0) history.splice(at, 1);
    history.push({ day, r: result });
    while (new Set(history.map((e) => e.day)).size > 2) history.shift();
    tried.add(who);
    drawTally();
    ctx.setResult(result4(result));
    if (result.shipped >= 4) ctx.breakSeal();
  }

  function tick(): void {
    step(state);
    draw();
    ctx.setResult(ui4.running(state.panels.length, F4.panels));
    if (done(state)) finish();
  }

  go.addEventListener('click', () => {
    if (phase === 'running') return finish();
    if (tried.has(who)) {
      day++;
      tried = new Set();
    }
    state = init(who, day);
    setPhase('running');
    draw();
    ctx.setResult(ui4.running(0, F4.panels));
    timer = window.setInterval(tick, TICK_MS);
  });

  setPhase('idle');
  draw();
  ctx.setResult(ui4.idle);
}

export const folio4: FolioModule = { id: 'iv', copy: copy4, mount };
