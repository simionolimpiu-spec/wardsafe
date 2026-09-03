#!/usr/bin/env node
/* WCAG 2.2 contrast checker for WardSafe's declared colour pairs.
 *
 *   node scripts/a11y/contrast-check.mjs
 *
 * Exits non-zero if any pair falls below its required ratio, so it can be
 * wired straight into CI. Evidence for DTAC section 4 lives in
 * docs/accessibility/wcag-2-2-aa-evidence.md — keep the two in step.
 */

const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* required: 4.5 = normal text (SC 1.4.3), 3 = large text and non-text such as
 * focus indicators and control borders (SC 1.4.11). */
const PAIRS = [
  ['Body ink on page', '#102033', '#f5f8fc', 4.5],
  ['Focus ring on light surface', '#0b3640', '#f5f8fb', 3],
  ['Focus ring on dark topbar', '#ffffff', '#124c56', 3],
  ['Blue-ink on blue-soft', '#0b3640', '#e8f3f4', 4.5],
  ['Selector text on white', '#17436f', '#ffffff', 4.5],
  ['Topbar subtitle on topbar', '#dbeaf7', '#124c56', 4.5],
  ['Scenario label on topbar', '#dbeaf7', '#124c56', 4.5],
  ['Brand on white', '#176b75', '#ffffff', 4.5],
  ['Green on green-soft', '#176b43', '#e9f6ee', 4.5],
  ['Red on red-soft', '#b42318', '#fdecea', 4.5],
  ['Amber on amber-soft', '#8a5a00', '#fff4d6', 4.5],
  ['Nav muted on white', '#617083', '#ffffff', 4.5],
  ['Badge text on badge', '#ffffff', '#d81b60', 4.5],
  ['Grey-500 on grey-50', '#5f6f7f', '#f5f8fb', 4.5],
  ['Safety card body on blue-soft', '#5f6f7f', '#e8f3f4', 4.5]
];

let failed = 0;
console.log('WCAG 2.2 contrast check\n');
for (const [name, fg, bg, required] of PAIRS) {
  const ratio = contrast(fg, bg);
  const ok = ratio >= required;
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(6)}:1  (needs ${required}:1)  ${name}  ${fg} on ${bg}`
  );
}

console.log(`\n${PAIRS.length - failed}/${PAIRS.length} pairs pass.`);
if (failed > 0) {
  console.error(`${failed} contrast failure(s).`);
  process.exit(1);
}
