// SF-300 / SF-306: at 860px and below the full workspace navigation opens
// from More in the bottom tab bar. Between 861px and 1120px it opens from the
// top-left menu button. Above that the sidebar is always visible.

export async function openWorkspaceNav(page) {
  const more = page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('button', { name: 'More' });
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await more.isVisible()) {
    if ((await more.getAttribute('aria-expanded')) !== 'true') await more.click();
  } else if (await menu.isVisible()) {
    await menu.click();
  }
  return page.getByRole('navigation', { name: /SafeFlow workspace/i });
}

export async function navigateTo(page, name, exact = typeof name === 'string') {
  const nav = await openWorkspaceNav(page);
  await nav.getByRole('button', { name, exact }).click();
}

// Presentation mode and the report buttons live in the Review tools menu.
export async function openReviewTools(page) {
  const menu = page.locator('details.review-tools-menu');
  if (await menu.count() && !(await menu.evaluate((element) => element.open))) {
    await menu.locator('summary').click();
  }
}

// SF-306: the app opens on the simulation access gate, then Hospitals and
// Wards. Most specs continue straight to the current ward board.
export async function signIn(page, { toBoard = true } = {}) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Work email').fill('review@example.test');
  await page.getByLabel('Password', { exact: true }).fill('fictional-review');
  await page.getByRole('button', { name: 'Enter simulation workspace' }).click();
  if (toBoard) await page.getByRole('button', { name: 'Open current ward workflow' }).click();
}

// SF-300: on phones the simulation context (care setting, scenario, ward,
// Change ward) folds behind a toggle in the top bar.
export async function openSimulationContext(page) {
  const toggle = page.getByRole('button', { name: /Simulation context/ });
  if (await toggle.isVisible() && (await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}
