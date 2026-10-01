# CODEX CORRECTION TASK 1: Phase 2 Connect UI review findings (SF-315)

Read CONTROL.md and docs/architecture/safeflow-connect-voice-point-of-care-master.md before making implementation decisions.

Claude reviewed the full uncommitted Phase 2 diff on feature/connect-ui-phase2. Scope, boundary copy, the message/task/cue/escalation separation, the AI draft gate, task linking, privacy preview, focus handling and the boundary scan pass. Fix ONLY the five items below. Do not refactor anything else. Do not touch CONTROL.md, docs/project/, Phase 1 domain modules, or other views. Do not stage or commit. No new dependencies.

## Findings

1. Reducer errors can crash the whole screen (robustness, safe failure).
   File: src/connect/connectWorkspace.js (+ tests).
   connectReducer throws FoundationValidationError on refused actions (unresolved recipient, empty message, illegal transition, unapproved send). A throw inside a React reducer unmounts the tree. The UI disables most paths, but the view must fail safe, not blank.
   Required: catch FoundationValidationError (and only that class) around the action handling and return the previous state unchanged except `announcement: "Action refused: <message>"`. Any other error must still throw. Update the reducer tests to assert the refusal (state unchanged apart from the announcement, nothing added to events, requests or activity) instead of expecting a throw. Add a ConnectView test that a refused action shows the refusal in the status region and the view stays rendered.

2. Test-only production path.
   File: src/connect/connectWorkspace.js (+ test).
   Remove the `send-unapproved-draft` action. Prove the gate instead with a test that builds a draft through the reducer and calls `createSimulationCommunicationProvider().sendEvent(draft)` directly, expecting 'Human approval required'.

3. Only one role resolves in the demo.
   File: src/connect/demoFixtures.js (+ test).
   Add one extra fictional current assignment for `pharmacist` (fictional person id `fictional-pharmacist`, name "Jordan Lee", same fictional team/ward/org) to the demo assignments only, alongside the Phase 1 `fictionalAssignments`. Do not edit src/connect/fixtures.js. Keep `on-call` unresolved. Test both.

4. Notification preview category.
   File: src/connect/connectWorkspace.js (+ test).
   Set `notificationCategory` by what happened: message sent or approved draft sent -> 'message'; request created -> 'review-request'; acknowledged -> 'acknowledgement'. Delivered, read, accepted, in-progress, completed, declined and cancelled leave it unchanged. Test that the preview text still never contains names, ids or digits.

5. Tidy the surface-scan test edit.
   File: src/components/safetyLanguageSurfaces.test.jsx.
   Move the ConnectView import into the existing import block (after the other component imports) and end the file with a newline. Do not change any other case.

## Verification

1. `npx vitest run --configLoader native src/connect src/components/connect src/components/safetyLanguageSurfaces.test.jsx src/shared`
2. `git diff --check` and `git status --short`
Claude runs the full suite, build and Playwright outside your sandbox.

## Stop condition

Stop after the five fixes. Final message: each finding with file and test names, focused result, diff-check, deviations.
