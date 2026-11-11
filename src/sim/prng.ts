/**
 * Seeded pseudo-random numbers. Every toy in the notebook draws from here,
 * so the same play gives the same result and the tests can assert it.
 */
export type Rng = () => number;

/** mulberry32: small, fast, good enough for toys. Returns floats in [0, 1). */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derive an independent stream from a base seed and some integer labels. */
export function subseed(seed: number, ...labels: number[]): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (const l of labels) {
    h = Math.imul(h ^ (l + 0x7f4a7c15), 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
  }
  return h >>> 0;
}

/** Integer in [lo, hi] inclusive. */
export function randInt(r: Rng, lo: number, hi: number): number {
  return lo + Math.floor(r() * (hi - lo + 1));
}

/** True with probability p. */
export function chance(r: Rng, p: number): boolean {
  return r() < p;
}
