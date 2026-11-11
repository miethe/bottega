import type { FolioCopy } from '../shell/types';

export const copy2: FolioCopy = {
  numeral: 'II',
  title: 'The whole commission',
  setup: [
    'An altarpiece is six steps. You can hand your apprentice one step at a time: he does it, then waits for you. It feels careful. You have eight handoffs in you today.',
    'Or you can write the whole commission once and walk away. At the end a wooden jig checks every clause you wrote, and nothing you did not.',
  ],
  sealed: 'Sealed until you have tried it both ways.',
  law: 'Hand over the whole thing, with the test attached.',
  lawNote: 'A sentence nobody can fail is not a test. It is a mood.',
  model: [
    'A day is sixty ticks. Each step is two ticks of work, so an altarpiece is twelve. Step by step, every step needs a handoff, you have eight, and he waits for each one: an altarpiece and a third, however quick you are. With the whole commission he never waits. Handing it over costs one of your eight, and each clause one more.',
    'For each thing that can go wrong (the count of figures, the gold, the size, the drying) an altarpiece gets it wrong four times in ten. If the clause is written, the jig catches it and he puts it right, which costs him two ticks. If it is not written, nobody looks and it ships. The two fine sentences cost one each and fit no jig.',
  ],
  lies: [
    'A real commission does not fit in four clauses, and the hard part of writing one is the clause you did not think of. Some things worth wanting fit no jig at all, and a shop that makes only what it can measure makes dull altarpieces.',
    'The toy says one thing: what you did not make checkable, you did not ask for.',
  ],
};

export type Clause2 = 'figures' | 'gold' | 'frame' | 'dry' | 'worthy' | 'care';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ui2 = {
  modeLabel: 'How you hand out the work',
  modeA: 'One step at a time',
  modeB: 'The whole commission',
  startA: 'Start the day',
  handNext: 'Hand him the next step',
  handOver: 'Hand over the commission',
  skip: 'To the end of the day',
  again: 'Another day',
  clausesLabel: 'Write the commission',
  clause: {
    figures: 'Three figures.',
    gold: 'Gold on the halos.',
    frame: 'It fits the two-braccia frame.',
    dry: 'Dry before it leaves the shop.',
    worthy: 'Make it worthy of the chapel.',
    care: 'Take great care with it.',
  } satisfies Record<Clause2, string>,
  /** How a shipped fault reads on a delivered altarpiece. */
  fault: {
    figures: 'two figures',
    gold: 'no gold',
    frame: 'too wide',
    dry: 'still wet',
  },
  faults: (n: number) => `${n} faults`,
  noJig: 'no jig fits this',
  jigLabel: 'the jig',
  handoffsLeft: (n: number) => `${plural(n, 'handoff', 'handoffs')} left`,
  cost: (n: number) => `costs ${n} of your 8`,
  waiting: 'He is waiting for you.',
  working: 'He is working.',
  outOfHandoffs: 'You have no handoffs left. He waits.',
  idleA: 'Step by step. Start the day, then hand him each step as he finishes the last.',
  idleB: 'Choose the clauses, then hand over the commission.',
  delivered: 'Delivered today',
};

export function resultA2(r: { handoffs: number; finished: number; idleTicks: number; ticks: number }): string {
  return `One step at a time: ${plural(r.handoffs, 'handoff', 'handoffs')}, ${plural(r.finished, 'altarpiece', 'altarpieces')}, nothing wrong with it. He spent ${r.idleTicks} of ${r.ticks} ticks waiting for you.`;
}

export function resultB2(r: {
  checkable: number;
  moods: number;
  tokens: number;
  finished: number;
  wrong: number;
}): string {
  const clauses = r.checkable + r.moods;
  const head = `The whole commission, ${plural(clauses, 'clause', 'clauses')}, ${r.tokens} of your 8: ${plural(r.finished, 'altarpiece', 'altarpieces')}.`;
  const wrong =
    r.wrong > 0
      ? ` <b class="err">${r.wrong} went out wrong</b>, in ways you never wrote down.`
      : r.checkable === 4
        ? ' Every one passed the jig, and all four things that go wrong in this toy were on it.'
        : ' Nothing went out wrong. This time.';
  const mood =
    r.moods > 0
      ? ` The jig had nothing to measure for ${r.moods === 1 ? 'one of your sentences' : 'two of your sentences'}.`
      : '';
  return head + wrong + mood;
}
