import type { FolioCopy } from '../shell/types';
import type { F1Summary } from '../sim/folio1';

export const copy1: FolioCopy = {
  numeral: 'I',
  title: 'One pair of eyes',
  setup: [
    'The patron wants forty small panels by vespers. One apprentice paints ten in a day, and paints them well while you stand behind him. Left alone, about one stroke in nine goes wrong, and one wrong stroke ruins the panel.',
    'So take on more hands. You have one pair of eyes. Tap an easel to put them there.',
  ],
  sealed: 'Sealed until a day goes wrong.',
  law: 'You cannot watch your way to quality.',
  lawNote: 'Everything after this page is what you do instead.',
  model: [
    'Each apprentice lays one stroke per tick: six strokes to a panel, sixty ticks to a day. An unwatched stroke goes wrong with probability 0.11, so a panel nobody watched is ruined about half the time (1 − 0.89⁶ ≈ 0.50). A watched stroke never goes wrong.',
    'Your eye is on one easel per tick, so it covers one stroke in N wherever you put it. Stare at one easel all day and the ruined share is (1 − 1/N) × 0.50. Dart about and it is a little worse, because a panel needs all six of its strokes clean and you have only watched some of each.',
  ],
  lies: [
    'Real apprentices learn. A master’s glance carries further than one easel, and being watched changes how people work, not always for the better. Nobody ruins half of what they touch and stays employed.',
    'The toy keeps only the arithmetic: one eye, divided by the number of hands.',
  ],
};

export const ui1 = {
  hands: 'Apprentices',
  open: 'Open the shop',
  skip: 'To the end of the day',
  again: 'Another day',
  watch: (n: number) => `Easel ${n}: put your eye here`,
  watching: (n: number) => `Easel ${n}: your eye is here`,
  idle: 'The shop is shut. Choose your hands and open it.',
  running: (tick: number, total: number) => `Working. ${Math.max(0, total - tick)} strokes of daylight left.`,
  chartTitle: 'Your days so far',
  chartX: 'hands',
  chartY: 'ruined',
  chartCurve: 'the best one eye can do',
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function result1(r: F1Summary): string {
  const made = `${plural(r.hands, 'apprentice', 'apprentices')}, ${plural(r.finished, 'panel', 'panels')}`;
  if (r.ruined === 0) {
    const short = r.finished < 40 ? ' The patron wanted forty.' : '';
    return `${made}, none ruined.${short}`;
  }
  const pct = Math.round(r.share * 100);
  const good = r.finished - r.ruined;
  const eye =
    r.eyeMoves === 0
      ? `Your eye stayed put and saved ${r.saved}.`
      : `You moved your eye ${plural(r.eyeMoves, 'time', 'times')}. It saved ${r.saved}.`;
  const patron = good >= 40 ? '' : ` Only ${good} are fit to deliver.`;
  return `${made}, <b class="err">${r.ruined} ruined</b> (${pct}%). ${eye}${patron}`;
}
