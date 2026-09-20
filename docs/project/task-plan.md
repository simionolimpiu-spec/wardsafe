# SafeFlow orchestration task plan

Authoritative work tracking lives in CONTROL.md. This file holds the current programme, phase and acceptance criteria so they survive context loss. Canonical architecture: docs/architecture/safeflow-connect-voice-point-of-care-master.md.

## Roles

- Claude: orchestrator, architect, clinical-safety, UX, security, accessibility and test reviewer, QA gate, CONTROL.md owner.
- Codex (CLI on Oli's PC): primary implementer. Works only on the bounded task it is given.
- Oli: approves every phase transition.

## Programme: SafeFlow Connect + Voice + Point of Care (parent SF-307)

| Phase | Scope | Status |
|---|---|---|
| 1 | Architecture, domain and provider foundations | In progress |
| 2 | Connect simulation UI | Not started, needs approval |
| 3 | Voice dictation + TTS | Not started, needs approval |
| 4 | Point-of-Care bedside session | Not started, needs approval |
| 5 | Voice/device observation capture | Not started, needs approval |
| 6 | Nursing forms/documentation | Not started, needs approval |
| 7 | Accent/multilingual/speech safety | Not started, needs approval |
| 8 | AI-assisted communication/documentation | Not started, needs approval |
| 9 | External adapter simulations | Not started, needs approval |
| 10 | Hardening/evaluation/governance | Not started, needs approval |

## Phase 1 acceptance criteria

- Master spec, hardware profile and FHIR mapping exist and pass the safety-wording scan.
- Shared capture provenance, review status, provider contract guard and platform events exist.
- Connect, Voice and Point-of-Care domain foundations exist with contracts and simulation providers only.
- MESSAGE, TASK, REVIEW CUE and ESCALATION never transform into each other.
- Speech output stays candidate/draft; low confidence fails safe; numbers need explicit confirmation.
- No network, microphone, storage, logging of bodies, env access or live providers in the new modules.
- Focused tests, full suite, build and diff-check pass (or unrelated failures documented).
- Claude review gates A to J pass on the actual diff.
- CONTROL.md updated. Branch pushed only after review. No Phase 2 work.

## Standing rules

- Every Codex task starts: "Read CONTROL.md and docs/architecture/safeflow-connect-voice-point-of-care-master.md before making implementation decisions."
- One bounded task per dispatch. Corrections are focused and listed.
- Claude edits directly only for tiny, unambiguous, non-architectural fixes.
- Stop for human approval at the end of every phase.
