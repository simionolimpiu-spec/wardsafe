# SafeFlow Stakeholder Demo Script

This script is for workflow demonstration and stakeholder discovery only. SafeFlow is a simulation-safe public preview. No real patient data is processed. Signals and risk suggestions remain placeholder-backed.

> This preview is not clinically validated decision support and must not be used for clinical decision-making.

Live NHS integration, ML-backed risk modelling, clinical validation, and pilot governance are future work.

## Before You Start

- Open the hosted public preview in a browser with Basic Auth enabled.
- Confirm the preview token gate is available for any direct API walkthrough.
- Use desktop first, then mobile, so the layout and copy can be checked on both.
- Keep the demo grounded in fictional scenarios and simulation-only outputs.

## Suggested Opening

You can open with:

> "SafeFlow is a simulation-safe preview showing how structured handover, discharge readiness, patient-safety signals, and audit trail logic could support ward workflow discovery."

Then repeat the safety statement above before any deeper walkthrough.

## Demo Walkthrough

### 1. Open the landing page

- Point to the `Simulation preview · stakeholder discovery` badge.
- Show the `What this preview shows` and `What this preview does not show` panels.
- Explain that the preview is intentionally simulation-only and does not use real patient data.
- Keep the framing calm and practical. The goal is to show workflow shape, not claim clinical performance.

### 2. Explain the public preview purpose

- Say the preview is for stakeholder discovery, CEP review, and early workflow discussion.
- Note that the interface is intended to show how handover, discharge readiness, signals, and audit learning could sit together.
- Clarify that signals and risk suggestions are placeholder-backed and remain simulation outputs.

### 3. Walk through handover and discharge

- Show the handover/discharge workflow surface.
- Explain where readiness, blockers, and next actions appear.
- Point out that the workflow is meant to make handover friction visible, not to automate care.
- If the audit trail is visible, show how actions are recorded for learning and governance review.

### 4. Show readiness output

- Explain that readiness output is a simulation-safe review aid.
- Point out the provider/source metadata where it is shown.
- Make it clear that the preview is not validating clinical readiness or patient safety in real life.

### 5. Show simulated signals

- Open the signals view or patient safety panel.
- Point out the placeholder-provider provenance.
- Explain that the signals are simulation cues, not clinical predictions.
- Reinforce that no diagnosis, prescribing, or treatment advice is being shown.

### 6. Show simulated risk suggestions

- Show the risk-suggestion surface if it is visible.
- Explain that suggestions are placeholder-backed and designed to support review, not decision automation.
- Keep the human-review boundary visible in the explanation.

### 7. Show audit trail behaviour

- If audit is visible, explain that the trail captures the actions taken during the fictional workflow.
- Emphasize that this is for workflow learning and governance discussion.
- Do not describe the trail as clinical evidence or a compliance guarantee.

### 8. Close the demo

- Summarise what was shown: handover, discharge readiness, simulated signals, simulated risk suggestions, and audit learning.
- Repeat that the preview remains simulation-only.
- Ask for feedback on workflow realism, missing information, terminology, and what would need to change before any future integration or pilot discussion.

## Feedback Prompts

- Does this match real ward handover and discharge workflow?
- Which step feels most useful?
- Which step feels unsafe, unclear, or unrealistic?
- What would nurses need to see before trusting this workflow?
- What information is missing at the point of handover or discharge?
- What would need to integrate with existing NHS systems?
- What governance or safety concerns would block a pilot?
- Which terms should be renamed to avoid overclaiming?
- What should be removed or simplified?

## Public Review Checklist

- [ ] Safety disclaimer visible.
- [ ] Placeholder-provider provenance visible.
- [ ] No clinical validation claims.
- [ ] No live NHS data claims.
- [ ] No diagnostic claims.
- [ ] No prediction accuracy claims.
- [ ] No pilot-readiness claims.
- [ ] Desktop layout checked.
- [ ] Mobile layout checked.
- [ ] Hosted smoke passed.
- [ ] Build passed.
- [ ] Demo script reviewed.
- [ ] Feedback prompts ready.
- [ ] Follow-up capture process ready.

## Feedback Capture Template

Use this as a short note template during or after the demo:

```text
Reviewer name or role:
Organisation/context:
Date:

Workflow realism feedback:

Safety concerns:

Missing information:

Integration concerns:

Language/copy concerns:

Pilot blockers:

Suggested next step:

Priority: high / medium / low
```

## Optional Closing Line

> "This preview is for workflow demonstration and stakeholder discovery only. Signals and risk suggestions remain placeholder-backed, and the next steps are about learning what needs to change before any future validation or integration discussion."
