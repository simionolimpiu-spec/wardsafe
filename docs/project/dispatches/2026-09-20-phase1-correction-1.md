# CODEX CORRECTION TASK 1: Phase 1 review findings (SF-307)

Read CONTROL.md and docs/architecture/safeflow-connect-voice-point-of-care-master.md before making implementation decisions.

Claude reviewed the actual uncommitted Phase 1 diff in this working copy. Most of it passes. Fix ONLY the five issues below. Do not refactor unrelated code. Do not touch CONTROL.md or docs/project/. Do not stage or commit (the sandbox blocks .git; Claude will commit outside the sandbox). No new dependencies. No Phase 2 work.

## Findings to fix

1. Voice save is not tied to a reviewed candidate (clinical safety, silent-save risk).
   File: src/voice/voiceCaptureLifecycle.js (+ test).
   `transitionVoiceCapture` to `saved` currently needs only action 'approve' and a human actor. A capture holding an unreliable or unreviewed transcript can reach Saved.
   Required: the `saved` transition must also receive `approvedCandidate` (add it as an allowed key only for this transition). It must be a speech candidate with `reviewStatus === 'approved'`, `reliability === 'reviewable'`, and `provenance.humanConfirmed === true`, and its `provenance.reviewedBy` must equal the approving actor id. If `approvedCandidate.numericConfirmationRequired === true`, the transition must also receive `confirmedNumericValues`: a non-empty array where every item has `humanConfirmed === true` and a non-empty `unit` (outputs of `confirmNumericValue`). Otherwise throw. Store only references on the capture: `savedCandidateRef: { reviewedBy, reviewedAt }` and `confirmedNumericValueCount`; never copy transcript text onto the capture. Tests: saved refused with no candidate, with an unapproved candidate, with an unreliable candidate, with a numeric candidate and no confirmed values, with a reviewer mismatch; saved allowed when all conditions are met.

2. Structured request cancellation can be done by a system actor (communication safety).
   File: src/connect/structuredRequest.js (+ test).
   A system actor can silently cancel a clinical review request. Require a human actor for `cancelled` as well. Only `delivered` and `read` may be system-recorded. Test it.

3. AI draft approval does not stop self-approval (human-review boundary).
   File: src/connect/communicationEvent.js (+ test).
   `approveAiDraft` accepts any `approvedBy` string, including the AI draft author's own id. Require `approvedBy !== event.author.id`. Test it.

4. Platform events allow non-human actors on human-decision events, and allow unconfirmed provenance on confirmation events (human-review boundary).
   File: src/shared/platformEvents.js (+ test).
   Export `HUMAN_ACTOR_EVENT_TYPES` = communication.acknowledged, communication.accepted, communication.completed, voice.captureStarted, voice.draftReviewed, pointOfCare.sessionStarted, pointOfCare.patientBound, observation.confirmed, documentation.approved. These require `actor.kind === 'human'`. Additionally `observation.confirmed` and `documentation.approved` require `provenance.humanConfirmed === true` and `provenance.reviewedBy === actor.id`. Tests for each rule, including an ai-draft actor refused on documentation.approved and an unconfirmed provenance refused on observation.confirmed.

5. Master spec must describe fixes 1 to 4.
   File: docs/architecture/safeflow-connect-voice-point-of-care-master.md.
   Section 5: cancellation requires a human; AI draft approver must differ from the draft author. Section 6: Saved requires an approved, reliable, human-confirmed candidate reviewed by the approving clinician, plus confirmed numeric values when numbers are present; captures hold references, not transcript text. Section 15: list the human-actor event types and the confirmed-provenance rule. Keep every banned term inside boundary context; the doc is scanned by src/domain/safetyLanguage.test.js.

## Verification (run and report exact summaries)

The default vitest config fails inside your sandbox with "Cannot read directory ../..". Use `--configLoader native` as you did before:
1. `npx vitest run --configLoader native src/shared src/connect src/voice src/pointOfCare src/domain/safetyLanguage.test.js`
2. `git diff --check` and `git status --short`
Claude will rerun the full suite and build outside the sandbox.

## Stop condition

Stop after the five fixes and verification. Final message: each finding with the file and test names that prove it, focused test result, diff-check result, and any deviation.
