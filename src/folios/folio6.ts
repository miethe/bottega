import { copy6, result6, ui6 } from '../copy/folio6';
import { figure, h, hatch, ink, line, path, s, smudge, stageSvg } from '../draw/svg';
import { F6, init, step, summarize, type Action } from '../sim/folio6';
import type { FolioCtx, FolioModule } from '../shell/types';

function mount(ctx: FolioCtx): void {
  const W = 360, H = 330;
  let run = 0, state = init(run), phase: 'idle' | 'running' | 'done' = 'idle';
  let timer: number | undefined, queued: Action | undefined;
  const svg = stageSvg(W, H), art = ink(), hits = h('div', { class: 'hit-layer' });
  svg.append(art); ctx.stage.append(svg, hits);
  const go = h('button', { type: 'button', class: 'btn primary', 'data-testid': 'f6-go' }, ui6.toDawn);
  const mend = h('button', { type: 'button', class: 'btn', 'data-testid': 'f6-mend' }, ui6.mend);
  const look = h('button', { type: 'button', class: 'btn', 'data-testid': 'f6-look' }, ui6.look);
  ctx.levers.append(mend, look, go);
  const buttons: HTMLButtonElement[] = [];
  for (let i = 0; i < F6.panels; i++) {
    const b = h('button', { type: 'button', class: 'hit', 'data-testid': `f6-panel-${i + 1}`,
      style: `left:${(8 + (i % 12) * 28.7) / W * 100}%;top:${(120 + Math.floor(i / 12) * 52) / H * 100}%;width:${28.7 / W * 100}%;height:${48 / H * 100}%` });
    b.addEventListener('click', () => request({ look: i })); hits.append(b); buttons.push(b);
  }
  function draw(): void {
    art.replaceChildren();
    art.append(line(18, 106, 342, 106), line(18, 169, 342, 169), line(18, 221, 342, 221));
    // the top shelf the jar stands on
    art.append(line(118, 67, 252, 67), line(128, 67, 134, 80, { class: 'faint' }), line(242, 67, 236, 80, { class: 'faint' }));
    const jar = s('g', { transform: state.mended ? 'translate(168 18)' : 'translate(168 18) rotate(15 12 30)' });
    jar.append(path('M5 4 L19 4 L19 12 Q26 16 25 31 L23 48 Q12 52 1 48 L-1 31 Q-2 16 5 12 Z'), line(4, 7, 20, 7));
    if (state.mended) jar.append(path('M6 29 l4 5 l9 -11'));
    art.append(jar);
    if (state.mended) art.append(s('text', { x: 202, y: 48, class: 'hand' }, ui6.jarMended));
    else art.append(smudge(190, state.tick % 2 ? 96 : 82, 3));
    state.panels.forEach((p, i) => {
      const x = 12 + (i % 12) * 28.7, y = 125 + Math.floor(i / 12) * 52 + (p.looked ? 5 : 0);
      art.append(s('rect', { x, y, width: 17, height: 35, class: 'tile' }), hatch(x + 2, y + 2, 13, 31, 9, { class: 'faint' }));
      if (p.looked) art.append(path(`M${x + 4} ${y + 15} l3 3 l6 -7`));
      const b = buttons[i]!; b.setAttribute('aria-label', p.looked ? ui6.panelSeen(i + 1) : ui6.panel(i + 1));
      b.setAttribute('aria-pressed', String(p.looked)); b.disabled = phase === 'done';
    });
    if (state.busy) art.append(figure(138, 48, { reach: [20, -10] }));
    else if (state.lastLook !== null) art.append(figure(12 + (state.lastLook % 12) * 28.7, 225, { reach: [10, -15] }));
    art.append(line(20, 306, 338, 306), s('circle', { cx: 20 + 318 * state.tick / F6.ticks, cy: 306, r: 5 }), s('circle', { cx: 338, cy: 306, r: 9 }));
    if (phase === 'done') {
      art.append(s('rect', { x: 25, y: 238, width: 310, height: 43, class: 'tile' }), s('circle', { cx: 65, cy: 287, r: 7 }), s('circle', { cx: 295, cy: 287, r: 7 }));
      state.panels.forEach((p, i) => art.append(s('rect', { x: 31 + i * 12.5, y: 245, width: 9, height: 24, class: p.stained ? 'tile err' : 'tile' })));
      art.append(s('text', { x: 180, y: 235, 'text-anchor': 'middle', class: 'hand' }, ui6.cart));
    }
    mend.disabled = phase === 'done' || state.mended || state.busy > 0 || queued === 'mend';
    mend.textContent = state.mended ? ui6.mended : state.busy || queued === 'mend' ? ui6.mending : ui6.mend;
    look.disabled = phase === 'done';
  }
  function setPhase(p: typeof phase): void { phase = p; ctx.root.dataset.phase = p; go.dataset.state = p; go.textContent = p === 'done' ? ui6.again : ui6.toDawn; }
  function finish(): void {
    if (timer !== undefined) window.clearInterval(timer); timer = undefined;
    while (state.tick < F6.ticks) { const action = state.busy ? 'idle' : queued ?? 'idle'; if (!state.busy) queued = undefined; step(state, action); }
    setPhase('done'); const result = summarize(state); ctx.setResult(result6(result));
    if (result.mended && result.stained >= 1) ctx.breakSeal(); draw();
  }
  function tick(): void {
    const action = state.busy ? 'idle' : queued ?? 'idle'; if (!state.busy) queued = undefined;
    step(state, action);
    if (state.tick >= F6.ticks) { finish(); return; }
    const sum = summarize(state); ctx.setResult(ui6.running(state.tick, F6.ticks, sum.looked, sum.total, sum.mended)); draw();
  }
  function start(): void { setPhase('running'); ctx.setResult(ui6.running(0, F6.ticks, 0, F6.panels, false)); timer = window.setInterval(tick, F6.tickMs); }
  function request(action: Action): void {
    if (phase === 'done') return;
    if (phase === 'idle') start();
    if (queued === undefined) queued = action;
    draw();
  }
  mend.addEventListener('click', () => request('mend'));
  look.addEventListener('click', () => { const next = state.panels.findIndex(p => !p.looked); if (next >= 0) request({ look: next }); });
  go.addEventListener('click', () => {
    if (phase === 'done') { state = init(++run); queued = undefined; setPhase('idle'); ctx.setResult(ui6.idle); draw(); }
    else { if (phase === 'idle') start(); finish(); }
  });
  setPhase('idle'); ctx.setResult(ui6.idle); draw();
}
export const folio6: FolioModule = { id: 'vi', copy: copy6, mount };
