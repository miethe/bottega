import { describe, expect, it } from 'vitest';
import { F5, done, drawNight, init, runNight, step, summarize } from './folio5';

const nights = 160;

/** Invariant sampling need not retain the playback history. */
function night(bells: number, cords: number, run: number) {
  let state = init(bells, cords, run);
  while (!done(state)) {
    state = step(state);
    state.series = [];
  }
  return summarize(state);
}

describe('Folio V: Bells', () => {
  it('the shipped uncorded first night is exactly 678 rings and 3 mends', () => {
    expect(night(8, 0, 0)).toMatchObject({ rung: 678, mended: 3, base: 3, lost: 7 });
    expect(night(8, 8, 0)).toMatchObject({ rung: 59, mended: 10 });
    const next = night(8, 8, 1);
    expect(next.mended).toBeGreaterThanOrEqual(8);
    expect(next.rung).toBeLessThan(678);
  });

  it('bells add rings and never mend anything without cords', () => {
    for (let run = 0; run < nights; run++) {
      let previous = 0;
      for (let bells = 0; bells <= F5.maxBells; bells++) {
        const result = night(bells, 0, run);
        expect(result.rung).toBeGreaterThanOrEqual(previous);
        expect(result.mended).toBe(result.base);
        expect(result.byCord).toBe(0);
        if (bells === 0) expect(result.rung).toBe(0);
        previous = result.rung;
      }
      const eight = night(8, 0, run);
      expect(eight.rung).toBeGreaterThan(0);
      expect(night(16, 0, run).rung).toBe(2 * eight.rung);
    }
  });

  it('answers never exceed a sleeper’s capacity or the total capacity', () => {
    for (let run = 0; run < nights; run++) {
      for (let cords = 0; cords <= F5.spots; cords++) {
        let state = init(16, cords, run);
        while (!done(state)) {
          state = step(state);
          state.series = [];
          for (const sleeper of state.sleepers) {
            expect(sleeper.answersLeft).toBeGreaterThanOrEqual(0);
            expect(sleeper.answersLeft).toBeLessThanOrEqual(F5.answersPerSleeper);
          }
        }
        const result = summarize(state);
        const used = state.sleepers.reduce((sum, sleeper) => sum + F5.answersPerSleeper - sleeper.answersLeft, 0);
        expect(result.byCord).toBeLessThanOrEqual(used);
        expect(used).toBeLessThanOrEqual(F5.sleepers * F5.answersPerSleeper);
        expect(result.mended).toBeLessThanOrEqual(result.base + F5.sleepers * F5.answersPerSleeper);
        expect(result.mended + result.lost).toBe(state.troubles.length);
      }
    }
  });

  it('more cords raise mean mends; eight cords add at least six and reduce ringing', () => {
    // A newly tied cord can spend an answer on something chance would later mend.
    // Shared finite answers therefore make this an expectation across nights.
    const totals = Array<number>(F5.spots + 1).fill(0);
    let base = 0;
    let quiet = 0;
    let loud = 0;
    const statisticalNights = 1000;
    for (let run = 0; run < statisticalNights; run++) {
      for (let cords = 0; cords <= F5.spots; cords++) {
        const result = night(8, cords, run);
        totals[cords]! += result.mended;
        if (cords === 0) {
          base += result.base;
          loud += result.rung;
        }
        if (cords === F5.spots) quiet += result.rung;
      }
      expect(night(8, 8, run).rung).toBeLessThan(night(8, 0, run).rung);
    }
    for (let cords = 1; cords <= F5.spots; cords++) {
      expect(totals[cords]!).toBeGreaterThanOrEqual(totals[cords - 1]!);
    }
    expect((totals[F5.spots]! - base) / statisticalNights).toBeGreaterThanOrEqual(6);
    expect(quiet).toBeLessThan(loud);
    const shipped = night(8, 8, 0);
    expect(shipped.mended).toBeGreaterThanOrEqual(shipped.base + 6);
    let previous = 0;
    for (let cords = 0; cords <= F5.spots; cords++) {
      const result = night(8, cords, 0);
      expect(result.mended).toBeGreaterThanOrEqual(previous);
      previous = result.mended;
    }
  });

  it('fixes chance and trouble times independently of the levers', () => {
    for (let run = 0; run < nights; run++) {
      const troubles = drawNight(run);
      expect(init(0, 0, run).troubles).toEqual(init(16, 8, run).troubles);
      for (let spot = 0; spot < F5.spots; spot++) {
        const events = troubles.filter((trouble) => trouble.spot === spot);
        for (let i = 1; i < events.length; i++) {
          expect(events[i]!.start).toBeGreaterThanOrEqual(events[i - 1]!.chanceAt ?? F5.ticks);
        }
      }
    }
  });

  it('is deterministic, retains a tick series, and does not mutate past state', () => {
    expect(runNight(12, 7, 4)).toEqual(runNight(12, 7, 4));
    const initial = init();
    const before = structuredClone(initial);
    const next = step(initial);
    expect(initial).toEqual(before);
    expect(next.tick).toBe(1);
    const result = runNight();
    expect(result.series).toHaveLength(F5.ticks + 1);
    expect(result.series.at(-1)).toMatchObject({ tick: F5.ticks, rung: 678, mended: 3 });
    expect(result.series[0]).toEqual(before.series[0]);
    let state = init(8, 8);
    while (!done(state)) state = step(state);
    expect(step(state)).toBe(state);
  });
});
