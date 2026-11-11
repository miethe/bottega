/**
 * Folio I. One pair of eyes.
 *
 * Model: each apprentice lays one stroke per tick. An unwatched stroke goes
 * wrong with probability P_WRONG; a watched stroke never does. One wrong
 * stroke ruins the panel. The master's eye rests on exactly one easel per tick.
 */
import { rng, subseed } from './prng';

export const F1 = {
  strokesPerPanel: 6,
  ticks: 60,
  pWrong: 0.11,
  maxHands: 12,
  seed: 1503,
} as const;

/** Chance that a panel nobody watched comes out ruined. */
export const F1_UNWATCHED_RUIN = 1 - Math.pow(1 - F1.pWrong, F1.strokesPerPanel);

export interface F1Panel {
  easel: number;
  ruined: boolean;
  /** True if it would have been ruined had the eye been nowhere at all. */
  ruinedBlind: boolean;
  tick: number;
}

export interface F1State {
  hands: number;
  day: number;
  tick: number;
  eye: number;
  eyeMoves: number;
  /** Per easel: strokes laid on the current panel, and which of them went wrong. */
  current: { strokes: number; wrong: boolean[]; wrongBlind: boolean }[];
  finished: F1Panel[];
  /** wrong[easel][tick]: would this stroke go wrong if unwatched? Fixed by the seed. */
  wrong: boolean[][];
}

export interface F1Summary {
  hands: number;
  finished: number;
  ruined: number;
  share: number;
  eyeMoves: number;
  /** Panels the eye actually saved: ruined if blind, clean as played. */
  saved: number;
}

/** Which strokes would go wrong if nobody looked. Depends only on seed, day, easel, tick. */
export function drawDay(hands: number, day: number, seed: number = F1.seed): boolean[][] {
  const out: boolean[][] = [];
  for (let e = 0; e < hands; e++) {
    const r = rng(subseed(seed, day, e));
    const row: boolean[] = [];
    for (let t = 0; t < F1.ticks; t++) row.push(r() < F1.pWrong);
    out.push(row);
  }
  return out;
}

export function init(hands: number, day = 0, seed: number = F1.seed): F1State {
  const n = Math.max(1, Math.min(F1.maxHands, Math.round(hands)));
  return {
    hands: n,
    day,
    tick: 0,
    eye: 0,
    eyeMoves: 0,
    current: Array.from({ length: n }, () => ({ strokes: 0, wrong: [], wrongBlind: false })),
    finished: [],
    wrong: drawDay(n, day, seed),
  };
}

export function done(s: F1State): boolean {
  return s.tick >= F1.ticks;
}

/** Advance one tick with the eye on `eye`. Mutates and returns the state. */
export function step(s: F1State, eye: number): F1State {
  if (done(s)) return s;
  const e = Math.max(0, Math.min(s.hands - 1, eye));
  if (e !== s.eye) {
    s.eye = e;
    s.eyeMoves++;
  }
  for (let i = 0; i < s.hands; i++) {
    const cur = s.current[i]!;
    const bad = s.wrong[i]![s.tick]!;
    cur.wrong.push(bad && i !== s.eye);
    if (bad) cur.wrongBlind = true;
    cur.strokes++;
    if (cur.strokes >= F1.strokesPerPanel) {
      s.finished.push({
        easel: i,
        ruined: cur.wrong.some(Boolean),
        ruinedBlind: cur.wrongBlind,
        tick: s.tick,
      });
      s.current[i] = { strokes: 0, wrong: [], wrongBlind: false };
    }
  }
  s.tick++;
  return s;
}

export function summarize(s: F1State): F1Summary {
  const finished = s.finished.length;
  const ruined = s.finished.filter((p) => p.ruined).length;
  const saved = s.finished.filter((p) => p.ruinedBlind && !p.ruined).length;
  return {
    hands: s.hands,
    finished,
    ruined,
    share: finished ? ruined / finished : 0,
    eyeMoves: s.eyeMoves,
    saved,
  };
}

/** Play a whole day with an eye policy: (tick, hands) -> easel index. */
export function runDay(
  hands: number,
  policy: (tick: number, hands: number) => number = () => 0,
  day = 0,
  seed: number = F1.seed,
): F1Summary {
  const s = init(hands, day, seed);
  while (!done(s)) step(s, policy(s.tick, s.hands));
  return summarize(s);
}

/** Expected ruined share when the eye stays on one easel all day. */
export function expectedShare(hands: number): number {
  return (1 - 1 / hands) * F1_UNWATCHED_RUIN;
}

/** Expected ruined share when the eye is spread evenly over every easel. */
export function expectedShareSpread(hands: number): number {
  return 1 - Math.pow(1 - F1.pWrong, F1.strokesPerPanel * (1 - 1 / hands));
}
