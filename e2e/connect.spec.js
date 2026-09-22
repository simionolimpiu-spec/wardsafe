import { expect, test } from '@playwright/test';
import { navigateTo, signIn } from './shell.js';
test('Connect keeps messages distinct, walks requests and reviews drafts on desktop and phone', async ({
  page
}, testInfo) => {
  await signIn(page);
  await navigateTo(page, 'Communication');
  const view = page.getByRole('region', { name: 'Communication', exact: true });
  await expect(view).toBeVisible();
  await view
    .getByRole('button', { name: /Patient thread/ })
    .first()
    .click();
  await view
    .getByLabel('Message', { exact: true })
    .fill('Please escalate this fictional handover concern');
  await view.getByRole('button', { name: 'Send message', exact: true }).click();
  const event = view
    .locator('article')
    .filter({ hasText: 'Please escalate this fictional handover concern' });
  await expect(event.getByText('Message', { exact: true })).toBeVisible();
  await view
    .locator('summary')
    .filter({ hasText: /^New request$/ })
    .click();
  await view
    .getByLabel('Request summary')
    .fill('Review the fictional handover documentation');
  await view.getByRole('button', { name: 'Send request' }).click();
  for (const name of [
    'Simulate delivery',
    'Simulate read',
    'Acknowledge',
    'Accept',
    'Start',
    'Complete'
  ])
    await view.getByRole('button', { name, exact: true }).click();
  await expect(view.getByRole('status')).toHaveText('Request completed');
  await view.getByRole('button', { name: 'Draft reply (simulation)' }).click();
  await view.getByRole('button', { name: 'Approve and send' }).click();
  await expect(view.getByText(/Approved by Alex Morgan/)).toBeVisible();
  await view.getByLabel('Recipient role').selectOption('on-call');
  await expect(
    view.getByRole('button', { name: 'Send message', exact: true })
  ).toBeDisabled();
  await expect(
    view.getByRole('region', { name: 'Lock-screen preview (simulation)' })
  ).not.toContainText(/Margaret|DCU|\d/);
  for (const width of [320, 860, 1366]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1);
    await view.screenshot({
      path: testInfo.outputPath(`connect-${width}.png`)
    });
  }
});
