# Codex Handoff

Last updated: 2026-06-29 (post-reconciliation)
Maintainer lane: Oli Codex

This file is the shared handoff note for cross-thread coordination between Oli's Codex and Mia's Codex. Treat GitHub remote state as the source of truth when local clones disagree.

## Confirmed Remote State

Confirmed from Oli's authenticated clone against `origin`:

- `codex/safeflow-prototype` at `34e86a8`
- `feature/simulation-signal-engine` at `ab0da3a`
- `deployment/public-simulation-preview` at `893f98e`
- `docs/codex-handoff-sync` at `8ffc173`
- `ml/synthetic-scenario-coverage` at `9c65167`
- `docs/demo-readiness-pack` at `762c7a7`
- `review/ml-foundation-merge-readiness` at `32494d9`

## Confirmed Open PRs

Confirmed from GitHub on Oli's side:

1. PR #1
   - Title: `[codex] Build SafeFlow focused demo prototype`
   - Base: `main`
   - Head: `codex/safeflow-prototype`
   - State: open draft

2. PR #2
   - Title: `Add simulation signal engine foundation`
   - Base: `codex/safeflow-prototype`
   - Head: `feature/simulation-signal-engine`
   - State: open
   - Merge state: clean
   - Checks: green

## Mia Lane Status

Reported by Mia's Codex and now reflected in remote state:

- Shared handoff note branch on Mia's side: `review/ml-foundation-merge-readiness` at `32494d9`
- Mia's dirty local checkout was safely parked on:
  - `wip/mia-local-checkout-2026-06-29` at `4c5244e`
- Mia's GitHub access is now fixed for this repo through the macOS keychain credential helper
- Mia's clone can now fetch `origin` and confirm PR state directly

## Mia Stack Shape

Confirmed by Mia's Codex as one linear stack on top of `codex/safeflow-prototype`:

`codex/safeflow-prototype`
-> `ml/safeflow-risk-foundation`
-> `ml/risk-support-contract`
-> `ml: add risk support evaluation harness`
-> `ml/risk-support-readonly-report`
-> `docs/codex-project-instructions`
-> `docs/risk-support-technical-explainer`
-> `test/safety-language-regression-scan`
-> `ml/synthetic-scenario-coverage`
-> `docs/demo-readiness-pack`
-> `review/ml-foundation-merge-readiness`

## Branch Relationship

Both the signal-engine lane and Mia's ML/docs/review lane branch from the same merge base:

- merge base: `34e86a8` (`codex/safeflow-prototype`)
- `feature/simulation-signal-engine` is a sibling branch
- Mia's ML/docs/review stack is a separate sibling stack
- neither stack is an ancestor of the other

## Confirmed File Overlap

The branches are mostly independent. Confirmed direct overlap between:

- `feature/simulation-signal-engine`
- `review/ml-foundation-merge-readiness`

is limited to:

- `src/App.jsx`
- `src/App.test.jsx`

## Current Integration Rule

- Treat `codex/safeflow-prototype` as the integration branch.
- Keep `deployment/public-simulation-preview` separate until the feature and ML/documentation foundation work is reconciled.
- Do not start AWS deployment execution yet.
- Prefer merging PR #2 first, then rebase or retarget the ML/docs/review stack onto the updated `codex/safeflow-prototype`.
- The expected post-merge integration seam is now known and narrow: `src/App.jsx` and `src/App.test.jsx`

## Next Action

Shared next sequence:

1. merge PR #2:
   - `feature/simulation-signal-engine` -> `codex/safeflow-prototype`
2. rebase Mia's linear ML/docs/review stack onto the updated `codex/safeflow-prototype`
3. resolve the known overlap in:
   - `src/App.jsx`
   - `src/App.test.jsx`
4. open or update clean PRs for:
   - `ml/synthetic-scenario-coverage`
   - `docs/demo-readiness-pack`
   - `review/ml-foundation-merge-readiness`
5. keep `deployment/public-simulation-preview` separate until the foundation branches are integrated
