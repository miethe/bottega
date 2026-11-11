import { expect, test } from '@playwright/test';

const shots = process.env.BOTTEGA_SHOTS ?? 'shots';

test('Folio I: one watched apprentice ruins nothing; many hands break the seal', async ({ page }, info) => {
  await page.goto('./#folio-i');
  const folio = page.locator('#folio-i');
  const law = folio.getByTestId('law');
  const result = folio.getByTestId('result');
  const go = folio.getByTestId('f1-go');
  await expect(law).toHaveAttribute('data-revealed', 'false');

  // one apprentice, eye on him
  await go.click();
  await go.click(); // to the end of the day
  await expect(result).toContainText('none ruined');
  await expect(law).toHaveAttribute('data-revealed', 'false');

  // eight hands, by keyboard
  const hands = folio.getByTestId('f1-hands');
  await hands.focus();
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
  await expect(folio.locator('.lever-value')).toHaveText('8');
  await go.click();
  await folio.getByTestId('f1-easel-3').click();
  await folio.getByTestId('f1-easel-5').click();
  await go.click();
  await expect(result).toContainText('ruined');
  await expect(law).toHaveAttribute('data-revealed', 'true');
  await expect(law).toHaveAttribute('data-how', 'played');
  await expect(law).toContainText('You cannot watch your way to quality.');
  await folio.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${shots}/${info.project.name}-folio-i.png`, fullPage: false });

  // and it stays revealed
  await page.reload();
  await expect(page.locator('#folio-i').getByTestId('law')).toHaveAttribute('data-revealed', 'true');
});
