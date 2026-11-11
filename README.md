# Bottega

A playable notebook of seven workshop laws, each one learned by breaking it.

**Read and play it: <https://nick.miethe.dev/bottega/>**

A bottega is a working shop: a master, some apprentices, plaster dust, a deadline, and a patron who is late paying. You are the master. The apprentices do the work. Your attention is the one thing in the shop you cannot hire more of. Each page has one small toy and one law under a seal. Most seals break when the work goes wrong in your hands. Any of them opens if you ask.

By Metis. This is Mark I; the colophon on the last page lists what still ices.

## Run it

```sh
nvm use            # Node 22
npm install
npm run dev        # http://localhost:5173/bottega/
```

```sh
npm test                           # the simulation invariants (vitest)
npm run build && npm run e2e       # play-throughs in a real browser (Playwright, chromium)
npm run e2e:live                   # the same play-throughs against the live site
```

The first `npm run e2e` needs a browser: `npx playwright install chromium --only-shell`.

## How it is built

- No framework. TypeScript, SVG and CSS, bundled by Vite into a static site.
- `src/sim/` holds the models: pure functions over a seeded random number generator, so the same play gives the same result and the tests can assert it. One module per page, each with a test file beside it that states the page's claim as invariants.
- `src/folios/` draws each page's toy and wires its lever. `src/copy/` holds every word. `src/shell/` is the notebook itself: the sealed law, the margin notes, the progress kept in `localStorage`.
- No analytics, no cookies, no third-party requests. The fonts are bundled.

## The model behind each page

Every page carries two margin notes: _the model_ (its assumptions and numbers) and _where this toy lies_ (its honest limits). The same models, in code:

| Page                         | Law                                                                                                | Model                                                                                                                                                                                                                                     | Code                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| I. One pair of eyes          | You cannot watch your way to quality.                                                              | One eye covers one easel at a time. An unwatched panel of six strokes is ruined when any stroke goes wrong (11 in 100 each), so the expected ruined share rises with every hand you add.                                                  | [`src/sim/folio1.ts`](src/sim/folio1.ts) |
| II. The whole commission     | Hand over the whole thing, with the test attached.                                                 | Step by step, the apprentice waits for one of your eight handoffs before each of six steps. Handed the whole commission he never waits, and only the clauses you wrote down are tested; each unwritten one ships wrong four times in ten. | [`src/sim/folio2.ts`](src/sim/folio2.ts) |
| III. The gold and the sketch | Spend the gate where the mistake cannot be taken back.                                             | Five hops; each of the first four adds a flaw 15 times in 100. A seal holds work for one inspector who looks at ten pieces a day and tires in proportion to the queue. Gold is wasted once per piece when a flaw is under it.             | [`src/sim/folio3.ts`](src/sim/folio3.ts) |
| IV. He says it is finished   | A report is a claim. A second eye counts only if it could have disagreed.                          | Twenty panels with three kinds of flaw. Checkers from the same bench share one blind spot and their misses are correlated; the outsider has a different one.                                                                              | [`src/sim/folio4.ts`](src/sim/folio4.ts) |
| V. Bells                     | A bell nobody hears is decoration. Before you hang it, name who gets up.                           | About ten troubles a night over eight spots. A bell counts every tick of trouble and mends nothing. A cord wakes one of three sleepers, who will each get up at most three times.                                                         | [`src/sim/folio5.ts`](src/sim/folio5.ts) |
| VI. The leaking jar          | Mending the jar does not clean the shelf. Count what it already touched, and go touch each one.    | A jar stains one more clean panel of twenty-four every tick until it is mended or none is left clean. Mending takes three ticks and cleans nothing; each panel has to be pulled out and looked at.                                        | [`src/sim/folio6.ts`](src/sim/folio6.ts) |
| VII. Mark I                  | Finished and unseen is unfinished. Name it Mark I, write down what still ices, and open the doors. | Each stroke halves the gap the maker can see. Three faults are visible only from outside and keep the piece under seventy in a hundred until the doors open.                                                                              | [`src/sim/folio7.ts`](src/sim/folio7.ts) |

Each model has a test file beside it (`src/sim/folioN.test.ts`) that states the page's claim as invariants, and a play-through in `e2e/` that breaks the law in a real browser at phone size.

## Licence

Code is licensed under the [MIT License](LICENSE); words and drawings are reserved. See [LICENSING.md](LICENSING.md) for the path map and font licences.
