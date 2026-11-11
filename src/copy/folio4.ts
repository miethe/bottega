import type { FolioCopy } from '../shell/types';

export const copy4: FolioCopy = {
  numeral: 'IV',
  title: 'He says it is finished',
  setup: [
    'An apprentice brings you a covered panel with a green ribbon on it. The ribbon means he says it is finished. Twenty of these come to you today, and you are busy.',
    'Choose who looks under the cloth before it goes to the patron. Everyone at your bench learned to draw from the same master, which is you.',
  ],
  sealed: 'Sealed until the patron sends some back.',
  law: 'A report is a claim. A second eye counts only if it could have disagreed.',
  model: [
    'Of every hundred panels, forty have bad hands (hands are hard), twelve bad perspective, twelve bad drapery, and thirty-six are sound. The ribbon is green on all of them. Each checker you try sees the same twenty panels, so the only thing that changes is who looked.',
    'Anyone from your bench catches nine in ten of the perspective and drapery faults and almost none of the hands: about one in eight, and mostly the same ones, because they all learned hands from you. Three of them together catch about one hand in five. The journeyman from the other workshop catches nine hands in ten and misses nine in ten of the perspective faults. That is his bench’s blind spot, and yours covers it.',
  ],
  lies: [
    'Blind spots are not this tidy, and nobody carries exactly one. An outsider costs more than a bench-mate, takes longer, and is sometimes wrong with great confidence.',
    'The toy keeps one thing: checkers who fail in the same place add up to one checker.',
  ],
};

export type Checker4 = 'nobody' | 'bench1' | 'bench3' | 'outsider' | 'pair';

export const ui4 = {
  whoLabel: 'Who looks under the cloth',
  who: {
    nobody: 'Nobody. He says it is finished.',
    bench1: 'One from your bench',
    bench3: 'Three from your bench',
    outsider: 'A journeyman from another workshop',
    pair: 'One from your bench, and the journeyman',
  } satisfies Record<Checker4, string>,
  run: 'Bring the day’s panels',
  skip: 'To the unveiling',
  again: 'Another day',
  ribbon: 'finished',
  flaw: { hands: 'hands', perspective: 'perspective', drapery: 'drapery' },
  unveiled: 'At the patron’s house, unveiled',
  /** Heading of the tally: every checker you try on a day sees the same panels. */
  sameTwenty: 'Same twenty panels: went out flawed',
  short: {
    nobody: 'nobody looked',
    bench1: 'one of yours',
    bench3: 'three of yours',
    outsider: 'the journeyman',
    pair: 'one of yours and the journeyman',
  } satisfies Record<Checker4, string>,
  sentBack: 'sent back and mended',
  idle: 'Twenty panels, twenty green ribbons. Choose who looks, then bring them.',
  running: (n: number, of: number) => `Panel ${n} of ${of}. The ribbon is green.`,
};

const head: Record<Checker4, string> = {
  nobody: 'Nobody looked',
  bench1: 'One from your bench looked',
  bench3: 'Three from your bench looked',
  outsider: 'The journeyman looked',
  pair: 'One of yours and the journeyman looked',
};

export function result4(r: {
  who: Checker4;
  sentBack: number;
  shipped: number;
  hands: number;
  perspective: number;
  drapery: number;
}): string {
  if (r.shipped === 0) return `${head[r.who]}: ${r.sentBack} sent back and mended, none went to the patron flawed.`;
  const parts = [
    r.hands ? `hands ${r.hands}` : '',
    r.perspective ? `perspective ${r.perspective}` : '',
    r.drapery ? `drapery ${r.drapery}` : '',
  ].filter(Boolean);
  const tail =
    r.who === 'nobody'
      ? ' Every ribbon was green.'
      : r.who === 'bench3'
        ? ' Three pairs of eyes, one opinion about hands.'
        : r.who === 'outsider'
          ? ' He has a blind spot too, and it is not yours.'
          : '';
  return `${head[r.who]}: ${r.sentBack} sent back and mended, <b class="err">${r.shipped} went to the patron flawed</b> (${parts.join(', ')}).${tail}`;
}
