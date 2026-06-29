# SafeFlow Implementation Blueprint

## Product Goal

SafeFlow should help ward teams see safety risks, handover blockers, discharge readiness and documentation gaps earlier, then support safe escalation and audit. The first production-intent version should remain nurse-led, explainable and auditable.

## Non-Negotiable Boundaries

- No live data until a formal clinical safety and information-governance process is approved.
- No official NHS logo or endorsement unless a real NHS partner authorises it in writing.
- No prescribing, diagnosis or treatment instructions.
- AI output must be editable draft support, never autonomous clinical action.
- Every generated suggestion must show the source evidence or state that evidence is missing.

## Core Product Modules

### 1. Ward Safety Board

Purpose: Give the nurse in charge a scan view of risk, workload and blockers.

Needed features:

- Patient list with fictional or integrated identifiers.
- Risk flags, NEWS2 or observation status, responsible nurse, next action and escalation state.
- Handover and discharge readiness indicators.
- Filters for risk, nurse, escalation and readiness.
- Export or handover summary for simulated review.

### 2. Patient Safety Panel

Purpose: Show the selected patient context without navigating away from the ward board.

Needed features:

- Safety overview.
- SBAR summary.
- Tasks and ownership.
- Audit trail.
- Evidence links for observations, labs, medicines and notes once integrations exist.

### 3. Handover And Discharge Readiness

Purpose: Make incomplete documentation and discharge blockers visible.

Needed features:

- Completion state for SBAR, tasks and clinical checks.
- Blocker categories such as plan unclear, observations pending, medicines issue, transport or education.
- Shift handover export.
- Role-based task assignment.

### 4. Safety Gap Intelligence

Purpose: Explain possible safety gaps using visible evidence and missing information.

Needed features:

- Deterministic safety rules for the first pilot scenarios.
- AI draft provider behind a server-side interface.
- Evidence panel listing input signals and missing data.
- Editable SBAR draft.
- Save event to audit trail.

### 5. Audit And Learning

Purpose: Show what was noticed, when, by whom and what happened next.

Needed features:

- Timeline of observations, escalations, task changes and draft edits.
- Documentation-quality prompts.
- Exportable learning summary.
- Later: aggregation across wards, shifts and scenarios.

## First Production-Intent Build

The first production-intent build should not start with full EPR integration. It should start with a controlled simulation or de-identified workflow environment:

1. Implement the full UI flow using fictional and synthetic data.
2. Add authenticated user roles.
3. Add backend APIs and database persistence.
4. Add audit logging for every workflow action.
5. Add AI draft generation behind a provider interface.
6. Run a tabletop clinical safety review.
7. Run a non-live ward workflow simulation.
8. Only then assess whether live integration is appropriate.

## Evidence Needed To Move Forward

- Nurses can understand and act on the board within one minute.
- Safety flags are explainable and do not overclaim.
- Handover/discharge blockers match real ward workflow.
- Draft SBAR saves time without reducing professional accountability.
- Audit trail is useful for learning, not blame.
