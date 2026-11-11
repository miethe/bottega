import { describe, expect, it } from 'vitest';
import { F4, init, runDay, step, summarize, type Kind4 } from './folio4';
import type { Checker4 } from '../copy/folio4';

const options: Checker4[] = ['nobody', 'bench1', 'bench3', 'outsider', 'pair'];
describe('Folio IV', () => {
  it('shows the ordered story on each shipped day and in the play-through', () => {
    for (let day = 0; day < 5; day++) {
      const [n, b, three, out, pair] = options.map((w) => runDay(w, day).shipped) as [
        number,
        number,
        number,
        number,
        number,
      ];
      expect(n).toBeGreaterThan(b);
      expect(b).toBeGreaterThanOrEqual(three);
      expect(b - three).toBeLessThanOrEqual(2);
      expect(three).toBeGreaterThan(out);
      expect(out).toBeGreaterThan(pair);
    }
    expect(runDay('bench3', 1).shipped).toBeGreaterThan(runDay('outsider', 2).shipped);
  });
  it('preserves ribbons, common panel states, and the bench superset', () => {
    for (let day = 0; day < 500; day++) {
      const runs = options.map((w) => runDay(w, day));
      const nobody = runs[0]!,
        one = runs[1]!,
        three = runs[2]!;
      expect(nobody.sentBack).toBe(0);
      expect(nobody.shipped).toBe(nobody.panels.filter((p) => p.state !== 'sound').length);
      for (const run of runs) {
        expect(run.panels).toHaveLength(F4.panels);
        expect(run.panels.every((p) => p.ribbon)).toBe(true);
        expect(run.panels.map((p) => p.state)).toEqual(nobody.panels.map((p) => p.state));
        expect(run.panels.filter((p) => p.state === 'sound').every((p) => !p.caughtBy.length)).toBe(true);
      }
      one.panels.forEach((p, i) => {
        if (p.caughtBy.length) expect(three.panels[i]!.caughtBy).toContain('bench1');
      });
      expect(three.shipped).toBeLessThanOrEqual(one.shipped);
    }
  });
  it('measures blind spots and shipping rates across many days', () => {
    const counts = Object.fromEntries(
      options.map((w) => [w, { shipped: 0, hands: 0, handsCaught: 0, perspective: 0, perspectiveCaught: 0 }]),
    ) as Record<
      Checker4,
      { shipped: number; hands: number; handsCaught: number; perspective: number; perspectiveCaught: number }
    >;
    for (let day = 0; day < 2000; day++)
      for (const who of options) {
        const run = runDay(who, day),
          c = counts[who];
        c.shipped += run.shipped;
        for (const p of run.panels)
          for (const kind of ['hands', 'perspective'] as Kind4[])
            if (p.state === kind) {
              if (kind === 'hands') {
                c.hands++;
                if (p.caughtBy.length) c.handsCaught++;
              } else {
                c.perspective++;
                if (p.caughtBy.length) c.perspectiveCaught++;
              }
            }
      }
    const rate = (who: Checker4, kind: 'hands' | 'perspective') => counts[who][`${kind}Caught`] / counts[who][kind];
    expect(rate('bench3', 'hands')).toBeLessThan(0.3);
    expect(rate('outsider', 'hands')).toBeGreaterThan(0.8);
    expect(rate('bench3', 'hands') - rate('bench1', 'hands')).toBeLessThan(0.12);
    expect(rate('outsider', 'perspective')).toBeLessThan(0.2);
    expect(rate('bench1', 'perspective')).toBeGreaterThan(0.8);
    expect(counts.outsider.shipped).toBeLessThan(counts.bench3.shipped);
    for (const who of options.filter((w) => w !== 'pair'))
      expect(counts.pair.shipped).toBeLessThan(counts[who].shipped);
    for (const [who, expected] of Object.entries({
      nobody: 12.8,
      bench1: 7.4,
      bench3: 6.4,
      outsider: 3.2,
      pair: 1,
    }) as [Checker4, number][])
      expect(counts[who].shipped / 2000).toBeCloseTo(expected, 0);
  });
  it('is deterministic and interactive steps equal a whole run', () => {
    for (const who of options) {
      expect(runDay(who, 3)).toEqual(runDay(who, 3));
      const state = init(who, 3);
      for (let i = 0; i < F4.panels + 1; i++) step(state);
      expect(summarize(state)).toEqual(runDay(who, 3));
    }
  });
});
