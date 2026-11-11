import { expect, test } from '@playwright/test';

const shots = process.env.BOTTEGA_SHOTS ?? 'shots';

test('Folio III: a seal on every hop ruins more than two seals in the right places', async ({ page }, info) => {
  await page.goto('./#folio-iii');
  const folio = page.locator('#folio-iii');
  const law = folio.getByTestId('law');
  const result = folio.getByTestId('result');
  const go = folio.getByTestId('f3-go');
  const ruinedIn = async () => {
    const text = await result.innerText();
    return text.includes('none delivered ruined') ? 0 : Number(text.match(/(\d+) delivered ruined/)?.[1]);
  };
  await expect(law).toHaveAttribute('data-revealed', 'false');

  // the careful shop: a seal on every hop
  await go.click();
  await page.waitForTimeout(2600);
  await folio.locator('.stage').screenshot({ path: `${shots}/${info.project.name}-folio-iii-running.png` });
  await go.click();
  await expect(result).toContainText('delivered ruined');
  const careful = await ruinedIn();
  expect(careful).toBeGreaterThanOrEqual(8);
  await expect(result).toContainText('without really looking');
  await expect(law).toHaveAttribute('data-revealed', 'true');
  await expect(law).toHaveAttribute('data-how', 'played');
  await expect(law).toContainText('Spend the gate where the mistake cannot be taken back.');

  // keep only the seals before the gold and before the door, with the keyboard
  await folio.getByTestId('f3-seal-1').focus();
  await page.keyboard.press('Space');
  await folio.getByTestId('f3-seal-3').focus();
  await page.keyboard.press('Space');
  await expect(folio.getByTestId('f3-seal-1')).not.toBeChecked();
  await expect(folio.getByTestId('f3-seal-2')).toBeChecked();
  await go.click();
  await go.click();
  expect(await ruinedIn()).toBeLessThan(careful / 3);
  await expect(result).not.toContainText('without really looking');
  await expect(folio.locator('.f3-tally li')).toHaveCount(2);

  await folio.scrollIntoViewIfNeeded();
  await folio.screenshot({ path: `${shots}/${info.project.name}-folio-iii.png` });
});
