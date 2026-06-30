# Public Simulation Preview Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a shareable, password-protected, simulation-only SafeFlow preview by keeping the frontend API base URL configurable, keeping AWS preview ingress origin-locked, and documenting the exact deployment checklist.

**Architecture:** The existing Vite app already supports relative `/api` requests for local development and a configurable public API base URL for hosted preview. The AWS side should expose the simulation API through the current Lambda Function URL path, keep CORS locked to the exact preview origin, and surface a clear `PublicApiUrl` output for the hosted frontend. The preview frontend stays on Amplify Hosting with managed access; no clinical deployment or real patient data enters the flow.

**Tech Stack:** React 19, Vite, existing SafeFlow fetch clients, AWS Lambda Function URL and CDK stack code, Vitest, Playwright, Markdown docs.

---

## File Structure

- Modify: `docs/public-demo-pack/build-readiness/public-simulation-preview.md`
- Modify: `infra/aws/app.js`
- Modify: `infra/aws/safeflowFoundationStack.js`
- Modify: `infra/aws/safeflowFoundationStack.test.js`
- Modify: `infra/aws/lambda/safeflowApi/index.mjs`
- Modify: `infra/aws/lambda/safeflowApi/index.test.js`
- Modify only if the origin contract needs tightening: `server/corsConfig.js`, `server/corsConfig.test.js`
- Modify only if the client URL contract needs refinement: `src/services/apiBaseUrl.js`, `src/services/apiBaseUrl.test.js`
- Modify only if the visible safety boundary needs a stronger assertion: `src/App.test.jsx`, `src/components/SafetyBanner.jsx`

### Preview contract snapshot

Use these environment variables consistently:

```bash
# Frontend build-time variable for Amplify or any other hosted preview
VITE_SAFEFLOW_API_BASE_URL=https://preview-api.example.com

# Backend runtime variables for the simulation preview
SAFEFLOW_ENVIRONMENT=simulation
SAFEFLOW_SIMULATION_ONLY=true
SAFEFLOW_ALLOWED_ORIGIN=https://preview.example.com
```

Local development must continue to work with the relative `/api` proxy flow when `VITE_SAFEFLOW_API_BASE_URL` is unset.

## Task 1: Lock The Deployment Doc To The Real Preview Shape

**Files:**
- Modify: `docs/public-demo-pack/build-readiness/public-simulation-preview.md`

- [ ] **Step 1: Add the exact preview contract**

Write the missing deployment-ready sections so the doc clearly states:

- frontend host: AWS Amplify Hosting
- backend path: public simulation API base URL
- password protection: required before sharing
- manual deployment approval: still required
- why `localhost` is not shareable

Keep the wording simulation-only and explicitly non-clinical.

- [ ] **Step 2: Pin the required environment variables**

Make sure the doc lists:

- `VITE_SAFEFLOW_API_BASE_URL`
- `SAFEFLOW_ALLOWED_ORIGIN`
- `SAFEFLOW_SIMULATION_ONLY=true`

State that `OPENAI_API_KEY` must not be added to frontend env.

- [ ] **Step 3: Record the current public API output**

Document that the deployment branch exposes the `PublicApiUrl` stack output and that it is the base URL the preview frontend should use.

- [ ] **Step 4: Review the doc for safety wording**

Confirm the document still says:

- fictional patient data only
- not diagnosis
- not prescribing
- not live NHS deployment
- human review required

- [ ] **Step 5: Stop and review the doc**

Read the final markdown once before touching infra or tests.

**Test / check**

Run:

```powershell
Get-Content docs/public-demo-pack/build-readiness/public-simulation-preview.md
```

Expected: the doc is explicit about the public preview host, environment variables, and safety boundary.

## Task 2: Keep The AWS Preview Ingress Exact And Origin-Locked

**Files:**
- Modify: `infra/aws/app.js`
- Modify: `infra/aws/safeflowFoundationStack.js`
- Modify: `infra/aws/safeflowFoundationStack.test.js`
- Modify: `infra/aws/lambda/safeflowApi/index.mjs`
- Modify: `infra/aws/lambda/safeflowApi/index.test.js`

- [ ] **Step 1: Resolve the preview origin once**

