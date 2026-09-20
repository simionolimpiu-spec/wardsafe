# WardSafe — WCAG 2.2 AA conformance evidence

Status: **in progress — first audit**
Standard: WCAG 2.2, Level AA
Scope: WardSafe clinical UI (React SPA, `src/`). Simulation-only build.
Audit date: 2026-08-29
Auditor: automated + manual review of `src/styles/` and `src/components/`
Purpose: evidence for NHS **DTAC section 4 (Usability and Accessibility)** and for
the accessibility statement required by the Public Sector Bodies (Websites and
Mobile Applications) Accessibility Regulations 2018.

> This file is maintained as the product changes. Each entry records what was
> tested, how, the result, and — where it failed — the fix and the commit.
> A finding is only moved to **Passed** once re-tested.

---

## 1. Method

| Layer | How it was tested |
|---|---|
| Colour contrast | Every foreground/background token pair in `src/styles/tokens.css` computed against the WCAG relative-luminance formula. Script: `scripts/a11y/contrast-check.mjs`. |
| Keyboard operation | Manual tab traversal of shell, nav, topbar, drawers and dialogs. |
| Focus visibility | Focus indicator contrast measured against **each surface it appears on**, not just the page background. |
| Motion | Static review for `prefers-reduced-motion` handling. |
| Structure | Landmark, heading-order and bypass-block review of `AppShell.jsx` / `WorkspaceNav.jsx`. |

Not yet covered — scheduled, see §5: screen-reader passes (NVDA + JAWS on Windows,
VoiceOver on iPadOS), 200% zoom and 400% reflow, Windows High Contrast visual pass,
and an independent third-party audit.

---

## 2. Findings — open

### A11Y-001 — Focus indicator invisible on the dark topbar
**SC 1.4.11 Non-text Contrast (AA) · 2.4.11 Focus Not Obscured (Minimum) (AA) · Severity: High**

The global focus ring is `--color-focus-ring: var(--sf-blue-ink)` = `#0b3640`.
The redesigned topbar (`.redesign-topbar`) has background `--sf-blue-deep` = `#124c56`.

Measured contrast: **1.36:1**. Required: **3:1**.

Every control in the topbar — ward selector, simulation date stepper, notifications
button — has an effectively invisible keyboard focus indicator. A keyboard-only or
low-vision user cannot tell where they are in the header.

*Fix:* introduce a second token, `--color-focus-ring-on-dark: #ffffff`, and scope it
to dark surfaces. Ring stays `#0b3640` (12.19:1) on light surfaces.

### A11Y-002 — Scenario selector label unreadable on the dark topbar
**SC 1.4.3 Contrast (Minimum) (AA) · Severity: High**

`.demo-scenario-control span` is `#617083`. On the dark topbar this is **1.89:1**
against `#124c56`. Required: 4.5:1.

The sibling `.ward-context-selector > span` was correctly updated to `#dbeaf7`
(7.81:1) when the dark topbar was introduced; the scenario selector was missed.

*Fix:* use the same `#dbeaf7` on-dark token.

### A11Y-003 — No bypass-blocks mechanism
**SC 2.4.1 Bypass Blocks (Level A) · Severity: High**

There is no skip link. A keyboard user lands on the page and must tab through the
full 16-item workspace navigation before reaching content — on **every** view
change. No `<main>` landmark target exists for a skip destination either;
`AppShell` renders `<main class="app-shell">` around the whole page including nav.

*Fix:* add a visually-hidden-until-focused "Skip to main content" link as the first
focusable element; move the `<main>` landmark to wrap only `.workspace-content`;
demote the outer element to a `<div>`.

### A11Y-004 — No reduced-motion handling
**SC 2.3.3 Animation from Interactions (AAA) + DTAC usability expectation · Severity: High**

No `prefers-reduced-motion` media query exists anywhere in `src/styles/`. Existing
CSS transitions (nav hover translate, select transforms) run regardless of the OS
setting. This becomes materially more serious now that `framer-motion` is in the
dependency set.

*Fix:* `src/styles/motion.css` — motion tokens plus a `prefers-reduced-motion`
block; `src/motion/index.jsx` — `MotionConfig reducedMotion="user"` wrapping the app.

### A11Y-005 — Viewport height unit breaks on mobile browsers
**SC 1.4.10 Reflow (AA), contributory · Severity: Medium**

`min-height: 100vh` in `tokens.css` and `shell.css`. On iOS/Android the dynamic
browser chrome makes `100vh` taller than the visible viewport, pushing content
under the toolbar.

