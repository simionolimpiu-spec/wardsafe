# SafeFlow Simulation Evaluation Framework (SF-210)

Status date: 3 July 2026
Board item: SF-220
Authored directly (Claude, Oli's-codex role), docs-only change. Simulation-only: fictional patients, anonymous feedback, no NHS systems or data.

Purpose: turn demo sessions into evidence. Every session run with this framework produces data usable in the HIE conversation, CEP application, DTAC Domain 5, and any future funding bid. The evidence, not the app, is the asset.

## 1. Session design

- Format: 60–90 minute facilitated session (education day, preceptorship session, or stakeholder demo).
- Participants: 6–12 per session — registered nurses, NQNs, student nurses; optionally educators, HCAs, junior doctors for handover/discharge scenarios.
- Structure: (1) brief + simulation-only boundary statement → (2) baseline task on the *current* method (paper/verbal SBAR handover for a fictional scenario) → (3) same task in SafeFlow → (4) escalation-documentation exercise → (5) debrief + forms.
- Facilitator: project owner or educator; a second person scribes observations.

## 2. Measures

| # | Measure | Instrument | When |
|---|---|---|---|
| M1 | Handover completeness | SBAR checklist score (items present / expected) | Baseline task vs SafeFlow task |
| M2 | Time to prepare handover | Stopwatch, minutes:seconds | Both tasks |
| M3 | Escalation documentation completeness | Checklist against scenario's expected escalation elements | SafeFlow task |
| M4 | Missed discharge blockers | Count missed vs planted in scenario | SafeFlow task |
| M5 | Confidence in ward prioritisation | Self-rating 1–7 | Pre and post form |
| M6 | Perceived cognitive load | Self-rating 1–7 ("how much did you have to hold in your head?") | Both tasks |
| M7 | Usability | SUS (System Usability Scale, 10 items) — standard, comparable, citable | Post form |
| M8 | Qualitative | Three free-text prompts (below) | Post form |

## 3. Forms

### Pre-session form (anonymous; participant code e.g. "N3")

1. Role: RN / NQN / Student / HCA / Other
2. Years in acute care: <1 / 1–3 / 4–10 / >10
3. Confidence prioritising a full ward's workload right now (1–7)
4. Confidence producing a complete SBAR handover under time pressure (1–7)
5. How do you currently keep track of your ward picture on shift? (free text)

### Post-session form (same participant code)

1. Confidence prioritising a full ward's workload after today (1–7)
2. Confidence producing a complete SBAR handover (1–7)
3. Cognitive load, baseline task (1–7) · Cognitive load, SafeFlow task (1–7)
4. SUS items 1–10 (standard wording, 1–5 agreement scale)
5. What helped most? (free text)
6. What confused you or slowed you down? (free text)
7. What would you remove? (free text)
8. Would a tool like this help before the Expanse EPR go-live? Yes / No / Unsure — why? (free text)
9. Any safety concern about how information was presented? (free text — feeds hazard log)

### Facilitator observation sheet

Scenario used · participant count/mix · M1–M4 scores per participant code · verbatim quotes · any moment a participant misread simulated data as authoritative (→ hazard log candidate) · technical issues.

## 4. Data handling

Anonymous participant codes only; no names, no employer identifiers on forms. Paper or offline forms; results transcribed into an anonymised summary. Nothing enters the app. If a session happens inside a trust, it runs under the education team's direction and the COI declaration stands. Store raw forms privately; publish only aggregates.

## 5. Output per session

One short report (2–3 pages): session details, M1–M8 results (before/after deltas where applicable), SUS score, top 5 qualitative themes, hazards found (with hazard-log IDs raised), feature verdicts (keep / fix / remove), and an honest limitations paragraph (small n, simulation setting, facilitator = developer bias). Reports accumulate in `docs/evaluation-reports/`.

## 6. Thresholds worth claiming (pre-registered, so we can't fudge later)

- SUS ≥ 68 (published average) = "usable"; ≥ 80 = strong.
- M1 improvement ≥ 20% on checklist score = meaningful handover-completeness signal.
- Any single safety-concern response (form Q9) = mandatory hazard-log entry before next session.

## 7. What this framework does not claim

No clinical-outcome claims, no patient-safety-improvement claims, no generalisation beyond simulated scenarios. It measures usability, confidence, completeness and time in a simulated education context — exactly what a simulation-first product may honestly measure.
