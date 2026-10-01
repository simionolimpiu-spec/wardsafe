# SafeFlow orchestration findings

Architecture discoveries and constraints. Newest first.

## 2026-09-20 Phase 1 pre-dispatch inspection (Claude)

- Base: origin/codex/safeflow-prototype at be30246 (merge of PR #98, SF-306). Highest CONTROL.md ID before this work: SF-306.
- Stack: React 19 + Vite, plain JS ES modules, Vitest jsdom, co-located tests. npm with package-lock (AGENTS.md mentions pnpm, but CONTROL.md evidence and lockfile use npm).
- Domain pattern: pure functions in src/domain, provider objects like src/domain/draftProvider.js, fail-closed guards like server/signalProvider.js.
- src/domain/workflowEvents.js is a UI audit-trail helper (Date.now, Math.random). Not suitable as a domain event base. New platform events use injected clock and id.
- SF-305 agent foundation is on unmerged branch feature/agent-foundation-v0.1 (pushed 2b69cc8, local 8dff4a9). It has src/agent/provenance.js (source-record provenance) and four trust tiers. Phase 1 provenance is capture-source provenance, named createCaptureProvenance to avoid collision. Reconciliation deferred (SF-323).
- Safety wording test scans a fixed DOCUMENTATION_FILES list with a boundary-aware scanner. New architecture docs must be added to that list.
- No docs/architecture folder existed.
- Codex sandbox previously blocked git index writes in worktrees and Lambda bundling. Phase 1 uses a fresh clone (C:\Users\oli\Documents\wardsafe-cvp-foundation) so .git sits inside the Codex workspace. Claude reruns the full suite outside the sandbox.
- git diff --check skips untracked files. Use git diff --cached --check after staging.

## 2026-09-20 Phase 1 merge preparation (Claude)

- ID collision: PR #99 (merged 12:01Z) used SF-307 for the phone top bar fix after Claude's ID check. This programme is renumbered to SF-308 (parent) to SF-324. The historical dispatch briefs keep their original numbers; CONTROL.md, task-plan and progress use the new ones.
- Lesson: re-check the highest SF ID on the live base branch and open PRs immediately before writing CONTROL.md, not only at dispatch time.
- SF-305 agent foundation merged in PR #100 (src/agent). Capture provenance (src/shared) and SF-305 trust tiers now coexist on the base. Reconciliation stays SF-324.
- Base merged into the feature branch with a merge commit (branch already pushed, so no rebase).
