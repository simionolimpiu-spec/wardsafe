# SafeFlow Design System

Version 1.5 (SF-295 foundation, SF-296 ward board, SF-297 insights night zone prototype, SF-298 insight extension, SF-300 mobile shell, SF-301 to SF-303 phone screens). This is the canonical UI specification for SafeFlow.

Every screen, component and coding agent working on SafeFlow follows this document. If a component and this document disagree, fix the component or change this document in a reviewed commit. Do not create local rules.

- Tokens: `src/styles/tokens.css` (semantic layer at the top of the file)
- Components: `src/design-system/` (`primitives/`, `clinical/`, `layout/`, `feedback/`)
- Component styles: `src/design-system/design-system.css` (loaded by `src/styles/index.css`)
- Project rules: `AGENTS.md` and `CONTROL.md`

## 1. Product posture and safety boundary

SafeFlow is a nurse-led, simulation-first clinical documentation and workflow prototype.

Safety boundary for all UI work: simulation-only, fictional patient data only, no real patient data, not for live clinical deployment, no diagnosis, no prescribing, no treatment recommendation, no automatic escalation, and human review required for every cue. SafeFlow output is not clinically validated and not for clinical decision-making.

The interface must make three things obvious at all times:

1. The data is fictional and the product is a simulation.
2. Clinical judgement stays with the nurse or clinician. SafeFlow surfaces information that needs human review.
3. Safety-relevant information (identity, allergies, escalation state, review cues) is quick to find and quick to scan.

### Branding boundary

