/**
 * Progress lives in localStorage and nowhere else. If storage is unavailable
 * (private windows, blocked site data) the notebook still works; it just forgets.
 */
const KEY = 'bottega.mk1';

export type LawRoute = 'played' | 'asked';

interface Saved {
  laws: Record<string, LawRoute>;
}

function read(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { laws: {} };
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return { laws: parsed.laws && typeof parsed.laws === 'object' ? parsed.laws : {} };
  } catch {
    return { laws: {} };
  }
}

function write(v: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* forgetting is acceptable */
  }
}

export function lawState(id: string): LawRoute | undefined {
  return read().laws[id];
}

export function saveLaw(id: string, route: LawRoute): void {
  const v = read();
  if (v.laws[id] === 'played') return;
  v.laws[id] = route;
  write(v);
}

export function forgetAll(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to forget */
  }
}
