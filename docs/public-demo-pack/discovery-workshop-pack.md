# SafeFlow Discovery Workshop Pack

## Purpose

Use this pack to run a short, simulation-only review with nurses, ward leaders or product advisors. The aim is to learn whether SafeFlow makes ward risk, handover blockers, discharge readiness and documentation gaps easier to see.

## Session Setup

- Use fictional scenarios only.
- Do not use live patient data.
- Do not use official NHS branding or imply endorsement.
- Ask participants to judge workflow usefulness, clarity and safety boundaries.
- Treat AI-generated SBAR wording as editable draft support, not clinical direction.

## Suggested 45 Minute Agenda

1. Five minutes: explain the simulation boundary and SafeFlow Nursing concept.
2. Ten minutes: walk through the Ward Safety Board and selected patient panel.
3. Ten minutes: review the potassium / electrolyte safety-gap flow.
4. Ten minutes: compare the three discovery scenarios in the Scenarios tab.
5. Ten minutes: collect feedback, hazards, missing workflow steps and priority ranking.

## Discovery Scenarios

### Electrolyte / AKI Documentation Gap

Ward context: day care patient with falling potassium trend, changing renal function and no visible magnesium result.

Review question: can the nurse in charge see what evidence is present, what is missing and who needs to clarify the plan?

Watch for:

- Risk visible within one minute.
- Missing magnesium result clearly identified.
- SBAR wording supports escalation documentation without clinical instruction.
- Any wording that overstates the safety flag.

### Sepsis Escalation Handover

Ward context: patient with raised NEWS2, blood cultures completed and active escalation needing clear handover ownership.

Review question: can outgoing and incoming nurses see task ownership, escalation status and latest documentation without re-reading the full note?

Watch for:

- Escalation status visible on the board.
- Tasks showing owner and due time.
- Audit trail separating observation, escalation and documentation events.
- Ambiguity about who owns the next action.

### Discharge Readiness Blocker

Ward context: patient appears clinically stable but discharge education, BGL check or medicines counselling is incomplete.

Review question: can the team distinguish clinically ready from operationally ready and make blockers visible at handover?

Watch for:

- Readiness state explains the blocker.
- Handover completion reflects outstanding work.
- Board supports discharge discussion without hiding safety flags.
- Vague readiness labels.

## Feedback Form

Use one row per participant or group.

| Area | Prompt | Rating 1-5 | Notes |
| --- | --- | --- | --- |
| Board clarity | Could you understand the ward state within one minute? |  |  |
| Patient panel | Did the panel show the right information without too much navigation? |  |  |
| Safety flag | Was the potassium/electrolyte flag explainable and appropriately cautious? |  |  |
| SBAR draft | Did the draft wording save time while preserving professional judgement? |  |  |
| Handover | Did task ownership and blocker status feel clear? |  |  |
| Audit | Did the audit trail feel useful for learning rather than blame? |  |  |

## Initial Hazard Log

| Hazard | Example Concern | Current Control | Follow-up Question |
| --- | --- | --- | --- |
| Overstated safety flag | User reads a flag as diagnosis or treatment advice. | Boundary text, evidence list and missing-information wording. | Is the language cautious enough for ward review? |
| Unsafe AI wording | Draft includes clinical instruction. | Server-side provider boundary, unsafe-wording rejection and deterministic fallback. | What wording should be banned or escalated for review? |
| Hidden missing information | Important absent data is not visible. | Missing-information list in safety gap view. | Which missing fields matter most to nurses? |
| Out-of-date task status | Handover relies on stale owner/due-time data. | Fictional task status and audit timeline in prototype. | Which task updates need mandatory audit events? |
| Blame-oriented audit trail | Staff feel the audit view is punitive. | Learning-oriented labels and documentation focus. | What wording makes audit psychologically safer? |
| Brand or endorsement confusion | Reviewers assume official deployment or approval. | No official logo and repeated simulation boundary. | Is the public-safe wording clear enough? |

## Output To Capture

- Top three scenarios to keep.
- Top three scenarios to add.
- Highest-risk hazard and proposed mitigation.
- One workflow step that feels missing.
- Decision: stop, iterate prototype, or prepare a non-live simulation session.
