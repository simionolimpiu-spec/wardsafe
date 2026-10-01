# SafeFlow evaluation session N - YYYY-MM-DD

Simulation-only. Usability and usefulness evidence only; not clinical evidence, not clinical
validation. Fictional patients throughout. Participants consented for themselves.

Instrument: `docs/public-demo-pack/evaluation-framework.md` (SF-220). Thresholds below were
pre-registered before the session.

## 1. Session details

| Field | Value |
|---|---|
| Date and duration | |
| Facilitator | |
| Location / format | in person / projected / individual devices |
| Participants (n) | target 3-6 |
| Roles present | RN / NQN / Student / HCA / Other - counts only, no names |
| Scenarios used | e.g. `scenario-respiratory-rate-first`, `scenario-family-concern-marthas-rule` |
| Build evaluated | commit SHA or live demo URL and date |
| Deviations from the facilitator script | state them plainly, or "none" |

## 2. Results against the measures

| # | Measure | Baseline | With SafeFlow | Delta | Notes |
|---|---|---|---|---|---|
| M1 | Handover completeness (SBAR items present / expected) | | | | |
| M2 | Time to prepare handover (mm:ss) | | | | |
| M3 | Escalation documentation completeness | n/a | | | |
| M4 | Missed discharge blockers (missed / planted) | n/a | | | |
| M5 | Confidence in ward prioritisation (1-7) | pre: | post: | | |
| M6 | Perceived cognitive load (1-7) | | | | |
| M7 | Usability (SUS, 0-100) | n/a | | n/a | |

Report per-participant values only as an anonymised spread (for example "M5 pre 3-5, post 4-6"),
never as a named or per-code league table.

## 3. Threshold outcomes

State each as MET or NOT MET with the actual number. Do not soften the wording.

| Pre-registered threshold | Result | MET? |
|---|---|---|
| SUS 68 or above = usable | | |
| SUS 80 or above = strong | | |
| M1 improvement 20% or more | | |
| Any safety-concern response (Q9) triggers a hazard-log entry | | |

If a safety concern was raised: record the hazard-log entry reference here, and confirm it was
logged **before** any further session was scheduled.

## 4. Top qualitative themes

Five at most, each with a short supporting quote by participant code. Check quotes for
self-identifying detail before pasting.

1. **Theme** - "quote" (N1)
2.
3.
4.
5.

## 5. What did not work

The section that earns the report its credibility. Confusions, dead ends, features nobody used,
things participants expected to exist and did not, moments the facilitator had to intervene.
An empty section here almost always means the session was under-observed rather than flawless.

## 6. Hazards or safety-boundary observations

Anything a participant said or did that suggests SafeFlow could be misread as a live clinical tool,
a scoring engine, or a source of clinical instruction. Cross-reference
`clinical-safety-case-outline.md` and add a hazard-log row where warranted.

## 7. Actions into the backlog

| Action | Proposed SF-ID | Priority | Owner |
|---|---|---|---|

## 8. What this session does not show

Restate the limits explicitly, sized to what actually happened: sample size, single site, simulated
scenarios only, no clinical outcome measured, no generalisation claimed.
