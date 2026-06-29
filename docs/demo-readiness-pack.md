# SafeFlow demo-readiness pack

## One-sentence description

SafeFlow is a nurse-led, simulation-only prototype for structured documentation and workflow safety review using fictional patient journeys.

## What the demo shows

The demo shows:

- a fictional ward safety board
- structured documentation review
- handover completeness support
- escalation readiness cues
- discharge-readiness blockers
- deterministic risk-support signals
- an audit and learning timeline
- a simulation report and fictional scenario coverage summary

## What the demo does not show

The demo stays inside explicit safety boundaries:

- no real patient data
- no diagnosis claim
- no prescribing claim
- no treatment recommendation claim
- no autonomous clinical decision-making claim
- no clinical validation claim
- no live clinical deployment claim
- no NHS endorsement

Clinical judgement remains central, and outputs remain human-editable, explainable and reviewable.

## Suggested demo flow

1. Start with the simulation-only boundary and confirm that the prototype uses fictional patient journeys only.
2. Open the fictional ward safety board and show how the board is organised for review.
3. Review one fictional patient journey and call out the structured documentation fields.
4. Show documentation gaps and explainable safety cues without presenting treatment or prescribing advice.
5. Show handover completeness support and discharge-readiness blockers for the same fictional journey.
6. Open the simulation report and fictional scenario coverage summary to show deterministic rule traceability.
7. Close with the governance position: human review required, clinical judgement remains central, and the prototype is not for live clinical deployment.

## Reviewer talking points

- Nurse-led framing keeps the focus on safer review conversations and workflow clarity.
- Structured documentation makes nursing judgement more visible and easier to revisit.
- Deterministic rules are intentional at this stage because explainability comes first.
- Fictional scenario coverage helps test prototype behaviour without using real patient data.
- Human review remains central to every workflow shown in the demo.
- This is structured review support for a simulation-only prototype, not a live care product.

## Expected reviewer questions

### Is this AI?

The current demo uses deterministic rules and explainable safety cues. It is designed to support structured review rather than to make decisions on behalf of clinicians.

### Is this using real patient data?

No. The current prototype uses fictional patient journeys only.

### Has this been validated for live care?

No. This is a simulation-only prototype and it is not for live clinical deployment.

### Could this connect to an EPR?

Not in the current demo. Any future integration work would need separate governance, privacy, safety and technical review before it could be explored.

### Why rules before ML?

Deterministic rules are easier to inspect, test and explain during early prototype work. That makes them a better fit for bounded simulation review.

### How would governance be handled before any real-world use?

Any future step beyond simulation would need formal governance, safety review, privacy review, clinical leadership input and clear deployment boundaries before it could be considered.

### What is the next research step?

The next step is deeper review of the nurse-led workflow, the documentation structure, and the fictional scenario coverage so the team can decide whether further prototype work is justified.

## Safe closing statement

SafeFlow is a simulation-only prototype designed to explore how structured documentation, explainable safety cues, and nurse-led workflow review could support safer escalation, handover, and discharge-readiness conversations. It is not for live clinical deployment and does not replace clinical judgement.
