# Clinical Safety And Information Governance Readiness

This note describes what SafeFlow would need before moving beyond simulation. It is a readiness note for stakeholder discussion, not a formal clinical safety case, information-governance approval, or deployment decision.

## Current Prototype Boundary

- SafeFlow is currently simulation-only.
- It uses fictional patient and ward contexts only.
- No real patient data is used.
- No patient-identifiable information is used.
- No live NHS systems are connected.
- No NHS Digital APIs, AWS services, or external clinical datasets are connected in the current prototype.
- It is not for clinical use.
- It does not provide diagnosis, treatment advice, risk prediction, or automated escalation.
- All review cues, comparison signals, and report outputs require human review.

## What SafeFlow Currently Does

- Presents a simulated ward view and patient context for demos and review.
- Surfaces structured review cues such as documentation gaps, handover completeness issues, discharge-readiness blockers, and related simulation signals.
- Compares a current fictional ward against hospital-level mock benchmarks.
- Produces a simulation review report for education, stakeholder discussion, and operational learning.
- Supports nurse-led review, reflection, and digital-safety conversations without making clinical decisions.

## What SafeFlow Explicitly Does Not Do

- It does not diagnose conditions.
- It does not recommend treatment.
- It does not predict deterioration or future risk.
- It does not trigger autonomous escalation.
- It does not prescribe or modify medication.
- It does not replace professional judgement, local policy, or clinical oversight.
- It does not connect to live EPR, PAS, NHS Digital, or AWS-backed production data in this prototype.

## Clinical Safety Considerations

Before any move beyond simulation, SafeFlow would need a formal clinical safety case and documented intended use.

Key themes include:

- Define the intended users, settings, and boundaries.
- Maintain a hazard log and documented risk controls.
- Ensure every cue has traceable source evidence or a clear missing-data statement.
- Keep human-led nursing oversight central.
- Validate all safety wording so the product cannot be read as providing autonomous clinical advice.
- Complete DCB0129-style manufacturer clinical safety work and DCB0160-style deployment work where applicable to the future operating model.
- Test unsafe wording, missing-data cases, and escalation edge cases before any live pilot.

## Information Governance Considerations

Before any real-data pilot, SafeFlow would need information-governance review and approval.

Key themes include:

- Confirm data controller and data processor roles.
- Use approved local trust pathways and agreements.
- Define what data is in scope, why it is collected, and who may access it.
- Apply data minimisation so only necessary data is used.
- Define retention, deletion, and export rules.
- Use role-based access control for viewing, editing, exporting, and administration.
- Maintain audit logging for access, configuration, and report generation.
- Confirm hosting, residency, supplier, and subcontractor expectations.
- Document incident response and breach reporting responsibilities.

## Data Protection Considerations

Any move to real data would require a data protection impact assessment and related review.

Key themes include:

- Confirm the lawful basis and special-category data handling conditions.
- Complete a DPIA before processing real patient information.
- Provide a clear privacy notice and staff communication approach.
- Limit collection and display to the minimum necessary data.
- Consider encryption, pseudonymisation, and secure deletion controls.
- Confirm whether data can be used for support, audit, learning, or model improvement.
- Ensure subject-rights handling, where relevant, is understood by the future operating organisation.

## Human Review Model

SafeFlow is designed to support human review, not replace it.

- Ward nurses, ward managers, clinical educators, and digital safety leads remain responsible for interpretation.
- Review cues and comparison signals are advisory only.
- No output should be treated as a clinical decision.
- No output should be used for automated escalation or unattended care actions.
- Any future workflow automation would need explicit safety, IG, and operational approval.

## Role-Based Access And Audit Logging Needs

If SafeFlow moves toward a governed pilot, it should include:

- Role-based access control for viewer, ward lead, educator, safety lead, and administrator roles.
- Segregation of simulation, test, and future pilot environments.
- Audit logs for sign-in, record access, cue edits, report generation, exports, and configuration changes.
- Traceable administrative actions for data-source changes and integration settings.
- Retention rules for logs that support assurance, review, and incident investigation.

## Future NHS/AWS Integration Readiness

The current prototype should be treated as a clean simulation layer that could later sit behind approved service boundaries.

Future readiness would likely require:

- A governed data-access layer with approved adapters.
- Separation between presentation, rules, and data-source services.
- Explicit controls for any NHS Digital or local trust integration.
- A future AWS/Aurora or workflow-orchestration layer only after approval.
- Security review, access controls, and audit logging before any live connection.
- No assumption that mock data, prototype flows, or demo outputs can be reused directly for live care.

## Key Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Simulation outputs are mistaken for clinical advice | Keep boundary wording visible, use human-review language, and avoid decision wording. |
| Mock data is mistaken for real patient data | Label the prototype clearly, keep deterministic fictional scenarios, and avoid patient-identifiable information. |
| Unsafe live-data use | Require IG, clinical safety, security, and integration approval before any real connection. |
| Over-automation or unattended action | Keep the product review-led and disable autonomous escalation. |
| Insufficient auditability | Log access, exports, edits, and configuration changes. |
| Scope creep into production use | Keep a formal change-control and transition-gate process. |

## Open Questions Before Any Live Pilot

- Which trust, service line, and user group would be in scope?
- What exact data items are needed, and which are out of scope?
- What clinical safety officer or safety lead will own the safety case?
- What DPIA, IG, and security approvals are required?
- What retention, access, and audit expectations apply?
- What training, support, and incident-reporting process will be used?
- What live integration points are approved, and at what stage?

## Simulation-to-live Transition Gates

SafeFlow should not move from mock data to real data until all of the following are complete:

- Governance approval
- Clinical safety review
- Data protection review
- Technical architecture review
- Security review
- Integration approval
- Pilot scope approval
- Staff training and support
- Monitoring and incident reporting process

## Summary

SafeFlow is currently a simulation-first prototype. It can support discussion about documentation quality, ward comparison, review cues, and structured reporting, but it must remain clearly separated from live clinical use until all safety, governance, security, and integration gates are complete.
