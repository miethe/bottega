import { expect, test } from '@playwright/test';
const shots = process.env.BOTTEGA_SHOTS ?? 'shots';
test('Folio VI: mending leaves a dirty shelf; looking clears it', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.goto('./#folio-vi');
  const folio = page.locator('#folio-vi'), law = folio.getByTestId('law'), result = folio.getByTestId('result');
  const go = folio.getByTestId('f6-go');
  await folio.getByTestId('f6-mend').click(); await go.click();
  await expect(result).toContainText('The jar is mended.'); await expect(result).toContainText('stained');
  await expect(law).toHaveAttribute('data-revealed', 'true'); await expect(law).toHaveAttribute('data-how', 'played');
  await expect(law).toContainText('Mending the jar does not clean the shelf. Count what it already touched, and go touch each one.');
  await folio.scrollIntoViewIfNeeded(); await folio.screenshot({ path: `${shots}/${info.project.name}-folio-vi.png` });
  await go.click(); await folio.getByTestId('f6-mend').click();
  await expect(folio.getByTestId('f6-mend')).toHaveText('The jar is mended', { timeout: 4000 });
  for (let i = 1; i <= 24; i++) {
    await folio.getByTestId('f6-look').click();
    await expect(result).toContainText(`looked at ${i} of 24`, { timeout: 2000 });
  }
  await expect(result).toContainText('The cart left clean.', { timeout: 20000 });
});
