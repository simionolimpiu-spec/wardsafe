# SafeFlow — First Evaluation Session Plan

Status date: 2026-07-06
Board item: SF-223
Authored directly (Claude, Oli's-codex role), docs-only change. Simulation-only: fictional patients, anonymous participant feedback, no NHS systems and no patient data.

Parent framework: `docs/public-demo-pack/evaluation-framework.md` (SF-210 / board item SF-220). That document defines the reusable measures, forms, thresholds, and data-handling rules. **This document is the concrete run-book for the *first* session** — a smaller, paternity-aware pilot that produces SafeFlow's first real usability and perceived-usefulness evidence, including for the newly-merged Ward Quality & Safety Review export (SF-217).

## Why this session exists

The evaluation framework exists but no session has been run, so there is still zero user evidence — the strategy pack flags this as the single biggest adoption gap (DTAC Domain 5, HIE conversation, CEP application all ask for it). One small, honestly-run session closes the "we have never put this in front of a nurse" gap. The evidence, not the app, is the asset.

**What this session produces:** usability and perceived-usefulness evidence in a simulated education setting.
**What it explicitly does not produce:** clinical evidence, patient-safety-improvement claims, or any generalisation beyond fictional scenarios.

## 1. Objective

Gather usability and perceived-usefulness evidence from a small group of nurses and/or nursing students working with the simulation-only prototype, covering three surfaces in one sitting:

1. reading review cues on a fictional deteriorating-patient ward scenario;
2. generating a **Ward Quality & Safety Review** structured audit evidence export (SF-217); and
3. completing one Competency Passport learning module.

Primary questions: is it usable (SUS), is it perceived as useful before an Expanse EPR go-live, and does anyone misread simulated data as authoritative (hazard-log signal).

## 2. Participants and consent

- **Size:** 3–6 participants (deliberately small for a first run; the framework's 6–12 is the steady-state target).
- **Mix:** registered nurses, newly-qualified nurses, and/or student nurses. No minimum seniority.
- **Recruitment:** voluntary; colleagues or students who agree to a one-off feedback session. No employer identifiers recorded.
- **No patients are involved.** All data on screen is fictional. Because no patient data is processed, the information-governance note stays deliberately simple and honest.

### Participant consent script (read aloud + one-line written agreement)

> "This is a simulation-only prototype. Every patient you see is fictional — there is no real patient data here, and nothing you do affects any real person or record. I'm asking for your feedback on how usable and useful the tool feels. Your feedback is anonymous: I record only a participant code (e.g. N3), never your name or where you work. You can stop or skip anything at any time, and you can ask me to discard your feedback afterwards. This session measures usability, not you. May I use your anonymous feedback to improve SafeFlow and in anonymised summaries? Yes / No."

Consent covers **participants only** — there is no patient consent question because there is no patient data. Written record: participant code + date + "consent given: Y/N" on the facilitator sheet, nothing more.

## 3. Scripted walkthrough (≈30–40 min of a 60-min session)

Facilitator opens with the simulation-only boundary statement, then each participant works the same script at their own pace while a scribe observes:

1. **Open a fictional ward scenario** — pick one deteriorating-patient scenario from the ward simulation library (SF-216). Read the Ward Safety Board and Patient Journey Twin.
2. **Read the review cues** — identify what changed and what needs checking, using the explainable "why flagged" rationale from the heuristic cue engine (SF-213). Prompt: "Talk me through what this cue is telling you and what you'd check."
3. **Generate a Ward Quality & Safety Review export** — produce the structured audit evidence export (SF-217) for that ward and read it back. Prompt: "Is this the kind of summary you currently prepare by hand? What's missing or wrong?"
4. **Complete one Competency Passport learning module** — work through a single micro-learning module (SF-211) and confirm the verified learning credit appears.

Each step is a review/learning action only. Nothing in the walkthrough triggers, alerts, dispatches, or escalates anything — the export and cues are quality review evidence for a human to act on, not an automated system.

## 4. Metrics

All instruments are drawn from the evaluation framework (SF-210); the first session runs a reduced set so it stays completable in 60 minutes with a small group.

| # | Measure | Instrument | Source | When |
|---|---|---|---|---|
| M7 | Usability | SUS (System Usability Scale, 10 items, 1–5 agreement) | Brooke, 1996 — via evaluation-framework.md §2 M7 | Post form |
| M5 | Confidence in ward prioritisation | Self-rating 1–7 | evaluation-framework.md §2 M5 | Pre and post form |
| M6 | Perceived cognitive load | Self-rating 1–7 | evaluation-framework.md §2 M6 | Post form |
| Q | Perceived usefulness | Post-form Q "Would a tool like this help before the Expanse EPR go-live? Yes/No/Unsure — why?" | evaluation-framework.md §3 post-form Q8 | Post form |

### Qualitative prompts (3–5, free text; feed the framework's §3 themes)

1. What helped most when reading the ward picture?
2. What confused you or slowed you down?
3. Was the Ward Quality & Safety Review export the kind of summary you prepare by hand today — what's missing or wrong?
4. Did anything on screen feel like it was telling you what to do, rather than what to check? (safety-framing probe)
5. Any moment you were unsure whether the data was real or simulated? (→ hazard-log candidate)

SUS is scored the standard way (0–100). Pre-registered thresholds from the framework §6 apply: SUS ≥ 68 = "usable", ≥ 80 = strong; any single "unsure if real vs simulated" or safety-concern response is a mandatory hazard-log entry before a second session.

## 5. Results template (per session, 1–2 pages)

Fill this in after the session and save the anonymised summary to `docs/evaluation-reports/` (raw forms stay private and offline).

- **Session details:** date, participant count and mix (by code), scenario(s) used, facilitator + scribe.
- **SUS score:** mean (and range), vs the 68 / 80 thresholds.
- **M5 confidence:** pre vs post delta.
- **M6 cognitive load:** post rating.
- **Perceived usefulness:** Yes/No/Unsure tally + representative quotes.
- **Top qualitative themes:** up to 5, each with a verbatim quote.
- **Hazards found:** any "misread simulated data as authoritative" or safety-framing moment, with the hazard-log ID raised.
- **Feature verdicts:** keep / fix / remove, per surface (cues, Ward Quality & Safety Review export, Competency Passport module).

### RED / AMBER / GREEN verdict

| Band | Meaning |
|---|---|
| GREEN | SUS ≥ 68, positive usefulness majority, no unresolved hazard raised — proceed to a second, larger session. |
| AMBER | Mixed usability or a fixable confusion/hazard — fix the specific issue, then re-run. |
| RED | SUS < 68 or a safety-framing problem (participants read cues as instructions or simulated data as authoritative) — stop, redesign the affected surface before any further sessions. |

### What this does and does not prove (mandatory caveat)

This session produces **usability and perceived-usefulness evidence only**, from a small number (n = 3–6) of participants, using the developer as facilitator, in a simulated education setting with fictional data. It therefore **cannot** prove clinical benefit, patient-safety improvement, or that results generalise beyond these scenarios. Small n, single facilitator (developer-bias), and simulation context are stated limitations in every write-up. It is exactly what a simulation-first prototype may honestly claim — no more.

## 6. Timeline (paternity-aware, pauseable, no travel)

Designed to survive a newborn: every step is short, remote-friendly, and can pause for days without losing state. No travel is required — the session can run over a video call with screen-share or in whatever room the participants are already in.

| Step | Effort | Notes |
|---|---|---|
| Prep pack (print/share forms, pick scenario) | ~30 min | Reuses framework forms; do once. |
| Recruit 3–6 participants | async, low effort | Colleagues/students; no scheduling pressure. |
| Run the session | 60 min, once | Video-call or in-person; pause/reschedule freely. |
| Transcribe + write the 1–2 page results | ~45 min | Can be days later. |

If the paternity window interrupts any step, the plan pauses safely — nothing expires, no participant data sits in the app (it never enters the app), and the next step picks up from the saved forms.

## 7. Boundaries recap

- Simulation-only; fictional patients; **no real patient data at any point**.
- Produces usability/usefulness evidence, **not** clinical evidence; no clinical-outcome or patient-safety claims.
- Consent is for **participants**, not patients (there are no patients).
- Nothing in the session triggers, alerts, dispatches, or escalates — all cues and exports are human-review quality evidence.
- Runs under the education team's direction if held inside a trust; the COI declaration stands.
