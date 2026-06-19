# SafeFlow CI Quality Gates

SafeFlow uses `.github/workflows/safeflow-ci.yml` to verify the public simulation prototype and AWS/database foundation on pull requests and selected branch pushes.

## Application Quality Job

- Installs dependencies with `npm ci` on Node.js 22.
- Runs all unit, contract and infrastructure tests.
- Builds the production frontend bundle.
- Fails on moderate-or-higher dependency advisories.
- Installs Chromium and runs the Playwright safety journey.
- Uploads browser evidence only when the job fails.

## Foundation Job

- Verifies the current migration manifest.
- Validates the approved simulation-only migration dry run.
- Synthesizes isolated dev and simulation CloudFormation templates.
- Proves the restricted pilot profile still fails without its review gate.
- Uploads synthesized templates for seven days of review evidence.

## Safety Boundary

The workflow has repository read permission only. It does not configure AWS credentials, run `cdk deploy`, connect to a database or execute migrations. CI success is evidence that the local templates and safety gates are consistent; it is not deployment or clinical approval.

## Local Equivalents

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

Repository branch protection should require both GitHub Actions jobs before merging once the workflow has completed successfully on GitHub.
