# FHIR observation mapping

Proposed mapping only: FHIR R4 / UK Core resource relationships for a future governed adapter. Simulation-only prototype; fictional patient data only; no real patient data; human review required. No live NHS APIs, exporter or connected FHIR service. See the [master specification](safeflow-connect-voice-point-of-care-master.md).

## Proposed field map

| SafeFlow field | Future resource / element | Mapping condition |
|---|---|---|
| ObservationCandidate.patientId | Observation.subject -> Patient | Resolve a governed patient reference; fictional ID is not a live identifier |
| ObservationCandidate.code | Observation.code | LOINC/SNOMED placeholder: to be confirmed against UK Core |
| ObservationCandidate.value | Observation.valueQuantity.value | Finite numeric candidate; human-confirmed value only |
| ObservationCandidate.unit | Observation.valueQuantity.unit/code/system | UCUM units; proposed examples /min, %, L/min; confirm code/unit compatibility |
| ObservationCandidate.source / provenance.provider | Observation.device -> Device | Resolve device identity separately; provider name is not a device identifier |
| provenance.capturedAt | Observation.effectiveDateTime | Capture time is provisional; verify actual measurement-time semantics |
| session.patientId | Patient reference | Binding must have been explicitly confirmed in the future adapter |
| session.sessionId, wardId, bedId | Encounter context / location references | A bedside session is not itself an encounter; resolve the relevant Encounter |
| session.clinicianId, clinicianRole | Practitioner / role context | Resolve authenticated identity; do not export simulated badge identity |
| session.deviceId | Device reference | Resolve approved device inventory |
| session.authenticatedAt, patientBoundAt, lastActivityAt, status | Local session audit metadata | Do not invent equivalent FHIR clinical fields |
| provenance.type, provider, capturedAt | Provenance.entity / activity and source metadata | Profile/extension design to be confirmed against UK Core |
| provenance.reviewedBy, reviewedAt | Provenance.agent -> Practitioner, Provenance.recorded | Preserve review identity and time; verify profile semantics |
| confirmed observation reference | Provenance.target -> Observation | Reference the actual exported resource version |

LOINC and SNOMED CT coding values are deliberately absent: all terminology choices are **to be confirmed against UK Core**. ISO/IEEE 11073 is a future device-interoperability consideration, not an implemented interface or compliance claim. Units alone never identify an observation.

## Finality and provenance gates

Only human-confirmed observations would ever map to `Observation.status = final`. Unconfirmed candidates are never exported. Transcript approval alone is insufficient. Numeric confirmation alone is insufficient. Observation confirmation requires an identified human reviewer and review timestamp with capture provenance preserved. A future adapter must additionally validate resource profiles, required elements, terminology, unit consistency, patient/encounter binding and authorisation; this proposal does not claim that confirmation alone satisfies UK Core.

Patient, Encounter, Device, Practitioner and Provenance links above describe conceptual relationships rather than production payloads. No clinical score, NEWS2 value or aggregate is derived from speech or candidates in Phase 1.