*Fix:* `100dvh` with a `100vh` fallback.

### A11Y-006 — Sub-minimum target on the "Report concern" control
**SC 2.5.8 Target Size (Minimum) (AA) · Severity: Medium**

`.nav-safety-card button` sets `display: inline; min-height: 0; padding: 0` at
`--text-xs`. Computed target is roughly 78 × 15 CSS px — under the 24 × 24 minimum.
The inline-in-text exception does not apply: it is a standalone control in a card,
not a link inside a sentence.

*Fix:* keep the link appearance, restore a 24px minimum box via padding.

### A11Y-007 — Sub-12px text in the user chip
**SC 1.4.4 Resize Text (AA), contributory · Severity: Low**

`.user-chip small` is `0.68rem` (~10.9px). Below the 12px floor for legible UI text
and hostile on the older, lower-resolution displays common on ward machines.

*Fix:* raise to `--text-xs` (12px).

### A11Y-008 — No Windows High Contrast support
**SC 1.4.11 Non-text Contrast (AA), contributory · Severity: Medium**

No `forced-colors` handling. In High Contrast Mode the custom focus outline colour
is overridden by the OS and borders drawn with `box-shadow` disappear entirely,
which removes several card and nav boundaries.

*Fix:* `forced-colors: active` block in `motion.css` — drop decorative shadow,
re-assert the focus ring using the system `Highlight` colour.

### A11Y-009 — Inconsistent tabular figures in data columns
**Not an SC failure — usability / clinical safety · Severity: Medium**

`font-variant-numeric: tabular-nums` is set in exactly one place (`board.css:95`).
Everywhere else — observation tables, KPI cards, trend readouts — digits are
proportional, so columns jog as values update and vertical scanning of a numeric
column is harder than it should be. In an observations table that is a legibility
risk, not a cosmetic one.

*Fix:* apply tabular figures to all numeric cells and KPI values.

---

## 3. Findings — passed

Contrast pairs verified against WCAG relative luminance. All meet or exceed 4.5:1
for normal text.

| Pair | Ratio | Result |
|---|---|---|
| Body ink `#102033` on page `#f5f8fc` | 15.45:1 | Pass |
| Focus ring `#0b3640` on light surface `#f5f8fb` | 12.19:1 | Pass |
| Blue-ink `#0b3640` on blue-soft `#e8f3f4` | 11.48:1 | Pass |
| Selector text `#17436f` on white | 10.15:1 | Pass |
| Topbar subtitle `#dbeaf7` on `#124c56` | 7.81:1 | Pass |
| Brand `#176b75` on white | 6.18:1 | Pass |
| Green `#176b43` on green-soft `#e9f6ee` | 5.86:1 | Pass |
| Red `#b42318` on red-soft `#fdecea` | 5.75:1 | Pass |
| Amber `#8a5a00` on amber-soft `#fff4d6` | 5.41:1 | Pass |
| Nav muted `#617083` on white | 5.06:1 | Pass |
| Badge white on `#d81b60` | 4.95:1 | Pass |
| Grey-500 `#5f6f7f` on grey-50 `#f5f8fb` | 4.84:1 | Pass |
| Safety card body `#5f6f7f` on `#e8f3f4` | 4.56:1 | Pass |

Also passing on review:

- **1.4.1 Use of Colour** — risk states pair colour with an icon and a text label
  (`SafetyBanner`, `PatientSafetyPanel`); colour is not the sole carrier.
- **2.4.7 Focus Visible** — a global `:focus-visible` rule exists and covers all
  interactive roles. Its *contrast* fails on one surface only (A11Y-001).
- **4.1.2 Name, Role, Value** — icon-only controls (notifications, date stepper)
  carry `aria-label`; decorative icons carry `aria-hidden="true"`.
- **1.3.1 Info and Relationships** — navigation is a real `<nav>` with
  `aria-current="page"` on the active item; the date stepper is a labelled
  `role="group"` with an `aria-describedby` note.
- **4.1.3 Status Messages** — `aria-live="polite"` on the simulation date and the
  notifications popover.
- **3.3.7 Redundant Entry / 3.3.8 Accessible Authentication** — no authentication
  in the current build. **Must be re-tested when login lands**: allow paste, allow
  password managers, `autocomplete="current-password"`, and offer a non-cognitive
  path.

---

## 4. Clinical-safety constraint on motion

Recorded here because it is an accessibility decision with a patient-safety
consequence, and a reviewer will ask.

