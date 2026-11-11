import type { FolioCopy } from '../shell/types';

export const copy3: FolioCopy = {
  numeral: 'III',
  title: 'The gold and the sketch',
  setup: [
    'Every piece goes through five hops: sketch, underpainting, gilding, varnish, delivery. A sketch can be redone for nothing. Gold, once laid, is spent, and a delivered panel is in the patron’s hands.',
    'Put a wax seal on a hop and work waits there until you have looked at it. You can look at ten pieces a day, and well. When more than eight are waiting, you start stamping.',
  ],
  sealed: 'Sealed until a month goes badly.',
  law: 'Spend the gate where the mistake cannot be taken back.',
  model: [
    'Four pieces start each day for thirty days. Each hop adds a flaw fifteen times in a hundred. A seal holds every piece until you have looked at it; you look at ten a day, oldest first. With eight or fewer waiting you catch ninety-five flaws in a hundred. Past eight your eye tires in proportion, down to one in five.',
    'A flaw caught before the gold is put right for a day’s delay. A flaw caught after the gold costs a second leaf. Gold laid over a flaw is wasted. A flaw nobody catches is delivered.',
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
