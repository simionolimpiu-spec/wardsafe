# SafeFlow Data Integration Map

## Current Prototype Data

Current data is fictional and local to the app.

Current simulated domains:

- Ward summary.
- Patient summaries.
- Risk flags.
- NEWS2-style observation status.
- Medicines context.
- Lab trends.
- Tasks.
- Escalations.
- Handover status.
- Discharge blockers.
- Audit events.

## Future Data Domains

### Patient Identity

Needed later:

- Local patient identifier.
- Demographics.
- Ward/location.
- Responsible team.

Integration notes:

- Keep identity data minimal.
- Use approved identity and demographic services only.
- Avoid storing full records unless essential.

### Observations

Needed later:

- NEWS2 score.
- Vital signs.
- Observation time.
- Observation trend.

Integration notes:

- Start read-only.
- Show freshness and source.
- Flag stale data clearly.

### Labs

Needed later:

- Potassium.
- Magnesium.
- Creatinine.
- Collection/result times.
- Result status.

Integration notes:

- Show missing results as missing, not normal.
- Avoid autonomous treatment suggestions.
- Preserve units and reference ranges from source.

### Medicines

Needed later:

- Current medicines.
- Allergies.
- Medication-risk context.

Integration notes:

- Read-only first.
- Display source and timestamp.
- Never generate prescribing instructions.

### Notes And Tasks

Needed later:

- SBAR notes.
- Handover notes.
- Escalation notes.
- Task ownership and status.

Integration notes:

- Draft in SafeFlow first.
- Writeback requires a separate safety and governance decision.
- Every edit and save must be auditable.

## Integration Staging

1. Fictional local data.
2. Synthetic API data.
3. De-identified imported data.
4. Read-only live data in a controlled pilot.
5. Limited writeback only if approved.

## FHIR-Ready Mapping

Potential FHIR resources:

- Patient.
- Encounter.
- Observation.
- MedicationStatement or MedicationRequest where available and approved.
- AllergyIntolerance.
- Task.
- CarePlan.
- DocumentReference.
 
This map is indicative. Actual integration must follow the partner system, available APIs and approved governance route.
