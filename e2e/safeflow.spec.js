import { expect, test } from '@playwright/test';

test('SafeFlow homepage stays calm, responsive, and interactive', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1, name: /make ward risk visible before escalation is missed/i })).toBeVisible();
  await expect(page.getByText(/fictional workflow only\. no patient data shown\./i)).toBeVisible();
  await expect(page.getByText(/prepared for governance review/i).first()).toBeVisible();
  await expect(page.getByText(/^NHS approved$/i)).toHaveCount(0);

  const pageOverflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(pageOverflow.scrollWidth).toBeLessThanOrEqual(pageOverflow.clientWidth + 1);

  const heroTabs = page.getByRole('tablist', { name: /safeflow workflow steps/i });
  await heroTabs.getByRole('tab', { name: /audit/i }).click();
  await expect(page.getByRole('heading', { level: 3, name: /audit learning loop/i })).toBeVisible();

  const dashboardTabs = page.getByRole('tablist', { name: /dashboard sections/i });
  await dashboardTabs.getByRole('tab', { name: /signals/i }).click();
  await expect(page.getByText(/documentation gap cluster/i)).toBeVisible();
  await dashboardTabs.getByRole('tab', { name: /audit/i }).click();
  await expect(page.getByText(/governance export ready/i)).toBeVisible();

  await page.getByRole('button', { name: /escalation pathway/i }).click();
  await expect(page.getByText(/named route, next review action, and escalation ownership/i)).toBeVisible();
  await expect(page.getByText(/principle: support clinical judgement, do not replace it\./i)).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/clinically validated decision support|AI diagnosis|automation replacing clinicians|deployed in NHS/i);
});