Use the same origin resolution pattern everywhere:

```js
const publicPreviewOrigin =
  typeof props.publicPreviewOrigin === 'string' && props.publicPreviewOrigin.trim()
    ? props.publicPreviewOrigin.trim().replace(/\/+$/, '')
    : typeof process.env.SAFEFLOW_ALLOWED_ORIGIN === 'string' && process.env.SAFEFLOW_ALLOWED_ORIGIN.trim()
      ? process.env.SAFEFLOW_ALLOWED_ORIGIN.trim().replace(/\/+$/, '')
      : 'http://127.0.0.1:5173';
```

Keep local development as the fallback.

- [ ] **Step 2: Expose the public function URL**

Add or keep the Lambda Function URL with:

```js
apiFunction.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowCredentials: false,
    allowedHeaders: ['Content-Type'],
    allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
    allowedOrigins: [publicPreviewOrigin]
  }
});
```

Also export a `PublicApiUrl` stack output so the hosted frontend has a stable public base URL.

- [ ] **Step 3: Make the backend health payload truthfully show public ingress**

Ensure the API health / placeholder responses expose `publicIngress: true` or equivalent metadata that matches the preview reality.

- [ ] **Step 4: Keep the tests exact**

Update the stack and Lambda tests so they assert:

- the function URL exists
- `AuthType` is `NONE`
- CORS allows only the configured preview origin
- `PublicApiUrl` is emitted
- the health metadata still reflects simulation-only mode

- [ ] **Step 5: Run the focused infra tests**

Run:

```powershell
npm test -- infra/aws/safeflowFoundationStack.test.js infra/aws/lambda/safeflowApi/index.test.js
```

Expected: pass with the preview origin and public URL assertions.

## Task 3: Keep The Frontend URL Contract And Safety Boundary Simple

**Files:**
- Modify only if a regression appears: `src/services/apiBaseUrl.js`
- Modify only if a regression appears: `src/services/apiBaseUrl.test.js`
- Modify only if the preview contract needs a guardrail: `src/App.test.jsx`
- Modify only if the visible boundary text needs to be restated: `src/components/SafetyBanner.jsx`

- [ ] **Step 1: Keep public preview and local dev on the same contract**

The client should continue to use:

```js
export function buildApiUrl(path, { env = import.meta.env ?? {} } = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveApiBaseUrl({ env });
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
```

Do not add frontend access to `OPENAI_API_KEY`.

- [ ] **Step 2: Keep the fallback path safe**

If the preview URL is missing, malformed, or trimmed to empty, the app should keep using relative `/api` routes for local development and same-origin preview.

- [ ] **Step 3: Keep the boundary wording visible**

Preserve assertions for:

- fictional patient data only
- not clinical advice
- not diagnosis
- not prescribing
- not live NHS deployment
- human review required

- [ ] **Step 4: Run the focused client tests**

Run:

```powershell
npm test -- src/services/apiBaseUrl.test.js src/App.test.jsx
```

Expected: pass, with the public preview URL contract and safety wording intact.

## Task 4: Validate The Whole Preview Slice And Publish It Cleanly

**Files:**
- None expected unless a validation failure exposes a real regression in the files above.

- [ ] **Step 1: Run the full validation set**

Run:

```powershell
npm test
npm run build
npm audit --audit-level=moderate
npm run e2e
npm run db:manifest
$env:SAFEFLOW_SIMULATION_ONLY="true"; npm run db:migrate:plan
npm run infra:synth:dev
npm run infra:synth:simulation
```

- [ ] **Step 2: Fix only slice-caused failures**

If a command fails, fix only issues caused by this deployment preview slice. Do not widen scope into unrelated feature work.

- [ ] **Step 3: Commit and push the deployment branch**

Commit only the preview deployment work, then push `deployment/public-simulation-preview`.

- [ ] **Step 4: Refresh the PR summary**

Update the PR body with:

- the preview frontend approach
- the `PublicApiUrl` backend contract
- the exact preview origin CORS rule
- the validation results

- [ ] **Step 5: Stop at the branch handoff**

After the branch is pushed and the PR is updated, stop and hand the preview branch back for review.
