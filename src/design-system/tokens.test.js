import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');
const TOKENS_CSS = readFileSync(resolve(ROOT, 'src/styles/tokens.css'), 'utf8');

function readRootTokens() {
  const block = TOKENS_CSS.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
  const raw = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    raw[name] = value.trim();
  }
  return raw;
}

const rawTokens = readRootTokens();

function resolveToken(name, depth = 0) {
  const value = rawTokens[name];
  if (value === undefined) throw new Error(`${name} is not defined in tokens.css`);
  const reference = value.match(/^var\((--[\w-]+)\)$/);
  if (reference && depth < 10) return resolveToken(reference[1], depth + 1);
  return value;
}

function luminance(hex) {
  let value = hex.replace('#', '');
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4]
    .map((index) => parseInt(value.slice(index, index + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const TEXT = 4.5;
const NON_TEXT = 3;
const PAIRS = [
  ['--sf-text-primary', '--sf-background', TEXT],
  ['--sf-text-primary', '--sf-surface', TEXT],
  ['--sf-text-secondary', '--sf-surface-muted', TEXT],
  ['--sf-text-muted', '--sf-surface', TEXT],
  ['--sf-text-muted', '--sf-surface-muted', TEXT],
  ['--sf-action', '--sf-surface', TEXT],
  ['--sf-action', '--sf-action-subtle', TEXT],
  ['--sf-text-inverse', '--sf-action', TEXT],
  ['--sf-text-inverse', '--sf-action-hover', TEXT],
  ['--sf-text-inverse', '--sf-critical-solid', TEXT],
  ['--sf-information', '--sf-information-subtle', TEXT],
  ['--sf-success', '--sf-success-subtle', TEXT],
  ['--sf-warning', '--sf-warning-subtle', TEXT],
  ['--sf-review', '--sf-review-subtle', TEXT],
  ['--sf-critical', '--sf-critical-subtle', TEXT],
  ['--sf-neutral', '--sf-neutral-subtle', TEXT],
  ['--sf-simulation', '--sf-simulation-subtle', TEXT],
  ['--sf-border-strong', '--sf-surface', NON_TEXT],
  ['--sf-focus', '--sf-surface', NON_TEXT],
  ['--sf-information-solid', '--sf-surface', NON_TEXT],
  ['--sf-success-solid', '--sf-surface', NON_TEXT],
  ['--sf-warning-solid', '--sf-surface', NON_TEXT],
  ['--sf-review-solid', '--sf-surface', NON_TEXT],
  ['--sf-critical-solid', '--sf-surface', NON_TEXT]
];

const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi;

describe('SafeFlow semantic tokens (SF-295)', () => {
  it('defines every semantic token named in the design spec', () => {
    const required = [
      '--sf-background', '--sf-surface', '--sf-surface-raised', '--sf-surface-muted',
      '--sf-border', '--sf-border-strong', '--sf-text-primary', '--sf-text-secondary',
      '--sf-text-muted', '--sf-text-inverse', '--sf-action', '--sf-action-hover',
      '--sf-information', '--sf-success', '--sf-warning', '--sf-critical', '--sf-review',
      '--sf-disabled', '--sf-focus', '--sf-target-min', '--sf-duration-fast',
      '--sf-font-size-md', '--sf-space-4', '--sf-radius-xs', '--sf-icon-md', '--sf-bp-md'
    ];
    for (const name of required) {
      expect(rawTokens, name).toHaveProperty(name);
    }
  });

  it.each(PAIRS)('%s on %s meets %s:1 contrast', (foreground, background, minimum) => {
    expect(contrast(resolveToken(foreground), resolveToken(background))).toBeGreaterThanOrEqual(minimum);
  });

  it('keeps the action colour distinct from the NHS identity blue', () => {
    expect(resolveToken('--sf-action').toLowerCase()).not.toBe('#005eb8');
  });

  it('keeps critical and review visually distinct', () => {
    expect(resolveToken('--sf-review-solid')).not.toBe(resolveToken('--sf-critical-solid'));
  });

  it('sets a 44px minimum interactive target', () => {
    expect(resolveToken('--sf-target-min')).toBe('44px');
  });

  it('zeroes motion tokens and transitions under prefers-reduced-motion', () => {
    const reduced = TOKENS_CSS.slice(TOKENS_CSS.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/--sf-duration-fast:\s*0ms/);
    expect(reduced).toMatch(/--sf-duration-base:\s*0ms/);
    expect(reduced).toMatch(/--sf-duration-slow:\s*0ms/);
    expect(reduced).toMatch(/transition-duration:\s*0\.01ms !important/);
  });

  it.each(['src/design-system/design-system.css', 'src/styles/panel.css', 'src/styles/board.css'])(
    '%s uses tokens only (no raw colour values)',
    (file) => {
      const css = readFileSync(resolve(ROOT, file), 'utf8');
      expect(css.match(RAW_COLOUR) ?? []).toEqual([]);
    }
  );

  it('does not animate clinical content with keyframes in design-system styles', () => {
    const css = readFileSync(resolve(ROOT, 'src/design-system/design-system.css'), 'utf8');
    expect(css).not.toMatch(/@keyframes|animation:/);
  });

  it('keeps board styles on semantic tokens and limits transitions to interaction feedback', () => {
    const css = readFileSync(resolve(ROOT, 'src/styles/board.css'), 'utf8');
    expect(css).not.toMatch(/var\(--(?:color-|space-|text-|font-weight-|sf-(?:blue|red|amber|green|grey|shadow)-?)/);
    expect(css).not.toMatch(/@keyframes|animation:/);
    const ring = css.match(/\.progress-ring\s*\{([^}]+)\}/)[1];
    expect(ring).not.toMatch(/transition|animation/);
  });
});
