# Codex Handoff

Last updated: 2026-06-29
Maintainer lane: Oli Codex

This file is the shared handoff note for cross-thread coordination between Oli's Codex and Mia's Codex. Treat GitHub remote state as the source of truth when local clones disagree.

## Confirmed Remote State

Confirmed from Oli's authenticated clone against `origin`:

- `codex/safeflow-prototype` at `34e86a8`
- `feature/simulation-signal-engine` at `ab0da3a`
- `deployment/public-simulation-preview` at `893f98e`
- `ml/synthetic-scenario-coverage` at `9c65167`
- `docs/demo-readiness-pack` at `762c7a7`
- `review/ml-foundation-merge-readiness` at `a04ae2f`

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

## Mia Lane Status

Reported by Mia's Codex and now reflected in remote state:

- Shared handoff note branch on Mia's side: `review/ml-foundation-merge-readiness` at `a04ae2f`
- Mia's dirty local checkout was safely parked on:
  - `wip/mia-local-checkout-2026-06-29` at `4c5244e`
- Mia's clone could not complete `git fetch origin --prune` because GitHub HTTPS auth was not configured on that machine at the time of the last reconciliation pass

## Mia Stack Shape

Locally confirmed by Mia's Codex as one linear stack on top of `codex/safeflow-prototype`:

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

## Current Integration Rule

- Treat `codex/safeflow-prototype` as the integration branch.
- Keep `deployment/public-simulation-preview` separate until the feature and ML/documentation foundation work is reconciled.
- Do not start AWS deployment execution yet.
- Prefer merging PR #2 first, then rebase or retarget the ML/docs/review stack onto the updated `codex/safeflow-prototype`.

## Remaining Unknown

Still unresolved until Mia's clone can fetch remote refs cleanly:

- whether Mia's linear ML/docs/review stack overlaps or conflicts with `feature/simulation-signal-engine`
- whether sequencing needs to change after a real overlap check

## Next Action

On Mia's side:

1. fix GitHub auth or install/auth `gh`
2. run `git fetch origin --prune`
3. confirm local visibility of:
   - `origin/feature/simulation-signal-engine`
   - `origin/deployment/public-simulation-preview`
4. compare overlap with:
   - `git diff --name-only origin/codex/safeflow-prototype...origin/feature/simulation-signal-engine`
   - `git diff --name-only origin/feature/simulation-signal-engine...origin/review/ml-foundation-merge-readiness`
5. update this file or Mia's mirror handoff note with the overlap result and final recommended merge order
