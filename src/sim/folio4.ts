import type { Checker4 } from '../copy/folio4';
import { rng, subseed } from './prng';

export const F4 = {
  panels: 20,
  hands: 0.4,
  perspective: 0.12,
  drapery: 0.12,
  sound: 0.36,
  gross: 0.12,
  benchGross: 0.9,
  benchHands: 0.03,
  benchOther: 0.9,
  outsiderHands: 0.9,
  outsiderPerspective: 0.1,
  outsiderDrapery: 0.9,
  benchCount: 3,
  seed: 18,
} as const;
export type Flaw4 = 'hands' | 'perspective' | 'drapery';
export type Kind4 = Flaw4 | 'sound';
export type Eye4 = 'bench1' | 'bench2' | 'bench3' | 'outsider';
export interface Panel4 {
  state: Kind4;
  ribbon: true;
  caughtBy: Eye4[];
  shippedFlawed: boolean;
}
export interface Day4 {
  who: Checker4;
  sentBack: number;
  shipped: number;
  hands: number;
  perspective: number;
  drapery: number;
  panels: Panel4[];
}
export interface State4 {
  who: Checker4;
  day: number;
  seed: number;
  panels: Panel4[];
}

function makePanel(who: Checker4, day: number, index: number, seed: number): Panel4 {
  const draw = (stream: number) => rng(subseed(seed, day, index, stream))();
  const v = draw(0);
  const state: Kind4 =
    v < F4.hands
      ? 'hands'
      : v < F4.hands + F4.perspective
        ? 'perspective'
        : v < F4.hands + F4.perspective + F4.drapery
          ? 'drapery'
          : 'sound';
  const gross = draw(1) < F4.gross;
  const eyes: Eye4[] =
    who === 'bench1'
      ? ['bench1']
      : who === 'bench3'
        ? ['bench1', 'bench2', 'bench3']
        : who === 'outsider'
          ? ['outsider']
          : who === 'pair'
            ? ['bench1', 'outsider']
            : [];
  const caughtBy = eyes.filter((eye) => {
    if (state === 'sound') return false;
    const outsider = eye === 'outsider';
    const chance = outsider
      ? state === 'hands'
        ? F4.outsiderHands
        : state === 'perspective'
          ? F4.outsiderPerspective
          : F4.outsiderDrapery
      : state === 'hands'
        ? gross
          ? F4.benchGross
          : F4.benchHands
        : F4.benchOther;
    const stream = outsider ? 5 : Number(eye.slice(-1)) + 1;
    return draw(stream) < chance;
  });
  return { state, ribbon: true, caughtBy, shippedFlawed: state !== 'sound' && caughtBy.length === 0 };
}
export function init(who: Checker4, day = 0, seed: number = F4.seed): State4 {
  return { who, day, seed, panels: [] };
}
export function done(state: State4): boolean {
  return state.panels.length >= F4.panels;
}
export function step(state: State4): State4 {
  if (!done(state)) state.panels.push(makePanel(state.who, state.day, state.panels.length, state.seed));
  return state;
}
export function summarize(state: State4): Day4 {
  const count = (kind: Flaw4) => state.panels.filter((p) => p.state === kind && p.shippedFlawed).length;
  return {
    who: state.who,
    sentBack: state.panels.filter((p) => p.caughtBy.length > 0).length,
    shipped: state.panels.filter((p) => p.shippedFlawed).length,
    hands: count('hands'),
    perspective: count('perspective'),
    drapery: count('drapery'),
    panels: [...state.panels],
  };
}
export function runDay(who: Checker4, day = 0, seed: number = F4.seed): Day4 {
  const state = init(who, day, seed);
  while (!done(state)) step(state);
  return summarize(state);
}
