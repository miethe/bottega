import { copy1, result1, ui1 } from '../copy/folio1';
import { easel, eye, figure, h, ink, line, panel, path, s, smudge, stageSvg } from '../draw/svg';
import { F1, done, expectedShare, init, step, summarize, type F1State, type F1Summary } from '../sim/folio1';
import type { FolioCtx, FolioModule } from '../shell/types';

const W = 360;
const H = 330;
const GRID_H = 262;
const TICK_MS = 200;

interface Cell {
  x: number;
  y: number;
  size: number;
}

/** Lay N easels out in rows of at most four, as large as they fit, centered. */
function layout(n: number): Cell[] {
  const cols = Math.min(n, 4);
  const rows = Math.ceil(n / 4);
  const size = Math.min(W / cols, GRID_H / rows, 150);
  const cells: Cell[] = [];
  const top = (GRID_H - rows * size) / 2;
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 4);
    const inRow = row === rows - 1 ? n - row * 4 : 4;
    const left = (W - inRow * size) / 2;
    cells.push({ x: left + (i % 4) * size, y: top + row * size, size });
  }
  return cells;
}

function mount(ctx: FolioCtx): void {
  let hands = 1;
  let day = 0;
  let state: F1State = init(hands, day);
  let timer: number | undefined;
  let phase: 'idle' | 'running' | 'done' = 'idle';
  const history: F1Summary[] = [];

  // ----- stage
  const svg = stageSvg(W, H);
  const art = ink();
  const live = s('g', { class: 'ink live' });
  const shelf = s('g', { class: 'shelf' });
  const eyeG = eye();
  svg.append(art, live, shelf, eyeG);
  const buttons = h('div', { class: 'hit-layer' });
  ctx.stage.append(svg, buttons);

  // ----- levers
  const range = h('input', {
    type: 'range',
    min: 1,
    max: F1.maxHands,
    step: 1,
    value: hands,
    id: 'f1-hands',
    'data-testid': 'f1-hands',
  });
  const out = h('output', { for: 'f1-hands', class: 'lever-value' }, String(hands));
  const go = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f1-go' }, ui1.open);
  ctx.levers.append(h('div', { class: 'lever' }, h('label', { for: 'f1-hands' }, ui1.hands), range, out), go);

  // ----- chart of days
  const chart = s('svg', { viewBox: '0 0 360 120', class: 'drawing chart', role: 'img', 'aria-label': ui1.chartTitle });
  const chartBox = h('figure', { class: 'chart-box', hidden: '' }, chart, h('figcaption', {}, ui1.chartTitle));
  ctx.extras.append(chartBox);

  let cells: Cell[] = [];
  let panelGs: SVGGElement[] = [];
  let hitButtons: HTMLButtonElement[] = [];

  function drawScene(): void {
    cells = layout(hands);
    art.replaceChildren();
    live.replaceChildren();
    shelf.replaceChildren();
    buttons.replaceChildren();
    panelGs = [];
    hitButtons = [];
    cells.forEach((c, i) => {
      const k = c.size / 90;
      const g = s('g', { transform: `translate(${c.x} ${c.y}) scale(${k})` });
      g.append(easel(40, 14), panel(40, 14), figure(20, 30, { reach: [18, -2] }));
      art.append(g);
      const pg = s('g', { transform: `translate(${c.x} ${c.y}) scale(${k})` });
      live.append(pg);
      panelGs.push(pg);
      const b = h('button', {
        type: 'button',
        class: 'hit',
        'data-testid': `f1-easel-${i + 1}`,
        'aria-pressed': 'false',
        style: `left:${(c.x / W) * 100}%;top:${(c.y / H) * 100}%;width:${(c.size / W) * 100}%;height:${(c.size / H) * 100}%`,
      });
      b.addEventListener('click', () => lookAt(i));
      buttons.append(b);
      hitButtons.push(b);
    });
    // the shelf line
    art.append(line(6, GRID_H + 6, W - 6, GRID_H + 6, { class: 'faint' }));
    placeEye();
  }

  function placeEye(): void {
    const c = cells[state.eye] ?? cells[0]!;
    const k = c.size / 90;
    eyeG.setAttribute('transform', `translate(${c.x + 56 * k} ${c.y + 6 * k}) scale(${Math.max(0.8, k)})`);
    hitButtons.forEach((b, i) => {
      const on = i === state.eye;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? ui1.watching(i + 1) : ui1.watch(i + 1));
    });
  }

  let wantEye = 0;
  function lookAt(i: number): void {
    wantEye = i;
    if (phase !== 'running') {
      state.eye = i;
    }
    // show it at once; the sim picks it up on the next tick
    const c = cells[i]!;
    const k = c.size / 90;
    eyeG.setAttribute('transform', `translate(${c.x + 56 * k} ${c.y + 6 * k}) scale(${Math.max(0.8, k)})`);
    hitButtons.forEach((b, j) => {
      b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      b.setAttribute('aria-label', j === i ? ui1.watching(j + 1) : ui1.watch(j + 1));
    });
  }

  function drawPanels(): void {
    state.current.forEach((cur, i) => {
      const pg = panelGs[i]!;
      pg.replaceChildren();
      for (let k = 0; k < cur.strokes; k++) {
        const y = 19 + k * 6;
        if (cur.wrong[k]) pg.append(smudge(50 + ((k * 7) % 13), y, 4.2, k * 40));
        else pg.append(path(`M44 ${y} q7 ${k % 2 ? -2 : 2} 13 0 t11 0`));
      }
    });
  }

  function drawShelf(): void {
    shelf.replaceChildren();
    const perRow = 30;
    state.finished.forEach((p, i) => {
      const x = 8 + (i % perRow) * 11.5;
      const y = GRID_H + 12 + Math.floor(i / perRow) * 14;
      shelf.append(s('rect', { x, y, width: 7.5, height: 10, class: p.ruined ? 'tile err' : 'tile' }));
    });
  }

  function drawChart(): void {
    chart.replaceChildren();
    if (!history.length) return;
    chartBox.hidden = false;
    const x0 = 34;
    const x1 = 350;
    const y0 = 96;
    const y1 = 10;
    const top = 0.7;
    const px = (n: number) => x0 + ((n - 1) / (F1.maxHands - 1)) * (x1 - x0);
    const py = (v: number) => y0 - (Math.min(v, top) / top) * (y0 - y1);
    const g = ink();
    g.append(line(x0, y0, x1, y0), line(x0, y0, x0, y1));
    for (let n = 1; n <= F1.maxHands; n++) g.append(line(px(n), y0, px(n), y0 + 3));
    chart.append(g);
    chart.append(
      s('text', { x: x1, y: y0 + 16, 'text-anchor': 'end', class: 'hand' }, `${ui1.chartX} →`),
      s('text', { x: x0 - 6, y: y1 + 4, 'text-anchor': 'end', class: 'hand' }, '70%'),
      s('text', { x: x0 - 6, y: y0 + 2, 'text-anchor': 'end', class: 'hand' }, '0'),
      s('text', { x: px(1), y: y0 + 16, 'text-anchor': 'middle', class: 'hand' }, '1'),
      s('text', { x: px(12) - 46, y: y0 + 16, 'text-anchor': 'middle', class: 'hand' }, ''),
    );
    if (ctx.lawRevealed()) {
      let d = '';
      for (let n = 1; n <= F1.maxHands; n++) d += `${n === 1 ? 'M' : 'L'}${px(n)} ${py(expectedShare(n))} `;
      chart.append(
        path(d, { class: 'curve err' }),
        s('text', { x: x1, y: py(expectedShare(12)) - 8, 'text-anchor': 'end', class: 'hand err' }, ui1.chartCurve),
      );
    }
    history.forEach((r, i) => {
      const last = i === history.length - 1;
      chart.append(
        s('circle', { cx: px(r.hands), cy: py(r.share), r: last ? 4 : 3, class: last ? 'dot last' : 'dot' }),
      );
    });
  }

  function setPhase(p: typeof phase): void {
    phase = p;
    ctx.root.dataset.phase = p;
    range.disabled = p === 'running';
    go.textContent = p === 'running' ? ui1.skip : p === 'done' ? ui1.again : ui1.open;
    go.dataset.state = p;
  }

  function finish(): void {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    while (!done(state)) step(state, wantEye);
    drawPanels();
    drawShelf();
    const sum = summarize(state);
    history.push(sum);
    if (history.length > 24) history.shift();
    ctx.setResult(result1(sum));
    setPhase('done');
    if (sum.hands >= 3 && sum.ruined >= 3) ctx.breakSeal();
    drawChart();
  }

  function tick(): void {
    step(state, wantEye);
    drawPanels();
    drawShelf();
    if (state.tick % 5 === 0) ctx.setResult(ui1.running(state.tick, F1.ticks));
    if (done(state)) finish();
  }

  function start(): void {
    const keep = Math.min(wantEye, hands - 1);
    state = init(hands, day++);
    state.eye = keep;
    wantEye = keep;
    drawScene();
    drawPanels();
    setPhase('running');
    ctx.setResult(ui1.running(0, F1.ticks));
    timer = window.setInterval(tick, TICK_MS);
  }

  go.addEventListener('click', () => {
    if (phase === 'running') finish();
    else start();
  });

  range.addEventListener('input', () => {
    hands = Number(range.value);
    out.textContent = String(hands);
    wantEye = Math.min(wantEye, hands - 1);
    state = init(hands, day);
    state.eye = wantEye;
    drawScene();
    drawPanels();
    setPhase('idle');
    ctx.setResult(ui1.idle);
  });

  ctx.onLaw(drawChart);

  drawScene();
  setPhase('idle');
  ctx.setResult(ui1.idle);
}

export const folio1: FolioModule = { id: 'i', copy: copy1, mount };
