import type { FolioCopy } from '../shell/types';

export const copy5: FolioCopy = {
  numeral: 'V',
  title: 'Bells',
  setup: [
    'At night small disasters start in the shop: a candle near the drapes, the cat at the pigments, varnish skinning over in its pot. A bell is cheap. Hang one over a trouble spot and it rings for as long as there is trouble.',
    'A cord is dearer. It runs from a bell to someone asleep who has agreed to get up, and there are three such people.',
  ],
  sealed: 'Sealed until a loud night.',
  law: 'A bell nobody hears is decoration. Before you hang it, name who gets up.',
  model: [
    'The night is 120 ticks and the shop has eight trouble spots. About a dozen troubles start, and each lasts until someone mends it or the sun comes up. A bell over a spot rings once for every tick the trouble lasts; a second bell over the same spot rings just as often and mends just as little.',
    'A cord ties one bell to one sleeper. Three sleepers will each get up three times a night, and a mend takes four ticks. A bell with no cord wakes nobody. Now and then somebody happens to be up anyway. That is the whole of the base rate.',
  ],
  lies: [
    'Real alarms are not all noise: sometimes hanging the bell is the first honest look at how much is going wrong. And some trouble does burn out by itself.',
    'The toy counts two things because shops tend to count one. Rung is easy to raise and pleasant to report. Mended is the one the drapes care about.',
  ],
};

export const ui5 = {
  bells: 'Bells hung',
  cords: 'Cords tied',
  run: 'Put out the lamps',
  skip: 'To sunrise',
  again: 'Another night',
  rung: 'rung',
  mended: 'mended',
  lost: 'past saving',
  spots: [
    'candle by the drapes',
    'cat at the pigments',
    'varnish pot',
    'the kiln door',
    'lamp oil',
    'the window latch',
    'glue on the fire',
    'mice in the gesso',
  ],
  sleepers: ['the journeyman', 'the older apprentice', 'the cook'],
  idle: 'The lamps are lit. Hang your bells, tie your cords, and put the lamps out.',
  running: (tick: number, of: number) => `Night. ${Math.max(0, of - tick)} ticks to sunrise.`,
};

export function result5(r: { bells: number; cords: number; rung: number; mended: number; lost: number }): string {
  const b = `${r.bells} ${r.bells === 1 ? 'bell' : 'bells'}, ${r.cords} ${r.cords === 1 ? 'cord' : 'cords'}`;
  const lost =
    r.lost > 0
      ? ` By sunrise <b class="err">${r.lost} ${r.lost === 1 ? 'thing was' : 'things were'} past saving</b>.`
      : ' By sunrise nothing was lost.';
  return `${b}. Rung ${r.rung}. Mended ${r.mended}.${lost}`;
}
