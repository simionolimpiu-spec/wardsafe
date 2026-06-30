# SafeFlow Public Simulation Preview

This note prepares SafeFlow for a shareable, password-protected, simulation-only preview on AWS. It is not a clinical deployment, not a live NHS system, and not intended for real patient data.

## Preview Goal

- Share a fictional SafeFlow prototype URL with collaborators.
- Keep frontend and API boundaries separate.
- Keep all preview data fictional and simulation-only.
- Keep human review explicit throughout the UI and API.

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

- Preferred preview route: API Gateway + Lambda using `infra/aws/lambda/safeflowApi/index.mjs`.
- Acceptable lightweight alternative: Lambda Function URL if API Gateway is unnecessary for the first preview.
- Keep `SAFEFLOW_SIMULATION_ONLY=true` for all preview API environments.
- Keep deterministic fallback behavior when `OPENAI_API_KEY` is absent.
- Keep fictional data only and no live integration claims.
- The current deployment branch exposes a public Lambda Function URL output named `PublicApiUrl`; use that as the public API base when you connect the hosted frontend.

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
- database configuration already approved for fictional simulation use

## CORS Boundary

- Set `SAFEFLOW_ALLOWED_ORIGIN` to the exact preview frontend origin.
- Avoid `*` for the shared preview unless it is a temporary internal-only diagnostic step.
- Set `SAFEFLOW_PREVIEW_ACCESS_TOKEN` for the Lambda and `VITE_SAFEFLOW_PREVIEW_ACCESS_TOKEN` for the frontend to the same long random value.
- The Lambda rejects public preview API calls that do not include `X-SafeFlow-Preview-Token`.
- The current backend defaults to local development origin when no preview origin is configured.

## Visible Safety Boundary

The public preview must keep the following visible:

- fictional patient data only
- not clinical advice
- not diagnosis
- not prescribing
- not live NHS deployment
- human review required

## Password Protection Recommendation

For the first external preview:

- use Amplify Hosting preview protection or an equivalent managed access gate
- use the preview access token gate for direct API calls
- share only with named collaborators
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
3. Set Lambda or API Gateway environment variables for simulation-only backend mode.
4. Apply password protection before sharing the URL.
5. Run manual reviewer checks against the hosted preview.
6. Keep deployment approval as a human decision after synth and review.
