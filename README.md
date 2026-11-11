# Bottega

A playable notebook of seven workshop laws, each one learned by breaking it.

**Read and play it: <https://nick.miethe.dev/bottega/>**

A bottega is a working shop: a master, some apprentices, plaster dust, a deadline, and a patron who is late paying. You are the master. The apprentices do the work. Your attention is the one thing in the shop you cannot hire more of. Each page has one small toy with one lever. Break it, and the page gives up its law.

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

Every page carries two margin notes: *the model* (its assumptions and numbers) and *where this toy lies* (its honest limits). The same models, in code:

| Page | Law | Model | Code |
| --- | --- | --- | --- |
| I. One pair of eyes | You cannot watch your way to quality. | One eye covers one stroke in N; an unwatched panel is ruined with probability 1 − 0.89⁶. | [`src/sim/folio1.ts`](src/sim/folio1.ts) |

## Rights

© 2026 Nick Miethe. All rights reserved for now; a licence will be chosen.

The typefaces are IM Fell English and EB Garamond, each under the SIL Open Font License; the licence texts are in [`LICENSES/`](LICENSES/).
