import '../styles/folio5.css';
import { copy5, result5, ui5 } from '../copy/folio5';
import { figure, h, hatch, ink, line, path, s, smudge, stageSvg } from '../draw/svg';
import { F5, init, step, done, summarize, type F5State } from '../sim/folio5';
import type { FolioCtx, FolioModule } from '../shell/types';

const H = 330;
const pos = (i: number): [number, number] => [48 + (i % 4) * 88, 100 + Math.floor(i / 4) * 76];

function mount(ctx: FolioCtx): void {
  let bells = 8;
  let cords = 0;
  let night = 0;
  let state: F5State = init(bells, cords, night);
  let phase: 'idle' | 'running' | 'done' = 'idle';
  let timer: number | undefined;
  const history: ReturnType<typeof summarize>[] = [];
  const tried = new Set<string>();
  const svg = stageSvg(360, H);
  const art = ink();
  const live = ink({ class: 'ink live' });
  svg.append(art, live);
  ctx.stage.append(svg);

  const bellRange = h('input', {
    id: 'f5-bells',
    type: 'range',
    min: 0,
    max: 16,
    step: 1,
    value: bells,
    'data-testid': 'f5-bells',
  });
  const cordRange = h('input', {
    id: 'f5-cords',
    type: 'range',
    min: 0,
    max: 8,
    step: 1,
    value: cords,
    'data-testid': 'f5-cords',
  });
  const bellOut = h('output', { for: 'f5-bells', class: 'lever-value' }, String(bells));
  const cordOut = h('output', { for: 'f5-cords', class: 'lever-value' }, String(cords));
  const go = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f5-go' }, ui5.run);
  ctx.levers.append(
    h('div', { class: 'lever' }, h('label', { for: 'f5-bells' }, ui5.bells), bellRange, bellOut),
    h('div', { class: 'lever' }, h('label', { for: 'f5-cords' }, ui5.cords), cordRange, cordOut),
    go,
  );
  const table = h('table', { class: 'f5-tally', hidden: '' });
  ctx.extras.append(table);

  function tally(): void {
    table.hidden = history.length === 0;
    table.replaceChildren(
      h(
        'thead',
        {},
        h('tr', {}, ...[ui5.bells, ui5.cords, ui5.rung, ui5.mended].map((t) => h('th', { scope: 'col' }, t))),
      ),
      h(
        'tbody',
        {},
        ...history.map((r) => h('tr', {}, ...[r.bells, r.cords, r.rung, r.mended].map((v) => h('td', {}, String(v))))),
      ),
    );
  }
  function setPhase(p: typeof phase): void {
    phase = p;
    ctx.root.dataset.phase = p;
    bellRange.disabled = cordRange.disabled = p === 'running';
    go.dataset.state = p;
    go.textContent = p === 'running' ? ui5.skip : p === 'done' ? ui5.again : ui5.run;
  }
  function bell(x: number, y: number, ringing: boolean, tick: number): SVGGElement {
    const g = s('g', { transform: `translate(${x} ${y})` });
    g.append(
      path('M-5 5 Q-4 2 -4 -2 Q-4 -7 0 -7 Q4 -7 4 -2 Q4 2 5 5 Z'),
      s('circle', { cx: 0, cy: 7, r: 1, class: 'fill' }),
    );
    if (ringing) {
      const d = tick % 2 ? 1 : 3;
      g.append(path(`M${-7 - d} -4 q-3 4 0 8 M${7 + d} -4 q3 4 0 8`));
    }
    return g;
  }
  function glyph(i: number, x: number, y: number): SVGGElement {
    const g = s('g', { transform: `translate(${x} ${y})` });
    const shapes = [
      'M-4 10 L-4 -4 L4 -4 L4 10 Z M0 -5 Q-5 -11 0 -15 Q5 -10 0 -5 M-10 10 H10',
      'M-10 9 Q-12 -1 -7 -5 L-7 -12 L-2 -8 L3 -8 L8 -12 L8 -4 Q12 1 9 9 Z M9 7 Q18 6 16 -4',
      'M-10 -5 H10 L8 9 Q0 13 -8 9 Z M-11 -6 Q0 -11 11 -6 M-4 -10 Q-6 -14 -3 -17',
      'M-10 10 V-13 Q0 -18 10 -13 V10 M-13 10 H13 M5 0 h1',
      'M-8 10 H8 L5 2 H-5 Z M0 2 V-8 M-5 -8 H5 L3 -12 H-3 Z',
      'M-12 -12 H12 V10 H-12 Z M0 -12 V10 M-12 -1 H12 M4 1 h4',
      'M-12 -2 H10 Q8 8 0 8 Q-8 8 -10 -2 M10 0 L17 -3 M-7 13 l4 -4 l3 4 l4 -4 l4 4',
      'M-8 6 Q-10 -4 -2 -5 Q5 -6 8 1 L11 4 L7 7 Z M-4 -5 Q-7 -12 -2 -11 Q2 -10 0 -5 M-8 5 Q-17 9 -17 2',
    ];
    g.append(path(shapes[i]!));
    return g;
  }
  function draw(): void {
    art.replaceChildren();
    live.replaceChildren();
    art.append(
      path('M12 58 V253 H348 V58 M12 58 H348'),
      hatch(14, 59, 332, 10, 7),
      path('M179 43 a11 11 0 1 0 11 -18 a9 9 0 1 1 -11 18'),
    );
    art.append(
      s('text', { x: 13, y: 17, class: 'hand' }, ui5.rung),
      s('text', { x: 13, y: 46, class: 'f5-counter' }, String(state.rung)),
      s('text', { x: 347, y: 17, class: 'hand', 'text-anchor': 'end' }, ui5.mended),
      s('text', { x: 347, y: 46, class: 'f5-counter', 'text-anchor': 'end' }, String(state.mended)),
    );
    for (let i = 0; i < 8; i++) {
      const [x, y] = pos(i);
      const active = state.active[i];
      if (i < cords) art.append(line(x, y - 24, 55 + (i % 3) * 122, 279, { class: 'faint' }));
      art.append(glyph(i, x, y));
      if (i < bells) art.append(bell(x - (bells > i + 8 ? 7 : 0), y - 27, !!active, state.tick));
      if (i + 8 < bells) art.append(bell(x + 7, y - 27, !!active, state.tick));
      if (active) {
        const age = state.tick - active.start;
        live.append(smudge(x + 8, y + 1, age < 10 ? 3 : age < 30 ? 5 : 7, i * 19));
        if (phase === 'done')
          live.append(path(`M${x - 15} ${y - 16} l30 31 M${x + 15} ${y - 16} l-30 31`, { class: 'err' }));
      } else if (state.recentlyMended.includes(i)) live.append(path(`M${x + 9} ${y - 2} l3 4 l7 -9`));
    }
    for (let i = 0; i < 3; i++) {
      const x = 55 + i * 122;
      const sleeper = state.sleepers[i]!;
      art.append(
        line(x - 25, 282, x + 24, 282),
        s('text', { x, y: 300, class: 'hand', 'text-anchor': 'middle' }, ui5.sleepers[i]!),
      );
      if (sleeper.spot === null)
        art.append(s('circle', { cx: x - 17, cy: 274, r: 5 }), path(`M${x - 11} 276 Q${x} 270 ${x + 17} 277`));
      for (let j = 0; j < sleeper.answersLeft; j++) art.append(line(x - 6 + j * 6, 308, x - 4 + j * 6, 313));
      if (sleeper.spot !== null) {
        const [sx, sy] = pos(sleeper.spot);
        live.append(figure(sx + 19, sy - 10), path(`M${sx + 30} ${sy + 6} l10 0 l-2 9 l-6 0 Z`));
      }
    }
  }
  function finish(): void {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    while (!done(state)) state = step(state);
    setPhase('done');
    const result = summarize(state);
    history.push(result);
    if (history.length > 6) history.shift();
    ctx.setResult(result5(result));
    if (result.rung >= 100 && result.mended <= 5) ctx.breakSeal();
    draw();
    tally();
  }
  function tick(): void {
    state = step(state);
    draw();
    ctx.setResult(ui5.running(state.tick, F5.ticks));
    if (done(state)) finish();
  }
  function start(): void {
    // Every setting you try gets the same night. A new night comes only when
    // you run the same setting twice.
    const setting = `${bells}/${cords}`;
    if (tried.has(setting)) {
      night++;
      tried.clear();
    }
    tried.add(setting);
    state = init(bells, cords, night);
    setPhase('running');
    draw();
    ctx.setResult(ui5.running(0, F5.ticks));
    timer = window.setInterval(tick, F5.tickMs);
  }
  go.addEventListener('click', () => {
    if (phase === 'running') finish();
    else start();
  });
  function update(): void {
    bells = Number(bellRange.value);
    cordRange.max = String(Math.min(bells, 8));
    cords = Math.min(Number(cordRange.value), bells, 8);
    cordRange.value = String(cords);
    bellOut.textContent = String(bells);
    cordOut.textContent = String(cords);
    state = init(bells, cords, night);
    setPhase('idle');
    ctx.setResult(ui5.idle);
    draw();
  }
  bellRange.addEventListener('input', update);
  cordRange.addEventListener('input', update);
  setPhase('idle');
  ctx.setResult(ui5.idle);
  draw();
}

export const folio5: FolioModule = { id: 'v', copy: copy5, mount };
