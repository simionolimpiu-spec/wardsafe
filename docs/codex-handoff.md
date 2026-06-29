# SafeFlow Codex Handoff

Last updated: 2026-06-29

This file is the shared handoff note for Codex threads working on SafeFlow. Update it from repo state, not thread memory.

## Remote access status from Mia's clone

- `git remote -v` points to `https://github.com/simionolimpiu-spec/wardsafe.git`
- `git fetch origin --prune` failed in Mia's clone with:
  - `fatal: could not read Username for 'https://github.com': Device not configured`
- `gh` is not installed in Mia's clone
- Because fetch is currently blocked here, separate anything locally confirmed from anything only reported by another authenticated clone

## Locally confirmed remote-tracking refs in Mia's clone

- `origin/codex/safeflow-prototype` -> `34e86a8`
- `origin/ml/risk-support-readonly-report` -> `12f1ba0`
- `origin/test/safety-language-regression-scan` -> `e9ce7f7`
- `origin/ml/synthetic-scenario-coverage` -> `9c65167`
- `origin/docs/demo-readiness-pack` -> `762c7a7`
- `origin/review/ml-foundation-merge-readiness` -> `1ac1955`

## Additional remote refs reported by Oli's authenticated clone

These were reported by Oli's Codex and have not yet been re-fetched successfully in Mia's clone:

- `origin/feature/simulation-signal-engine` -> `ab0da3a`
- `origin/deployment/public-simulation-preview` -> `893f98e`

## Open PRs reported by Oli's authenticated clone

These PRs were reported by Oli's Codex and have not yet been re-queried successfully from Mia's clone:

- `PR #1` `codex/safeflow-prototype` -> `main`
  - `[codex] Build SafeFlow focused demo prototype`
- `PR #2` `feature/simulation-signal-engine` -> `codex/safeflow-prototype`
  - `Add simulation signal engine foundation`

## Integration branch

- Current integration branch for the prototype stack: `codex/safeflow-prototype`

## Local branch ancestry confirmed in Mia's clone

The locally visible ML/docs/review stack is linear on top of `codex/safeflow-prototype`:

1. `34e86a8` `codex/safeflow-prototype`
2. `eb67d25` `ml/safeflow-risk-foundation`
3. `aff6d10` `ml/risk-support-contract`
4. `6ea0339` `ml: add risk support evaluation harness`
5. `12f1ba0` `ml/risk-support-readonly-report`
6. `7acaab2` `docs/codex-project-instructions`
7. `9c650b6` `docs/risk-support-technical-explainer`
8. `e9ce7f7` `test/safety-language-regression-scan`
9. `9c65167` `ml/synthetic-scenario-coverage`
10. `762c7a7` `docs/demo-readiness-pack`
11. `1ac1955` `review/ml-foundation-merge-readiness`

## Dependency map

- The ML/docs/review branches visible in Mia's clone are not independent of each other.
- They form one linear stack on top of `codex/safeflow-prototype`.
- The relationship between that stack and `feature/simulation-signal-engine` is not yet locally confirmed in Mia's clone because the feature branch ref is not currently fetchable here.
- Until that ref is fetched locally, treat `feature/simulation-signal-engine` as a likely sibling branch from `codex/safeflow-prototype`, not as something already incorporated into the ML/docs/review stack.

## Recommended merge order

1. Refresh Mia's clone from remote truth once GitHub fetch/auth works again.
2. Confirm the ancestry of `feature/simulation-signal-engine` against `codex/safeflow-prototype`.
3. Merge `PR #2` into `codex/safeflow-prototype` first, if that ancestry still holds.
4. Rebase or retarget the linear ML/docs/review stack onto the updated `codex/safeflow-prototype`.
5. Open or update clean PRs for the rebased ML/docs/review branches into `codex/safeflow-prototype`.
6. Keep `deployment/public-simulation-preview` separate until the foundation stack is merged.

## Local-only changes parked safely in Mia's checkout

Mia's dirty local checkout was preserved on:

- branch: `wip/mia-local-checkout-2026-06-29`
- commit: `4c5244e`
- commit message: `wip: park Mia local checkout before reconciliation`

Files parked there:

- `README.md`
- `server/api.test.js`
- `server/simulationRiskSupportReport.js`
- `server/simulationRiskSupportReport.test.js`
- `server/simulationWorkspaceSnapshot.test.js`
- `src/data/simulationRiskSupportReportExample.js`

## Conflict status

- No conflict check against `feature/simulation-signal-engine` is possible from Mia's clone until that ref is locally fetchable.
- The ML/docs/review stack does touch docs, tests, and deterministic risk-support files, so rebase work is likely needed if PR #2 also changes overlapping simulation-signal or review surfaces.
