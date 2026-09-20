import { expect, test } from '@playwright/test';

test('SF-300 mobile shell puts content first with bottom tabs and a More sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const tabs = page.getByRole('navigation', { name: 'Quick navigation' });
  const more = tabs.getByRole('button', { name: 'More' });
  const workspace = page.getByRole('navigation', { name: /SafeFlow workspace/i });
  const board = page.getByRole('region', { name: 'Ward Safety Board', exact: true });

  await expect(tabs).toBeVisible();
  await expect(tabs.getByRole('button')).toHaveText(['Board', 'Patients', 'Obs', /^Tasks/, 'More']);
  await expect(tabs.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-current', 'page');
  await expect(workspace).toBeHidden();
  await expect(page.getByRole('region', { name: /simulation safety boundary/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Ward' })).toBeHidden();

  const layout = await page.evaluate(() => {
    const bar = document.querySelector('.sf-mobile-tabbar').getBoundingClientRect();
    const heading = [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === 'Ward Safety Board');
    const buttons = [...document.querySelectorAll('.sf-mobile-tabbar button, .sf-mobile-context-toggle')];
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      headingTop: heading.getBoundingClientRect().top,
      barTop: bar.top,
      barHeight: bar.height,
      smallestTarget: Math.min(...buttons.map((b) => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width))),
      bottomPadding: parseFloat(getComputedStyle(document.querySelector('.workspace-main')).paddingBottom)
    };
  });
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.headingTop).toBeLessThan(layout.barTop / 2);
  expect(layout.smallestTarget).toBeGreaterThanOrEqual(44);
  expect(layout.bottomPadding).toBeGreaterThanOrEqual(layout.barHeight);

  // The ward toggle reveals the ward and demo controls
  const context = page.getByRole('button', { name: /Ward and demo controls/ });
  await context.click();
  await expect(context).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('combobox', { name: 'Ward' })).toBeVisible();
  await context.click();

  // More opens every screen, Escape closes and returns focus
  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(workspace).toBeVisible();
  await expect(workspace.getByRole('button')).toHaveCount(16);
  await expect(workspace.getByRole('button', { name: 'Ward Safety Board' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toBeFocused();
  await expect(workspace).toBeHidden();

  // A More screen marks More as current and closes the sheet
  await more.click();
  await workspace.getByRole('button', { name: 'Handover', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Handover and Discharge Readiness' })).toBeVisible();
  await expect(workspace).toBeHidden();
  await expect(more).toHaveClass(/is-current/);

  // Tabs switch clinical screens
  await tabs.getByRole('button', { name: 'Obs' }).click();
  await expect(page.getByRole('heading', { name: 'Observations', exact: true })).toBeVisible();
  await expect(tabs.getByRole('button', { name: 'Obs' })).toHaveAttribute('aria-current', 'page');
  await expect(board).toHaveCount(0);
});

test('SF-300 desktop keeps the sidebar and full top bar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: /SafeFlow workspace/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Quick navigation' })).toBeHidden();
  await expect(page.getByRole('button', { name: /Ward and demo controls/ })).toBeHidden();
  await expect(page.getByRole('combobox', { name: 'Ward' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Presentation mode', exact: true })).toBeVisible();
});
