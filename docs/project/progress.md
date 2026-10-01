# SafeFlow orchestration progress

Implementation history, Codex dispatches, review rounds and verification. Newest first.

## 2026-09-20 Phase 1 (SF-308)

- Claude inspected repo, CONTROL.md, conventions, SF-305 branch and safety scanner.
- Created fresh clone and branch feature/connect-voice-poc-foundation from be30246.
- Added docs/project planning files.
- Dispatch 1 (initial Phase 1 brief) sent to Codex CLI. Brief: docs/project/dispatches/2026-09-20-phase1-initial.md.
- Dispatch 1 result: 64 new files, CONTROL.md and safetyLanguage.test.js modified. Codex could not commit: its workspace-write sandbox makes .git read-only (index.lock permission denied) and blocks vitest config loading and esbuild asset bundling. Codex verified with --configLoader native: focused 32 files / 127 tests passed; 18 infra bundling failures attributed to the sandbox.
- Review round 1 (Claude, full diff read): scope, architecture, provenance, connect domain rule, privacy notification, speech profile fairness, numeric detection, point-of-care binding and boundary tests pass. Five findings sent as correction 1 (docs/project/dispatches/2026-09-20-phase1-correction-1.md):
  1. Voice Saved not tied to an approved, reliable, human-confirmed candidate or confirmed numbers.
  2. Structured request cancellation possible by a system actor.
  3. AI draft could be approved by its own author id.
  4. Platform events allowed non-human actors on human-decision events and unconfirmed provenance on confirmation events.
  5. Master spec to document 1 to 4.
- Decision: commits are made by Claude outside the Codex sandbox after review, using the brief's commit grouping and Codex co-author trailer. Full suite and build run by Claude outside the sandbox.
- Correction 1 result (Codex): findings 1, 3, 4 and 5 fixed with tests. Finding 2 was a Claude misread: cancellation already required a human (only delivered and read accept a system actor); Codex added tests proving it. Claude re-read the changed modules and spec sections; all pass.
- Claude verification outside the sandbox: focused 32 files / 145 tests passed; npm test 126 files / 859 tests passed (infra bundling passes outside the sandbox); npm run build passed with the existing chunk-size warning; git diff --cached --check clean for each commit; boundary grep for local paths, secrets, scoring, escalation and origin fields found only negative tests and boundary statements.
- Commits (Claude, Codex co-author): 47dcbfa docs, 835bd46 shared, a813e70 connect, e7ad12b voice, 924a3b3 point of care, aff387b boundary tests, then control board and this log.
- Phase 1 gates A to J passed. STOP: awaiting Oli approval. No PR opened, no merge, no Phase 2 work.

## 2026-09-20 / 21 Phase 2 Connect simulation UI (SF-315)

- Oli approved Phase 1 merge and Phase 2. PR #101 merged (f36bb32) after CI passed. Branch feature/connect-ui-phase2 created from f36bb32.
- Dispatch: docs/project/dispatches/2026-09-20-phase2-connect-ui.md. While Claude was unavailable, Oli ran it through the Codex desktop app, which is not sandboxed in the same way. Codex wrote the full implementation (23 files, +1542) and reported: focused 21 files / 117 tests, full 142 files / 1118 tests, build passed, npm audit clean. Its Playwright rerun on a separate port and its handover to Claude did not finish. Nothing was committed.
- Claude re-verified outside Codex before review: full suite 142 files / 1118 tests passed, build passed.
- Review round 1 (Claude, full diff read): scope, boundary copy, MESSAGE != TASK != REVIEW CUE != ESCALATION, AI draft gate, existing-task linking, privacy preview, focus handling and the boundary scan pass. Five findings sent as docs/project/dispatches/2026-09-21-phase2-correction-1.md:
  1. Refused actions throw inside the React reducer and would blank the screen; must fail safe with an announcement.
  2. A test-only `send-unapproved-draft` action lives in production code.
  3. Only one role resolves in the demo; add a fictional pharmacist assignment.
  4. Notification preview category set on every request transition instead of by event type.
  5. Tidy the surface-scan test import and trailing newline.
- Codex left a scratch Playwright config (.phase2-playwright.config.mjs, separate port) in the repo root. Claude moved it to the orchestration folder so it is not committed.
