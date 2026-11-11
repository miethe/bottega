import { describe, expect, it } from 'vitest';
import { F7, F7_CEILING, gap, init, inside, mark, over, runAll, step, worth } from './folio7';

describe('Folio VII: Mark I', () => {
  it('each stroke closes half the remaining gap, and the gap never reaches zero', () => {
    const s = init();
    let last = gap(s);
    expect(last).toBeCloseTo(F7.gap0);
    while (!over(s)) {
      step(s, 'stroke');
      expect(gap(s)).toBeCloseTo(last / 2, 12);
      expect(gap(s)).toBeGreaterThan(0);
      expect(inside(s)).toBeLessThan(1);
      last = gap(s);
    }
  });

  it('polishing alone never passes the ceiling, on any day', () => {
    const s = init();
    while (!over(s)) {
      step(s, 'stroke');
      expect(worth(s)).toBeLessThan(F7_CEILING);
    }
  });

  it('never opening the doors ends with zero viewers and no Mark', () => {
    for (let run = 0; run < 20; run++) {
      const r = runAll(null, run);
      expect(r.viewers).toBe(0);
      expect(r.released).toBe(false);
      expect(r.mark).toBe(0);
      expect(r.passedBy).toBeGreaterThan(F7.days * F7.crowdMin - 1);
      expect(r.worth).toBeLessThan(F7_CEILING);
    }
  });

  it('opening the doors on any day but the last ends further along than endless polishing', () => {
    const alone = runAll(null).worth;
    for (let d = 1; d < F7.days; d++) {
      const r = runAll(d);
      expect(r.worth, `opened on day ${d}`).toBeGreaterThan(alone);
      expect(r.worth, `opened on day ${d}`).toBeGreaterThan(F7_CEILING);
      expect(r.viewers).toBeGreaterThan(0);
    }
  });

  it('opening on the very last day still gets it seen, though there is no time left to mend', () => {
    const r = runAll(F7.days);
    expect(r.viewers).toBeGreaterThan(0);
    expect(r.mark).toBe(1);
    expect(r.worth).toBeLessThan(F7_CEILING);
  });

  it('at the moment the doors open the piece is worth less than its maker thought', () => {
    const s = init();
    for (let i = 0; i < 5; i++) step(s, 'stroke');
    const thought = inside(s);
    step(s, 'open');
    expect(worth(s)).toBeLessThan(thought);
    expect(thought - worth(s)).toBeCloseTo(F7.hidden);
    expect(mark(s)).toBe(1);
  });

  it('strangers show one fault a day and each takes a day to mend; then it is Mark II', () => {
    const s = init();
    step(s, 'open');
    expect(s.hiddenShown).toBe(1);
    expect(s.hiddenFixed).toBe(0);
    const before = worth(s);
    step(s, 'stroke');
    expect(s.hiddenFixed).toBe(1);
    expect(mark(s)).toBe(2);
    expect(worth(s)).toBeCloseTo(before + F7.hidden / F7.hiddenParts);
    step(s, 'stroke');
    step(s, 'stroke');
    expect(s.hiddenFixed).toBe(F7.hiddenParts);
    const strokes = s.strokes;
    step(s, 'stroke');
    expect(s.strokes).toBe(strokes + 1);
  });

  it('opening sooner is never worse by the last day', () => {
    let last = Infinity;
    for (let d = 1; d <= F7.days; d++) {
      const w = runAll(d).worth;
      expect(w).toBeLessThanOrEqual(last + 1e-9);
      last = w;
    }
  });

  it('viewers are the piazza from the opening day on, and only then', () => {
    const s = init(3);
    const total = s.crowd.reduce((a, b) => a + b, 0);
    const r = runAll(11, 3);
    const before = s.crowd.slice(0, 10).reduce((a, b) => a + b, 0);
    expect(r.passedBy).toBe(before);
    expect(r.viewers).toBe(total - before);
  });

  it('is deterministic', () => {
    expect(runAll(7, 2)).toEqual(runAll(7, 2));
    expect(init(4).crowd).toEqual(init(4).crowd);
  });
});
