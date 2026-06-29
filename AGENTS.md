# SafeFlow Agent Instructions

## Project Identity

- SafeFlow is a nurse-led, simulation-first clinical documentation and workflow-intelligence prototype.
- It supports structured review, auditability, handover completeness, escalation readiness, discharge-readiness review, and documentation quality.
- It is not an EPR replacement.
- It is not a diagnostic system.
- It is not a prescribing tool.
- It is not ready for live clinical deployment.

## Core Safety Boundaries

- Fictional patient data only.
- No real patient data.
- No NHS logo.
- No implied NHS endorsement.
- No diagnosis.
- No prescribing.
- No treatment recommendation.
- No autonomous clinical decision-making.
- No live clinical deployment claim.
- No API keys or external clinical datasets.
- No OpenAI, LLM, or external API calls unless explicitly requested in a future task and safely bounded.
- No ML model training unless explicitly requested in a future task and safely bounded.
- No potassium recommendation wording.
- Do not use `patient needs potassium`, `give potassium`, or `potassium recommendation`.

## Preferred Language

- `risk-support signal`
- `documentation gap`
- `handover completeness issue`
- `escalation readiness cue`
- `discharge-readiness blocker`
- `explainable safety cue`
- `simulation-only prototype`
- `structured review support`
- `human review required`
- `clinical judgement remains central`

## Language To Avoid

- `diagnosis`
- `treatment recommendation`
- `prescribe`
- `AI decision`
- `clinical decision engine`
- `autonomous care`
- `live NHS deployment`
- `potassium recommendation`
- `patient needs potassium`
- `give potassium`

## Engineering Rules

- Keep deterministic rule-based safety logic explainable.
- Preserve human-editable, reviewable outputs.
- Add tests for any new safety wording or generated output.
- Keep UI changes minimal unless specifically requested.
- Do not mix unrelated CI, config, package manager, or deployment changes into feature branches.
- Do not add external datasets, real clinical data, API keys, or ML libraries without explicit instruction.
- Prefer small focused branches.
- Preserve existing validation commands.

## Validation Commands

Standard validation commands requested for SafeFlow work:

```bash
pnpm test
pnpm run build
pnpm audit --audit-level=moderate
pnpm run e2e
pnpm run db:manifest
pnpm run infra:synth:dev
pnpm run infra:synth:simulation
SAFEFLOW_SIMULATION_ONLY=true pnpm run db:migrate:plan
```

## Failed Commands

- If a command cannot run, report the exact error and run the closest targeted equivalent.
- Do not claim validation passed unless it actually passed.
