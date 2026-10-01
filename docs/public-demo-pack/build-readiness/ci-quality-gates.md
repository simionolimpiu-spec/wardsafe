# SafeFlow CI Quality Gates

SafeFlow uses `.github/workflows/safeflow-ci.yml` to verify the public simulation prototype and AWS/database foundation on pull requests and selected branch pushes.

## Application Quality Job

- Installs dependencies with `npm ci` on Node.js 22.
- Runs all unit, contract and infrastructure tests.
- Builds the production frontend bundle.
- Fails on moderate-or-higher advisories in **shipped** dependencies (`npm audit --omit=dev`). This is the blocking gate and has no exceptions.
- Additionally **reports** moderate-or-higher advisories in build-time-only dependencies, without blocking. See "Why the advisory gate is split" below.
- Runs the API safety smoke against health, workspace, readiness, audit-event and SBAR draft routes.
- Installs Chromium and runs the Playwright safety journey.
- Uploads browser evidence only when the job fails.

## Foundation Job

- Verifies the current migration manifest.
- Validates the approved simulation-only migration dry run.
- Synthesizes isolated dev and simulation CloudFormation templates.
- Proves the restricted pilot profile still fails without its review gate.
- Uploads synthesized templates for seven days of review evidence.

## Why the advisory gate is split

Until 25 July 2026 a single `npm audit --audit-level=moderate` blocked the build. That gate broke three times in two days on newly published advisories against the same transitive package, none of which involved a code change on our side, and the third one turned out to be structurally unfixable: `brace-expansion` is vendored *inside* the `aws-cdk-lib` tarball (`"inBundle": true` in the lockfile), so npm `overrides` cannot reach it, and the newest `aws-cdk-lib` release still bundles the affected version.

Leaving that as a blocking failure would have stopped every merge on an issue we cannot fix, which trains people to ignore or bypass the gate — the worst outcome for a project whose safety story depends on it. So the gate is now split by whether an advisory can actually reach a user:

- **Shipped dependencies — blocking, no exceptions.** `npm audit --omit=dev`. Anything that reaches the browser bundle or the deployed Lambda must be clean. At the time of the split this reported zero vulnerabilities.
- **Build-time-only dependencies — reported, non-blocking.** Tools like `aws-cdk-lib`, Vitest and Playwright run only in CI and on developer machines. `aws-cdk-lib` is a `devDependency`, and `brace-expansion` was confirmed absent from the built bundle in `dist/`.

This is a narrowing of the gate and it is recorded deliberately rather than quietly. Two obligations come with it:

- The non-blocking step's output is reviewed on every run, not ignored. When upstream republishes a fixed `aws-cdk-lib`, bump it.
- The split is by *reachability*, not by convenience. A moderate-or-higher advisory in anything that ships still fails the build, and no allowlist or exception mechanism exists for that gate.

## Safety Boundary

The workflow has repository read permission only. It does not configure AWS credentials, run `cdk deploy`, connect to a database or execute migrations. CI success is evidence that the local templates and safety gates are consistent; it is not deployment or clinical approval.

## Local Equivalents

```powershell
npm test
npm run build
npm audit --audit-level=moderate --omit=dev   # blocking gate
npm audit --audit-level=moderate              # advisory only, review the output
$env:SAFEFLOW_SIMULATION_ONLY="true"; npm run api:smoke
npm run e2e
npm run db:manifest
$env:SAFEFLOW_SIMULATION_ONLY="true"; npm run db:migrate:plan
npm run infra:synth:dev
npm run infra:synth:simulation
```

Repository branch protection should require both GitHub Actions jobs before merging once the workflow has completed successfully on GitHub.
