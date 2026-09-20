// SF-300: at 860px and below the full workspace navigation lives in the
// More sheet and the ward and demo controls sit behind the ward toggle.
// These helpers open them only when the mobile shell is showing.

export async function openWorkspaceNav(page) {
  const more = page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('button', { name: 'More' });
  if (await more.isVisible() && (await more.getAttribute('aria-expanded')) !== 'true') {
    await more.click();
  }
  return page.getByRole('navigation', { name: /SafeFlow workspace/i });
}

export async function navigateTo(page, name, exact = typeof name === 'string') {
  const nav = await openWorkspaceNav(page);
  await nav.getByRole('button', { name, exact }).click();
}

export async function openShellContext(page) {
  const toggle = page.getByRole('button', { name: /Ward and demo controls/ });
  if (await toggle.isVisible() && (await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
}
