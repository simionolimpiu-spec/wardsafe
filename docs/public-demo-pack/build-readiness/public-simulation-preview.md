# SafeFlow Public Simulation Preview

This note prepares SafeFlow for a shareable, password-protected, simulation-only preview on AWS. It is a simulation-safe public preview for workflow demonstration and stakeholder discovery. Outputs are not clinically validated and are not for clinical decision-making.

## Preview Goal

- Share a fictional SafeFlow prototype URL with collaborators.
- Keep frontend and API boundaries separate.
- Keep all preview data fictional and simulation-only.
- Keep human review explicit throughout the UI and API.

## Current Preview Deployment

The current deployed preview is:

- Frontend: `https://preview.d3etfd425b4rlk.amplifyapp.com/`
- Backend API: `https://nlork7u5ziyhwbjmoplexuw4rq0tnwah.lambda-url.eu-west-2.on.aws/`
- AWS region: `eu-west-2`
- CloudFormation stack: `safeflow-simulation-foundation`
- Amplify app id: `d3etfd425b4rlk`
- Amplify branch: `preview`

Amplify Basic Auth is enabled, and the API requires `X-SafeFlow-Preview-Token`. Do not commit or post the Basic Auth password or preview access token; share them only through a private channel with named reviewers.

## Hosted Preview API Smoke

Use the repo smoke command after redeploys, token rotation or pre-review checks:

- Set `SAFEFLOW_PREVIEW_API_URL` to the deployed `PublicApiUrl`.
- Set `SAFEFLOW_PREVIEW_ACCESS_TOKEN` to the shared preview token.
- Run `npm run api:smoke:preview`.

The hosted smoke checks:

- the preview token gate returns `401` when the token is missing
- `Access-Control-Allow-Origin` is not wildcarded
- the hosted health, workspace, readiness, signals, suggestions and audit routes stay simulation-only and available
- readiness, signals and risk-suggestion responses keep their preview metadata stable
- no direct patient identifiers or secret-like values appear in the returned payloads
- simulation audit read/write remains reachable for the preview workflow

The hosted smoke is a deployment-contract check. It does not validate clinical correctness, model quality, or real-world decision support behavior.

If a temporary internal diagnostic preview is intentionally ungated, set `SAFEFLOW_EXPECT_PREVIEW_ACCESS_GATE=false` for that smoke run only.

## Current Deployed Behavior

The current deployed preview stack is intentionally safe but limited:

- `/api/simulation/signals` currently serves a placeholder provider on the live preview stack
- `/api/simulation/risk-suggestions` currently serves a placeholder provider on the live preview stack
- those responses now need to stay explicit about `simulation` mode, `clinicalUse: false`, and their placeholder provider/source
- this keeps the preview honest and usable for demos without implying validated clinical decision support

The preview is not clinically validated decision support and must not be used for clinical decision-making.

Follow-up integration remains required before any preview should claim ML-backed signal or suggestion retrieval.

## Why Localhost Links Do Not Work For Other People

`http://127.0.0.1:5173` and `http://localhost:5173` point to the computer currently running Vite. Other people cannot open that address unless they are on the same machine. The local dev server also stops when:

- the terminal is closed
- `npm run dev` stops
- the machine sleeps, restarts or loses network access

A shareable preview needs publicly reachable hosting for both the frontend and the API.

## Recommended AWS Preview Shape

### Frontend

- Host the Vite build with AWS Amplify Hosting.
- Enable password protection or restricted preview access in Amplify before sharing.
- Set `VITE_SAFEFLOW_API_BASE_URL` in the Amplify environment to the public simulation API URL.

### API

- Current preview route: Lambda Function URL using `infra/aws/lambda/safeflowApi/index.mjs`.
- The deployment branch exposes the public Lambda Function URL stack output `PublicApiUrl`; the hosted preview should use that as its backend base URL.
- If a later follow-on ever adds API Gateway, it must keep the same simulation-only and origin-locked contract.
- Keep `SAFEFLOW_SIMULATION_ONLY=true` for all preview API environments.
- Keep deterministic fallback behavior when `OPENAI_API_KEY` is absent.
- Keep fictional data only and no live integration claims.

## Required Environment Variables

### Frontend build

