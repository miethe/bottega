/**
 * Folio III. The gold and the sketch.
 *
 * Model: pieces pass through five hops, one hop a day. Each of the first four
 * hops can add a flaw. A seal before a hop holds every piece there until the
 * master has looked at it. He looks at a fixed number a day, and well; when the
 * pile at his seals grows past a threshold he tires in proportion and stamps.
 * A flaw caught before the gold costs a day. Gold is wasted, one leaf per piece
 * and counted once, when it is laid over a flaw, stripped after a later catch,
 * or sent out on a ruined piece.
 */
import { rng, subseed } from './prng';

export const F3 = {
  days: 30,
  startsPerDay: 4,
  /** sketch, underpainting, gilding, varnish, delivery */
  hops: 5,
  gildingHop: 2,
  pFlaw: 0.15,
  looksPerDay: 10,
  tiredPast: 10,
  catchFresh: 0.95,
  catchFloor: 0.2,
  seed: 12,
} as const;

/** Four seal positions. Seal i guards hop i + 1: underpainting, gilding, varnish, delivery. */
export type Seals = readonly boolean[];

interface Piece {
  id: number;
  /** The next hop this piece will go through, 0..4. */
  hop: number;
  flawed: boolean;
  gilded: boolean;
  goldWasted: boolean;
  /** The day it started waiting at a seal, or null. */
  waitingSince: number | null;
  /** The first day it may move again. */
  ready: number;
}

export interface F3Day {
  day: number;
  /** Pieces waiting at each of the four seals at the end of the day. */
  queues: number[];
  sound: number;
  ruined: number;
  gold: number;
  waiting: number;
  stamped: number;
  tired: boolean;
}

export interface F3State {
  seals: boolean[];
  month: number;
  seed: number;
  day: number;
  pieces: Piece[];
  sound: number;
  ruined: number;
  gold: number;
  stamped: number;
  series: F3Day[];
}

export interface F3Summary {
  seals: number;
  sound: number;
  ruined: number;
  gold: number;
  waiting: number;
  stamped: number;
  series: F3Day[];
}

export function init(seals: Seals, month = 0, seed: number = F3.seed): F3State {
  return {
    seals: Array.from({ length: F3.hops - 1 }, (_, i) => !!seals[i]),
    month,
    seed,
    day: 0,
    pieces: [],
    sound: 0,
    ruined: 0,
    gold: 0,
    stamped: 0,
    series: [],
  };
}

export function done(state: F3State): boolean {
  return state.day >= F3.days;
}

/** How well the master catches a flaw with `waiting` pieces piled at his seals. */
export function catchChance(waiting: number): number {
  if (waiting <= F3.tiredPast) return F3.catchFresh;
  return Math.max(F3.catchFloor, (F3.catchFresh * F3.tiredPast) / waiting);
}

function wasteGoldIfFlawed(state: F3State, p: Piece): void {
  if (p.gilded && p.flawed && !p.goldWasted) {
    p.goldWasted = true;
    state.gold++;
  }
}

/** Advance one day. Mutates and returns the state. */
export function step(state: F3State): F3State {
  if (done(state)) return state;
  const day = ++state.day;

  // 1. The master looks, oldest first, across every seal.
  const queue = state.pieces
    .filter((p) => p.waitingSince !== null)
    .sort((a, b) => a.waitingSince! - b.waitingSince! || a.id - b.id);
  const tired = queue.length > F3.tiredPast;
  const chance = catchChance(queue.length);
  for (const p of queue.slice(0, F3.looksPerDay)) {
    if (tired) state.stamped++;
    const caught = p.flawed && rng(subseed(state.seed, state.month, p.id, p.hop, 1))() < chance;
    p.waitingSince = null;
    if (caught) {
      // put right: free before the gold, a wasted leaf after it; either way a day
      wasteGoldIfFlawed(state, p);
      p.flawed = false;
      p.ready = day + 1;
    } else {
      p.ready = day;
    }
  }

  // 2. New pieces start.
  for (let i = 0; i < F3.startsPerDay; i++) {
    state.pieces.push({
      id: (day - 1) * F3.startsPerDay + i,
      hop: 0,
      flawed: false,
      gilded: false,
      goldWasted: false,
      waitingSince: null,
      ready: day,
    });
  }

  // 3. Every free piece goes through its next hop.
  for (const p of state.pieces) {
    if (p.waitingSince !== null || p.ready > day) continue;
    if (p.hop === F3.hops - 1) {
      // delivery
      wasteGoldIfFlawed(state, p);
      if (p.flawed) state.ruined++;
      else state.sound++;
      p.hop++;
      continue;
    }
    if (rng(subseed(state.seed, state.month, p.id, p.hop, 0))() < F3.pFlaw) p.flawed = true;
    if (p.hop === F3.gildingHop) p.gilded = true;
    wasteGoldIfFlawed(state, p);
    p.hop++;
    p.ready = day + 1;
    if (state.seals[p.hop - 1]) p.waitingSince = day;
  }
  state.pieces = state.pieces.filter((p) => p.hop < F3.hops);

  const queues = Array.from(
    { length: F3.hops - 1 },
    (_, i) => state.pieces.filter((p) => p.waitingSince !== null && p.hop === i + 1).length,
  );
  state.series.push({
    day,
    queues,
    sound: state.sound,
    ruined: state.ruined,
    gold: state.gold,
    waiting: queues.reduce((a, b) => a + b, 0),
    stamped: state.stamped,
    tired,
  });
  return state;
}

export function summarize(state: F3State): F3Summary {
  return {
    seals: state.seals.filter(Boolean).length,
    sound: state.sound,
    ruined: state.ruined,
    gold: state.gold,
    waiting: state.series.at(-1)?.waiting ?? 0,
    stamped: state.stamped,
    series: state.series.map((d) => ({ ...d, queues: [...d.queues] })),
  };
}

export function runMonth(seals: Seals, month = 0, seed: number = F3.seed): F3Summary {
  const state = init(seals, month, seed);
  while (!done(state)) step(state);
  return summarize(state);
}
