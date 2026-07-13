# SafeFlow — NHS-realistic v2 Visual Concept (SF-202)

Status: simulation-only prototype. Fictional data only. Not for clinical use. This is a design-direction concept, not a build instruction and not a clinical interface specification.

`master-narrative.md` is the controlled wording source. This concept must never introduce wording that positions SafeFlow as replacing the EPR, RRT/Call-for-Concern, or any live clinical or quality system.

## Purpose

Give a graphic designer (and the dev team) a clear, safe visual direction for a cleaner, more NHS-realistic "version 2" look — calm, clinical-grade, trustworthy, and non-alarming — without changing what SafeFlow does or weakening any safety boundary. Everything here is a suggestion to react to, not a locked spec.

## Design principles

1. **Calm over urgent.** SafeFlow surfaces review cues for human review, not alarms. The visual language should feel considered and quiet, never like a live alerting system. Avoid red-dominant "alert" aesthetics; reserve strong colour for genuine emphasis only.
2. **Clinical-grade legibility.** High contrast, generous spacing, clear hierarchy. Assume tired eyes on an old laptop screen at the end of a shift.
3. **Accessible by default.** WCAG 2.1 AA minimum: 4.5:1 text contrast, visible focus states, colour never the only signal (pair colour with text/icon), 44px touch targets.
4. **Honest framing everywhere.** The simulation-only / not-for-clinical-use banner is part of the design, always visible, never an afterthought.
5. **Customisable + minimal.** Prefer a small, token-driven system a Trust could re-skin, over bespoke per-screen styling.

## Colour direction (concept, colour-blind-safe)

Use design tokens (do not hardcode). Suggested roles — final hex values to be confirmed with the designer against contrast tooling:

- **Surface / background:** near-white, cool neutral; a single subtle elevated surface for cards.
- **Primary / brand:** a calm NHS-adjacent teal or blue (avoid implying official NHS branding — this is a prototype, not an NHS product).
- **Status roles (paired with text + icon, never colour alone):**
  - *Review / watch* — amber, muted.
  - *Blocker* — deep red, used sparingly and only for genuine blockers.
  - *Confirmed / verified* — green, calm.
  - *Neutral / informational* — slate/grey.
- **Text:** near-black on light; ensure 4.5:1 everywhere.

## Typography & spacing

- One humanist sans family, 3–4 weights max. Clear type scale (e.g. 12/14/16/20/28/36) via tokens.
- Reduce the current over-use of very heavy weights; use size + spacing for hierarchy instead of weight alone.
- Generous line-height and card padding for a calmer, less dense feel.

## Component notes

- **Safety banner:** persistent, legible, never obscured; part of the layout, not a dismissible toast.
- **Review-cue cards:** consistent structure (what changed / why flagged / what a human should check); status shown by a labelled chip, not colour alone.
- **Ward Quality & Safety Review export:** print-clean; the same calm hierarchy translates to the exported/printed report.
- **Charts (Hospital Insights):** restrained palette, direct labels over legends where possible, "Illustrative model output, not clinically validated" retained.
- **Navigation:** simple, keyboard-first, no horizontal-scroll chip strips on mobile.

## What NOT to change

- No new clinical claims, no diagnosis/prescribing/escalation-automation language, no staff scoring/ranking visuals.
- Do not name or imply any competitor product or official NHS endorsement.
- Do not remove or de-emphasise the simulation-only boundary.

## Suggested next step

Hand this concept to the graphic designer alongside `quality-intelligence-one-pager.md` and the live demo (`live-site-demo-walkthrough.md`). Ask for: a token set (colours/type/spacing) and 2–3 example screens. Any resulting change lands as additive, token-driven CSS — no behaviour or boundary change.
