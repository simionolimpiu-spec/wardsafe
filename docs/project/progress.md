# SafeFlow orchestration progress

Implementation history, Codex dispatches, review rounds and verification. Newest first.

## 2026-09-20 Phase 1 (SF-307)

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
