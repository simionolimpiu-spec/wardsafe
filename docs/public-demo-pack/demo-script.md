# SafeFlow Demo Script

**Status date:** 2026-07-05
**Authored directly (docs-only):** aligned to `docs/public-demo-pack/master-narrative.md`.

## Setup

Run the prototype locally:

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## 1. Ward Safety Board

Start on the Ward Safety Board.

Call out:

- SafeFlow name in the UI.
- Simulation-only boundary.
- Fictional Day Care Unit patient list.
- Ward metrics for patients, escalations, NEWS2, handover and discharge readiness.
- Selected patient safety panel with SBAR summary and tasks.

## 2. Handover And Discharge Readiness

Open the Handover tab.

Call out:

- Handover completion for the selected patient.
- Open tasks that need allocation.
- Discharge blockers such as unclear medical plan and outstanding electrolyte review.

## 3. Potassium / Electrolyte Safety Gap

Open the Potassium flag tab.

Call out:

- Visible evidence: falling potassium, medicine context, symptoms, renal-function change.
- Missing information: magnesium result and unclear electrolyte plan.
- Boundary: SafeFlow supports recognition, checking, documentation and escalation readiness; it does not prescribe or replace clinical judgement.
- Editable SBAR draft generated from visible simulated evidence.

Optional action:

- Edit the SBAR draft.
- Save it.
- Note the visible audit cue.

## 4. Audit And Learning

Open the Audit tab.

Call out:

- Timeline events are imported from the fictional scenario.
- Documentation focus: concern, background, assessment, next step, who was contacted, response and outcome.

## 5. Discovery Scenarios

Open the Scenarios tab.

Call out:

- Electrolyte / AKI documentation gap.
- Sepsis escalation handover.
- Discharge readiness blocker.
- Initial hazard controls for a simulation-only review.

## 6. Quality Intelligence Lane

If asked about future framing, keep it simulation-only:

- Now: Band 6/7-style quality reporting for fictional deteriorating-patient documentation review.
- Next: simulated RRT/Outreach learning themes from fictional cases.
- Later: governed discovery only for an escalation-readiness queue, patient voice, and social/discharge coordination.
- Human review required; clinical judgement remains central.

## 7. Close

Position the prototype as a focused workflow demonstration, not clinical software. The next review question is whether this nurse-led safety workflow is compelling enough to justify structured discovery sessions, deeper stakeholder testing and private invention-pack development.
