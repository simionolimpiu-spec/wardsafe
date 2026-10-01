# SafeFlow — From Simulated Longitudinal Record to Live Capture (Boundary)

Status: simulation-only prototype. Fictional patients only. Not for clinical use. Human review required. This is a concept + a **simulation** of the idea — it is **not** a live capture of real patient data over time.

`master-narrative.md` is the controlled wording source.

## The idea

A fictional patient's journey can be viewed **day by day** — day 1, day 2, … day 1300 and beyond — so a reviewer can scrub the whole journey and compare **then vs now**: observations, location, episode phase, all with a review-support framed trend note. This is the same "continuity" idea as the portable cross-trust journey (`portable-patient-journey-concept.md`), extended along a **time axis** instead of (or alongside) a trust-to-trust axis.

## What is built now (simulation)

`src/domain/longitudinalJourney.js` (SF-251) is a **deterministic, seeded** engine: `getPatientDay(patientId, dayNumber)` derives that day's fictional observations/location/phase directly from a seed and the day number — no accumulation loop, so day 1300 costs the same as day 1. `buildEpisodes()` produces an ordered admission → ward moves → inter-trust transfer → discharge → community → possible readmission structure, reusing the SF-243 portable-journey definitions. `compareDays()` produces a then-vs-now delta. The Patient Journey Twin (SF-252) exposes this as a day scrubber, an episode-chapter strip, a then-vs-now panel, and trend sparklines.

SF-253 (this doc's companion PR) gives the engine a database home and a scale proof: `journey_episodes` and `longitudinal_observations` tables in `database/schema.sql`, keyed on `(patient_id, day_number)`, plus a materialisation script that generated and serialised 293 fictional patients × 1300 days (380,900 patient-days, 2,285,400 observation rows) in 27.2 seconds in this environment, and three read-only API endpoints serving the engine's output directly (no database round-trip required, since the engine is deterministic).

Every patient, every observation, and every day is **fictional and generated**, not captured from any real person.

## The honest boundary (why live capture is future discovery)

Generating a fictional 1300-day picture is a data-modelling exercise. **Capturing** 1300 real days for a real patient is a different thing entirely, and it is exactly the space the NHS already governs heavily:

- It is **identifiable patient data, held over a long duration** — a longitudinal record carries **retention duties from day one**, not just at the point of "go live." Retention schedules, the right to erasure/rectification, and data-minimisation all apply to a growing record, not a one-off snapshot.
- It needs a **lawful basis** under UK GDPR Article 6, and — because clinical observations are health data — an **Article 9 condition** as well, documented and kept current as the record grows.
- It needs a **DPIA** scoped to *longitudinal* processing specifically (the risk profile of holding day-1-to-day-1300 data about one person is materially different from a single-visit record, and a DPIA written for the latter does not cover the former).
- It needs the **clinical-safety-case scope reassessed** (DCB0129/DCB0160) — a system that shows trend-over-time to a reviewer carries different failure modes (staleness, drift, a reviewer over-trusting an old trend) than a single-snapshot review tool, and the existing safety case (`clinical-safety-ig-readiness.md`) does not yet cover this.
- It needs **DSPT** currency and **per-trust data-sharing agreements**, same as the portable cross-trust journey — a longitudinal record that follows a patient across trusts (as SF-251/252 already model) compounds this: each trust holding a slice of the same timeline is a separate controller relationship to document.
- It needs **information-governance sign-off** (Caldicott/IG/SIRO) before any live capture begins, not retrospectively.

So: **live longitudinal capture stays FUTURE DISCOVERY**, gated behind the same information-governance homework already logged for the portable journey (`ig-checklist.md`), plus the retention-specific items above. What we build and show now is the **simulation** of the longitudinal view — valuable for review-support and teaching, and safe to demonstrate today because nothing captured is real.

## Alignment, not replacement (Shared Care Record / GP Connect)

A live longitudinal record must **align with and read from** existing NHS interoperability, never become a competing source of truth — the same posture already taken for the portable cross-trust journey:

- **Shared Care Records (ShCR)** and **GP Connect** already hold and federate a patient's history across organisations and over time. A live version of the day-scrubber view would **surface and annotate** that existing longitudinal record, not build a parallel one.
- SafeFlow's contribution stays the **review-support layer on top**: the then-vs-now comparison, the explainable review cues at each point in time, and the episode-chapter framing that makes a long record easier for a human reviewer to navigate — not the system of record itself.
- Materialising fictional data into a database (as SF-253 does) proves the *engineering* pattern — indexed day-range queries at scale — without implying SafeFlow should ever become the authoritative store for real longitudinal data. A live deployment would read from and write learning/review annotations back toward the existing shared record, not hold the primary longitudinal dataset itself.

## Retention — the specific new consideration for a longitudinal record

A single-visit or single-review record has a comparatively simple retention question. A day-1-to-day-1300 (or longer) record does not:

- Retention timers need to be considered **per data point**, not just per patient — day-1 observations may fall due for review or minimisation well before day-1300 observations do.
- A **right-to-erasure** request part-way through a long record needs a defined behaviour: full-record deletion, or partial redaction that preserves the clinical/teaching value of the remaining timeline without the erased individual's data. This is a decision for IG/legal, not an engineering default.
- The **learning copy** pattern already established for the portable cross-trust journey (a de-identified copy returned to the originating trust for teaching) would need the same retention/de-identification treatment applied per time-slice, not just once at journey end.

None of this is built or decided in the simulation — it is listed here so the live-capture homework starts with the right questions, not as an afterthought once a real record already has 1300 days in it.

## Open questions before any live build

- Who is the data controller for each day-slice of the longitudinal record, particularly where a patient's journey has crossed trusts?
- What retention schedule applies, and how is partial erasure/rectification handled part-way through a long record?
- How does a live version read from and annotate the Shared Care Record / GP Connect rather than duplicate the underlying timeline?
- What DPIA is required specifically for longitudinal (not single-snapshot) processing, and who signs it off?
- What does the DCB0129/DCB0160 safety case need to say about trend-over-time review (staleness, drift, over-trust in an old trend) that a single-snapshot safety case does not already cover?
- What is the consent/transparency model for a patient whose data is captured and reviewed over a very long period?

## Status

Concept + simulation delivered (longitudinal engine, Journey Twin day-scrubber, database schema + materialisation proof at scale, read-only API). The live longitudinal record remains future discovery, contingent on the IG and retention work above. No real patient data is used or captured at any point.