- SafeFlow is not an NHS product and carries no NHS endorsement. No NHS logo.
- The action colour is the SafeFlow teal (`--sf-action`, #176B75). Do not use the NHS identity blue (#005EB8) as a brand colour.

## 2. Clinical visual principles

SafeFlow should feel modern, calm, precise and clinical: highly legible, information-dense, premium but restrained.

1. Meaning before decoration. Colour, weight and position show state or hierarchy, or they are not used.
2. Never colour alone. Every clinical state pairs colour with a text label, and with an icon where space allows.
3. Red is scarce. Red means genuinely critical or high-risk information only.
4. Scan first. Identity, safety context and current status sit at the top of every patient surface in a fixed order.
5. Dense, not cluttered. Group with borders, spacing and type weight. No oversized cards.
6. Quiet motion. Nothing moves around clinical information unless the user caused it.
7. Accessible by default. WCAG 2.2 AA is the floor.
8. Human review is visible. Anything rule-derived or generated is labelled as information requiring human review.

Avoid: generic AI-dashboard styling, heavy gradients, glassmorphism, neon, decorative animation, meaningless charts, consumer-app styling (very round corners, playful colour), and colour-only clinical meaning.

## 3. Colour

### 3.1 Semantic tokens

New and migrated components use semantic tokens only. Palette tokens (`--sf-blue`, `--sf-red`, `--sf-grey-*`) and legacy aliases (`--color-*`) remain for existing styles, and are the values the semantic layer points at.

| Token | Value | Use |
| --- | --- | --- |
| `--sf-background` | #F5F8FC | App canvas |
| `--sf-surface` | #FFFFFF | Panels, tables, cards |
| `--sf-surface-raised` | #FFFFFF | Dialogs and drawers (with `--sf-elevation-2`) |
| `--sf-surface-muted` | #F5F8FB | Inset areas, form wells, context strips |
| `--sf-surface-selected` | #E8F3F4 | Selected board row, paired with a left bar and `aria-current` on its button |
| `--sf-border` | #DBE3EC | Dividers and panel borders |
| `--sf-border-strong` | #7A8795 | Input and control borders (3:1 on surface) |
| `--sf-text-primary` | #14283D | Body text and values |
| `--sf-text-secondary` | #46525E | Labels and supporting text |
| `--sf-text-muted` | #5F6F7F | Metadata and timestamps (4.5:1 on surface) |
| `--sf-text-inverse` | #FFFFFF | Text on action or critical fills |
| `--sf-action` | #176B75 | Primary buttons, links, selected tabs |
| `--sf-action-hover` | #124C56 | Hover and pressed action |
| `--sf-information` | #1E5A8C | Neutral information, watch-priority cues |
| `--sf-success` | #176B43 | Completed, ready, within expected state |
| `--sf-warning` | #8A5A00 | Attention needed: allergies, blockers |
| `--sf-review` | #8A5A00 | Information requiring human review |
| `--sf-critical` | #B42318 | Genuinely critical or high-risk only |
| `--sf-disabled` | #8A96A3 | Disabled text and icons |
| `--sf-simulation` | #55606B | Simulation and fictional-data markers |
| `--sf-focus` | #0B3640 | Focus ring (with white halo) |

Each state colour has companions: `-subtle` (background), `-border` and `-solid` (bars and icons on white).

### 3.2 Clinical state semantics

| State | Colour | Meaning | Examples |
| --- | --- | --- | --- |
| `critical` | Red | Genuinely critical or high-risk | High risk patient, active escalation |
| `warning` | Amber | Needs attention | Allergies, blocker-priority cue |
| `review` | Amber, outline | Human review suggested | Review-priority cue |
| `information` | Blue | Neutral information | Watch-priority cue, monitoring |
| `success` | Green | Complete or ready | Task done, discharge ready |
| `neutral` | Slate | No clinical meaning | Category tags, learning cues |
| `simulation` | Slate, dashed | Fictional or simulated | Fictional scenario label |

Rules:

- Map data to states in one place: `src/design-system/clinical/clinicalStates.js`.
- Only map to `critical` from existing fields that already mean critical or high risk (`risk === 'High'`, `escalation === 'Active'`). Do not add clinical thresholds in the UI.
- Review cues never render red, at any priority. They are information requiring human review, not alarms.
- Missing data is `neutral` with explicit text. Green never means "no data".

### 3.3 Contrast

- Text: 4.5:1 minimum. Large text (24px, or 18.66px bold): 3:1.
- Control borders, focus rings and state icons: 3:1.
- `src/design-system/tokens.test.js` checks the key semantic pairs.

## 4. Typography

- Family: Inter (bundled locally via `@fontsource/inter`, weights 400 to 700), then the system UI stack. No remote font requests.
- Numerals: use `--sf-font-numeric` (tabular figures) for values, times, counts and identifiers.

| Token | Size / line height | Use |
| --- | --- | --- |
| `--sf-font-size-xs` | 12px / 16px | Eyebrow labels only. Never clinical values |
| `--sf-font-size-sm` | 14px / 20px | Metadata, badges, dense table cells |
| `--sf-font-size-md` | 16px / 24px | Body text, form input |
| `--sf-font-size-lg` | 18px / 26px | Section headings in panels |
| `--sf-font-size-xl` | 20px / 28px | Panel and view titles |
| `--sf-font-size-2xl` | 24px / 32px | Page titles, patient display name |
| `--sf-font-size-value` | 28px / 32px | Headline observation values |

Weights: `--sf-font-weight-regular` 400, `-medium` 500, `-semibold` 600, `-bold` 700. Do not use 800 or 900.

Rules: 14px is the minimum for clinical text. A value and its unit are one unit, and the unit is never dropped. Sentence case for headings, buttons and labels.

## 5. Spacing and sizing

4px grid: `--sf-space-1` 4px, `-2` 8px, `-3` 12px, `-4` 16px, `-5` 20px, `-6` 24px, `-8` 32px, `-10` 40px, `-12` 48px.

The legacy `--space-*` scale (4, 6, 8, 12, 16, 20...) stays for existing styles. New code uses `--sf-space-*`.

- Interactive targets: `--sf-target-min` 44px. Dense desktop tables may use `--sf-target-compact` 36px. Never below 24px.
- Related items: `--sf-space-2`. Groups: `--sf-space-4`. Sections: `--sf-space-6`.

## 6. Shape and elevation

| Token | Value | Use |
| --- | --- | --- |
| `--sf-radius-xs` | 4px | Badges, chips, inputs |
| `--sf-radius-sm` | 8px | Buttons, cue cards, notices |
| `--sf-radius-md` | 12px | Panels and drawers |
| `--sf-radius-pill` | 999px | Count badges only |
| `--sf-status-bar-width` | 4px | Left status bar on cues and notices |
| `--sf-elevation-0` | none | Default: flat with a border |
| `--sf-elevation-1` | subtle | Sticky panels |
| `--sf-elevation-2` | medium | Dialogs, drawers |

Depth comes from borders and background steps first. `--sf-radius-lg` (16px) and `--sf-radius-xl` (20px) are legacy and are not used by new components.

## 7. Iconography

- lucide-react only. Sizes: `--sf-icon-sm` 16px, `--sf-icon-md` 20px, `--sf-icon-lg` 24px.
- Icons are decorative (`aria-hidden="true"`). Meaning always lives in adjacent text.
- One icon per state, defined in `clinicalStates.js`.
- Siren icons are for escalation only, never for review cues.

## 8. Interaction states

| State | Treatment |
| --- | --- |
| Hover | Background step or border darkening. No lift or scale on clinical content |
| Focus | 3px `--sf-focus` outline, 3px offset, white halo (global rule in tokens.css) |
| Active / selected | `--sf-action` text with a 3px underline (tabs) or `--sf-surface-selected` fill (rows) |
| Disabled | `--sf-disabled` text on `--sf-disabled-subtle`, `cursor: not-allowed`, and an accessible reason where it matters |
| Loading | Static text in a `role="status"` region. No spinners near clinical values |
| Error (system) | Warning styling with text. Never critical red, so it is not mistaken for a clinical alert |

## 9. Motion policy

Tokens: `--sf-duration-fast` 120ms, `--sf-duration-base` 160ms, `--sf-duration-slow` 220ms, `--sf-ease-standard`.

Allowed: hover and focus transitions, disclosure opening (chevron rotation), drawer and dialog open and close, navigation transitions, non-clinical loading transitions.

Not allowed: flashing, pulsing or bouncing alerts, movement around observations or cues, animation that delays clinical information, continuous decorative animation, motion that changes perceived severity.

`prefers-reduced-motion: reduce` sets all `--sf-duration-*` tokens to 0ms, and a global rule in tokens.css removes transitions and animations.

## 10. Accessibility (WCAG 2.2 AA)

- Semantic HTML: `aside`, `section` with headings, `dl` for label and value pairs, `article` for each cue, native `details` for disclosures.
- Keyboard: every control is reachable. Tabs use roving tabindex with arrow keys, Home and End.
- Names: regions and icon-only controls have accessible names.
- Status: never colour alone. State text is always visible.
- Live regions: status messages use `role="status"`. Review cues never use `role="alert"`.
- Targets: 44px, see section 5. Reflow: no page-level horizontal scroll at 320px.

## 11. Desktop, tablet and mobile

| Width | Context | Behaviour |
| --- | --- | --- |
| 1180px and above | Ward workstation | Board and patient panel side by side. Panel is sticky |
| 860 to 1179px | Bedside tablet | Single column. Patient panel follows the board |
| 860px and below | Handheld and portrait tablet | Mobile shell (section 17). Single column. Patient banner content wraps and never truncates identity or allergies |

Breakpoints in use: 520, 620, 860, 920, 960, 1050, 1180 and 1400px. New work uses `--sf-bp-sm` 620px, `--sf-bp-md` 860px, `--sf-bp-lg` 1050px and `--sf-bp-xl` 1180px, written as literals in media queries and documented here.

At narrow widths, keep this order and move secondary content (SBAR, audit, integrations) behind tabs rather than shrinking it.

## 12. Patient-context hierarchy

Every patient surface opens with the patient banner, in this order:

1. Identity: display name, simulation identifier, age
2. Simulation context: the "Fictional scenario" label
3. Location and context: ward, hospital and responsible nurse, where the data has them
4. Allergies: always shown, as the list, "None recorded in this simulation record", or "Allergy information not available"
5. Current safety and review status: risk, escalation state, and the human review line

Rules: do not invent fields the data model does not hold (no NHS number, date of birth, bed or consultant until the data exists). Missing fields are omitted, not faked. The banner sits outside the tabs so it stays visible on every tab.

## 13. Safety and review cue hierarchy

A review cue is information requiring human review. It is never an AI decision, a diagnosis, a treatment recommendation or an automatic escalation.

The review cue group always shows, in order:

1. Title: "Simulation Review Cues"
2. Boundary: "Simulation-only cues. Human review required." and "Simulation output for preview only. Not clinically validated and not for clinical decision-making."
3. Provider notes where present
4. The cues, in the order the signal engine returns them

Each cue (`ReviewCue`) contains:

1. `ReviewCueMetadata`: category and priority as text badges
2. Title and explanation (wording comes from the signal engine and its output guard, and is never rewritten in the UI)
3. `ReviewCueEvidence`: evidence to check, freshness and missing data, visible by default
4. The human review action line
5. `ReviewCueRationale`: a "Why flagged" disclosure with rule, rationale and threshold, when present

Priority presentation:

| Priority | State | Icon |
| --- | --- | --- |
| `blocker` | warning | Octagon alert |
| `review` | review | Eye |
| `watch` | information | Info |
| `learning` | neutral | Graduation cap |

## 14. Component conventions

- Reusable components take data through props and never contain patient-specific data.
- Components render only what they receive. Missing values show "Not recorded" or are omitted.
- Class names use the `sf-` prefix with BEM-style parts (`sf-review-cue__title`).
- Styles use semantic tokens only. `src/design-system/tokens.test.js` fails on raw colours in `design-system.css`.
- Tone classes (`sf-tone-critical` and so on) set local `--sf-tone-*` properties that components read.
- No new npm packages without a written case in the pull request: why existing code cannot do it, licence, maintenance and security.
- Componentry, Cult UI and similar libraries may inform structure. They are not installed and their visual effects are not copied.

Component inventory in v1.1:

| Layer | Components |
| --- | --- |
| Primitives | `Badge` |
| Clinical | `clinicalStates`, `ClinicalStatusBadge`, `ClinicalValue`, `SafetyStatus`, `SimulationLabel`, `PatientIdentityBlock`, `PatientContextStrip`, `PatientBanner`, `ReviewCue`, `ReviewCueGroup`, `ReviewCueMetadata`, `ReviewCueEvidence`, `ReviewCueRationale`, `WardBoardPatientCell`, `WardBoardStatusCell` |
| Layout | `InformationPanel` |
| Feedback | `EmptyState` |

Planned for Phase 2: ObservationTrend, TaskList, Timeline, button primitives, and migration of the remaining legacy CSS partials onto semantic tokens.

## 15. Ward board

The Ward Safety Board is the second design-system screen. It retains a native table with `th scope="col"`, inside a named, keyboard-focusable `.table-scroll` region. Column order is the same visually and in the DOM at every width:

1. Fictional label: simulation identifier and display name together in `WardBoardPatientCell`. The existing header text is retained for accessibility-test compatibility. The button keeps `Open {name} ({id})` as its accessible name.
2. Risk: one `ClinicalStatusBadge`, followed by recorded flags as neutral outline badges. No fallback flag is invented.
3. Escalation status.
4. Next action: the existing recorded text, unchanged.
5. NEWS2: `ClinicalValue`, the recorded value and the existing band as visible text.
6. Responsible fictional nurse.
7. Handover %: static progress ring with its existing accessible label.
8. Discharge-ready.

`WardBoardStatusCell` wraps `ClinicalStatusBadge` for risk, escalation and discharge readiness. The existing `riskStatus` and `escalationStatus` mappings are unchanged. The new presentation mappers live only in `clinicalStates.js`:

| Mapper | Recorded input | Presentation |
| --- | --- | --- |
| `dischargeReadinessStatus` | `true` / `false` | success, "Ready" / review, "Needs review" |
| `dischargeReadinessStatus` | Missing or unknown | neutral, "Not recorded" |
| `news2BandStatus` | Existing `getNews2Band` output `normal` | neutral, "Normal band" |
| `news2BandStatus` | Existing `getNews2Band` output `watch` / `high` | warning, "Watch band" / "High band" |
| `news2BandStatus` | Missing or unknown | neutral, "Not recorded" |

`getNews2Band` remains unchanged. Missing NEWS2 bypasses band calculation and shows "Not recorded" without a band. No UI thresholds or new clinical calculations are introduced. Red remains reserved for High risk and active escalation; a NEWS2 band alone does not introduce another red state.

Summary cards retain the five existing metric labels and display recorded values through `ClinicalValue` with tabular numerals. They use neutral styling and do not infer severity from aggregate counts. Missing metrics are explicit; a recorded zero remains zero.

Selection combines `--sf-surface-selected`, a left bar and `aria-current="true"` on the open-patient button. Buttons retain 44px targets. The handover ring does not animate; row and control feedback use hover/focus transitions with duration tokens. No new tokens are required.

At 860px and below, identity, risk, escalation and next action remain the first columns. Secondary columns remain accessible by scrolling within `.table-scroll`; table semantics and content are retained. Summary cards reflow to two columns and then one at 520px. Neither the board nor its cards may cause page-level horizontal scroll at 320px.

The board displays "Simulation-only", "Human review required", and "Not clinically validated and not for clinical decision-making". The application safety boundary remains unchanged. Inside the patient panel, the potassium safety-gap evidence grid always stacks into one column, including on wide workstations; its text and regions remain unchanged.

The raw-colour guard covers `design-system.css`, `panel.css` and `board.css`.

## 16. Insights night zone (SF-297 prototype, SF-298 extension)

SafeFlow has two visual zones.

| Zone | Screens | Look |
| --- | --- | --- |
| Clinical | Ward board, patient panel, handover, escalations, observations, tasks, discharges | Light, calm, restrained. Sections 2 to 15 apply in full |
| Insight | Hospital Insights, Trust Network and Patient Journey Twin. The presentation-mode shell remains unchanged | May use the night view: dark surfaces, larger numerals, richer charts, one-off chart entry motion |

Rules for the night view:

- Opt-in only, by adding `.sf-zone-night` to the insight view root. It is never applied to a clinical screen. `src/design-system/tokens.test.js` checks the clinical components for it.
- The night palette lives in `tokens.css` under `.sf-zone-night`. It redefines the semantic layer, the legacy palette and the legacy `--color-*` aliases, because aliases resolve at `:root` and would otherwise stay light.
- Scoped night styles live in `src/styles/insights-night.css` and use tokens only. Trust Network uses semantic tokens throughout `trust-network.css`, which is included in the raw-colour guard. Twin overrides are scoped to its insight root; the shared `scenario-and-audit.css` is unchanged.
- The simulation boundary, "Illustrative model output, not clinically validated", the data source note and every safety wording stay visible and unchanged. Only colours change.
- Night text and state pairs meet 4.5:1 contrast; borders and focus rings meet 3:1. Token tests and desktop/mobile browser checks cover the SF-298 surfaces, including nested source and human-review notes.
- Charts may animate once on entry (600ms). No looping, pulsing or glow animation. Reduced motion turns it off.
- Canvas charts cannot read CSS custom properties, so `HospitalInsightsView.jsx` mirrors the chart colours for both themes in one place.
- Accents allowed only in this zone: one soft radial glow behind the view, a 1px top highlight on cards, cyan accent text. No glassmorphism, neon or gradients on data.
- Each insight surface has a "Night view" toggle (`aria-pressed`), a `data-sf-theme` attribute and a `defaultTheme` prop. Unknown themes fall back to standard. Presentation mode opens Hospital Insights, Trust Network and Patient Journey Twin in night view by default; users can switch back.
- Trust Network observation strips remain plain, neutral text, with no glow or added state coding. SF-298 introduces no animation; Twin sparklines and observation values remain static.
- The existing clinical-screen exclusion test is retained in full. Browser checks also verify that presentation mode never applies the night zone to clinical screens.

## 17. Mobile shell (SF-300)

At 860px and below the app shell switches to a phone layout, so content is on screen straight away. Above 860px the desktop sidebar and top bar are unchanged.

| Part | Phone behaviour |
| --- | --- |
| Simulation boundary | Always visible, compact type. Wording unchanged |
| Top bar | Brand, current screen name and a ward toggle ("Ward and demo controls: <ward>"). The ward toggle opens the ward and review focus pickers, date stepper, notifications, user chip and report buttons |
| Bottom tab bar | "Quick navigation": Board, Patients, Obs, Tasks, More. Fixed to the bottom, 64px tall, respects the safe area |
| More sheet | The full "SafeFlow workspace" navigation (all 16 screens), the Safety first card and the ward context, in a bottom sheet |

Rules:

- Components: `src/components/MobileTabBar.jsx`, `WorkspaceNav.jsx` (sheet mode) and `AppShell.jsx`. Styles live in `src/styles/mobile-shell.css`, which uses tokens only and is in the raw-colour guard.
- Everything stays in the DOM. The mobile panels are hidden by CSS, so desktop, print and unit tests see the same markup. `.shell-context` uses `display: contents` above 860px, so the desktop top bar grid does not change.
- The current tab shows a top bar, heavier label and `aria-current="page"`. Never colour alone. More is marked current when the active screen is not one of the four tabs.
- The More button has `aria-expanded` and `aria-controls="workspace-nav"`. Opening moves focus to the current screen in the list. Escape, Close menu or tapping the scrim closes it and returns focus to More. Choosing a screen closes it.
- Tab and toggle targets are at least 44px. The task count badge uses the action colour, not red.
- Content has bottom padding equal to the tab bar plus `--sf-space-4`, so the tab bar never covers the last item.
- Presentation mode keeps its content and wording on a phone but drops its projector-sized padding, which pushed the page wider than the screen.
- Tokens: `--sf-mobile-tabbar-height`, `--sf-mobile-scrim`, `--sf-z-mobile-scrim`, `--sf-z-mobile-sheet`, `--sf-z-mobile-tabbar`.
- E2E: `e2e/mobile-shell.spec.js`. Other e2e specs reach screens through `e2e/shell.js`, which opens More only when the mobile shell is showing.

### 17.1 Phone screens (SF-301 to SF-303)

- Trust Network: each hospital shows its first ward trend open. The rest sit behind one native `details` disclosure ("Show N more ward trends"), with a 44px summary. Every trend stays in the DOM with unchanged wording, and the first trend in each hospital keeps its human-review note visible. This applies at every width.
- Long lists of repeated panels follow the same pattern: show the first, collapse the rest, never hide boundary or human-review wording on what is shown.
- At 860px and below, Trust Network text is at least 12px (`--sf-font-size-xs`) and the ward day pickers are 44px tall.
- At 620px and below, operational and workflow views and the Twin panels use `--sf-space-3` padding, so content gets the width. Wide tables and chapter strips keep their own sideways scroll inside the card. The page itself never scrolls sideways.
- Text on the deep teal top bar uses `--sf-text-on-shell` or `--sf-text-on-shell-secondary` on `--sf-shell-bar`. Both pairs are in the token contrast tests. Light-surface greys are never used on the bar.
