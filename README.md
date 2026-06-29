# SafeFlow Nursing

SafeFlow Nursing is a nurse-led clinical documentation-safety and workflow-intelligence prototype concept.

This public repository is being prepared as the build workspace for a simulation-first SafeFlow prototype. The current public scope is intentionally limited: no live patient data, no NHS branding or endorsement, no clinical deployment, and no prescribing or diagnostic functionality.

## Current Direction

- Product UI name: **SafeFlow**
- Concept and authorship name: **SafeFlow Nursing**
- First build posture: simulation-only, using fictional patients
- Design stance: clinically familiar interface, no official NHS logo
- Safety boundary: supports recognition, checking, escalation and documentation; does not prescribe, diagnose or replace clinical judgement

## Repository Status

This repo is a fresh scaffold. Confidential invention-pack notes and detailed design material should remain private until intentionally reviewed for public release.

The simulation workspace includes distinct patients, observations, tasks, escalations, handover, discharge, reports, audit and settings screens. Browser-local changes are fictional, versioned and reversible through **Reset simulation**.

Contributor and agent guardrails live in [AGENTS.md](AGENTS.md) and [.github/pull_request_template.md](.github/pull_request_template.md). A public technical explainer for the current simulation-only risk-support layer is in [docs/risk-support-technical-explainer.md](docs/risk-support-technical-explainer.md).

## Local Development

```powershell
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal.

### Optional local API

The prototype now has a server-side draft provider boundary for SBAR wording. It keeps OpenAI credentials out of the browser and falls back to the deterministic simulation provider when no API key is configured.

In one terminal:

```powershell
$env:OPENAI_API_KEY="your_key_here"
npm run api
```

In a second terminal:

```powershell
npm run dev
```

If `OPENAI_API_KEY` is not set, `npm run api` still starts and uses the deterministic provider. The Vite dev server proxies `/api` to `http://127.0.0.1:8787`.

The API also exposes `GET /api/simulation/workspace`. By default it serves the local fictional fixture. To point that route at an approved simulation PostgreSQL database, set both `SAFEFLOW_SIMULATION_ONLY=true` and `DATABASE_URL`; otherwise database-backed workspace mode is refused or falls back to the fixture.

The API also exposes `GET /api/simulation/risk-support-report`. It returns a read-only structured review support report built from fictional scenario fixtures with deterministic rules, no patient input, and no live clinical deployment claim. Nurses and clinicians remain responsible for judgement and escalation.

Inside the prototype, **Settings** includes **Check backend workspace** and **Check build readiness** so reviewers can confirm which server-side simulation source is active, which provider boundaries are configured, and whether the migration approval manifest is current without replacing browser-local edits.

## Verification

```powershell
npm test
npm run build
npm run infra:synth
npm run infra:synth:simulation
npm run db:manifest
$env:SAFEFLOW_SIMULATION_ONLY="true"; npm run db:migrate:plan
$env:SAFEFLOW_SIMULATION_ONLY="true"; npm run api:smoke
npm run e2e
```

`npm run e2e` starts both the local API and Vite so the Settings backend/readiness checks exercise the server boundary.

The same checks run in `.github/workflows/safeflow-ci.yml` without AWS credentials or deployment permissions.

## Public Demo Pack

Reviewer materials are in `docs/public-demo-pack/`.
