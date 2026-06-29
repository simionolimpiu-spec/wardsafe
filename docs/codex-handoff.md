# Codex Handoff

Last updated: 2026-06-29 (post-PR-4 validation)
Maintainer lane: shared

This file is the shared handoff note for cross-thread coordination between Oli's Codex and Mia's Codex. Treat GitHub remote state as the source of truth when local clones disagree.

## Confirmed Remote State

Confirmed from Mia's authenticated clone against `origin`:

- `main` at `d5663c4`
- `codex/safeflow-prototype` at `2271d5e`
- `codex/ml-foundation-rebase` at `8eb555e`
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
   - State: open draft

2. PR #4
   - Title: `Rebase simulation risk-support foundation onto prototype`
   - Base: `codex/safeflow-prototype`
   - Head: `codex/ml-foundation-rebase`
   - State: open
   - This is the active review path for the ML/docs stack after PR #2 merged

3. PR #3
   - Title: `Stack simulation risk-support foundation on signal engine`
   - Base: `feature/simulation-signal-engine`
   - Head: `codex/signal-engine-ml-stack`
   - State: open draft
   - Historical bridge PR opened before PR #2 merged; superseded by PR #4 for current review

4. PR #2
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

## Current ML Stack

The current rebased integration branch is:

`codex/safeflow-prototype`
-> `codex/ml-foundation-rebase`

Relationship summary:

- `codex/ml-foundation-rebase` is `14` commits ahead of `codex/safeflow-prototype`
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

Validated on `codex/ml-foundation-rebase` at `8eb555e`:

- `vitest`: `46` files passed, `270` tests passed
- `vite build`: passed
- `playwright`: `2` tests passed

## Current Integration Rule

- Treat `codex/safeflow-prototype` as the integration branch.
- PR #2 is merged and PR #4 is now the next review gate.
- Keep `deployment/public-simulation-preview` separate until the ML/docs foundation work is integrated.
- Do not start AWS deployment execution yet.

## Next Action

Shared next sequence:

1. review and merge PR #4 into `codex/safeflow-prototype`
2. once PR #4 is accepted, close or otherwise archive PR #3 as superseded historical scaffolding
3. keep `deployment/public-simulation-preview` separate until the foundation branch is integrated