**No safety-bearing value is ever animated into existence.** Escalation counts,
risk-support signals, documentation gaps and observation totals render at their
final value on first paint and are present in the accessibility tree immediately.
Motion may only draw attention to a change already stated in text.

Rationale: a count-up or delayed reveal produces a window in which the screen shows
a number that is not the real number. On a ward that is a misread waiting to happen,
and a screen reader would announce a value the eye cannot yet confirm. Enforced in
code by `SafetyValue` in `src/motion/index.jsx`.

---

## 5. Scheduled work

| Item | Why | Owner | Target |
|---|---|---|---|
| Fix A11Y-001 … A11Y-009 | Open AA failures | — | this branch |
| Automated axe-core pass in CI | Catches regressions per PR | — | next |
| 200% zoom / 400% reflow (SC 1.4.10, 1.4.4) | Not yet tested | — | next |
| NVDA + JAWS pass on Windows | Primary NHS estate AT | — | before pilot |
| VoiceOver pass on iPadOS | Ward tablets | — | before pilot |
| Windows High Contrast visual pass | Verify A11Y-008 fix | — | before pilot |
| Authentication accessibility (3.3.8) | Login not yet built | — | with login |
| Published accessibility statement | Legally required for public sector | — | before pilot |
| Independent third-party audit | DTAC reviewers expect it | — | before procurement |

---

## 6. Implementation notes

Two things worth recording, because both look like arbitrary style choices and
are not.

**High-contrast rules must not use a universal selector.** The first cut of
`motion.css` stripped decorative shadow in High Contrast Mode with
`@media (forced-colors: active) { * { box-shadow: none !important; } }`. jsdom
resolves the selectors inside a media block whether or not the query matches, and
on our largest tree (`TrustNetworkView`, the full England trust network) that one
rule added **~28 seconds** per test run — enough to push the file past its 60s
timeout. Replaced with a targeted selector list; cost fell to ~0.3s with identical
behaviour in a real browser. Measured, not guessed: 91.6s clean → 127.5s with the
universal rule → 99.2s with the targeted rule.

Worth noting separately: `TrustNetworkView` takes roughly **45–60 seconds per test
to render in jsdom**. That is not caused by this work and the timeout was only ever
a symptom. A component that expensive to render is worth profiling on its own — a
ward machine will feel it.

**The on-dark focus ring needs `!important`, and this is why.** The first fix used
`.redesign-topbar :where(…):focus-visible`. `:where()` contributes zero specificity,
so that rule scores 0,1,0 — and live browser testing showed component rules beating
it: `.demo-scenario-control select:focus-visible` (0,2,1) silently restored the
1.36:1 ring, and four `.secondary-action` buttons in the topbar
(`.secondary-action:focus-visible`, 0,2,0) did the same. Six of nine topbar controls
were still failing after a fix that looked correct on paper. Enumerating the
conflicts would be brittle — the next component added to the topbar reintroduces the
bug — so the rule now wins outright. Verified live: all 9 topbar controls at 9.57:1,
content-area controls unchanged at 13:1.

**Tabular figures are set on `table`, not on every cell.**
`font-variant-numeric` inherits, so `table { … }` covers all `th`/`td` for free and
avoids matching an attribute selector against every cell.

---

## 7. Verification run

Recorded 2026-08-29 on branch `design/wardsafe-revamp`.

| Check | Result |
|---|---|
| `node scripts/a11y/contrast-check.mjs` | 15/15 pairs pass |
| `npm test` | 82/82 files, 516/516 tests pass |
| `npm run build` | Built in 19.2s. Bundle 766.6 kB / 227 kB gzipped |
| Live browser — skip link | Present, first focusable element, target `#main-content` exists |
| Live browser — `<main>` landmark | Exactly one, wraps content only, no longer contains the nav |
| Live browser — focus ring, topbar | All 9 controls at 9.57:1 (was 1.36:1) |
| Live browser — focus ring, content | Unchanged at 13:1 |
| Live browser — scenario label | `#dbeaf7` on the dark topbar (was `#617083`, 1.89:1) |
| Live browser — "Report concern" target | 99 × 27 px (was ~78 × 15 px; minimum 24 × 24) |
| Live browser — user chip text | 12px (was 10.9px) |

---

## 8. Change log

| Date | Change |
|---|---|
| 2026-08-29 | First audit. 9 findings raised, 13 contrast pairs verified. |
| 2026-08-29 | A11Y-001 … A11Y-009 fixed. Suite green, build clean. |
