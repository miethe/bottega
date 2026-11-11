import { expect, test } from '@playwright/test';

const shots = process.env.BOTTEGA_SHOTS ?? 'shots';

test('Folio VII: polishing to the last day ends on a shelf; opening the doors ends as Mark II', async ({ page }, info) => {
  await page.goto('./#folio-vii');
  const folio = page.locator('#folio-vii');
  const law = folio.getByTestId('law');
  const result = folio.getByTestId('result');
  await expect(law).toHaveAttribute('data-revealed', 'false');
  await expect(result).toContainText('40%');

  // a few strokes: closer, never there
  for (let i = 0; i < 2; i++) await folio.getByTestId('f7-stroke').click();
  await folio.locator('.stage').screenshot({ path: `${shots}/${info.project.name}-folio-vii-shut.png` });
  for (let i = 0; i < 6; i++) await folio.getByTestId('f7-stroke').click();
  await expect(result).toContainText('Still not it.');
  await expect(result).toContainText('Nobody has seen it.');
  await expect(law).toHaveAttribute('data-revealed', 'false');

  // the doors will not open without something written down
  await folio.getByTestId('f7-open').click();
  await folio.getByTestId('f7-doors').click();
  await expect(folio.locator('.need')).toContainText('at least one thing');
  await folio.locator('.toy').screenshot({ path: `${shots}/${info.project.name}-folio-vii-form.png` });
  await folio.getByTestId('f7-name').fill('Saint with a Goldfinch');
  await folio.getByTestId('f7-ice-0').check();
  await folio.getByTestId('f7-ice-own').fill('the blue is wrong');
  await folio.getByTestId('f7-doors').click();
  await expect(result).toContainText('Saint with a Goldfinch, Mark I');
  await expect(result).toContainText('From where they stand');
  await expect(law).toHaveAttribute('data-revealed', 'true');
  await expect(law).toHaveAttribute('data-how', 'played');
  await expect(law).toContainText('Finished and unseen is unfinished.');
  await expect(folio.locator('.said')).toContainText('the blue is wrong');
  await folio.scrollIntoViewIfNeeded();
  await folio.screenshot({ path: `${shots}/${info.project.name}-folio-vii-open.png` });

  await folio.getByTestId('f7-stroke').click();
  await expect(folio.locator('.said')).toContainText('Mark II');
  await folio.getByTestId('f7-skip').click();
  await expect(result).toContainText('Mark II');
  await expect(result).toContainText('have seen it');
  await folio.screenshot({ path: `${shots}/${info.project.name}-folio-vii-end.png` });

  // begin again and never open
  await folio.getByTestId('f7-again').click();
  await folio.getByTestId('f7-skip').click();
  await expect(result).toContainText('It was found long afterwards and much admired.');
  await folio.screenshot({ path: `${shots}/${info.project.name}-folio-vii-shelf.png` });
});

test('Folio VII: never opening the doors also breaks the seal', async ({ page }) => {
  await page.goto('./#folio-vii');
  const folio = page.locator('#folio-vii');
  await folio.getByTestId('f7-skip').click();
  await expect(folio.getByTestId('result')).toContainText('The days ran out.');
  await expect(folio.getByTestId('law')).toHaveAttribute('data-how', 'played');
});
