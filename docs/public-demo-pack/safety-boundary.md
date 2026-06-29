# SafeFlow Safety Boundary

This prototype is a simulation-only product demonstration.

## What SafeFlow Does In This Prototype

- Shows fictional ward-level workflow data.
- Highlights explainable safety gaps from simulated evidence.
- Shows missing information that a nurse may need to check.
- Helps structure escalation and documentation.
- Creates editable SBAR-style draft wording from visible fictional evidence.
- Records simulated audit events for learning review.

## Simulation Signal Engine Boundary

The Simulation Signal Engine is deterministic and simulation-only.

- It converts fictional patient workflow state, fictional signal snapshots and fictional risk suggestions into structured review cues.
- Every cue is framed as review support only and states that human review is required.
- The engine does not diagnose, prescribe, recommend treatment, or make autonomous clinical decisions.
- A signal output guard removes unsafe wording before cues are shown in the UI.
- This engine is for prototype review, learning and audit discussion only, not live NHS use.

## What SafeFlow Does Not Do In This Prototype

- It does not use live patient data.
- It does not connect to clinical systems.
- It does not diagnose.
- It does not prescribe.
- It does not issue treatment instructions.
- It does not replace clinical judgement, local policy, medical review or professional accountability.

## Current Potassium / Electrolyte Scenario Boundary

The potassium scenario demonstrates recognition and documentation support only.

SafeFlow may show:

- Potassium has fallen in the fictional data.
- Diuretic therapy is visible in the fictional medicines list.
- Magnesium result is not visible.
- No clear electrolyte plan is documented.
- A nurse may need to check results, observations, medicines chart and local escalation route.
- The concern and response should be documented.

SafeFlow must not provide potassium-administration, replacement or prescribing instructions.