- `VITE_SAFEFLOW_API_BASE_URL=https://preview-api.example.com`
- `VITE_SAFEFLOW_PREVIEW_ACCESS_TOKEN=replace-with-shared-preview-token`

The API URL is public and non-secret. The preview access token is bundled into the browser app, so treat it as a shared preview gate rather than strong authentication. Keep Amplify password protection enabled before sharing the frontend URL. Do not place `OPENAI_API_KEY` or any other backend secret in Vite client env.

### API runtime

- `SAFEFLOW_ENVIRONMENT=simulation`
- `SAFEFLOW_SIMULATION_ONLY=true`
- `SAFEFLOW_ALLOWED_ORIGIN=https://preview.example.com`
- `SAFEFLOW_PREVIEW_ACCESS_TOKEN=replace-with-the-same-long-random-preview-token`

Optional backend-only variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- backend configuration already approved for fictional simulation use

## CORS Boundary

- Set `SAFEFLOW_ALLOWED_ORIGIN` to the exact preview frontend origin.
- Avoid `*` for the shared preview unless it is a temporary internal-only diagnostic step.
- Set `SAFEFLOW_PREVIEW_ACCESS_TOKEN` for the Lambda and `VITE_SAFEFLOW_PREVIEW_ACCESS_TOKEN` for the frontend to the same long random value.
- The Lambda rejects public preview API calls that do not include `X-SafeFlow-Preview-Token`.
- In dev-only runs, the current backend fallback still uses the local development origin when no preview origin is configured.

## Visible Safety Boundary

The public preview must keep the following visible:

- fictional patient data only
- not clinical advice
- simulation output for preview only
- not clinically validated
- not for clinical decision-making
- not diagnosis
- not prescribing
- not live NHS deployment
- human review required

## PR #6 Release Checklist

- Hosted smoke passed against the live Lambda URL.
- Token gate verified.
- Health endpoint verified.
- Workspace endpoint verified.
- Readiness endpoint verified.
- Signals endpoint verified.
- Risk suggestions endpoint verified.
- Audit read/write verified.
- Provider metadata visible.
- Placeholder-provider status confirmed.
- UI clinical safety boundary visible.
- Documentation states smoke does not validate clinical correctness.
- Follow-up backlog includes ML-backed DB read models.
- No clinical validation claims remain in public-facing copy.

## Password Protection Recommendation

For the first external preview:

- use Amplify Hosting preview protection or an equivalent managed access gate
- use the preview access token gate for direct API calls
- share only with named collaborators
- do not share the URL with family members or other non-clinical viewers
- avoid building custom authentication until the preview workflow itself is stable

## AWS Safety Prerequisites

Before any preview deployment:

- use only fictional data
- no NHS branding or implied endorsement
- no real patient data
- no clinical deployment claim
- deployment approval remains manual
- confirm account budget alerts and cleanup ownership

See also:

- `docs/public-demo-pack/build-readiness/aws-free-tier-setup.md`
- `docs/public-demo-pack/build-readiness/aws-database-foundation.md`

## Cost Controls And Cleanup

- keep preview environments small and simulation-only
- stop or remove unused preview branches in Amplify
- remove unused Lambda URLs, API stages, logs and database resources
- review budgets, CloudWatch logs and retained storage after preview sessions

## Manual Steps Before Real Preview Release

1. Choose the frontend origin and API origin.
2. Set Amplify environment variables for the frontend build.
3. Set backend environment variables for simulation-only mode.
4. Apply password protection before sharing the URL.
5. Run manual reviewer checks against the hosted preview.
6. Keep deployment approval as a human decision after synth and review.

## Stakeholder Demo Note

This preview demonstrates the handover and discharge workflow, simulated patient-safety signals, simulated readiness and risk-suggestion surfaces, audit trail behaviour, and the preview authentication/token gate.

It does not demonstrate clinical validation, live NHS integration, real ML-backed risk modelling, real patient-data processing, or deployment-ready clinical decision support.

## Follow-up Integration Note

The current hosted preview must not be described as clinically validated decision support.

Before any stronger claim is made:

- replace placeholder signal and risk-suggestion providers with ML-backed database read models
- keep the API response source/provider explicit
- keep the simulation disclaimer visible in the UI
- prevent silent fallback to placeholder providers outside explicitly configured preview/simulation environments
