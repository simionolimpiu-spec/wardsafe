# SF-271: Super-user / train-the-trainer track — concept doc

Status: concept, written before any code dispatch (same pattern as SF-202/SF-207/SF-107/SF-210). Purpose: define what a "super-user" or ward-level champion role means for a simulation-only demo product, decide what is and is not in scope, and propose a first buildable increment.

## The problem this addresses

Every prior SafeFlow feature this session has been aimed at what happens *inside* a single review — a nurse using the scenario library, an escalation decision, a debrief. None of them address how a ward actually *adopts* the tool: who introduces it to colleagues, who runs the first few practice sessions, who answers "how do I..." questions, and who is the feedback conduit back to whoever owns the rollout. Digital-health adoption literature consistently identifies a local champion/super-user as a strong predictor of whether a tool gets used past week one (this is a well-established QI/implementation-science finding, not specific to SafeFlow — it is the standard rationale for train-the-trainer models across NHS digital rollouts).

## What "super-user" means here — and what it explicitly does not mean

SafeFlow has no authentication, no accounts, and no RBAC (SF-207 was written as a concept-only doc, deliberately not built, because the whole product is a simulation-only demo with no real user identity). A super-user role therefore **cannot** be a permissions tier, an in-app login, or anything that implies one reviewer's judgement outranks another's inside the tool. That would contradict the standing safety boundary (no staff scoring, no automated escalation, human review always central, every reviewer's structured observation carries equal weight).

Instead, "super-user / train-the-trainer" here means a **facilitation role that sits outside the tool**: a colleague who has spent more time in SafeFlow's simulation scenarios, knows the demo pack, and can run a 20-30 minute practice session for the rest of the ward. The product's job is to make that facilitation easy, not to encode the role into the software.

## Proposed scope (three parts, phased)

**Part A — Facilitator quick-start guide (docs, buildable now).** A single-page guide, in the same voice as the existing demo pack (docs/public-demo-pack/), covering: how to run a 20-minute walkthrough session using the Scenario Library, which 3-4 scenarios make the best first-session picks, a suggested facilitation script (open with "this is simulation-only, nothing here is real"), and a short feedback-capture template facilitators can use to note what confused people (informal, not wired into the app). Delivered alongside this concept doc as `docs/public-demo-pack/facilitator-quick-start-guide.md`.

**Part B — In-app facilitator note (small code change, same aside pattern as every other panel this session).** A `facilitatorNote` export in scenarioLibrary.js could be rendered as a ninth sibling aside, but — unlike every other panel added today — this one should probably NOT be an always-visible aside (see "Watch for panel overload" below). Better: a single link/toggle near the top of the Scenario Library ("Running a training session? Facilitator notes") that reveals the same content as Part A inline, rather than adding a ninth always-on aside. NOT built in this pass; recommended as the next SF row once the panel-consolidation question (below) is resolved.

**Part C — Feedback loop (out of scope for now, flag only).** A structured way for facilitators to report back what confused colleagues during practice sessions would be genuinely valuable, but building real feedback capture implies persistence/storage decisions this simulation-only prototype hasn't made yet. Recommend leaving this as a documented idea, not a build, until a decision is made about whether SafeFlow ever collects any real usage data.

## Watch for panel overload

ScenarioLibraryView.jsx has grown to eight sibling `<aside>` panels this session (hazards, staffing context, new-to-service context, bias awareness, PEARLS debrief, PACE ladder, Safety-II, score comparison) plus the scenario cards themselves. Each addition was individually well-justified and evidence-backed, but the cumulative effect is a page that is now quite dense. Before adding a ninth always-visible panel for facilitators, the stronger recommendation is either (a) a collapsible/tabbed presentation of the existing eight panels — genuinely useful and overdue regardless of SF-271 — or (b) keeping the facilitator content out of the always-on panel stack entirely (Part B above). Raising this as its own candidate: "panel consolidation pass."

## Safety boundary

- Facilitator role carries no special authority inside the tool; it is a training/onboarding convenience only.
- No accounts, no login, no permissions change — consistent with the whole product's simulation-only, no-real-identity stance.
- Facilitator materials must open every session by restating "simulation-only, no real patients."
- No claim that having a facilitator improves real clinical outcomes — the claim is narrower: facilitated first-use sessions correlate with higher tool adoption/completion in general digital-health rollout literature, which is a training-design point, not a clinical-efficacy claim.

## Recommended next step

Build Part A now (docs-only, no code, low risk, immediately useful) as SF-271. Hold Part B pending a decision on the panel-consolidation question. Park Part C as a documented idea in this doc, not a task.
