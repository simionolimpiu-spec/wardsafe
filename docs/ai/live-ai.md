# Go 6 / SF-325: simulation debrief and live-provider boundary

The Scenario Library has a PEARLS reflection draft with Reactions, Description,
Analysis and Summary prompts. It runs deterministically in the browser, including
the static phone demo and single-file offline build. No API key, network request or
model call is needed to draft or review. Every line is labelled **AI interpretation**
and **rule-based draft** so the label does not imply a live model was used.

## Educator workflow

Choose a fictional scenario and optionally enter fictional facilitator notes. Draft,
then accept, edit or reject each line. Sign-off stays blocked until every line has a
decision and there is no unsaved edit. Saved edits pass the same wording and source
checks as generated lines. Rejected lines are excluded from the signed-off prompts.
Decisions can be changed before sign-off; their earlier events remain in the audit.
Completed reviews cannot be edited. A new draft keeps the previous review in the
page's earlier-drafts list and starts a new review gate.

The source snapshot belongs to the draft: changing the scenario picker or notes
does not silently change the evidence for an existing review. Sources are scenario
context, review prompt, numbered hazards, numbered success signals and optional
unverified facilitator notes. A success signal is a discussion goal, not evidence
that a learner achieved it. These prompts are a teaching convenience, not a
validated PEARLS instrument or an assessment of clinical performance.

## Audit scope

The SF-305 event/session primitives record generation and append-only human decision
events. Sign-off records HUMAN_REVIEW_COMPLETED only after all line decisions. A
downloadable JSON snapshot includes original source text, generated text, decisions,
edited text and event timestamps. The deterministic generator uses the existing
AI_REVIEW_GENERATED event format with provider/model `rule-based`; it is not a model call.

This is in-memory simulation history. Leaving Scenarios, closing the page or
reloading clears it. Download it first if it is needed. The actor `local-educator`
is a local UI actor, not an authenticated identity. The export is not signed,
tamper-evident, server-persisted or a clinical record. Fictional data only.

## Safety checks and their limits

Each draft requires all four phases, unique line IDs, bounded text and known,
nonempty source references. Clinical instruction and discharge-judgement patterns
are blocked. The UI demonstrates one allowed example and three rejected examples
using the same validator. This is a bounded wording/reference check: a valid source
ID does not prove that a statement follows from that source, and wording patterns
cannot detect every unsafe paraphrase. Educator review remains essential.

Facilitator notes never enter system instructions. The future provider prompt uses
the existing SF-305 untrusted-data wrapper and escapes delimiter characters. The
rule-based generator never interpolates notes into its questions. Tests verify
delimiter escaping and that instruction-like notes cannot change its output. This
does not constitute proof that a future language model cannot be prompt-injected.

## Server groundwork: deliberately disabled

GET `/api/simulation/debrief/status` reports why live generation is disabled without
returning a key. POST `/api/simulation/debrief` accepts only `{ scenarioId, notes }`.
It rejects unknown scenarios, extra fields and notes longer than 2,000 characters.
The server resolves sources from its own scenario library and builds its own prompt.
No client-authored system prompt, source list, generated reply or provider choice is
accepted. The current browser uses only the status endpoint; it never sends notes.

An injected server provider can run only when `SAFEFLOW_LIVE_AI=true`, a nonempty
server `OPENAI_API_KEY` exists, and a provider adapter is installed. With any gate
missing, the endpoint returns the deterministic draft. A provider response must
contain only `lines`; the server validates the entire reply and reconstructs source
metadata itself. A failed check, error or timeout returns a controlled rejection,
not a partial live draft. Provider errors and secrets are not returned to clients.

**This reconstruction does not ship an OpenAI adapter or a live-mode UI switch.**
Setting the environment variables alone cannot enable live generation. This differs
from the unverified original Claude handover: its four commits remain unavailable.
No existing credentials were accessed or used. The adapter seam is tested with
in-memory providers only, so this work requires no Claude or OpenAI API tokens.

Before implementing/enabling an external adapter, explicitly settle key ownership,
cost limits, model/schema choice, data handling and retention, consent for sending
fictional notes, authentication/rate limiting, provider cancellation, and additional
adversarial evaluation. Keep it server-only and review the provider's actual
structured responses and failure behavior. Do not use this feature with real data
or for live clinical decisions.

## Handover identity

SF-325 reconstructs the missing Go 6 debrief from Oli's pasted acceptance description.
SF-308 already belongs to the Connect/Voice/Point-of-Care programme (merged PR #101).
Do not import the missing original branch later without comparing it to SF-325;
its quoted 997 unit tests and 22 browser tests are not results for this reconstruction.
See `docs/ai/go6-codex-handover.md` for actual validation and delivery status.
