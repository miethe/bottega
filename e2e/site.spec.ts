import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const shots = process.env.BOTTEGA_SHOTS ?? 'shots';

test('cover loads, nothing third-party is requested, nothing is stored but progress', async ({
  page,
  baseURL,
}, info) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (req) => {
    const u = req.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return;
    if (new URL(u).origin !== origin) foreign.push(u);
  });
  await page.goto('./');
  await expect(page.locator('html[data-ready="true"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Bottega' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${shots}/${info.project.name}-cover.png` });
  // walk the page so everything lazy has had its chance
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  expect(foreign, `third-party requests: ${foreign.join(', ')}`).toEqual([]);
  expect(await page.context().cookies()).toEqual([]);
});

test('no serious accessibility violations', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html[data-ready="true"]')).toBeVisible();
  // open every margin note and reveal every law so the whole page is checked
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach((d) => (d.open = true));
    document.querySelectorAll<HTMLButtonElement>('[data-testid="show-law"]').forEach((b) => b.click());
  });
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
});

test('no horizontal scroll', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html[data-ready="true"]')).toBeVisible();
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
});

test('with reduced motion, a page that only plays itself goes straight to its end', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#folio-iii');
  const folio = page.locator('#folio-iii');
  await folio.getByTestId('f3-go').click();
  await expect(folio).toHaveAttribute('data-phase', 'done');
  await expect(folio.getByTestId('result')).toContainText('delivered ruined');
  for (const [id, go] of [
    ['iv', 'f4-go'],
    ['v', 'f5-go'],
  ]) {
    const other = page.locator(`#folio-${id}`);
    await other.getByTestId(go!).click();
    await expect(other).toHaveAttribute('data-phase', 'done');
  }
});

test('no serious accessibility violations after the pages have been played', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.locator('html[data-ready="true"]')).toBeVisible();
  for (const go of ['f3-go', 'f4-go', 'f5-go']) await page.getByTestId(go).click();
  await page.getByTestId('f7-open').click();
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
});
