# Codex Handoff

Last updated: 2026-06-29

This file is the shared handoff note for cross-thread coordination between Oli's Codex and Mia's Codex. Treat GitHub remote state as the source of truth when local clones disagree.

## Confirmed Remote State

Confirmed from Mia's clone after GitHub auth was repaired and `git fetch origin --prune` succeeded:

- `main` at `d5663c4`
- `codex/safeflow-prototype` at `34e86a8`
- `codex/signal-engine-ml-stack` at `278bd26`
- `feature/simulation-signal-engine` at `ab0da3a`
- `deployment/public-simulation-preview` at `893f98e`
- `docs/codex-handoff-sync` at `8ffc173`
- `ml/risk-support-readonly-report` at `12f1ba0`
- `ml/synthetic-scenario-coverage` at `9c65167`
- `docs/demo-readiness-pack` at `762c7a7`
- `review/ml-foundation-merge-readiness` at `32494d9`
- `test/safety-language-regression-scan` at `e9ce7f7`

## Confirmed Open PRs

Confirmed from GitHub API using Mia's repaired GitHub credential path:

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

- Mia's dirty local checkout was safely parked on:
  - `wip/mia-local-checkout-2026-06-29` at `4c5244e`
- Local-only files preserved there:
  - `README.md`
  - `server/api.test.js`
  - `server/simulationRiskSupportReport.js`
  - `server/simulationRiskSupportReport.test.js`
  - `server/simulationWorkspaceSnapshot.test.js`
  - `src/data/simulationRiskSupportReportExample.js`
- Mia's clone now has working GitHub fetch auth via:
  - local repo config `credential.helper=/Library/Developer/CommandLineTools/usr/libexec/git-core/git-credential-osxkeychain`

## Mia Stack Shape

Locally confirmed as one linear stack on top of `codex/safeflow-prototype`:

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

## Branch Dependency Map

- `feature/simulation-signal-engine` is a sibling branch from `codex/safeflow-prototype`, not an ancestor of the ML/docs/review stack.
- `review/ml-foundation-merge-readiness` is also a sibling branch from `codex/safeflow-prototype` once viewed against remote refs.
- Merge base:
  - `merge-base(feature/simulation-signal-engine, codex/safeflow-prototype) = 34e86a8`
  - `merge-base(feature/simulation-signal-engine, review/ml-foundation-merge-readiness) = 34e86a8`
- Neither branch is an ancestor of the other.

## Overlap Check

Files changed by `feature/simulation-signal-engine` relative to `codex/safeflow-prototype`:

- `docs/public-demo-pack/safety-boundary.md`
- `src/App.jsx`
- `src/App.signalWiring.test.jsx`
- `src/App.test.jsx`
- `src/components/PatientSafetyPanel.jsx`
- `src/components/PatientSafetyPanel.test.jsx`
- `src/domain/signalEngine.js`
- `src/domain/signalEngine.test.js`
- `src/domain/signalOutputGuard.js`
- `src/domain/signalOutputGuard.test.js`
- `src/state/simulationWorkspace.js`
- `src/state/simulationWorkspace.test.js`

Files changed by `review/ml-foundation-merge-readiness` relative to `codex/safeflow-prototype` include risk-support domain/server work, docs, tests, and:

- `src/App.jsx`
- `src/App.test.jsx`

Confirmed direct overlap between the feature branch and Mia's review stack:

- `src/App.jsx`
- `src/App.test.jsx`

Interpretation:

- the branches are mostly independent
- a targeted rebase or merge-resolution pass will be needed in `src/App.jsx` and `src/App.test.jsx`
- broader conflicts are not currently indicated by the file-level comparison

## Integration Rehearsal

Mia prepared and pushed an integrated rehearsal branch:

- `codex/signal-engine-ml-stack` at `278bd26`

This branch starts from `origin/feature/simulation-signal-engine` and replays Mia's ML/docs/review stack on top of it.

Observed integration result:

- initial cherry-pick conflict occurred in `src/App.test.jsx`
- the conflict was resolved by keeping both:
  - signal-engine handover risk-support expectations
  - Mia's patient-specific handover/discharge expectations
- no additional cherry-pick conflicts occurred
- a follow-up assertion tweak was committed so the test targets the exact `Medical plan unclear` checklist item

Validation on `codex/signal-engine-ml-stack`:

- targeted integration test set: passed
- `pnpm test`: passed
- `pnpm run build`: passed
- `pnpm audit --audit-level=moderate`: could not run exactly because there is no `pnpm-lock.yaml`
- closest equivalent `pnpm dlx npm@10.9.2 audit --audit-level=moderate`: completed with `1 low` severity `esbuild` advisory only
- `pnpm run e2e`: passed
- `pnpm run db:manifest`: passed
- `pnpm run infra:synth:dev`: passed
- `pnpm run infra:synth:simulation`: passed
- `SAFEFLOW_SIMULATION_ONLY=true pnpm run db:migrate:plan`: passed

Interpretation:

- the integration is already proven locally
- after PR #2 merges, rebasing Mia's stack should be routine rather than exploratory
- the known seam remains `src/App.jsx` and `src/App.test.jsx`, but it is now a solved seam

## Current Integration Rule

- Treat `codex/safeflow-prototype` as the integration branch.
- Keep `deployment/public-simulation-preview` separate until the feature and ML/documentation foundation work is reconciled.
- Do not start AWS deployment execution yet.

## Recommended Merge Order

1. Review and merge PR #2 `feature/simulation-signal-engine` -> `codex/safeflow-prototype`.
2. Rebase or retarget the linear ML/docs/review stack onto the updated `codex/safeflow-prototype`.
3. Resolve the expected overlap in:
   - `src/App.jsx`
   - `src/App.test.jsx`
4. Open or update clean PRs for:
   - `ml/synthetic-scenario-coverage`
   - `docs/demo-readiness-pack`
   - `review/ml-foundation-merge-readiness`
5. Use `codex/signal-engine-ml-stack` as the working reference if a ready-made integration comparison is helpful.
6. Keep `deployment/public-simulation-preview` as a later separate PR.

## Remaining Follow-up

- Decide which handoff branch becomes canonical long-term:
  - `docs/codex-handoff-sync`
  - `review/ml-foundation-merge-readiness`
- After PR #2 merges, refresh this file with the rebased SHAs for the ML/docs/review stack.
