import { expect, test } from '@playwright/test';
import { navigateTo, openReviewTools, signIn } from './shell.js';

// Check the rendered cascade, including legacy/shared styles, not just token pairs.
async function nightReadability(view) {
  return view.evaluate((root) => {
    const rgb = (value) => value.match(/[\d.]+/g).map(Number);
    const luminance = (value) => rgb(value).slice(0, 3)
      .map((channel) => channel / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const contrast = (a, b) => {
      const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const background = (element) => {
      for (let current = element; current; current = current.parentElement) {
        const color = getComputedStyle(current).backgroundColor;
        if (rgb(color)[3] !== 0) return color;
      }
      throw new Error('No opaque surface found');
    };
    const failures = [];
    for (const element of [root, ...root.querySelectorAll('*')]) {
      if (!(element instanceof HTMLElement) || !element.getClientRects().length) continue;
      const style = getComputedStyle(element);
      const surface = background(element);
      const hasText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (hasText && contrast(style.color, surface) < 4.5) {
        failures.push(`text ${element.className || element.tagName}: ${style.color} on ${surface}`);
      }
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        if (parseFloat(style[`border${side}Width`]) && style[`border${side}Style`] !== 'none'
          && contrast(style[`border${side}Color`], surface) < 3) {
          failures.push(`border ${element.className || element.tagName}: ${style[`border${side}Color`]} on ${surface}`);
        }
      }
      if (style.animationName !== 'none') failures.push(`animation ${element.className}`);
    }
    return [...new Set(failures)];
  });
}

test('SF-298 insight night views retain readable content and stay off clinical screens', async ({ page }, testInfo) => {
  await signIn(page);
  for (const [name, region] of [['Trust Network', 'England Trust Network'], ['Patient Journey Twin', 'Patient Journey Twin']]) {
    await navigateTo(page, name);
    const view = page.getByRole('region', { name: region, exact: true });
    const originalText = await view.innerText();
    const toggle = view.getByRole('button', { name: 'Night view' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(view).toHaveAttribute('data-sf-theme', 'night');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await view.innerText()).toBe(originalText);
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    expect(await nightReadability(view)).toEqual([]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await nightReadability(view)).toEqual([]);
    await view.screenshot({ path: testInfo.outputPath(`${name.replaceAll(' ', '-')}-night.png`) });
    if (name === 'Trust Network') {
      await view.locator('.review-report-summary-card').first().screenshot({ path: testInfo.outputPath('trust-summary-night.png') });
      await view.locator('.trust-network-journey').first().screenshot({ path: testInfo.outputPath('trust-journey-night.png') });
      const observations = view.locator('.trust-network-obs');
      await expect(observations.first()).toContainText(/RR \d+ · SpO₂ \d+% · HR \d+/);
      expect(await observations.first().evaluate((element) => ({
        color: getComputedStyle(element).color,
        expected: getComputedStyle(element).getPropertyValue('--sf-text-primary').trim(),
        shadow: getComputedStyle(element).textShadow
      }))).toMatchObject({ color: 'rgb(231, 240, 243)', expected: '#e7f0f3', shadow: 'none' });
    }
    await toggle.click();
    await expect(view).toHaveAttribute('data-sf-theme', 'standard');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  }

  await openReviewTools(page);
  await page.getByRole('button', { name: 'Presentation mode', exact: true }).click();
  for (const [name, region] of [['Trust Network', 'England Trust Network'], ['Patient Journey Twin', 'Patient Journey Twin']]) {
    await navigateTo(page, name);
    await expect(page.getByRole('region', { name: region, exact: true })).toHaveAttribute('data-sf-theme', 'night');
  }
  for (const name of ['Ward Safety Board', 'Observations', /^Tasks/, /^Escalations/, 'Handover', 'Discharges']) {
    await navigateTo(page, name);
    await expect(page.locator('.sf-zone-night')).toHaveCount(0);
  }
});

test('SF-299 trust network hospital cards stay top-aligned with inline review-support labels', async ({ page }) => {
  await signIn(page);
  await navigateTo(page, 'Trust Network');
  const view = page.getByRole('region', { name: 'England Trust Network', exact: true });
  for (const theme of ['standard', 'night']) {
    if (theme === 'night') await view.getByRole('button', { name: 'Night view' }).click();
    const layout = await view.evaluate((root) => {
      const cards = [...root.querySelectorAll('.review-report-summary-card')].map((card) => {
        const box = card.getBoundingClientRect();
        const title = card.querySelector(':scope > strong').getBoundingClientRect();
        return { titleOffset: title.top - box.top, slack: box.bottom - card.lastElementChild.getBoundingClientRect().bottom };
      });
      const label = root.querySelector('.trust-network-ward-trend-flags strong');
      const line = label.parentElement;
      return {
        cards,
        labelDisplay: getComputedStyle(label).display,
        labelSize: parseFloat(getComputedStyle(label).fontSize),
        lineSize: parseFloat(getComputedStyle(line).fontSize)
      };
    });
    expect(layout.cards.length).toBeGreaterThan(1);
    for (const card of layout.cards) {
      expect(card.titleOffset).toBeLessThan(120);
      expect(card.slack).toBeLessThan(48);
    }
    expect(layout.labelDisplay).toBe('inline');
    expect(layout.labelSize).toBe(layout.lineSize);
  }
});
