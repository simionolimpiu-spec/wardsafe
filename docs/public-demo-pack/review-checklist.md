# SafeFlow Review Checklist

Use this checklist when reviewing the hosted SafeFlow simulation preview and PR #6.

## Before You Review

- Open `docs/public-demo-pack/build-readiness/public-simulation-preview.md` for the current frontend URL and non-secret deployment details.
- Get the Amplify Basic Auth password and preview token only through a private channel.
- Do not paste preview credentials into GitHub comments, repo files, screenshots or shared notes.
- Open the hosted preview first, not `localhost`, so feedback matches the live review surface.

## Safety

- The app uses fictional patient data only.
- The simulation boundary is visible on first load.
- The UI does not use an NHS logo or imply NHS endorsement.
- The prototype does not provide prescribing, diagnosis or treatment instructions.
- The potassium workflow explains evidence and missing information rather than making an autonomous clinical decision.

## Hosted Preview Checks

- The hosted preview loads after Basic Auth without a blank screen or broken layout.
- The visible product name is `SafeFlow`.
- The main workspace loads without showing raw credential errors or crashed API requests.
- The review path feels bounded and simulation-only rather than open-ended or clinical.
- Refreshing the page keeps the preview working and does not strand the user in an error state.

## Nurse-Led Workflow

- The Ward Safety Board helps scan risk and workload quickly.
- The selected patient panel gives enough context for handover.
- The handover/discharge view makes blockers visible.
- The potassium safety-gap workflow supports checking, escalation and documentation.
- The audit timeline helps show what was noticed, when, and by whom.

## Product Fit

- SafeFlow works as the short UI name.
- SafeFlow Nursing remains clear as the nurse-led concept name.
- The prototype feels familiar to clinical users without copying official NHS branding.
- The UI is focused on workflow, not marketing copy.

## Review Outcome To Capture

- Is the live preview ready to merge into `codex/safeflow-prototype`?
- Should the preview stay live after review, or should credentials be rotated or the preview be torn down?
- Which feedback belongs in PR #6 comments, and which feedback should stay in a private reviewer channel because it mentions credentials or access flow?

## Next Evidence To Gather

- Which safety-gap scenarios are most valuable for nurses to spot early?
- Which handover/discharge blockers should be prioritised first?
- What evidence would make the audit and learning layer useful to ward leaders?
- Which integrations would be required later, after the concept is validated?
