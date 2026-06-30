import { expect, test } from '@playwright/test';

test('SafeFlow homepage keeps core keyboard and structure accessibility intact', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('main')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: /make ward risk visible before escalation is missed/i })).toBeVisible();

  const heroTabs = page.getByRole('tablist', { name: /safeflow workflow steps/i });
  await heroTabs.getByRole('tab', { name: /readiness/i }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(heroTabs.getByRole('tab', { name: /signals/i })).toBeFocused();
  await expect(page.getByRole('heading', { level: 3, name: /risk signal review/i })).toBeVisible();

  const dashboardTabs = page.getByRole('tablist', { name: /dashboard sections/i });
  await dashboardTabs.getByRole('tab', { name: /readiness/i }).focus();
  await page.keyboard.press('End');
  await expect(dashboardTabs.getByRole('tab', { name: /audit/i })).toBeFocused();
  await expect(page.getByText(/action trace captured/i)).toBeVisible();

  await expect(page.getByText(/simulation view · no patient data/i)).toBeVisible();
  await expect(page.getByText(/not clinically validated\. not for clinical decision-making\./i)).toBeVisible();
});
