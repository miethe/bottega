import { describe, expect, it } from 'vitest';
import type { Clause2 } from '../copy/folio2';
import { checks, F2, runDay } from './folio2';

const all: Clause2[] = [...checks, 'worthy', 'care'];
describe('Folio II', () => {
  it('whole commissions beat instant handoffs within the attention budget for every subset', () => {
    const a = runDay('a');
    for (let mask = 0; mask < 64; mask++) {
      const clauses = all.filter((_, i) => mask & (1 << i));
      for (let day = 0; day < 100; day++) {
        const b = runDay('b', clauses, day);
        expect(b.tokens).toBeLessThanOrEqual(F2.tokens);
        expect(b.finished).toBeGreaterThan(a.finished);
      }
    }
  });
  it('written checks catch faults and omitted faults occur at the specified rate', () => {
    for (const omitted of checks) {
      const clauses = checks.filter((c) => c !== omitted);
      let faults = 0,
        pieces = 0;
      for (let day = 0; day < 1000; day++) {
        const b = runDay('b', clauses, day);
        for (const piece of b.pieces) {
          expect(piece.faults.every((c) => !clauses.includes(c))).toBe(true);
          faults += Number(piece.faults.includes(omitted));
          pieces++;
        }
      }
      expect(Math.abs(faults / pieces - F2.q)).toBeLessThan(0.05);
    }
  });
  it('moods only cost tokens', () => {
    for (let day = 0; day < 100; day++) {
      const a = runDay('b', ['gold'], day),
        b = runDay('b', ['gold', 'worthy', 'care'], day);
      expect(b.pieces).toEqual(a.pieces);
      expect(b.tokens).toBe(a.tokens + 2);
    }
  });
  it('stepwise work produces one piece and waiting for reaction delays 0 through 3', () => {
    for (let delay = 0; delay <= 3; delay++) {
      const a = runDay('a', [], 0, delay);
      expect(a.finished).toBe(1);
      expect(a.idleTicks).toBeGreaterThan(0);
      expect(a.handoffs).toBe(8);
    }
  });
  it('shows the effect on the first day and is deterministic', () => {
    const blind = runDay('b');
    const checked = runDay('b', [...checks]);
    expect(blind.finished).toBe(5);
    expect(blind.wrong).toBeGreaterThanOrEqual(3);
    expect(runDay('b', [], 1).wrong).toBeGreaterThanOrEqual(3);
    expect(checked.finished).toBeGreaterThanOrEqual(3);
    expect(checked.wrong).toBe(0);
    expect(runDay('b', [...checks], 4)).toEqual(runDay('b', [...checks], 4));
    expect(runDay('a', [], 0, 2)).toEqual(runDay('a', [], 0, 2));
  });
});
