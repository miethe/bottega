import type { Clause2 } from '../copy/folio2';
import { rng, subseed } from './prng';

export const F2 = { ticks: 60, steps: 6, workTicks: 2, tokens: 8, reworkTicks: 2, q: 0.4, seed: 1503 } as const;
export const checks = ['figures', 'gold', 'frame', 'dry'] as const;
export type Check2 = typeof checks[number];
export type Mode2 = 'a' | 'b';
export interface Piece2 { faults: Check2[]; tested: Check2[] }
export interface State2 {
  mode: Mode2; tick: number; handoffs: number; idleTicks: number; progress: number;
  working: number; rework: number; clauses: Clause2[]; pieces: Piece2[]; pending: Piece2 | null;
  day: number; seed: number; lastTested: Check2[];
}
export function init(mode: Mode2, clauses: Clause2[] = [], day = 0, seed: number = F2.seed): State2 {
  const unique = [...new Set(clauses)];
  return { mode, tick: 0, handoffs: mode === 'b' ? 1 + unique.length : 0, idleTicks: 0,
    progress: 0, working: 0, rework: 0, clauses: unique, pieces: [], pending: null, day, seed, lastTested: [] };
}
export function done(s: State2): boolean { return s.tick >= F2.ticks; }
export function step(s: State2, handoff = false): State2 {
  if (done(s)) return s;
  s.lastTested = [];
  if (s.mode === 'a') {
    if (handoff && s.working === 0 && s.handoffs < F2.tokens) { s.handoffs++; s.working = F2.workTicks; }
    if (s.working) {
      s.working--;
      if (!s.working && ++s.progress === F2.steps) { s.pieces.push({ faults: [], tested: [] }); s.progress = 0; }
    } else s.idleTicks++;
  } else if (s.rework > 0) {
    s.rework--;
    if (!s.rework && s.pending) { s.pieces.push(s.pending); s.lastTested = s.pending.tested; s.pending = null; s.progress = 0; }
  } else {
    s.progress++;
    if (s.progress === F2.steps * F2.workTicks) {
      const tested = checks.filter(c => s.clauses.includes(c));
      const bad = checks.filter((_, i) => rng(subseed(s.seed, s.day, s.pieces.length, i))() < F2.q);
      const faults = bad.filter(c => !tested.includes(c));
      const caught = bad.length - faults.length;
      s.pending = { faults, tested };
      s.rework = caught * F2.reworkTicks;
      if (!s.rework) { s.pieces.push(s.pending); s.lastTested = tested; s.pending = null; s.progress = 0; }
    }
  }
  s.tick++;
  return s;
}
export function summarize(s: State2) {
  return { handoffs: s.handoffs, idleTicks: s.idleTicks, ticks: s.tick,
    checkable: checks.filter(c => s.clauses.includes(c)).length,
    moods: s.clauses.filter(c => c === 'worthy' || c === 'care').length,
    tokens: s.handoffs, finished: s.pieces.length, wrong: s.pieces.filter(p => p.faults.length > 0).length,
    pieces: s.pieces };
}
export function runDay(mode: Mode2, clauses: Clause2[] = [], day = 0, delay = 0, seed: number = F2.seed) {
  const state = init(mode, clauses, day, seed);
  let waiting = 0;
  while (!done(state)) {
    const handoff = mode === 'a' && state.working === 0 && waiting >= delay;
    if (handoff) waiting = 0;
    else if (mode === 'a' && state.working === 0) waiting++;
    step(state, handoff);
  }
  return summarize(state);
}
