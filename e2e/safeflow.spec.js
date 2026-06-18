import { expect, test } from '@playwright/test';

test('SafeFlow prototype journey stays within simulation safety boundaries', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'SafeFlow', exact: true })).toBeVisible();
  await expect(page.getByText(/Simulation only/i)).toBeVisible();
  await expect(page.getByText(/^NHS$/)).toHaveCount(0);

  const overflowingMetrics = await page.locator('.metric-grid').evaluate((grid) => {
    const gridRect = grid.getBoundingClientRect();
    return Array.from(grid.children)
      .filter((card) => card.getBoundingClientRect().right > gridRect.right + 1)
      .map((card) => card.textContent?.trim());
  });
  expect(overflowingMetrics).toEqual([]);

  await page.getByRole('tab', { name: /Handover/i }).click();
  await expect(page.getByRole('region', { name: /Handover and discharge readiness/i })).toBeVisible();

  await page.getByRole('tab', { name: /Potassium flag/i }).click();
  await expect(page.getByText(/does not prescribe/i)).toBeVisible();
  await expect(page.getByText(/Potassium has fallen from 3.8 to 3.2 mmol\/L/i).first()).toBeVisible();

  await page.getByLabel(/Editable SBAR draft/i).fill('Edited safe escalation note.');
  await page.getByRole('button', { name: /Save SBAR draft/i }).click();
  await expect(page.getByText(/SBAR draft edited and saved/i)).toBeVisible();

  await page.getByRole('tab', { name: /Scenarios/i }).click();
  await expect(page.getByRole('region', { name: /Discovery scenario library/i })).toBeVisible();
  await expect(page.getByText(/Initial hazard controls/i)).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/administer potassium|give potassium|replace potassium|prescribe potassium|diagnose this patient/i);
});
