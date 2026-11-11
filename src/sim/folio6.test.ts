import { describe, expect, it } from 'vitest';
import { F6, init, runNight, step, summarize, type F6State } from './folio6';

const sweep = (s: F6State) =>
  s.tick === 0 ? ('mend' as const) : s.busy ? ('idle' as const) : { look: s.tick - F6.mendTicks };
describe('Folio VI', () => {
  it('mending holds the existing stains, and sweeping clears them', () => {
    for (let run = 0; run < 100; run++) {
      const s = init(run);
      step(s, 'mend');
      while (s.busy) step(s, 'idle');
      const atMend = summarize(s).stained;
      expect(atMend).toBe(8);
      while (s.tick < F6.ticks) step(s, 'idle');
      expect(summarize(s).stained).toBe(atMend);
      expect(runNight(sweep, run).stained).toBe(0);
      const leaking = runNight((s) => (s.tick < F6.panels ? { look: s.tick } : 'idle'), run);
      expect(leaking.stained).toBeGreaterThan(8);
      expect(runNight(() => 'idle', run).stained).toBe(24);
    }
  });
  it('one look per panel is needed regardless of shelf size', () => {
    for (const n of [12, 24, 36]) {
      const s = init(0, n);
      step(s, 'mend');
      while (s.busy) step(s, 'idle');
      for (let i = 0; i < n; i++) step(s, { look: i });
      expect(s.tick).toBe(n + F6.mendTicks);
      expect(summarize(s).stained).toBe(0);
      expect(summarize(s).looked).toBe(n);
    }
  });
  it('only looking removes stains and seeded runs repeat', () => {
    for (let run = 0; run < 100; run++) {
      const s = init(run);
      while (s.tick < F6.ticks) {
        const action = s.tick === 10 ? 'mend' : s.tick % 3 === 0 ? { look: s.tick % 24 } : 'idle';
        const before = s.panels.map((p) => p.stained);
        const busy = s.busy;
        step(s, action);
        s.panels.forEach((p, i) => {
          if (before[i] && !p.stained) expect(!busy && typeof action === 'object' && action.look === i).toBe(true);
        });
      }
      expect(runNight(sweep, run)).toEqual(runNight(sweep, run));
    }
  });
  it('what you clean is exactly what the jar had stained by the time it was mended', () => {
    for (let run = 0; run < 100; run++) {
      const s = init(run);
      step(s, 'mend');
      while (s.busy) step(s, 'idle');
      const stainedAtMend = summarize(s).stained;
      expect(stainedAtMend).toBe(F6.initialStains + F6.mendTicks);
      for (let i = 0; i < F6.panels; i++) step(s, { look: i });
      const r = summarize(s);
      expect(r.cleaned).toBe(stainedAtMend);
      expect(r.panels.filter((p) => p.found).length).toBe(stainedAtMend);
      expect(r.stained).toBe(0);
    }
  });
});
