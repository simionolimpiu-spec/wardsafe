# Go 6 reconstruction handover for Claude

Oli authorised Codex to reconstruct and continue Go 6 because Claude tokens were
unavailable. The original four commits/bundle were not available on this PC or
fetched remote branches. This is new work from integration commit f36bb32 on
`codex/go6-ai-debrief`, tracked as SF-325 because SF-308 is already allocated.

Implemented: rule-based PEARLS draft in Scenario Library; per-line source snapshots,
AI-interpretation labels, human accept/edit/reject and sign-off; immutable local audit
events and JSON download; unsafe wording/source checks and visible examples; escaped
untrusted notes; server-owned input/prompt/output boundary with disabled adapter seam.

Live OpenAI calls are not implemented or enabled. No credentials are required or
used. See `live-ai.md` for the exact boundary and limitations. This is intentionally
not represented as recovery of Claude's missing commits or its claimed test results.

Validation and PR outcome will be recorded here after this branch's checks finish.
