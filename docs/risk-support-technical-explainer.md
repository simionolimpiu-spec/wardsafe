# SafeFlow simulation risk-support layer

## Purpose

The SafeFlow simulation risk-support layer provides structured review support for fictional patient journeys. Its job is to make review work easier to inspect, discuss and test during simulation work.

At a high level, it helps surface:

- documentation gaps
- handover completeness issues
- escalation readiness cues
- discharge-readiness blockers
- explainable safety cues

This is a simulation-only prototype. It is designed to support review of fictional workflow states rather than to replace clinical judgement.

## What it is not

The boundary for this layer is explicit. It should not be positioned as:

- an EPR replacement
- a diagnosis system
- a prescribing tool
- a clinical decision engine
- an autonomous care system

It is also not clinically validated and not for live clinical deployment.

## Why deterministic rules first

SafeFlow starts with deterministic, transparent rules before any future ML discussion because that is more appropriate for an early simulation-only prototype.

Deterministic rules are:

- easier to inspect line by line
- easier to test with known fictional scenarios
- safer for simulation governance
- easier to audit and explain to reviewers
- more appropriate for early prototype controls
- less likely to create false clinical authority

This approach keeps the current layer explainable, reviewable and bounded.

## Data boundary

The current risk-support layer works inside a deliberately narrow data boundary:

- only fictional scenario fixtures are used
- no real patient data is used
- no external clinical datasets are added
- no API keys are used by this layer
- no external LLM or model call is made by this layer

That boundary matters because it keeps the prototype suitable for demonstration, testing and technical review without implying live clinical use.

## Output contract

The output contract is designed to stay human-readable at a technical level without turning into a large opaque payload.

At a high level, the contract exposes:

- `simulationOnly`
- `generatedBy`
- `humanReviewRequired`
- `clinicalUse`
- risk-support signal content
- documentation gap reasons
- handover completeness reasons
- escalation readiness cues
- discharge-readiness blockers
- missing fields
- explainable reasons
- scenario traceability

In practice, that means reviewers can see why a fictional journey was flagged, which fields were incomplete, which blockers were present, and which fictional scenario produced the output.

## Evaluation harness

The evaluation harness uses fictional scenarios to check expected rule behaviour against known inputs.

That harness is for simulation behaviour reporting, not for clinical validation. It does not make clinical performance claims and it does not present metrics such as:

- accuracy
- sensitivity
- specificity
- AUROC
- F1
- calibration
- prediction claims

Instead, it checks whether deterministic rules behave consistently and whether the resulting language stays within the documented safety boundary.

## Synthetic scenario coverage

The synthetic scenario coverage helper maps fictional scenarios to deterministic rule paths and broad coverage domains such as documentation quality, handover completeness, escalation readiness and discharge readiness.

It is not clinical validation and it does not measure model or clinical performance. It is a compact way to see where fictional scenario coverage is already exercised, where coverage is thin, and where additional fictional scenarios may improve prototype testing.

## Read-only report boundary

The read-only report boundary exists so the current simulation behaviour can be reviewed without introducing a live workflow feature.

The report:

- uses bundled fictional fixtures
- accepts no patient input
- mutates nothing
- returns deterministic report data
- supports demo, testing and documentation work only

This makes the report suitable for technical review and public explanation while keeping it separate from live operational use.

## Governance position

Nurses and clinicians remain responsible for judgement and escalation. SafeFlow supports structured review; it does not make autonomous care decisions.

That governance position is reinforced in the repository guardrails:

- [AGENTS.md](../AGENTS.md) sets the working boundaries for future agent and contributor work
- [.github/pull_request_template.md](../.github/pull_request_template.md) keeps PR review aligned with those boundaries

Any future ML work would need to stay within those guardrails and would need separate safety, governance and review scrutiny before being described as anything more than bounded prototype work.
