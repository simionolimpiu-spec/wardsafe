# Evaluation session: recruitment and scheduling checklist (SF-277)

The evaluation kit has been complete since SF-210. The only thing standing between SafeFlow and its
first real evidence is this page. It exists so the remaining step is a set of small errands rather
than an open-ended "organise an evaluation".

Simulation-only throughout. Participants consent for themselves; no real patient data is involved,
so there is no patient-consent step and no patient-facing IG approval to obtain.

## Do you need formal ethics approval?

Probably not, but decide it deliberately and write the answer down rather than assuming.

- **Service-evaluation / usability testing of a simulation tool, with staff or students consenting
  for themselves, no patient data and no randomisation** is normally outside the scope of NHS REC
  review. The usual reference point is the HRA "Is my study research?" decision tool.
- **It changes** if participants are recruited *as students* through a university, if you intend to
  publish it as research, or if any patient data is involved. A university route usually means the
  institution's own ethics process even when the NHS route does not apply.

Action: run the HRA decision tool once, screenshot or note the outcome, and record it in the first
session report's section 1. If publication is a goal, ask the university before recruiting, not
after - retrospective approval is generally not available.

## Recruitment

- [ ] Decide the participant mix. 3-6 people; a mix of RN, newly-qualified, and student gives the
      most useful spread. One HCA perspective is valuable if escalation is being discussed.
- [ ] Identify a route: a ward manager or practice educator who can circulate the invitation is far
      more effective than asking individuals directly.
- [ ] Send the invitation. Say plainly: ~60 minutes, simulation-only, no real patient data, no test
      of the participant, feedback is anonymous, and they may stop at any point.
- [ ] Confirm nobody is participating under any perceived obligation to a manager. If a manager is
      recruiting their own direct reports, make explicit that non-participation carries no
      consequence and is not recorded.
- [ ] Over-recruit by one or two. Clinical shifts change.

## Scheduling

- [ ] Pick a time that does not sit across handover or a drug round.
- [ ] Book a room with a screen, or confirm a laptop can be passed around.
- [ ] Check the live demo loads on the actual device and network you will use, on the day, before
      participants arrive. A hospital guest network blocking the site mid-session is the single most
      likely way to lose the session.
- [ ] Have an offline fallback: a local `npm run dev` build, or screenshots of the key surfaces.
- [ ] Print or prepare: consent wording, pre form, post form with SUS, capture sheet, facilitator
      script.
- [ ] Bring a stopwatch or use a phone timer for M2. Do not rely on remembering to start it.

## On the day

- [ ] Read the simulation-only framing out loud at the start. Every session, without exception.
- [ ] Assign participant codes (N1, N2, ...) and do not write names on any form.
- [ ] Run the baseline task before showing SafeFlow, or M1 and M2 are worthless.
- [ ] Capture the deltas as you go; do not plan to reconstruct them later from memory.
- [ ] Note what confused people, not just what impressed them. The "what did not work" section of
      the report is the part that makes the evidence credible.

## Immediately afterwards

- [ ] Write the report from `docs/evaluation-reports/session-report-template.md` the same day.
- [ ] Score each pre-registered threshold as MET or NOT MET with the actual number, including
      misses.
- [ ] If any participant raised a safety concern (form Q9), add the hazard-log entry **before**
      scheduling another session. This is a stop condition.
- [ ] Raise the actions as new SF-IDs in `CONTROL.md`.
- [ ] Update `evaluation-readiness-summary.md`: tick the "run the session" and "write up findings"
      boxes, and move SF-210 off "Ready to run".

## What a first session realistically gives you

With 3-6 participants: a SUS score you can quote with its sample size stated, a genuine list of
usability problems, and a defensible sentence such as "in a first simulation evaluation with N
nurses and students, SafeFlow scored X on SUS and handover completeness improved by Y%".

It does not give a clinical claim, and no amount of good feedback will change that. The honest
framing remains simulation-only, usability and usefulness only, human review always central.
