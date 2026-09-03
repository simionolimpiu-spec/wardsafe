#!/usr/bin/env node
/* WCAG 2.2 contrast check for WardSafe's declared colour pairs (NHS palette).
 *
 *   node scripts/a11y/contrast-check.mjs
 *
 * Exits non-zero if any pair falls below its required ratio, for CI. Evidence
 * for DTAC section 4 lives in docs/accessibility/wcag-2-2-aa-evidence.md.
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

/* required: 4.5 = normal text (SC 1.4.3); 3 = large text and non-text such as
 * focus rings and control borders (SC 1.4.11). NHS design-system palette. */
const PAIRS = [
  ['Body ink on page', '#212b32', '#f0f4f5', 4.5],
  ['Focus ring (dark blue) on light surface', '#003087', '#f0f4f5', 3],
  ['Focus ring (white) on NHS blue header', '#ffffff', '#005eb8', 3],
  ['Focus ring (white) on NHS dark-blue header', '#ffffff', '#003087', 3],
  ['Brand blue on white', '#005eb8', '#ffffff', 4.5],
  ['Dark blue heading on white', '#003087', '#ffffff', 4.5],
  ['Dark blue on blue-soft', '#003087', '#e6f1f8', 4.5],
  ['On-dark muted on dark-blue header', '#dbeaf7', '#003087', 4.5],
  ['Red on white', '#d5281b', '#ffffff', 4.5],
  ['Red on red-soft', '#d5281b', '#fdf2f0', 4.5],
  ['Green on white', '#007f3b', '#ffffff', 4.5],
  ['Green on green-soft', '#007f3b', '#e5f4eb', 4.5],
  ['Amber on amber-soft', '#765100', '#fff4c2', 4.5],
  ['Secondary grey on page', '#4c6272', '#f0f4f5', 4.5],
  ['Secondary grey on white', '#4c6272', '#ffffff', 4.5],
  ['Badge text (white) on red badge', '#ffffff', '#d5281b', 4.5]
];

let failed = 0;
console.log('WCAG 2.2 contrast check (NHS palette)\n');
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
