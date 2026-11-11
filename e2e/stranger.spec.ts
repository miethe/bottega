import { test, type Locator, type Page } from '@playwright/test';

/**
 * Pictures for a blind read. Each page is played with its law and margin notes
 * hidden, so a reader who has only the pictures can say what the page taught,
 * and the answer can be compared with the law. Run with BOTTEGA_BLIND=1.
 */
const out = process.env.BOTTEGA_BLIND_SHOTS ?? 'shots/blind';

test.skip(!process.env.BOTTEGA_BLIND, 'only for the blind read');
test.skip(({ viewport }) => (viewport?.width ?? 0) > 500, 'phone size only');

async function open(page: Page, id: string): Promise<Locator> {
  await page.goto(`./#folio-${id}`);
  await page.addStyleTag({ content: '[data-testid="law"], .margin, .folio-foot { display: none !important; }' });
  return page.locator(`#folio-${id}`);
}

const shot = (folio: Locator, name: string) => folio.screenshot({ path: `${out}/${name}.png` });

test('I', async ({ page }) => {
  const folio = await open(page, 'i');
  const go = folio.getByTestId('f1-go');
  await go.click();
  await go.click();
  await shot(folio, '1a-one-apprentice');
  await folio.getByTestId('f1-hands').focus();
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
  await go.click();
  await folio.getByTestId('f1-easel-3').click();
  await go.click();
  await shot(folio, '1b-eight-apprentices');
});

test('II', async ({ page }) => {
  const folio = await open(page, 'ii');
  const go = folio.getByTestId('f2-go');
  await go.click();
  await folio.getByTestId('f2-hand').click();
  await go.click();
  await shot(folio, '2a-step-by-step');
  await folio.getByTestId('f2-mode-b').click();
  await go.click();
  await go.click();
  await shot(folio, '2b-whole-commission-nothing-written');
  for (const id of ['figures', 'gold', 'frame', 'dry', 'care']) await folio.getByTestId(`f2-clause-${id}`).check();
  await go.click();
  await go.click();
  await shot(folio, '2c-whole-commission-with-clauses');
});

test('III', async ({ page }) => {
  const folio = await open(page, 'iii');
  const go = folio.getByTestId('f3-go');
  await go.click();
  await go.click();
  await shot(folio, '3a-seal-on-every-hop');
  await folio.getByTestId('f3-seal-1').uncheck();
  await folio.getByTestId('f3-seal-3').uncheck();
  await go.click();
  await go.click();
  await shot(folio, '3b-two-seals');
});

test('IV', async ({ page }) => {
  const folio = await open(page, 'iv');
  const go = folio.getByTestId('f4-go');
  for (const who of ['nobody', 'bench3', 'outsider']) {
    await folio.getByTestId(`f4-who-${who}`).check();
    await go.click();
    await go.click();
    await shot(folio, `4-${who}`);
  }
});

test('V', async ({ page }) => {
  const folio = await open(page, 'v');
  const go = folio.getByTestId('f5-go');
  await go.click();
  await go.click();
  await shot(folio, '5a-eight-bells-no-cords');
  await folio.getByTestId('f5-cords').focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
  await go.click();
  await go.click();
  await shot(folio, '5b-eight-bells-eight-cords');
});

test('VI', async ({ page }) => {
  test.setTimeout(90_000);
  const folio = await open(page, 'vi');
  const go = folio.getByTestId('f6-go');
  await folio.getByTestId('f6-mend').click();
  await go.click();
  await shot(folio, '6a-mended-and-waited');
  await go.click();
  await folio.getByTestId('f6-mend').click();
  await folio.getByTestId('f6-mend').filter({ hasText: 'The jar is mended' }).waitFor({ timeout: 5000 });
  for (let i = 1; i <= 24; i++) {
    await folio.getByTestId('f6-look').click();
    await folio
      .getByTestId('result')
      .filter({ hasText: `looked at ${i} of 24` })
      .waitFor({ timeout: 3000 });
  }
  await folio.getByTestId('result').filter({ hasText: 'The cart left clean.' }).waitFor({ timeout: 25_000 });
  await shot(folio, '6b-mended-then-looked-at-every-panel');
});

test('VII', async ({ page }) => {
  const folio = await open(page, 'vii');
  for (let i = 0; i < 8; i++) await folio.getByTestId('f7-stroke').click();
  await shot(folio, '7a-eight-strokes-doors-shut');
  await folio.getByTestId('f7-open').click();
  await folio.getByTestId('f7-name').fill('Saint with a Goldfinch');
  await folio.getByTestId('f7-ice-0').check();
  await shot(folio, '7b-the-two-lines');
  await folio.getByTestId('f7-doors').click();
  await shot(folio, '7c-doors-open');
  await folio.getByTestId('f7-skip').click();
  await shot(folio, '7d-last-day-doors-open');
  await folio.getByTestId('f7-again').click();
  await folio.getByTestId('f7-skip').click();
  await shot(folio, '7e-last-day-doors-never-opened');
});
