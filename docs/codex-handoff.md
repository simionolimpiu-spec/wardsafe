# Codex Handoff

Last updated: 2026-06-30

This file is the shared handoff note for cross-thread coordination between Oli's Codex and Mia's Codex. Treat GitHub remote state and deployed AWS state as the source of truth when local clones disagree.

## Confirmed Remote State

Confirmed from Mia's working clone at `/private/tmp/safeflow-next` after `git fetch origin --prune`:

- `main` at `5c1f604`
- `codex/safeflow-prototype` at `d50cff5`
- `deployment/public-simulation-preview` at `1696d98`
- `feature/simulation-signal-engine` at `ab0da3a`
- `ml/risk-support-readonly-report` at `12f1ba0`
- `ml/synthetic-scenario-coverage` at `9c65167`
- `docs/demo-readiness-pack` at `762c7a7`
- `review/ml-foundation-merge-readiness` at `331caea`
- `docs/codex-handoff-sync` at `693a790`
- `codex/ml-foundation-rebase` at `8eb555e`
- `codex/public-simulation-preview-rebase` at `b82b9b6`
- `codex/signal-engine-ml-stack` at `278bd26`
- `test/safety-language-regression-scan` at `e9ce7f7`

## Confirmed Open PRs

Confirmed from the GitHub API with Mia's local Git credential:

1. PR #6
   - Title: `[codex] Add public API ingress for simulation preview`
   - Base: `codex/safeflow-prototype`
   - Head: `deployment/public-simulation-preview`
   - State: open draft
   - URL: `https://github.com/simionolimpiu-spec/wardsafe/pull/6`

Earlier prototype, signal-engine, ML-foundation and deployment-prep PRs have already been merged or superseded. PR #6 is now the active review surface.

## Live Preview State

The public simulation preview has been deployed.

- Frontend: `https://preview.d3etfd425b4rlk.amplifyapp.com/`
- Amplify app: `safeflow-public-simulation-preview`
- Amplify app id: `d3etfd425b4rlk`
- Amplify branch: `preview`
- Amplify branch stage: `DEVELOPMENT`
- Amplify Basic Auth: enabled
- Live preview smoke was last re-verified after the provider-metadata hardening deploy on `deployment/public-simulation-preview`
- Backend stack: `safeflow-simulation-foundation`
- Backend stack status: `UPDATE_COMPLETE`
- Backend public API output: `https://nlork7u5ziyhwbjmoplexuw4rq0tnwah.lambda-url.eu-west-2.on.aws/`
- Backend region: `eu-west-2`
- AWS account: `334807430803`
- AWS CLI profile used locally: `safeflow-free-tier`

Do not commit or post the Basic Auth password, AWS access keys, or `SAFEFLOW_PREVIEW_ACCESS_TOKEN`. Share preview credentials only out-of-band with named reviewers.

## Validation Completed

- Full unit test suite passed: 48 files, 285 tests.
- Frontend production build passed.
- `pnpm audit --audit-level=moderate` found no known vulnerabilities.
- E2E suite passed: 2 tests across desktop and mobile Chromium.
- Migration manifest and simulation migration dry-run passed.
- Infra synth passed for `dev` and `simulation`.
- CDK deploy preflight passed with the non-root IAM user.
- CloudFormation update completed successfully.
- Amplify manual deployment job `1` completed with `SUCCEED`.
- Hosted browser smoke test confirmed:
  - page title `SafeFlow`
  - heading `SafeFlow`
  - visible simulation safety boundary
- Backend smoke tests confirmed:
  - direct API call without preview token returns `401`
  - tokened `/api/health` returns simulation metadata
  - tokened `/api/simulation/workspace` returns fictional database-backed SafeFlow data
- Repo recheck path now exists: set `SAFEFLOW_PREVIEW_API_URL` plus `SAFEFLOW_PREVIEW_ACCESS_TOKEN`, then run `npm run api:smoke:preview`.
- Hosted preview API smoke now passes against the deployed `PublicApiUrl`; it verifies route availability, token gating, schema stability, and simulation audit read/write behavior.
- Hosted preview API smoke does not validate clinical correctness or clinical decision quality.
- On the deployed preview stack, signals and risk suggestions currently return simulation-safe placeholder providers rather than ML-backed database read models.
- The preview must not be described as clinically validated decision support.

## Current Integration Rule

- Treat `codex/safeflow-prototype` as the integration branch for PR #6.
- Keep public-preview credentials out of repo history and PR comments.
- Do not merge PR #6 until the deployed preview has been reviewed with named collaborators.
- Do not treat this preview as a clinical deployment, live NHS system, or approval to use real patient data.
- Treat the hosted preview URL and GitHub PR #6 as the current reviewer entry points.

## Remaining Follow-up

1. Review PR #6 against the live preview using `docs/public-demo-pack/review-checklist.md`.
2. Confirm the Basic Auth password and preview token are shared only through a private channel.
3. Decide whether to keep the preview live, rotate credentials, or tear it down after review.
4. If the preview remains live, monitor AWS budget alerts and retained resources and rerun `npm run api:smoke:preview` after any redeploy or credential rotation.
5. Replace placeholder signal and risk providers with ML-backed DB read models, keeping explicit provider metadata and no silent fallback outside preview/simulation mode.
6. After PR #6 review, either merge into `codex/safeflow-prototype` or keep it draft while follow-up hardening lands.

## Final Preview Hardening Summary

- Branch/commit: `deployment/public-simulation-preview` at `bd0dba4`.
- Stack: `safeflow-simulation-foundation` previously redeployed for the public preview; this pass is documentation and frontend hardening only.
- Checks: `npm test`, `npm run build`, `CI=1 npm run e2e`, `CI=1 npm run a11y`, `node infra/aws/deploymentPreflight.js`, and `pnpm audit --audit-level=moderate --prod` all passed in this pass.
- Safe to demo: yes, as a simulation-safe public preview for workflow demonstration and stakeholder discovery.
- Still simulated: placeholder providers remain in use for `/api/simulation/signals` and `/api/simulation/risk-suggestions`.
- Not appropriate to claim: clinical validation, clinical decision support, live NHS integration, or deployment-ready safety assurance.
- Merge recommendation: ready for final review and merge once the PR comment is posted and the reviewer agrees the release language is acceptable.

## PR #6 Comment Draft

Final preview hardening summary

- Branch/commit: `deployment/public-simulation-preview` at `bd0dba4`.
- Stack: `safeflow-simulation-foundation` redeployed; hosted smoke re-verified against the live Lambda URL.
- Checks: `npm test`, `npm run build`, `CI=1 npm run e2e`, `CI=1 npm run a11y`, `node infra/aws/deploymentPreflight.js`, and `pnpm audit --audit-level=moderate --prod` passed, and hosted smoke confirmed route availability, token gating, schema stability, and audit read/write.
- Safe to demo: yes, as a simulation-safe public preview for workflow demonstration and stakeholder discovery.
- Still simulated: `/api/simulation/signals` and `/api/simulation/risk-suggestions` still use placeholder providers, with explicit simulation/provider metadata.
- Not appropriate to claim: clinical validation, clinical decision support, live NHS integration, or deployment-ready safety assurance.
- Merge recommendation: ready for final review and merge once the release wording is accepted.

## Local Notes

The active working clone is `/private/tmp/safeflow-next`.

Local-only untracked files remain from local tooling and deployment runs and should not be committed:

- `cdk.context.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
