import { describe, expect, it } from 'vitest';
import { F1, F1_UNWATCHED_RUIN, expectedShare, expectedShareSpread, runDay } from './folio1';

const stare = () => 0;
const dart = (t: number, n: number) => t % n;

function meanShare(hands: number, policy: (t: number, n: number) => number, days = 400): number {
  let ruined = 0;
  let finished = 0;
  for (let d = 0; d < days; d++) {
    const r = runDay(hands, policy, d);
    ruined += r.ruined;
    finished += r.finished;
  }
  return ruined / finished;
}

describe('Folio I: one pair of eyes', () => {
  it('one apprentice, watched, ruins nothing', () => {
    for (let d = 0; d < 50; d++) {
      const r = runDay(1, stare, d);
      expect(r.ruined).toBe(0);
      expect(r.finished).toBe(F1.ticks / F1.strokesPerPanel);
    }
  });

  it('finished panels grow with hands', () => {
    let last = 0;
    for (let n = 1; n <= F1.maxHands; n++) {
      const r = runDay(n, stare, 0);
      expect(r.finished).toBeGreaterThan(last);
      last = r.finished;
    }
  });

  it('ruined share does not fall as hands are added (expected value)', () => {
    let last = -1;
    for (let n = 1; n <= F1.maxHands; n++) {
      const e = expectedShare(n);
      expect(e).toBeGreaterThanOrEqual(last);
      last = e;
    }
  });

  it('simulated share tracks (1 - 1/N) x f for a fixed stare', () => {
    for (const n of [2, 4, 6, 12]) {
      expect(meanShare(n, stare)).toBeCloseTo(expectedShare(n), 1);
    }
  });

  it('simulated mean share is non-decreasing in hands', () => {
    let last = -1;
    for (let n = 1; n <= F1.maxHands; n++) {
      const m = meanShare(n, stare, 600);
      expect(m).toBeGreaterThanOrEqual(last - 0.015);
      last = m;
    }
  });

  it('moving the eye faster does not help; it is slightly worse', () => {
    for (const n of [3, 6, 12]) {
      expect(expectedShareSpread(n)).toBeGreaterThan(expectedShare(n));
      expect(meanShare(n, dart)).toBeGreaterThan(meanShare(n, stare) - 0.01);
    }
  });

  it('the shipped first days show the plateau the page describes', () => {
    const six = runDay(6, stare, 0);
    const twelve = runDay(12, stare, 0);
    expect(six.share).toBeGreaterThan(0.25);
    expect(twelve.share).toBeGreaterThan(0.3);
    expect(twelve.share).toBeLessThan(F1_UNWATCHED_RUIN + 0.12);
  });

  it('is deterministic', () => {
    expect(runDay(7, dart, 3)).toEqual(runDay(7, dart, 3));
  });

  it('the eye never saves more than it could have watched', () => {
    for (const n of [2, 5, 9]) {
      const r = runDay(n, dart, 1);
      expect(r.saved).toBeLessThanOrEqual(r.finished);
      expect(r.eyeMoves).toBeGreaterThan(0);
    }
  });
});
