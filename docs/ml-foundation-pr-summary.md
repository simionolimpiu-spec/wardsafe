# SafeFlow simulation risk-support foundation PR summary

## Purpose

This PR stack adds a simulation-only, deterministic, explainable risk-support foundation for fictional patient journeys so reviewers can inspect structured review support without implying live clinical use.

## What changed

- deterministic risk-support scoring for fictional patient journeys
- a formal simulation risk-support contract with explainable reasons and human review required
- a fictional evaluation harness for deterministic scenario checking
- a read-only report boundary built from fictional scenario fixtures
- a safety-language regression scanner for generated outputs and key documentation
- synthetic scenario coverage for deterministic rule-path review
- Codex and contributor guardrails in `AGENTS.md` and the PR checklist template
- technical explainer, demo-readiness pack, and screenshot checklist for reviewer-safe communication

## Safety boundary

This stack stays inside explicit boundaries:

- fictional data only
- no real patient data
- no NHS endorsement
- not for live clinical deployment
- no diagnosis, prescribing, or treatment recommendation claim
- no autonomous clinical decision-making claim
- clinical judgement remains central

Outputs remain human-editable, explainable, and reviewable.

## Data-science position

- this is deterministic rule-based structured review support
- no model has been trained
- no external clinical dataset is used
- evaluation checks fictional scenario behaviour only
- fictional scenario coverage is not clinical validation and not model performance assessment

## Review focus

Please focus review on:

- clarity of the safety boundary across code, generated outputs, and documentation
- explainability of reasons in the contract, evaluation, and read-only report
- fixture-only data use and clearly fictional patient journeys
- stability of contract and report outputs
- whether fictional scenario coverage is understandable and useful
- whether the demo-readiness documentation is safe and reviewer-friendly

## Validation checklist

- `pnpm test`: ____________________
- `pnpm run build`: ____________________
- `pnpm audit --audit-level=moderate`: ____________________
- `pnpm run e2e`: ____________________
- `pnpm run db:manifest`: ____________________
- `pnpm run infra:synth:dev`: ____________________
- `pnpm run infra:synth:simulation`: ____________________
- `SAFEFLOW_SIMULATION_ONLY=true pnpm run db:migrate:plan`: ____________________

## Merge-readiness checklist

- [ ] README references are accurate
- [ ] `AGENTS.md` exists
- [ ] PR checklist/template exists
- [ ] technical explainer exists
- [ ] demo-readiness pack exists
- [ ] safety-language scan covers generated outputs
- [ ] boundary-aware docs scan covers key docs
- [ ] risk-support contract tests pass
- [ ] evaluation harness tests pass
- [ ] read-only report tests pass
- [ ] scenario coverage tests pass
- [ ] API/server tests pass
- [ ] e2e tests pass
- [ ] build passes
- [ ] audit passes
- [ ] infrastructure synth commands pass
- [ ] migration plan command passes
- [ ] no lockfile or package manager drift
- [ ] no external datasets or API keys
- [ ] no real patient data
- [ ] no unsafe generated wording
