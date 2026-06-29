# Codex Handoff

Last updated: 2026-06-29 (post-main merge)
Maintainer lane: shared

This file is the shared handoff note for cross-thread coordination between Oli's Codex and Mia's Codex. Treat GitHub remote state as the source of truth when local clones disagree.

## Confirmed Remote State

Confirmed from Mia's authenticated clone against `origin`:

- `main` at `5c1f604`
- `codex/safeflow-prototype` at `d50cff5`
- `codex/ml-foundation-rebase` at `8eb555e`
- `codex/public-simulation-preview-rebase` at `b82b9b6`
- `codex/signal-engine-ml-stack` at `278bd26`
- `deployment/public-simulation-preview` at `893f98e`
- `ml/synthetic-scenario-coverage` at `9c65167`
- `docs/demo-readiness-pack` at `762c7a7`
- `review/ml-foundation-merge-readiness` at `331caea`

## Confirmed PR State

Confirmed from GitHub API using Mia's repaired repo auth:

1. PR #1
   - Title: `[codex] Build SafeFlow focused demo prototype`
   - Base: `main`
   - Head: `codex/safeflow-prototype`
   - State: merged
   - Merged commit on base: `5c1f604`

2. PR #5
   - Title: `Prepare public simulation preview on top of prototype`
   - Base: `codex/safeflow-prototype`
   - Head: `codex/public-simulation-preview-rebase`
   - State: merged
   - Merged commit on base: `d50cff5`

3. PR #4
   - Title: `Rebase simulation risk-support foundation onto prototype`
   - Base: `codex/safeflow-prototype`
   - Head: `codex/ml-foundation-rebase`
   - State: merged
   - Merged commit on base: `15e0e05`

4. PR #3
   - Title: `Stack simulation risk-support foundation on signal engine`
   - Base: `feature/simulation-signal-engine`
   - Head: `codex/signal-engine-ml-stack`
   - State: closed
   - Historical bridge PR opened before PR #2 merged; superseded and closed after PR #4 merged

5. PR #2
   - Title: `Add simulation signal engine foundation`
   - Base: `codex/safeflow-prototype`
   - Head: `feature/simulation-signal-engine`
   - State: merged
   - Merged commit on base: `2271d5e`

## Mia Lane Status

- Mia's dirty local checkout was safely parked on:
  - `wip/mia-local-checkout-2026-06-29` at `4c5244e`
- Mia's GitHub access is fixed for this repo through the macOS keychain credential helper
- Mia's clone can fetch `origin`, inspect branches, and query PR state directly

## Current Integrated Prototype State

The current integrated prototype branch is:

`codex/safeflow-prototype` at `d50cff5`

`main` now includes that prototype branch through merge commit `5c1f604`.

Relationship summary:

- `codex/ml-foundation-rebase` has already been merged into `codex/safeflow-prototype`
- the separate deployment lane was rebased onto the updated prototype as `codex/public-simulation-preview-rebase` and has now been merged
- the older review stack branches remain useful as history, but they are no longer the primary review target:
  - `review/ml-foundation-merge-readiness`
  - `codex/signal-engine-ml-stack`

## Known Integration Surface

The signal-engine overlap that needed care remains concentrated in:

- `src/App.jsx`
- `src/App.test.jsx`

Post-rebase, the active branch also includes a small test-only stabilization in:

- `infra/aws/safeflowFoundationStack.test.js`

## Validation

Validated on `codex/ml-foundation-rebase` at `8eb555e` before merge:

- `vitest`: `46` files passed, `270` tests passed
- `vite build`: passed
- `playwright`: `2` tests passed

Validated on `codex/public-simulation-preview-rebase` at `b82b9b6`:

- `vitest`: `48` files passed, `279` tests passed
- `vite build`: passed
- `playwright`: `2` tests passed
- `node infra/aws/runSynth.js --environment=simulation`: passed
- `node infra/aws/runSynth.js --environment=dev`: passed

Validated on `codex/safeflow-prototype` at `d50cff5` before merge to `main`:

- `vitest`: `48` files passed, `279` tests passed
- `vite build`: passed
- `playwright`: `2` tests passed
- `node infra/aws/runSynth.js --environment=simulation`: passed
- `node infra/aws/runSynth.js --environment=dev`: passed
- `node database/printMigrationManifest.js`: passed
- `SAFEFLOW_SIMULATION_ONLY=true node database/runMigrations.js --dry-run`: passed
- `SAFEFLOW_SIMULATION_ONLY=true node server/apiSmoke.js`: passed

## Current Integration Rule

- `main` now contains the integrated SafeFlow prototype.
- `codex/safeflow-prototype` remains the historical integration branch that fed `main`.
- PR #1, PR #2, PR #4, and PR #5 are merged.
- There are currently no open PRs.
- Keep actual AWS deployment execution manual and separate from code review.
- Do not start AWS deployment execution yet.

## Next Action

Shared next sequence:

1. keep actual AWS preview rollout manual after env setup, password protection, and smoke testing
2. use `main` as the base for any further docs, deployment, or release-prep work
3. keep Mia's parked local branch untouched until those local-only changes are intentionally revisited
