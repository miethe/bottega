import { describe, expect, it } from 'vitest';
import { F3, catchChance, runMonth } from './folio3';

const all = [true, true, true, true];
/** The two seals that guard what cannot be taken back: before gilding, before delivery. */
const right = [false, true, false, true];
const none = [false, false, false, false];
const placements = Array.from({ length: 16 }, (_, mask) => Array.from({ length: 4 }, (_, i) => !!(mask & (1 << i))));
const MONTHS = 300;

function average(seals: boolean[], field: 'ruined' | 'gold' | 'delivered' | 'loss'): number {
  let total = 0;
  for (let month = 0; month < MONTHS; month++) {
    const r = runMonth(seals, month);
    total += field === 'delivered' ? r.sound + r.ruined : field === 'loss' ? r.ruined + r.gold : r[field];
  }
  return total / MONTHS;
}

describe('Folio III: the gold and the sketch', () => {
  it('a seal on every hop lets more ruined work through than two seals in the right places', () => {
    const a = runMonth(all);
    const b = runMonth(right);
    expect(a.ruined).toBeGreaterThanOrEqual(8);
    expect(a.ruined).toBeGreaterThanOrEqual(3 * Math.max(1, b.ruined));
    expect(average(all, 'ruined')).toBeGreaterThan(3 * average(right, 'ruined'));
  });

  it('a seal on every hop delivers less than two seals in the right places', () => {
    const a = runMonth(all);
    const b = runMonth(right);
    expect(a.sound + a.ruined).toBeLessThan(b.sound + b.ruined);
    expect(average(all, 'delivered')).toBeLessThan(average(right, 'delivered'));
    expect(a.waiting).toBeGreaterThan(b.waiting);
    expect(a.stamped).toBeGreaterThan(0);
    expect(b.stamped).toBe(0);
  });

  it('no seals wastes the most gold, in the first month and on average', () => {
    const n = runMonth(none);
    const avgNone = average(none, 'gold');
    for (const p of placements.filter((p) => p.some(Boolean))) {
      expect(n.gold).toBeGreaterThanOrEqual(runMonth(p).gold);
      expect(avgNone).toBeGreaterThanOrEqual(average(p, 'gold'));
    }
    expect(n.gold).toBeGreaterThan(runMonth(all).gold);
    expect(n.gold).toBeGreaterThan(runMonth(right).gold);
  });

  it('no seals ships about half of everything ruined', () => {
    const n = runMonth(none);
    expect(n.ruined / (n.ruined + n.sound)).toBeGreaterThan(0.35);
    expect(n.stamped).toBe(0);
  });

  it('of all the ways to place two seals, before the gold and before delivery loses least', () => {
    const best = average(right, 'loss');
    for (const p of placements.filter((p) => p.filter(Boolean).length === 2 && p.some((v, i) => v !== right[i]))) {
      expect(best, `against ${p.map(Number).join('')}`).toBeLessThan(average(p, 'loss'));
    }
  });

  it('gold is wasted at most one leaf per piece', () => {
    for (const p of placements) {
      const r = runMonth(p);
      expect(r.gold).toBeLessThanOrEqual(F3.days * F3.startsPerDay);
    }
  });

  it('the eye is fresh up to the threshold and tires in proportion past it', () => {
    expect(catchChance(0)).toBe(F3.catchFresh);
    expect(catchChance(F3.tiredPast)).toBe(F3.catchFresh);
    expect(catchChance(F3.tiredPast * 2)).toBeCloseTo(F3.catchFresh / 2);
    expect(catchChance(1000)).toBe(F3.catchFloor);
  });

  it('is deterministic', () => {
    expect(runMonth(all, 3)).toEqual(runMonth(all, 3));
  });
});
