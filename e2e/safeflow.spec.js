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

  const destinations = [
    ['Ward Safety Board', 'Ward Safety Board'],
    ['My Patients', 'My Patients'],
    ['Observations', 'Observations'],
    [/^Tasks/, 'Tasks'],
    [/^Escalations/, 'Escalations'],
    ['Handover', 'Handover and Discharge Readiness'],
    ['Discharges', 'Discharges'],
    ['Reports', 'Reports'],
    ['Audit Trail', 'Audit and Learning'],
    ['Settings', 'Settings']
  ];

  for (const [button, heading] of destinations) {
    await page.getByRole('button', { name: button, exact: typeof button === 'string' }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Check backend workspace' }).click();
  await expect(page.getByText(/local-fictional-fixture|postgresql-simulation-read-model/i)).toBeVisible();
  await expect(page.getByText('5 fictional patients')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Backend workspace check complete');

  await page.getByRole('button', { name: 'Check build readiness' }).click();
  await expect(page.getByText(/Migration approval current/i)).toBeVisible();
  await expect(page.getByText('Fixture mode')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Build readiness check complete');

  await page.getByRole('button', { name: 'Reset simulation' }).click();
  await expect(page.getByRole('dialog', { name: 'Reset simulation' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm reset' }).click();
  await expect(page.getByRole('status')).toContainText('Simulation reset');

  await page.getByRole('button', { name: 'Call team' }).click();
  await expect(page.getByRole('dialog', { name: 'Record simulated team contact' })).toBeVisible();
  await expect(page.getByRole('link', { name: /call/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Record contact' }).click();
  await expect(page.getByText(/Simulated team contact recorded/i)).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/administer potassium|give potassium|replace potassium|prescribe potassium|diagnose this patient/i);
});
