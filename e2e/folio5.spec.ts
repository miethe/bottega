import { expect, test } from '@playwright/test';

const shots = process.env.BOTTEGA_SHOTS ?? 'shots';

test('Folio V: bells ring; tied cords wake the people who mend', async ({ page }, info) => {
  await page.goto('./#folio-v');
  const folio = page.locator('#folio-v');
  const law = folio.getByTestId('law');
  const result = folio.getByTestId('result');
  const go = folio.getByTestId('f5-go');
  const bells = folio.getByTestId('f5-bells');
  const cords = folio.getByTestId('f5-cords');
  await expect(law).toHaveAttribute('data-revealed', 'false');
  await expect(bells).toHaveValue('8');
  await expect(cords).toHaveValue('0');

  await go.click();
  await expect(go).toHaveText('To sunrise');
  await go.click();
  await expect(result).toContainText('Rung 678. Mended 3, by whoever happened to be up.');
  await expect(law).toHaveAttribute('data-revealed', 'true');
  await expect(law).toHaveAttribute('data-how', 'played');
  await expect(law).toContainText('A bell nobody hears is decoration. Before you hang it, name who gets up.');
  await folio.scrollIntoViewIfNeeded();
  await folio.screenshot({ path: `${shots}/${info.project.name}-folio-v-loud.png` });

  await cords.focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
  await expect(cords).toHaveValue('8');
  await go.click();
  await expect(go).toHaveText('To sunrise');
  await page.waitForTimeout(2500);
  await folio.locator('.stage').screenshot({ path: `${shots}/${info.project.name}-folio-v-running.png` });
  await go.click();
  await expect(folio).toHaveAttribute('data-phase', 'done');
  const totals = (await result.innerText()).match(/Rung (\d+)\. Mended (\d+)\./);
  expect(totals).not.toBeNull();
  expect(Number(totals![1])).toBeLessThan(678);
  expect(Number(totals![2])).toBeGreaterThanOrEqual(8);
  await expect(law).toHaveAttribute('data-how', 'played');
  await folio.screenshot({ path: `${shots}/${info.project.name}-folio-v.png` });

  await page.reload();
  await expect(page.locator('#folio-v').getByTestId('law')).toHaveAttribute('data-revealed', 'true');
});
