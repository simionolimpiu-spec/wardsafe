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

## Local Development

```powershell
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal.

## Verification

```powershell
npm test
npm run build
npm run e2e
```

## Public Demo Pack

Reviewer materials are in `docs/public-demo-pack/`.
