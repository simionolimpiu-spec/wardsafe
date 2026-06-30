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

## Stakeholder Demo Note

This is a simulation-safe public preview for workflow demonstration and stakeholder discovery. It is useful for CEP, community and investor conversations because it shows the shape of the workflow without implying clinical validation.

It demonstrates handover and discharge flow, simulated patient-safety signals, simulated readiness and risk-suggestion surfaces, audit trail behaviour, and the preview authentication/token gate.

It does not demonstrate clinical validation, live NHS integration, real ML-backed risk modelling, real patient-data processing, or deployment-ready clinical decision support.

## Hospital Insights simulation layer

### Feature summary

- A button in the main app opens a compact right-side Hospital insights drawer.
- The drawer compares one ward against the hospital simulation average and fictional peer wards.
- It shows summary cards, compact comparison charts, a ward comparison table and short review cues.
- It is useful for ward nurses, ward managers, clinical educators and digital safety leads who want a fast simulation review view.

### Safety boundary

- Simulation-only mock data is used.
- No real NHS systems are connected.
- No patient-identifiable information is used.
- No diagnosis, prediction, automated escalation or clinical decision-making is shown.
- The drawer is explicitly framed as comparison signals, review cues and human review required.

### Demo talking points

- The roadmap can be described as patient view -> review cues -> ward comparison -> hospital insights -> future NHS/AWS integration.
- Show how the comparison helps explain documentation completeness, handover completeness, NEWS2 escalation documentation, medication review cue completion and discharge readiness documentation.
- Emphasize that the charts and table are only comparison cues for review, not clinical advice.
- Use the source badge to show that the data is static prototype data.

### Future integration notes

- The service boundary is ready for a future swap to NHS Digital, hospital dashboard or AWS/Aurora sources.
- Any later integration would need separate governance, access control, safety review and audit review.

### Risks / limitations

- The benchmark values are deterministic and fictional, so they are stable for demos but not suitable for live operational decisions.
- The feature should not be treated as a clinical risk engine or decision support system.
- Future connected data sources may require UI changes once governance and integration constraints are known.

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
