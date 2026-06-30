# SafeFlow Public Simulation Preview Deployment Design

Date: 2026-06-30
Status: draft for review
Product mark: SafeFlow
Confidential pack name: SafeFlow Nursing

## Purpose

SafeFlow needs a shareable, password-protected preview that collaborators can open from a real URL without relying on `localhost`. The preview must stay simulation-only, keep fictional data only, and preserve the visible safety boundary already present in the app.

This design prepares the deployment path, not a clinical release. It keeps the frontend and API separately configurable so the hosted preview can point at a public simulation API while local development continues to use the existing local proxy flow.

## Current State

SafeFlow already has:

- a Vite frontend with relative `/api` fallback for local development
- a public API base URL helper in `src/services/apiBaseUrl.js`
- preview-safe CORS logic in `server/corsConfig.js`
- explicit simulation boundary wording in the UI
- public simulation API ingress on the deployment branch
- deployment-readiness notes in `docs/public-demo-pack/build-readiness/public-simulation-preview.md`

SafeFlow does not yet have:

- a hosted preview frontend
- password-protected collaborator access in AWS
- a final preview domain
- a production clinical deployment claim

## Design Options

### Option 1: Docs-only runbook

Document the deployment path and stop there.

Trade-off: fastest, but collaborators still have no hosted preview.

### Option 2: Minimal hosted preview contract

Use AWS Amplify Hosting for the frontend and the current Lambda Function URL output (`PublicApiUrl`) as the public simulation API base for the first preview. Protect the preview with managed access in Amplify. If the branch later needs API Gateway, it can be added as a follow-on change, not as a blocker for the first shareable preview.

Trade-off: small, practical, and enough to share a real URL without overbuilding.

### Option 3: Full production-style hosting stack

Add a fuller AWS hosting and edge setup now, including more infrastructure and deployment automation.

Trade-off: stronger long-term structure, but too heavy for the next slice.

## Selected Approach

Choose Option 2.

The preview should use:

- AWS Amplify Hosting for the frontend
- `VITE_SAFEFLOW_API_BASE_URL` for the public API base URL at build time
- `SAFEFLOW_ALLOWED_ORIGIN` for the exact preview frontend origin at runtime
- `SAFEFLOW_SIMULATION_ONLY=true` in every preview backend environment
- managed password protection or equivalent restricted preview access
- the existing `PublicApiUrl` stack output as the public backend URL for the preview

The app must keep the same safety stance it already has:

- fictional patient data only
- no diagnosis
- no prescribing
- no autonomous clinical decision-making
- no live NHS deployment claim
- human review required

## Architecture

```text
User browser
  -> Amplify-hosted SafeFlow frontend
       -> VITE_SAFEFLOW_API_BASE_URL
       -> public simulation API
            -> CORS checks exact preview origin
            -> simulation read models / deterministic fallback
            -> visible safety boundary in UI
```

Local development stays separate:

```text
User browser
  -> Vite dev server
       -> /api proxy
       -> local simulation API
```

## Data Flow

1. The hosted frontend loads build-time environment settings.
2. The frontend sends read requests to the public simulation API base URL.
3. The API returns simulation-only read models and keeps CORS restricted to the preview origin.
4. If the API or preview data is unavailable, the client shows safe fallback states instead of pretending to have live clinical data.
5. The UI continues to show the explicit simulation boundary and human-review wording.

## Error Handling And Safety

- If the preview frontend cannot reach the API, the app must keep working in fallback mode where possible and show a clear simulation-safe message.
- If the configured origin is wrong, CORS should fail closed rather than widen access.
- If `OPENAI_API_KEY` is absent, the backend must keep deterministic fallback behavior.
- If the preview is not configured, local development must continue to use relative `/api` routes.
- No secret values should be added to Vite client env variables.

## Files Likely To Change

- `docs/public-demo-pack/build-readiness/public-simulation-preview.md`
- `docs/public-demo-pack/build-readiness/README.md` or related deployment notes, if preview instructions need cross-linking
- `infra/aws/app.js`
- `infra/aws/safeflowFoundationStack.js`
- `infra/aws/safeflowFoundationStack.test.js`
- `server/corsConfig.js` and its tests, if preview origin rules need alignment
- `src/services/apiBaseUrl.js` and tests only if the frontend API URL contract needs refinement

## Testing And Validation

Focused validation should cover:

- public API base URL selection
- local `/api` fallback
- preview-safe CORS behavior
- simulation-only safety wording
- build and synth correctness

Full validation remains:

- `npm test`
- `npm run build`
- `npm audit --audit-level=moderate`
- `npm run e2e`
- `npm run db:manifest`
- `SAFEFLOW_SIMULATION_ONLY=true npm run db:migrate:plan`
- `npm run infra:synth:dev`
- `npm run infra:synth:simulation`

## Deployment Rule

Deployment approval stays manual. This design only prepares the preview shape and does not authorize a live clinical rollout.
