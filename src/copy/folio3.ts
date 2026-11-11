import type { FolioCopy } from '../shell/types';

export const copy3: FolioCopy = {
  numeral: 'III',
  title: 'The gold and the sketch',
  setup: [
    'Every piece goes through five hops: sketch, underpainting, gilding, varnish, delivery. A sketch can be redone for nothing. Gold, once laid, is spent, and a delivered panel is in the patron’s hands.',
    'Put a wax seal on a hop and work waits there until you have looked at it. You can look at ten pieces a day, and well. When more than ten are waiting, you start stamping.',
  ],
  sealed: 'Sealed until a month goes badly.',
  law: 'Spend the gate where the mistake cannot be taken back.',
  model: [
    'Four pieces start each day for thirty days. Each of the first four hops adds a flaw fifteen times in a hundred; delivery adds none. A seal holds every piece until you have looked at it; you look at ten a day, oldest first. With ten or fewer waiting you catch ninety-five flaws in a hundred. Past ten your eye tires in proportion, down to one in five.',
    'A flaw caught before the gold is put right for a day’s delay. A leaf of gold is wasted, once for each piece, when it is laid over a flaw, when it is stripped and laid again after a later catch, or when it leaves on a ruined piece. A flaw nobody catches is delivered. Each way of sealing you try gets the same month, flaw for flaw, so the only thing that changes is where the seals are. Run the same seals twice and a new month begins.',
  ],
  lies: [
    'Mistakes do not sort themselves into two tidy kinds, and part of the craft is noticing that a step you took for a sketch was gold. A tired inspector is not this predictable.',
    'The toy also gives you one inspector. The usual answer to a long queue is a second inspector, and that is the next page.',
  ],
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ui3 = {
  hops: ['sketch', 'underpainting', 'gilding', 'varnish', 'delivery'],
  sealsLabel: 'Your seals',
  /** Seal positions: the hop each seal guards. */
  seal: ['before underpainting', 'before gilding', 'before varnish', 'before delivery'],
  sealOn: (where: string) => `Seal ${where}: on. Work waits here for you.`,
  sealOff: (where: string) => `Seal ${where}: off. Work passes straight through.`,
  run: 'Run the month',
  skip: 'To the end of the month',
  again: 'Another month',
  day: (d: number, of: number) => `Day ${d} of ${of}`,
  sound: 'delivered sound',
  ruined: 'delivered ruined',
  gold: 'gold wasted',
  waiting: 'waiting at seals',
  tired: 'stamping',
  fresh: 'looking',
  idle: 'A careful shop seals every hop. Run the month and see.',
  /** Live counts under the bench. */
  counts: ['delivered sound', 'delivered ruined', 'gold wasted', 'waiting'],
  more: (n: number) => `+${n}`,
  tallyTitle: 'The same month, sealed differently',
  noSeals: 'no seals',
  everyHop: 'a seal on every hop',
  tallyRow: (r: { sound: number; ruined: number; gold: number }) =>
    `${r.sound} sound, ${r.ruined} ruined, ${plural(r.gold, 'leaf', 'leaves')} wasted`,
};

export function result3(r: {
  seals: number;
  sound: number;
  ruined: number;
  gold: number;
  waiting: number;
  stamped: number;
}): string {
  const head = r.seals === 0 ? 'No seals' : plural(r.seals, 'seal', 'seals');
  const ruined = r.ruined > 0 ? `<b class="err">${r.ruined} delivered ruined</b>` : 'none delivered ruined';
  const wait = r.waiting > 0 ? `, ${r.waiting} still waiting at your seals` : '';
  const stamp = r.stamped > 0 ? ` You stamped ${r.stamped} without really looking.` : '';
  return `${head}: ${r.sound} delivered sound, ${ruined}, ${plural(r.gold, 'leaf', 'leaves')} of gold wasted${wait}.${stamp}`;
}
