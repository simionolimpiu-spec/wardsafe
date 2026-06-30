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

## Simulation Review Report

### Feature summary

- The Review report button opens a short in-app simulation summary.
- It pulls together the current simulated patient view, active review cues, and the ward-level Hospital Insights comparison.
- The report is useful for education, ward review, quality improvement discussion, and digital safety demonstrations.

### Safety boundary

- No real patient data is used.
- No live NHS systems are connected.
- No patient-identifiable information is used.
- The report is for prototype demonstration only.
- The wording is comparison-based and requires human review.

### Demo talking points

- Show the flow from patient view to review cues, then into ward comparison and the structured review summary.
- Use the report to explain how documentation, handover, NEWS2 review cues, and ward-level comparison fit together in one simulation view.
- Emphasize that the report is a learning aid, not a clinical recommendation tool.
- Keep the human review note visible so the audience sees the boundary clearly.

### Future integration notes

- SafeFlow currently demonstrates a simulation pathway from patient-level review cues to ward-level comparison and a structured review summary. Future work could place this behind approved NHS/AWS service boundaries, subject to information governance, clinical safety case development, and integration approval.
- Later integration could reuse the same report layout once a governed NHS or AWS service boundary exists.

### Risks / limitations

- The report summarizes deterministic mock data, so it is stable for demos but not suitable for patient care.
- It should not be treated as diagnosis, treatment advice, or automated escalation.
- Future live data sources may require extra governance, access control, and UI review.

## SafeFlow architecture readiness note

### Current prototype state

- SafeFlow is a simulation-only prototype built around fictional patient journeys.
- The current data model uses deterministic mock data for the patient panel, review cues, Hospital Insights, and the Simulation Review Report.
- The app is designed for human-led review, documentation quality, ward comparison, and educational demos.

### Service boundaries already present

- Patient-level review cues are separated from ward-level comparison logic.
- Hospital Insights is already isolated as a simulation layer with deterministic benchmark data.
- The Simulation Review Report reuses the current simulation state instead of introducing live data sources.
- These boundaries are intended to make future integration work easier to govern and review.

### Future NHS/AWS architecture possibility

- Future work could place SafeFlow behind an approved data service boundary for NHS Digital or local trust systems.
- That boundary could feed governed AWS/Aurora storage and Step Functions workflow orchestration.
- The same pattern could support audited dashboarding, report generation, and controlled data access once approved.
- Current:
  Simulation patient panel -> review cues -> Hospital Insights -> Simulation Review Report
- Future:
  Approved data service boundary -> NHS/local trust integration -> AWS/Aurora storage -> Step Functions workflow orchestration -> governed dashboard/reporting -> human-led review

### Information governance and safety requirements

- Any real integration would need information governance approval.
- Any real integration would need a clinical safety case, including DCB0129 and DCB0160-style work where applicable.
- A DPIA, role-based access control, and audit logging would be expected before live use.
- Approved NHS and local trust pathways would also be required before any operational deployment.

### Why real integrations are not included yet

- The current product stage is intentionally simulation-only.
- No real NHS data is used now.
- No live NHS systems are connected now.
- No patient-identifiable information is used now.
- The deterministic mock data is deliberate so the demo stays stable, reviewable, and safe for presentations.
- Live integrations are deferred until governance, clinical safety, and technical approval are in place.

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

## Live demo walkthrough

Use this flow when presenting SafeFlow in Presentation Mode to NHS nursing leadership, ward managers, clinical educators, digital safety leads, or innovation and transformation teams.

SafeFlow is simulation-only at this stage. No real patient data is used. No live NHS systems are connected. The prototype does not provide diagnosis, treatment advice, risk prediction, or automated escalation. SafeFlow demonstrates how structured documentation, review cues, ward comparison, and learning summaries could support human-led review.

1. Enable Presentation Mode
   - Open the prototype in Presentation Mode before the audience arrives so the experience feels guided, calm, and focused.
   - Speaker note: "This is a simulation-only review surface designed for demonstration and discussion."

2. Select a Demo Scenario
   - Choose a fictional ward and patient scenario that makes documentation gaps, handover issues, or discharge blockers easy to understand.
   - Speaker note: "We are using a fictional scenario so we can review workflow quality without using real patient data."

3. Review the simulated patient context
   - Walk through the patient summary, the current ward context, and the simulated care story.
   - Speaker note: "Nothing here is connected to live NHS systems; it is a controlled review example."

4. Review patient-level cues
   - Show the review cues that explain why a patient needs attention, such as documentation gaps, handover completeness issues, escalation readiness cues, or discharge-readiness blockers.
   - Speaker note: "These cues are prompts for human review, not diagnosis, treatment advice, or automated escalation."

5. Open Hospital Insights
   - Open the Hospital Insights view to show the ward-level context behind the selected patient.
   - Speaker note: "This helps the team understand the ward at a glance without exposing real patients or operational data."

6. Compare the ward against simulated hospital benchmarks
   - Compare the ward against the simulated hospital benchmarks to show how review quality, workload patterns, and readiness signals are framed in the prototype.
   - Speaker note: "These are fictional benchmarks for learning and discussion, not performance claims or clinical predictions."

7. Open the Simulation Review Report
   - Open the report to bring together the simulated patient context, the patient-level cues, and the ward comparison in one review summary.
   - Speaker note: "The report is a structured learning aid that keeps the human review boundary visible."

8. Explain the future NHS/AWS roadmap
   - Close by explaining that future NHS/AWS work would require governance, integration approval, safety review, and deployment controls before anything moved beyond simulation.
   - Speaker note: "Today we are demonstrating a prototype pathway; any real-world future use would need separate approval, connectivity, and safety assurance."

### Short close

Reinforce the key boundary at the end of the walkthrough:

- SafeFlow is simulation-only today.
- No real patient data is used.
- No live NHS systems are connected.
- Human review remains central.
- The prototype shows how structured documentation, review cues, ward comparison, and learning summaries could support safer team discussion.

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
