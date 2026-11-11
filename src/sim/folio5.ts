/** A fixed night of trouble, heard by bells and answered by finite sleepers. */
import { rng, subseed } from './prng';

export const F5 = {
  ticks: 120,
  spots: 8,
  maxBells: 16,
  sleepers: 3,
  answersPerSleeper: 3,
  mendTicks: 4,
  troubleOpportunities: 20,
  startWindow: 80,
  chanceProbability: 0.25,
  chanceDelayMin: 8,
  chanceDelayRange: 20,
  seed: 34974,
  defaultBells: 8,
  defaultCords: 0,
  tickMs: 100,
} as const;

export interface F5Active {
  id: number;
  spot: number;
  start: number;
  chanceAt: number | null;
}

export interface F5Sleeper {
  spot: number | null;
  troubleId: number | null;
  answersLeft: number;
  until: number;
}

export interface F5Frame {
  tick: number;
  rung: number;
  mended: number;
  active: (F5Active | null)[];
  sleepers: F5Sleeper[];
  recentlyMended: number[];
}

export interface F5State extends F5Frame {
  bells: number;
  cords: number;
  run: number;
  troubles: F5Active[];
  byCord: number;
  series: F5Frame[];
}

export interface F5Summary {
  bells: number;
  cords: number;
  rung: number;
  mended: number;
  lost: number;
  /** The same potential chance mends under every lever setting. */
  base: number;
  byCord: number;
}

const clamp = (n: number, max: number): number => Math.max(0, Math.min(max, Math.round(n)));

/**
 * Lay out the night before looking at either lever. Candidate starts choose a
 * spot free in the zero-cord night; a candidate with no free spot is discarded.
 * Thus a repair cannot create extra trouble, and a spot never holds two troubles.
 * Each accepted trouble keeps its own independent chance draw and mend time.
 */
export function drawNight(run = 0, seed: number = F5.seed): F5Active[] {
  const nightSeed = seed + run;
  const r = rng(subseed(nightSeed, 0));
  const freeAt: number[] = Array(F5.spots).fill(0);
  const starts = Array.from({ length: F5.troubleOpportunities }, () => Math.floor(r() * F5.startWindow));
  starts.sort((a, b) => a - b);
  const troubles: F5Active[] = [];
  starts.forEach((start, id) => {
    const available = freeAt.flatMap((tick, spot) => tick <= start ? [spot] : []);
    if (!available.length) return;
    const spot = available[Math.floor(r() * available.length)]!;
    const chance = rng(subseed(nightSeed, id, 1));
    const chanceAt = chance() < F5.chanceProbability
      ? start + F5.chanceDelayMin + Math.floor(chance() * F5.chanceDelayRange)
      : null;
    troubles.push({ id, spot, start, chanceAt });
    freeAt[spot] = chanceAt ?? F5.ticks;
  });
  return troubles;
}

function frame(s: F5Frame): F5Frame {
  return {
    tick: s.tick,
    rung: s.rung,
    mended: s.mended,
    active: s.active.map((trouble) => trouble ? { ...trouble } : null),
    sleepers: s.sleepers.map((sleeper) => ({ ...sleeper })),
    recentlyMended: [...s.recentlyMended],
  };
}

export function init(
  bells: number = F5.defaultBells,
  cords: number = F5.defaultCords,
  run = 0,
  seed: number = F5.seed,
): F5State {
  const n = clamp(bells, F5.maxBells);
  const state: F5State = {
    bells: n,
    cords: clamp(cords, Math.min(n, F5.spots)),
    run,
    tick: 0,
    rung: 0,
    mended: 0,
    byCord: 0,
    active: Array(F5.spots).fill(null),
    sleepers: Array.from({ length: F5.sleepers }, () => ({
      spot: null, troubleId: null, answersLeft: F5.answersPerSleeper, until: 0,
    })),
    recentlyMended: [],
    troubles: drawNight(run, seed),
    series: [],
  };
  state.series.push(frame(state));
  return state;
}

export function done(s: F5State): boolean {
  return s.tick >= F5.ticks;
}

/** Advance one tick without mutating the input or any earlier playback frame. */
export function step(s: F5State): F5State {
  if (done(s)) return s;
  const next: F5State = {
    ...s,
    active: [...s.active],
    sleepers: s.sleepers.map((sleeper) => ({ ...sleeper })),
    recentlyMended: [],
    series: [...s.series],
  };
  const mend = (spot: number): void => {
    next.active[spot] = null;
    next.mended++;
    next.recentlyMended.push(spot);
  };
  for (const sleeper of next.sleepers) {
    if (sleeper.spot !== null && sleeper.until === s.tick) {
      if (next.active[sleeper.spot]?.id === sleeper.troubleId) {
        mend(sleeper.spot);
        next.byCord++;
      }
      sleeper.spot = null;
      sleeper.troubleId = null;
    }
  }
  for (const trouble of next.active) {
    if (trouble && trouble.chanceAt === s.tick) mend(trouble.spot);
  }
  for (const trouble of next.troubles) {
    if (trouble.start === s.tick) next.active[trouble.spot] = trouble;
  }
  for (let spot = 0; spot < F5.spots; spot++) {
    const trouble = next.active[spot];
    if (!trouble) continue;
    next.rung += Number(spot < next.bells) + Number(spot + F5.spots < next.bells);
    const sleeper = next.sleepers[spot % F5.sleepers]!;
    if (spot < next.cords && sleeper.spot === null && sleeper.answersLeft > 0) {
      sleeper.spot = spot;
      sleeper.troubleId = trouble.id;
      sleeper.until = s.tick + F5.mendTicks;
      sleeper.answersLeft--;
    }
  }
  next.tick++;
  next.series.push(frame(next));
  return next;
}

export function summarize(s: F5State): F5Summary {
  return {
    bells: s.bells,
    cords: s.cords,
    rung: s.rung,
    mended: s.mended,
    lost: s.active.filter(Boolean).length,
    base: s.troubles.filter((trouble) => trouble.chanceAt !== null).length,
    byCord: s.byCord,
  };
}

export function runNight(
  bells: number = F5.defaultBells,
  cords: number = F5.defaultCords,
  run = 0,
  seed: number = F5.seed,
): F5Summary & { series: F5Frame[] } {
  let s = init(bells, cords, run, seed);
  while (!done(s)) s = step(s);
  return { ...summarize(s), series: s.series };
}
