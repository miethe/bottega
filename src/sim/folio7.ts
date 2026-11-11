/**
 * Folio VII. Mark I.
 *
 * Model: every stroke halves the distance between the piece and the piece the
 * maker imagined, so by the maker's own eye it approaches 1 and never arrives.
 * Some faults cannot be seen from inside the shop; together they cap the true
 * worth below 1 however long the polishing goes on. Opening the doors lets
 * strangers in, and strangers show the maker those faults, one a day.
 */
import { randInt, rng, subseed } from './prng';

export const F7 = {
  days: 30,
  /** How far the first state is from the imagined piece. */
  gap0: 0.6,
  /** Worth lost to faults that only a stranger can see. */
  hidden: 0.3,
  /** Number of such faults; each is worth hidden / hiddenParts. */
  hiddenParts: 3,
  crowdMin: 6,
  crowdMax: 18,
  seed: 1519,
} as const;

/** The most the piece can be worth if the doors never open. */
export const F7_CEILING = 1 - F7.hidden;

export type F7Action = 'stroke' | 'open';

export interface F7State {
  /** The day about to be spent, 1-based. Past F7.days the game is over. */
  day: number;
  /** Strokes that closed the visible gap. */
  strokes: number;
  released: boolean;
  releaseDay: number | null;
  /** Stranger-shown faults mended so far, 0..hiddenParts. */
  hiddenFixed: number;
  /** Stranger-shown faults pointed out so far, 0..hiddenParts. */
  hiddenShown: number;
  /** People who came in. */
  viewers: number;
  /** People who walked past a shut door. */
  passedBy: number;
  /** People in the piazza on each day (index 0 is day 1). Fixed by the seed. */
  crowd: number[];
  /** Days of work done after the doors opened. */
  workAfter: number;
}

export function init(run = 0, seed: number = F7.seed): F7State {
  const r = rng(subseed(seed, run));
  const crowd = Array.from({ length: F7.days }, () => randInt(r, F7.crowdMin, F7.crowdMax));
  return {
    day: 1,
    strokes: 0,
    released: false,
    releaseDay: null,
    hiddenFixed: 0,
    hiddenShown: 0,
    viewers: 0,
    passedBy: 0,
    crowd,
    workAfter: 0,
  };
}

export function over(s: F7State): boolean {
  return s.day > F7.days;
}

/** What separates the piece from the imagined one, as the maker sees it. Never zero. */
export function gap(s: F7State): number {
  return F7.gap0 * Math.pow(0.5, s.strokes);
}

/** The piece by the maker's own eye: 1 - gap. Approaches 1, never reaches it. */
export function inside(s: F7State): number {
  return 1 - gap(s);
}

/** The piece as it is: what the maker sees, less the faults the maker cannot. */
export function worth(s: F7State): number {
  return inside(s) - F7.hidden + (F7.hidden / F7.hiddenParts) * s.hiddenFixed;
}

/** The Mark the piece carries: 0 before it has a name, then I, then II once strangers' faults are being mended. */
export function mark(s: F7State): number {
  if (!s.released) return 0;
  return s.hiddenFixed > 0 ? 2 : 1;
}

/**
 * Spend one day. Mutates and returns the state.
 * - 'stroke' behind shut doors: one more stroke; the piazza walks past.
 * - 'open': the doors open (it takes the day); today's piazza comes in and a stranger shows one fault.
 * - 'stroke' with the doors open: mend a stranger-shown fault if one is waiting, else one more stroke;
 *   today's piazza comes in, and a stranger shows the next fault if any remain.
 */
export function step(s: F7State, action: F7Action): F7State {
  if (over(s)) return s;
  const today = s.crowd[s.day - 1] ?? 0;
  if (!s.released) {
    if (action === 'open') {
      s.released = true;
      s.releaseDay = s.day;
      s.viewers += today;
      s.hiddenShown = Math.min(F7.hiddenParts, s.hiddenShown + 1);
    } else {
      s.strokes++;
      s.passedBy += today;
    }
  } else {
    if (s.hiddenFixed < s.hiddenShown) s.hiddenFixed++;
    else s.strokes++;
    s.workAfter++;
    s.viewers += today;
    s.hiddenShown = Math.min(F7.hiddenParts, s.hiddenShown + 1);
  }
  s.day++;
  return s;
}

export interface F7Summary {
  released: boolean;
  releaseDay: number | null;
  strokes: number;
  inside: number;
  gap: number;
  worth: number;
  mark: number;
  viewers: number;
  passedBy: number;
}

export function summarize(s: F7State): F7Summary {
  return {
    released: s.released,
    releaseDay: s.releaseDay,
    strokes: s.strokes,
    inside: inside(s),
    gap: gap(s),
    worth: worth(s),
    mark: mark(s),
    viewers: s.viewers,
    passedBy: s.passedBy,
  };
}

/** Play all thirty days: polish until `openOn` (a day number), open, then keep working. null = never open. */
export function runAll(openOn: number | null, run = 0, seed: number = F7.seed): F7Summary {
  const s = init(run, seed);
  while (!over(s)) step(s, openOn !== null && s.day === openOn && !s.released ? 'open' : 'stroke');
  return summarize(s);
}
