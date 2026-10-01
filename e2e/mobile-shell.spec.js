import { expect, test } from '@playwright/test';
import { navigateTo, signIn } from './shell.js';

test('SF-300 phone shell puts the board first, with bottom tabs and More opening the drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  const tabs = page.getByRole('navigation', { name: 'Quick navigation' });
  const more = tabs.getByRole('button', { name: 'More' });
  const drawer = page.locator('#workspace-navigation');
  const context = page.getByRole('button', { name: /Simulation context/ });

  await expect(tabs.getByRole('button')).toHaveText(['Board', 'Patients', 'Obs', /^Tasks/, 'More']);
  await expect(tabs.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeHidden();
  await expect(page.getByRole('region', { name: /simulation safety boundary/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Training scenario' })).toBeHidden();

  const layout = await page.evaluate(() => {
    const bar = document.querySelector('.sf-mobile-tabbar').getBoundingClientRect();
    const heading = [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === 'Ward Safety Board');
    const targets = [...document.querySelectorAll('.sf-mobile-tabbar button, .sf-mobile-context-toggle')];
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      headingTop: heading.getBoundingClientRect().top,
      barTop: bar.top,
      barHeight: bar.height,
      smallestTarget: Math.min(...targets.map((t) => Math.min(t.getBoundingClientRect().height, t.getBoundingClientRect().width))),
      bottomPadding: parseFloat(getComputedStyle(document.querySelector('.workspace-main')).paddingBottom)
    };
  });
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.headingTop).toBeLessThan(layout.barTop);
  expect(layout.smallestTarget).toBeGreaterThanOrEqual(44);
  expect(layout.bottomPadding).toBeGreaterThanOrEqual(layout.barHeight);

  // The context toggle reveals care setting, scenario and date
  await context.click();
  await expect(context).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('combobox', { name: 'Training scenario' })).toBeVisible();
  await context.click();

  // More opens the drawer, Escape closes it and returns focus to More
  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer).toHaveClass(/is-open/);
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveClass(/is-open/);
  await expect(more).toBeFocused();

  // A drawer screen marks More as current
  await navigateTo(page, 'Handover');
  await expect(page.getByRole('heading', { name: 'Handover and Discharge Readiness' })).toBeVisible();
  await expect(drawer).not.toHaveClass(/is-open/);
  await expect(more).toHaveClass(/is-current/);

  // Tabs switch clinical screens
  await tabs.getByRole('button', { name: 'Obs' }).click();
  await expect(page.getByRole('heading', { name: 'Observations', exact: true })).toBeVisible();
  await expect(tabs.getByRole('button', { name: 'Obs' })).toHaveAttribute('aria-current', 'page');
});

test('SF-300 desktop keeps the sidebar and context without the phone controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await expect(page.getByRole('navigation', { name: /SafeFlow workspace/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Quick navigation' })).toBeHidden();
  await expect(page.getByRole('button', { name: /Simulation context/ })).toBeHidden();
  await expect(page.getByRole('combobox', { name: 'Training scenario' })).toBeVisible();
});

test('SF-301 to SF-303 phone screens stay readable and on-screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);

  // SF-303: text in the simulation context meets 4.5:1 on its own surface
  await page.getByRole('button', { name: /Simulation context/ }).click();
  const lowContrast = await page.evaluate(() => {
    const rgb = (v) => v.match(/[\d.]+/g).map(Number);
    const lum = (v) => rgb(v).slice(0, 3).map((c) => c / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const surface = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (rgb(c)[3] !== 0) return c; } return 'rgb(255, 255, 255)'; };
    return [...document.querySelectorAll('.topbar-context span, .topbar-context small, .topbar-context p, .topbar-context time')]
      .filter((el) => el.textContent.trim() && el.getClientRects().length)
      .filter((el) => ratio(getComputedStyle(el).color, surface(el)) < 4.5).map((el) => el.textContent.trim());
  });
  expect(lowContrast).toEqual([]);

  // Trust Network compares one ward at a time, so it stays short
  await navigateTo(page, 'Trust Network');
  await expect(page.getByRole('combobox', { name: 'Ward to compare' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(20000);

  for (const name of ['Trust Network', 'Patient Journey Twin', 'Scenarios']) {
    await navigateTo(page, name);
    const result = await page.evaluate(() => {
      let tiny = 0;
      for (const el of document.querySelectorAll('.workspace-content *')) {
        if (el.closest('details:not([open])') || !el.getBoundingClientRect().width) continue;
        if (el.childNodes[0]?.nodeType === 3 && el.textContent.trim() && parseFloat(getComputedStyle(el).fontSize) < 12) tiny += 1;
      }
      return { tiny, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(result.tiny, name).toBe(0);
    expect(result.overflow, name).toBeLessThanOrEqual(1);
  }
});
