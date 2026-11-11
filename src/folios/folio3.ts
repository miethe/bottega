import '../styles/folio3.css';
import { copy3, result3, ui3 } from '../copy/folio3';
import { eye, h, hatch, ink, line, panel, path, s, stageSvg } from '../draw/svg';
import { F3, done, init, step, summarize, type F3State, type F3Summary } from '../sim/folio3';
import type { FolioCtx, FolioModule } from '../shell/types';

const W = 360;
const H = 300;
const TICK_MS = 380;
/** Where the five hops stand along the bench, and the four places a seal can go between them. */
const HOP_X = [34, 107, 180, 253, 326];
const SEAL_X = [70.5, 143.5, 216.5, 289.5];
const BENCH_Y = 196;
const STACK_MAX = 11;

function key(seals: boolean[]): string {
  return seals.map((on) => (on ? '1' : '0')).join('');
}

function names(seals: boolean[]): string {
  if (seals.every(Boolean)) return ui3.everyHop;
  if (!seals.some(Boolean)) return ui3.noSeals;
  return ui3.seal.filter((_, i) => seals[i]).join(', ');
}

/** The five hops, drawn once. */
function drawBench(g: SVGGElement): void {
  g.append(line(12, BENCH_Y, W - 12, BENCH_Y));
  const y = 158;
  const [sketch, under, gilding, varnish, door] = HOP_X as [number, number, number, number, number];
  // sketch: a panel with one loose line on it
  g.append(panel(sketch - 12, y, 24, 32), path(`M${sketch - 7} ${y + 24} q5 -16 14 -9`, { class: 'faint' }));
  // underpainting: the same panel, blocked in
  g.append(panel(under - 12, y, 24, 32), hatch(under - 10, y + 3, 20, 26, 5, { class: 'hatch faint' }));
  // gilding: a figure with a halo
  g.append(
    panel(gilding - 12, y, 24, 32),
    s('circle', { cx: gilding, cy: y + 12, r: 3.5 }),
    s('circle', { cx: gilding, cy: y + 12, r: 7.5 }),
    path(`M${gilding - 6} ${y + 30} q6 -14 12 0`),
  );
  // varnish: a pot and a brush
  g.append(
    path(`M${varnish - 10} ${y + 16} l3 16 h14 l3 -16 z`, { class: 'panel' }),
    line(varnish + 2, y + 18, varnish + 11, y + 1),
    line(varnish + 10, y + 3, varnish + 13, y - 3),
  );
  // delivery: the patron's door
  g.append(
    path(`M${door - 11} ${y + 38} v-34 q11 -9 22 0 v34`),
    s('circle', { cx: door + 6, cy: y + 22, r: 1.2, class: 'fill' }),
  );
  ui3.hops.forEach((hop, i) => {
    g.append(s('text', { x: HOP_X[i]!, y: i % 2 ? 228 : 214, 'text-anchor': 'middle' }, hop));
  });
}

