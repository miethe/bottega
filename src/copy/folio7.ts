import type { FolioCopy } from '../shell/types';

export const copy7: FolioCopy = {
  numeral: 'VII',
  title: 'Mark I',
  setup: [
    'The piece is on the easel. Behind it, in faint line, is the piece you imagined. Each stroke closes half the distance between them.',
    'You have thirty days. The doors are shut, and there are people in the piazza. To open the doors you must write two lines: its name, with a number after it, and what is still wrong with it.',
  ],
  sealed: 'Sealed until the doors open, or the days run out.',
  law: 'Finished and unseen is unfinished. Name it Mark I, write down what still ices, and open the doors.',
  lawNote:
    'Ices: the fault you know about and ship with. The word comes from a flying machine that flew, and froze when it climbed.',
  model: [
    'Each stroke halves what separates the piece from the one you imagined. By your own eye it passes ninety-nine in a hundred within a week and never reaches a hundred.',
    'Three faults cannot be seen from where you stand. Together they hold the piece at seventy however long you polish. Opening the doors costs a day. After that the piazza comes in, and each day a stranger shows you one of the three. Each takes a day to mend. Mark II is the piece once the first is mended.',
  ],
  lies: [
    'Strangers are rarely this useful this fast. Many walk past an open door as well; some are wrong; a few are unkind, and the toy leaves those out. It also pretends that how good a thing is can be read off a scale.',
    'What it keeps is the shape. Your own eye runs out of things to see long before the piece runs out of faults, and the rest are visible only from the piazza.',
  ],
};

export const ui7 = {
  stroke: 'One more stroke',
  open: 'Open the doors',
  polishOut: 'polish until the days run out',
  work: 'Work on it where they can see',
  toLast: 'to the last day',
  again: 'Begin again',
  notYet: 'not yet',
  formTitle: 'Two lines before the doors open',
  nameLabel: 'Its name',
  namePlaceholder: 'what is it called',
  nameDefault: 'Untitled',
  markOne: ', Mark I',
  icesLabel: 'What still ices',
  icesOwn: 'or in your own words',
  icesNeed: 'Write at least one thing that is not right yet.',
  doors: 'Open the doors',
  /** What is honestly still wrong, by how long you have polished. The longer you polish, the smaller the list gets. */
  ices: [
    ['the left hand', 'the sky is flat', 'the gold is thin'],
    ['the left hand, still', 'a fold in the sleeve', 'the varnish is uneven'],
    ['one eyelash', 'a speck in the gold', 'the third fold of the sleeve'],
  ],
  saidTitle: 'What they said',
  strangers: ['A dyer', 'A boy with a basket', 'The baker’s wife'],
  finds: [
    'asked why the shadows fall two ways',
    'said the far arch leans',
    'asked where the arm is in the left sleeve',
  ],
  mends: ['the shadows', 'the arch', 'the sleeve'],
  passed: 'walked past',
  cameIn: 'came in',
  asYouSee: 'your eye',
  asItIs: 'their eyes',
  alone: 'the most it could reach behind shut doors',
  shelf: 'on the shelf',
  romans: ['', 'I', 'II'],
};

const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;

/** A percentage that never rounds up to a hundred. */
export function pct(v: number): string {
  const p = v * 100;
  if (p <= 99) return `${Math.round(p)}%`;
  const short = 100 - p;
  const places = Math.min(12, Math.max(1, Math.ceil(-Math.log10(short))));
  const cut = Math.floor(p * 10 ** places) / 10 ** places;
  return `${cut.toFixed(places)}%`;
}

export function shut7(r: { day: number; days: number; inside: number; strokes: number; passedBy: number }): string {
  const day = `Day ${Math.min(r.day, r.days)} of ${r.days}.`;
  if (r.strokes === 0) return `${day} By your own eye it is ${pct(r.inside)} of what you imagined. The doors are shut.`;
  const tail = r.inside > 0.99 ? ' Still not it.' : '';
  return `${day} By your own eye it is ${pct(r.inside)} of what you imagined.${tail} Nobody has seen it. ${people(r.passedBy)} have walked past the door.`;
}

export function opened7(r: { day: number; name: string; came: number; inside: number; worth: number }): string {
  return `Day ${r.day}. ${r.name}, Mark I. ${people(r.came)} came in. You thought it was ${pct(r.inside)}. <b class="err">From where they stand it is ${pct(r.worth)}.</b>`;
}

export function open7(r: {
  day: number;
  days: number;
  name: string;
  mark: number;
  worth: number;
  viewers: number;
}): string {
  return `Day ${Math.min(r.day, r.days)} of ${r.days}. ${r.name}, Mark ${ui7.romans[r.mark] ?? 'II'}, stands at ${pct(r.worth)}. ${people(r.viewers)} have seen it.`;
}

export function endOpen7(r: { name: string; mark: number; worth: number; viewers: number; ceiling: number }): string {
  const beat =
    r.worth > r.ceiling
      ? ` Behind shut doors the most it could have reached is ${pct(r.ceiling)}, and nobody would know.`
      : ' There was no time left to mend what they showed you. They saw it, which is more than the shelf would have done.';
  return `The thirty days are up. ${r.name}, Mark ${ui7.romans[r.mark] ?? 'II'}, stands at ${pct(r.worth)}, and ${people(r.viewers)} have seen it.${beat}`;
}

export function endShut7(r: { inside: number; passedBy: number }): string {
  return `<b class="err">The days ran out.</b> It went on a shelf at ${pct(r.inside)} of what you imagined, with three faults in it that you never saw. ${people(r.passedBy)} walked past the door. It was found long afterwards and much admired.`;
}

export const said7 = {
  agreed: (k: number, item: string) => `${k} of them said what you had already written: “${item}.”`,
  own: (item: string) => `Nobody mentioned “${item}.” It may be that only you can see it.`,
  found: (who: string, what: string, days: number, first: boolean) =>
    first
      ? `${who} ${what}. You have stood in front of it for ${days} ${days === 1 ? 'day' : 'days'}.`
      : `${who} ${what}.`,
  mended: (what: string, first: boolean) =>
    first ? `You mended ${what}. That makes it Mark II.` : `You mended ${what}.`,
};
