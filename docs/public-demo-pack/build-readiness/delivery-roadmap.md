# SafeFlow Delivery Roadmap

## Active Follow-up Backlog

### Replace placeholder signal and risk providers with ML-backed DB read models

Acceptance criteria:

- Database read model is available in the preview stack.
- Placeholder fallback is used only when explicitly configured for preview or simulation mode.
- API responses expose source and provider metadata for both signal and risk-suggestion routes.
- Tests cover both DB-backed and placeholder-backed modes.
- The simulation safety disclaimer remains visible in the public preview UI.
- No silent placeholder fallback is allowed in production-intent environments.

### Preview observability and diagnostics

Acceptance criteria:

- Smoke failures identify the endpoint and failure mode.
- Provider mode is logged safely.
- No patient-identifiable data is logged.
- Preview failures are diagnosable without exposing sensitive data.
- Hosted smoke output is suitable for CI/PR review.

### Pilot governance and clinical safety track

Acceptance criteria:

- Define requirements before real clinical data use.
- Define DPIA and information-governance requirements.
- Define clinical safety case requirements.
- Define validation plan for ML-backed outputs.
- Define human-in-the-loop boundaries.
- Define intended-use statement and exclusions.

## Phase 0: Public Simulation Prototype

Status: current PR.

Deliverables:

- Ward Safety Board.
- Handover/discharge workflow.
- Potassium safety-gap journey.
- Editable SBAR draft.
- Audit and learning timeline.
- Public demo pack.

Exit criteria:

- Prototype can be run locally.
- Safety boundary is visible.
- Public docs do not expose confidential invention material.
- Basic tests and browser journey pass.

## Phase 1: Product Discovery

Goal: Validate workflow value with nurses and ward leaders using fictional scenarios.

Deliverables:

- Workshop scripts.
- Scenario templates.
- Feedback form.
- Prioritised backlog.
- Initial hazard log.

Exit criteria:

- At least three realistic safety-gap scenarios ranked.
- Users understand the board without training-heavy explanation.
- Safety boundary remains clear.

## Phase 2: Secure Pilot Build

Goal: Build a production-intent app using synthetic or de-identified data.

Deliverables:

- Authenticated app.
- Backend APIs.
- Database persistence.
- Audit event store.
- Server-side AI draft provider.
- Admin/config area for scenarios and rules.
- CI/CD and environment separation.

Exit criteria:

- Role-based access works.
- Audit trail captures all key actions.
- AI draft output is evidence-bound and editable.
- Safety tests catch unsafe wording.

## Phase 3: Non-Live Ward Simulation

Goal: Test SafeFlow in a realistic workflow setting without live patient data.

Deliverables:

- Ward simulation scripts.
- Facilitator guide.
- Observation sheets.
- Usability findings.
- Updated hazard log.

Exit criteria:

- Nurses can complete a handover scenario.
- Escalation documentation is clearer or faster.
- False-positive and false-negative concerns are documented.

## Phase 4: Integration Feasibility

Goal: Assess whether controlled read-only clinical integration is viable.

Deliverables:

- Integration inventory.
- Data protection assessment draft.
- Clinical safety case draft.
- Technical architecture review.
- Partner system API assessment.

Exit criteria:

- Clear data source for each required signal.
- Approved path for identity, observations, labs and notes.
- No unresolved high-risk safety blockers.

## Phase 5: Controlled Pilot

Goal: Run SafeFlow in a governed pilot if approved.

Deliverables:

- Support model.
- Monitoring.
- Incident response process.
- Training and onboarding.
- Pilot metrics.
- Post-pilot evaluation.

Exit criteria:

- Evidence shows workflow value.
- Safety and governance conditions are met.
- Decision made: stop, iterate or scale.
