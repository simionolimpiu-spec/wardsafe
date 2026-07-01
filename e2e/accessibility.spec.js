import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

function seriousViolations(results) {
  return results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
}

test('SafeFlow pitch and prototype pass critical accessibility smoke checks', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  let results = await new AxeBuilder({ page }).analyze();
  expect(seriousViolations(results)).toEqual([]);

  await page.getByRole('button', { name: /Open interactive prototype/i }).first().click();
  await expect(page.getByRole('heading', { name: 'SafeFlow', exact: true })).toBeVisible();

  results = await new AxeBuilder({ page }).analyze();
  expect(seriousViolations(results)).toEqual([]);
});
