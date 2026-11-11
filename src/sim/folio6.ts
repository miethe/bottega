import { rng, subseed } from './prng';

export const F6 = { panels: 24, ticks: 40, initialStains: 5, mendTicks: 3, seed: 1506, tickMs: 450 } as const;
export type Action = 'idle' | 'mend' | { look: number };
export interface Panel { stained: boolean; looked: boolean; stainedAfterLooked: boolean }
export interface F6State {
  tick: number; panels: Panel[]; mended: boolean; mendedAtTick: number | null;
  busy: number; lastLook: number | null; random: () => number;
}
export function init(run = 0, panels: number = F6.panels): F6State {
  const random = rng(subseed(F6.seed, run));
  const shelf = Array.from({ length: panels }, () => ({ stained: false, looked: false, stainedAfterLooked: false }));
  for (let i = 0; i < Math.min(F6.initialStains, panels); i++) {
    const clean = shelf.filter(p => !p.stained);
    clean[Math.floor(random() * clean.length)]!.stained = true;
  }
  return { tick: 0, panels: shelf, mended: false, mendedAtTick: null, busy: 0, lastLook: null, random };
}
export function step(state: F6State, action: Action): F6State {
  if (state.tick >= F6.ticks) return state;
  state.lastLook = null;
  if (!state.busy && action === 'mend' && !state.mended) state.busy = F6.mendTicks;
  if (!state.busy && typeof action === 'object') {
    const p = state.panels[action.look];
    if (p) { p.stained = false; p.looked = true; p.stainedAfterLooked = false; state.lastLook = action.look; }
  }
  if (!state.mended) {
    const clean = state.panels.filter(p => !p.stained);
    if (clean.length) {
      const p = clean[Math.floor(state.random() * clean.length)]!;
      p.stained = true;
      if (p.looked) p.stainedAfterLooked = true;
    }
  }
  state.tick++;
  if (state.busy && --state.busy === 0) { state.mended = true; state.mendedAtTick = state.tick; }
  return state;
}
export function summarize(state: F6State) {
  return { mended: state.mended, mendedAtTick: state.mendedAtTick, looked: state.panels.filter(p => p.looked).length, total: state.panels.length, stained: state.panels.filter(p => p.stained).length, panels: state.panels.map(p => ({ ...p })) };
}
export function runNight(policy: (state: F6State) => Action, run = 0, panels: number = F6.panels) {
  const state = init(run, panels);
  while (state.tick < F6.ticks) step(state, policy(state));
  return summarize(state);
}