function mount(ctx: FolioCtx): void {
  const seals = [true, true, true, true];
  // Every placement you try sees the same month. A new month comes only when
  // you run the same placement twice.
  let month = 0;
  let tried = new Set<string>();
  let state: F3State = init(seals, month);
  let phase: 'idle' | 'running' | 'done' = 'idle';
  let timer: number | undefined;
  const history: { month: number; key: string; seals: boolean[]; r: F3Summary }[] = [];

  const svg = stageSvg(W, H);
  const bench = ink();
  const live = s('g', { class: 'ink live' });
  svg.append(bench, live);
  const hits = h('div', { class: 'hit-layer' });
  ctx.stage.append(svg, hits);
  drawBench(bench);

  // ----- levers: four seals, one button
  const boxes: HTMLInputElement[] = [];
  const list = h('div', { class: 'f3-chips' });
  ui3.seal.forEach((where, i) => {
    const input = h('input', { type: 'checkbox', id: `f3-seal-${i + 1}`, 'data-testid': `f3-seal-${i + 1}` });
    input.checked = seals[i]!;
    input.addEventListener('change', () => setSeal(i, input.checked));
    boxes.push(input);
    list.append(h('label', { class: 'f3-chip', for: `f3-seal-${i + 1}` }, input, h('span', {}, where)));
    // the same seal, as a place to tap on the drawing
    const spot = h('button', {
      type: 'button',
      class: 'hit',
      tabindex: -1,
      'aria-hidden': 'true',
      style: `left:${((SEAL_X[i]! - 20) / W) * 100}%;top:${(150 / H) * 100}%;width:${(40 / W) * 100}%;height:${(56 / H) * 100}%`,
    });
    spot.addEventListener('click', () => {
      if (phase !== 'running') setSeal(i, !seals[i]);
    });
    hits.append(spot);
  });
  const sheet = h('fieldset', { class: 'f3-sheet' }, h('legend', {}, ui3.sealsLabel), list);
  const go = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f3-go' }, ui3.run);
  ctx.levers.append(sheet, go);

  const tally = h('div', { class: 'f3-tally', hidden: '' });
  ctx.extras.append(tally);

  function setSeal(i: number, on: boolean): void {
    seals[i] = on;
    boxes[i]!.checked = on;
    state = init(seals, month);
    setPhase('idle');
    draw();
    ctx.setResult(on ? ui3.sealOn(ui3.seal[i]!) : ui3.sealOff(ui3.seal[i]!));
  }

  function setPhase(next: typeof phase): void {
    phase = next;
    ctx.root.dataset.phase = next;
    go.dataset.state = next;
    go.textContent = next === 'running' ? ui3.skip : next === 'done' ? ui3.again : ui3.run;
    for (const b of boxes) b.disabled = next === 'running';
  }

  function draw(): void {
    live.replaceChildren();
    const today = state.series.at(-1);
    const queues = today?.queues ?? [0, 0, 0, 0];

    live.append(s('text', { x: 14, y: 22 }, ui3.day(state.day, F3.days)));

    // seals, and what waits at each
    SEAL_X.forEach((x, i) => {
      if (!seals[i]) {
        live.append(line(x, BENCH_Y - 5, x, BENCH_Y + 5, { class: 'faint' }));
        return;
      }
      live.append(path(`M${x - 7} ${BENCH_Y - 1} q-3 -7 4 -8 q8 -3 10 4 q3 8 -5 9 q-6 2 -9 -5 z`, { class: 'fill' }));
      const n = queues[i]!;
      for (let j = 0; j < Math.min(n, STACK_MAX); j++) {
        live.append(s('rect', { x: x - 7, y: 178 - j * 6, width: 14, height: 5, class: 'tile' }));
      }
      if (n > STACK_MAX) {
        live.append(s('text', { x, y: 178 - STACK_MAX * 6, 'text-anchor': 'middle' }, ui3.more(n - STACK_MAX)));
      }
    });

    // the master's eye, over the longest queue
    if (seals.some(Boolean)) {
      const sealed = SEAL_X.map((_, i) => i).filter((i) => seals[i]);
      const at = sealed.reduce((best, i) => (queues[i]! > queues[best]! ? i : best), sealed[0]!);
      const x = SEAL_X[at]!;
      const master = eye();
      master.setAttribute('transform', `translate(${x} 74)`);
      live.append(master);
      const label = today?.tired ? ui3.tired : phase === 'running' ? ui3.fresh : '';
      if (today?.tired) live.append(path(`M${x - 12} 73 q12 7 24 0`, { class: 'err' }));
      if (label) {
        live.append(s('text', { x, y: 54, 'text-anchor': 'middle', class: today?.tired ? 'err' : '' }, label));
      }
    }

    // what has gone through the patron's door
    const delivered = state.sound + state.ruined;
    for (let i = 0; i < delivered; i++) {
      const bad = i < state.ruined;
      live.append(
        s('rect', {
          x: 306 + (i % 8) * 5.6,
          y: 142 - Math.floor(i / 8) * 5.6,
          width: 4.2,
          height: 4.2,
          class: bad ? 'tile err' : 'tile',
        }),
      );
    }

    // the count so far
    const counts = [state.sound, state.ruined, state.gold, today?.waiting ?? 0];
    ui3.counts.forEach((label, i) => {
      const x = 48 + i * 88;
      live.append(
        s('text', { x, y: 258, 'text-anchor': 'middle' }, label),
        s(
          'text',
          { x, y: 280, 'text-anchor': 'middle', class: i === 1 && counts[i]! > 0 ? 'f3-count err' : 'f3-count' },
          String(counts[i]),
        ),
      );
    });
  }

  function drawTally(): void {
    tally.hidden = history.length === 0;
    const rows = history.filter((e) => e.month === month);
    tally.replaceChildren(
      h('p', { class: 'f3-tally-title' }, ui3.tallyTitle),
      h(
        'ul',
        {},
        ...rows.map((e) =>
          h(
            'li',
            {},
            h('span', {}, names(e.seals)),
            h('b', { class: e.r.ruined >= 8 ? 'err' : '' }, ui3.tallyRow(e.r)),
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
    const r = summarize(state);
    const k = key(seals);
    const at = history.findIndex((e) => e.month === month && e.key === k);
    if (at >= 0) history.splice(at, 1);
    history.push({ month, key: k, seals: [...seals], r });
    tried.add(k);
    drawTally();
    ctx.setResult(result3(r));
    if (r.ruined >= 8) ctx.breakSeal();
  }

  function tick(): void {
    step(state);
    draw();
    if (done(state)) finish();
  }

  go.addEventListener('click', () => {
    if (phase === 'running') return finish();
    if (tried.has(key(seals))) {
      month++;
      tried = new Set();
    }
    state = init(seals, month);
    setPhase('running');
    draw();
    ctx.setResult(ui3.day(0, F3.days));
    // nothing to do but watch, so with reduced motion go straight to the end
    if (ctx.reducedMotion()) return finish();
    timer = window.setInterval(tick, TICK_MS);
  });

  setPhase('idle');
  draw();
  ctx.setResult(ui3.idle);
}

export const folio3: FolioModule = { id: 'iii', copy: copy3, mount };
