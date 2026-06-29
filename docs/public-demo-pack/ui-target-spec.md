# SafeFlow UI Target Spec

This spec translates the reference image into SafeFlow's neutral, public-safe UI direction.

Do not copy official NHS branding, logos or endorsement language. Use SafeFlow as the product mark and SafeFlow Nursing as the nurse-led concept name.

## Target Layout

### App Shell

- Left navigation.
- Main ward board.
- Right patient detail panel.
- Optional bottom architecture/implementation strip for demo mode only.

### Left Navigation

Items:

- Ward Safety Board.
- My Patients.
- Observations.
- Tasks.
- Escalations.
- Handover.
- Discharges.
- Reports.
- Audit Trail.
- Settings.

Rules:

- Use icons plus labels.
- Show count badges for tasks and escalations.
- Keep ward/location context at the bottom.
- Do not use official NHS logo.

### Ward Safety Board

Columns:

- Patient ID.
- Risk Flags.
- NEWS2 or observation status.
- Responsible Nurse.
- Next Action.
- Escalation Status.
- Handover Progress.
- Discharge Readiness.

Row states:

- Selected patient row.
- High-risk alert row.
- Discharge-ready row.
- Needs-review row.

Controls:

- Date selector.
- Last updated timestamp.
- Refresh action.
- Export board action.

### Right Patient Panel

Tabs:

- Safety Overview.
- SBAR.
- Tasks.
- Audit Trail.

Safety overview sections:

- Allergies.
- Active concerns.
- Escalation status.
- SBAR summary.
- Tasks.
- Audit trail preview.
- Integration readiness panel.

Rules:

- Patient data must be fictional unless the environment is formally approved for live data.
- Active alerts must show source and timestamp.
- Escalation cards must show who was contacted and when.
- Action buttons must avoid prescribing or treatment wording.

### Demo Architecture Strip

The bottom architecture strip is useful for demos, investor conversations and technical review. It should be toggleable or placed in documentation mode, not always present in clinical workflow mode.

Suggested blocks:

- Identity.
- API layer.
- Workflow orchestration.
- Event routing.
- Application services.
- Database.
- Object storage.
- Monitoring.
- Key management.
- Integration gateway.

## Visual Style

Use:

- Clean clinical palette.
- White background.
- Strong blue for active navigation and primary actions.
- Red only for high-severity safety warnings.
- Amber for needs-review state.
- Green for ready/complete state.
- Text labels alongside colour indicators.

Avoid:

- Official NHS logo or brand lockup.
- Marketing hero sections.
- Decorative gradients or abstract backgrounds.
- Colour-only clinical meaning.

## Prototype Gaps To Fill

The current prototype demonstrates the core journey. To approach the target image, add:

- Persistent left navigation.
- Patient detail tabs.
- More patient rows.
- Ring-style handover progress indicators.
- Export board action.
- Task count badges.
- Audit preview on the patient panel.
- Demo architecture strip or documentation view.
- FHIR-ready integration placeholder panel.
