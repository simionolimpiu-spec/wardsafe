import { expect, test } from '@playwright/test';
import { signIn } from './shell.js';

test('DCU-031 review separates source evidence, AI draft and human decision', async ({ page }, testInfo) => {
  // SF-306: the app opens on the simulation access gate, so sign in and open
  // the current ward board, where DCU-031 is the default selected patient.
  await signIn(page);
  const panel = page.getByRole('region', { name: 'Simulated agent review' });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Run simulated review' }).focus();
  await page.keyboard.press('Enter');
  await expect(panel.getByText('Human review required.', { exact: true })).toBeVisible();
  await expect(panel.getByText(/Recorded potassium change: -0.6/)).toBeVisible();
  await panel.getByText('Why this review cue appeared', { exact: true }).click();
  await expect(panel.getByText('DCU-031:labs.potassium.0', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Edit review' }).click();
  await panel.getByLabel('Your edited review').fill('Fictional values and source timestamps reviewed.');
  await panel.getByRole('button', { name: 'Save edited review' }).click();
  await expect(panel.getByText('Human review recorded: edited.', { exact: true })).toBeVisible();
  await expect(panel.getByText('The original AI interpretation remains untrusted.')).toBeVisible();
  await panel.screenshot({ path: testInfo.outputPath('agent-review.png') });
  await panel.getByText(/Review session audit/).click();
  await expect(panel.getByText(/HUMAN REVIEW COMPLETED/)).toBeVisible();
  const widths = await panel.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
});
