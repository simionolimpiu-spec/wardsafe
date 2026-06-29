# Codex Handoff

Last updated: 2026-06-29 (post-PR-2 merge)
Maintainer lane: Oli Codex

This file is the shared handoff note for cross-thread coordination between Oli's Codex and Mia's Codex. Treat GitHub remote state as the source of truth when local clones disagree.

## Confirmed Remote State

Confirmed from Oli's authenticated clone against `origin`:

- `codex/safeflow-prototype` at `2271d5e`
- `deployment/public-simulation-preview` at `893f98e`
- `docs/codex-handoff-sync` (shared handoff branch)
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
   - State: merged
   - Merged commit on base: `2271d5e`

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

Before PR #2 merged, both the signal-engine lane and Mia's ML/docs/review lane branched from the same merge base:

- merge base: `34e86a8` (`codex/safeflow-prototype`)
- Mia's ML/docs/review stack is a separate sibling stack
- neither stack is an ancestor of the other

## Confirmed File Overlap

The branches are mostly independent. Confirmed direct overlap between the former signal-engine branch and Mia's stack was limited to:

- `src/App.jsx`
- `src/App.test.jsx`

After PR #2 merged, Mia's top branch still differs from the updated `codex/safeflow-prototype` in many files, but the known signal-engine integration seam remains those two App files. Current post-merge diff for that seam is:

- `src/App.jsx`: `12` insertions, `1` deletion
- `src/App.test.jsx`: `4` insertions, `1` deletion

## Current Integration Rule

- Treat `codex/safeflow-prototype` as the integration branch.
- Keep `deployment/public-simulation-preview` separate until the feature and ML/documentation foundation work is reconciled.
- Do not start AWS deployment execution yet.
- PR #2 is now merged into `codex/safeflow-prototype`.
- The next required integration step is rebasing or retargeting the ML/docs/review stack onto the updated `codex/safeflow-prototype`.
- The expected post-merge integration seam is known: `src/App.jsx` and `src/App.test.jsx`

## Next Action

Shared next sequence:

1. rebase Mia's linear ML/docs/review stack onto the updated `codex/safeflow-prototype`
2. resolve the known overlap in:
   - `src/App.jsx`
   - `src/App.test.jsx`
3. open or update clean PRs for:
   - `ml/synthetic-scenario-coverage`
   - `docs/demo-readiness-pack`
   - `review/ml-foundation-merge-readiness`
4. keep `deployment/public-simulation-preview` separate until the foundation branches are integrated
