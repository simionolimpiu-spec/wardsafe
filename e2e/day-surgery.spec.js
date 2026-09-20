import { expect, test } from '@playwright/test';
import { openSimulationContext } from './shell.js';

test('day surgery shows throughput, dated lists, case milestones and preserved work', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Work email').fill('review@example.test');
  await page.getByLabel('Password', { exact: true }).fill('fictional-review');
  await page.getByRole('button', { name: 'Enter simulation workspace' }).click();
  await page.getByRole('searchbox', { name: 'Find a ward' }).fill('Day Care Unit');
  const card = page.locator('.ward-card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('30 booked attendances');
  await expect(card).toContainText('20 published day beds');
  await card.click();
  await page.getByRole('button', { name: 'Open this ward workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Day surgery flow' })).toBeVisible();
  const firstRow = page.getByRole('table', { name: 'Day surgery list' }).locator('tbody tr').first();
  const firstText = await firstRow.innerText();
  await firstRow.locator('summary').click();
  await expect(firstRow.getByText('Procedure ended', { exact: true })).toBeVisible();
  await expect(firstRow.getByText('Operation duration', { exact: true })).toBeVisible();
  await page.getByLabel('Day list date', { exact: true }).fill('2026-06-18');
  await expect(firstRow).not.toHaveText(firstText);
  await expect(page.getByLabel('Day list date', { exact: true })).toHaveValue('2026-06-18');
  await page.getByLabel('Day list date', { exact: true }).fill('2026-06-17');
  await firstRow.getByRole('button', { name: /^Review / }).click();
  await expect(page.getByRole('heading', { name: 'Handover and Discharge Readiness' })).toBeVisible();
  const patient = await page.getByRole('combobox', { name: 'Selected patient', exact: true }).inputValue();
  await page.getByRole('tab', { name: 'SBAR', exact: true }).click();
  await page.getByRole('textbox', { name: 'Editable SBAR draft' }).fill('Fictional day-case review. Human review required.');
  await page.getByRole('button', { name: 'Save SBAR draft', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Selected patient', exact: true })).toHaveValue(patient);
  await page.getByRole('tab', { name: 'SBAR', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Editable SBAR draft' })).toHaveValue('Fictional day-case review. Human review required.');
  await openSimulationContext(page);
  await page.getByRole('button', { name: 'Change ward', exact: true }).click();
  await page.getByRole('button', { name: 'Open this ward workspace' }).click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test('ward evidence and patient care levels remain readable on desktop and mobile', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Work email').fill('review@example.test');
  await page.getByLabel('Password', { exact: true }).fill('fictional-review');
  await page.getByRole('button', { name: 'Enter simulation workspace' }).click();
  await page.getByRole('searchbox', { name: 'Find a ward' }).fill('ICU/HDU');
  await page.locator('.ward-card').click();
  const evidence = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Service evidence and simulation assumptions' }) });
  await evidence.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(evidence.getByText('Capacity', { exact: true })).toBeVisible();
  await expect(evidence).toContainText('Fictional occupied-patient mix');
  await expect(evidence.getByRole('link', { name: 'Source for capacity' })).toBeVisible();
  await page.locator('.patient-name-trigger').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Simulated adult care level');
  await expect(dialog).toContainText('completion has not been recorded');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});
