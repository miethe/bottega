import type { FolioCopy } from '../shell/types';

export const copy6: FolioCopy = {
  numeral: 'VI',
  title: 'The leaking jar',
  setup: [
    'A jar of red lake on the top shelf has been dripping onto the finished panels stacked below it. They are stacked face in, so a stain shows only when you pull a panel out and look. At dawn the cart takes everything on the shelf to the patron.',
    'You can mend the jar. You can go along the shelf. The night is not long.',
  ],
  sealed: 'Sealed until the cart leaves with a stain on it.',
  law: 'Mending the jar does not clean the shelf. Count what it already touched, and go touch each one.',
  model: [
    'Twenty-four panels and forty ticks until dawn. The jar had stained five before you noticed, and it stains one more every tick until it is mended. Mending takes three ticks. Pulling a panel out to look takes one tick, stained or not, and you clean it while you have it. Until the jar is mended it can drip on a panel you have already looked at.',
  ],
  lies: [
    'A real leak rarely tells you which shelf it was over, and some stains cannot be cleaned, only reported.',
    'The toy also gives you a shelf short enough to walk in one night. The usual shelf is longer than the night, and then the first job is the count, so that the patron hears it from you.',
  ],
};

export const ui6 = {
  mend: 'Mend the jar',
  mending: 'Mending the jar',
  mended: 'The jar is mended',
  look: 'Pull out the next panel',
  toDawn: 'Wait for dawn',
  again: 'Another night',
  panel: (n: number) => `Panel ${n}: pull it out and look`,
  panelSeen: (n: number) => `Panel ${n}: looked at`,
  jarLeaking: 'The jar is dripping.',
  jarMended: 'The jar is mended.',
  idle: 'Evening. The jar is dripping. Dawn is forty ticks off.',
  running: (tick: number, of: number, looked: number, total: number, jarMended: boolean) =>
    `${Math.max(0, of - tick)} ticks to dawn. ${jarMended ? 'The jar is mended.' : 'The jar is dripping.'} You have looked at ${looked} of ${total}.`,
  cart: 'The cart, at the patron’s door',
};

export function result6(r: { mended: boolean; looked: number; total: number; stained: number }): string {
  const looked = r.looked >= r.total ? `every one of the ${r.total} panels` : `${r.looked} of ${r.total} panels`;
  if (r.stained === 0) {
    return r.mended
      ? `The jar is mended and you looked at ${looked}. The cart left clean.`
      : `You looked at ${looked} and the cart left clean. The jar is still dripping, so tomorrow you do this again.`;
  }
  const took = `<b class="err">The cart took ${r.stained} stained ${r.stained === 1 ? 'panel' : 'panels'} to the patron.</b>`;
  return r.mended
    ? `The jar is mended. You looked at ${looked}. ${took}`
    : `The jar is still dripping. You looked at ${looked}. ${took}`;
}
