# Public Case Corpus — Inclusion Protocol

**Version:** 1.2
**Status date:** 15 August 2026
**Applies to:** `data/public-case-corpus/`

> **Changes in v1.1** — both forced by real adjudications, not anticipated:
> - Added exclusion code `E7_mechanism_not_identified` (see `excluded/pfd-2024-0166.json`).
> - Added `sensitive_handling` flag (see `cases/pfd-2025-0579.json`).
> - Added the category-coverage warning under *Source hierarchy*.
>
> **Changes in v1.2** — all three forced by checking claims against live pages rather than against this document:
> - Corrected the category-coverage table. Two cases were misattributed and one sits in a category the v1.1 extension list omitted entirely. See *Source hierarchy*.
> - `response_published` corrected on 6 of 9 records; the field was wrong on every record that had not been independently source-checked. See `VERIFICATION-LOG.md`.
> - Recorded that the harvester's pre-filter rejected 2 of the 4 hand-included cases it was tested against, and that it no longer discards single-signal reports. Recall on unseen reports remains unmeasured.

---

## The pattern this corpus exists to document

Not "patients who died in NHS care." Not "clinical error."

A specific and narrower shape:

> A patient makes **more than one contact** with a service about the same underlying deterioration. Each contact is **closed as resolved** — discharged, reassured, not escalated — and each closure is, in isolation, defensible on the notes available at that moment. The information that would have changed the outcome **already existed** before the final contact. **Nobody re-opened the whole arc.**

This matters because it is invisible to any review that examines one episode at a time. The individual clinician at contact three cannot see what contact one should have carried forward. Morbidity and mortality review, incident reporting, and complaint handling are all episode-shaped. The failure is not.

That is the gap WardSafe claims to address. This corpus is the evidence that the gap is real, recurring, and independently identified by coroners.

---

## Inclusion criteria (strict)

A case is **included** only if **all four** criteria are met and each is traceable to source text.

### C1 — Multiple contacts
Two or more separate care contacts relating to the same underlying clinical problem or the same continuous period of deterioration.

A "contact" is any of:
- an attendance (ED, urgent care, GP, ambulance)
- an admission
- a readmission following discharge
- an **intra-admission escalation event** that was individually assessed and closed (e.g. a fall, a NEWS trigger, a family concern raised and answered)

Intra-admission sequences count, but **must be flagged** `contact_type: "intra_admission"` so they remain separable in analysis. Some stakeholders will want the readmission cases only; the flag lets you filter without re-adjudicating.

### C2 — Each earlier contact closed as appropriate
At least one contact ended in a discharge, a decision not to escalate, or a decision not to investigate further, which was documented or treated at the time as a correct closure.

This is the criterion that distinguishes the pattern from ordinary negligence. If the earlier contact was recognised as wrong *at the time*, it is a different failure mode. Exclude.

### C3 — The information already existed
Information material to the outcome was available before the final contact — held in the record, stated by the patient, or raised by the family — and was in principle accessible at the earlier contact.

Sources of pre-existing information seen in practice:
- prior correspondence or specialist advice in the record
- a prior test result, ordered but not chased or not reviewed
- a documented prior risk assessment
- the patient declining or questioning a treatment
- a family member repeatedly raising a concern

### C4 — The coroner identifies a longitudinal failure
The coroner (or ombudsman / investigator) identifies a failure that is **longitudinal in character**: a failure to carry information forward, to re-assess, to chase, to review, or to reconsider a working diagnosis *across* contacts.

A failure confined to a single moment — a surgical error, a drug dose miscalculated once, an equipment fault — does **not** meet C4, however serious.

**Test C4 against the whole report, not the matters-of-concern box alone.** *(v1.1 — forced by `pfd-2025-0559`.)* The numbered concerns are addressed to whoever has power to act, which is often a national body, so a report can name a trajectory failure clearly in its findings of fact while its formal concerns are all about guidance gaps. Findings of fact count.

**But the coroner must have made the finding.** *(v1.1 — forced by `pfd-2024-0166`.)* If C1–C3 are visible in the narrative and the coroner identifies something else entirely, C4 fails and the case is excluded `E7_mechanism_not_identified`. This is the load-bearing constraint of the whole protocol. The value of PFD reports as a source is that an independent judicial authority decided what went wrong. The moment cases rest on *our* reading of the facts rather than the coroner's finding, the corpus stops being evidence and becomes an argument with footnotes.

---

## Exclusions

Exclude, and record the reason, where:

| Reason code | Meaning |
|---|---|
| `E1_single_episode` | Failure confined to one admission with no earlier closed contact |
| `E2_point_failure` | Technical or procedural error at a single moment (surgical, equipment, single dosing error) |
| `E3_no_prior_information` | Nothing material existed before the final contact; genuinely unforeseeable |
| `E4_recognised_at_time` | The earlier contact was identified as wrong at the time, not closed as appropriate |
| `E5_insufficient_detail` | Report too thin to adjudicate C1–C4 against source text |
| `E6_out_of_scope_setting` | Non-hospital setting outside current scope (custody, road, workplace) |
| `E7_mechanism_not_identified` | C1–C3 present on the facts, but the coroner identified a different failure and did not name the longitudinal one anywhere in the report *(v1.1)* |

**Record every exclusion.** A corpus of 100 included cases is an anecdote. A corpus of 100 included cases drawn from a documented pool of N screened, with reasons for every rejection, is evidence. The denominator is the asset.

---

## Adjudication rules

1. **Source text only.** Every field must be traceable to a quotable passage in the published report. If a detail is not in the report, the field is `null`. Do not infer a contact, an interval, or a mechanism that the coroner did not state.

2. **No reconstruction.** If the report says "readmitted" without a date, `interval_days` is `null`, not an estimate.

3. **Verbatim anchors.** Each of C1–C4 must be supported by a `criteria_met[].evidence` string quoted from the report. This is what makes the corpus defensible when a Trust disputes a case.

4. **Ambiguity defaults to exclusion.** If C1–C4 cannot be established on the face of the report, exclude as `E5_insufficient_detail`. An over-inclusive corpus is worse than a small one, because a single contested case discredits the set.

5. **Second-pass audit.** A sample of at least 20% of both included and excluded cases is re-adjudicated independently against this protocol. Disagreement rate is recorded in the corpus manifest. Publish it.

---

## Worked adjudications

### INCLUDED — Roger Smith, 2026-0069 (West Suffolk)

- **C1** Two admissions, same hospital: 14 Apr – 21 Aug 2023, then readmitted 25 Aug 2023. ✓
- **C2** Discharged 21 Aug 2023 "having been assessed as medically fit for discharge." ✓
- **C3** "Correspondence from treating neurologists at another hospital that formed part of Mr. SMITH's medical records and which advised against the prescription of anti-coagulation therapy was not followed." The advice was already in the record, and had been correctly acted on during the first admission. ✓
- **C4** Coroner: the information "was not flagged for clinician attention as part of the electronic records management system… This meant that when Mr. Smith was readmitted on the 25th August 2023, this information did not form part of the reviewing consultant's considerations." Explicitly a failure of carry-forward across admissions. ✓

**Verdict: include.** This is the canonical case for the corpus. The coroner names the mechanism WardSafe exists to address.

### INCLUDED — Alan Fallows, 2024-0458 (University Hospitals Birmingham)

- **C1** Admitted 08/02/2024, discharged, readmitted 09/02/2024; then two separate in-patient falls (12/02, 16/02), each an intra-admission event. ✓ (flagged `intra_admission` for the fall sequence)
- **C2** "He was initially discharged" — closed as appropriate, then reversed by a CT result. Fall of 12/02 assessed and closed without injury. ✓
- **C3** Falls risk assessment existed from 10/02 and the 12/02 fall was itself information about escalating risk. ✓
- **C4** "His falls risk assessment was not updated following this fall" — failure to re-assess after a warning event, plus a Datix not completed, so the signal never entered the governance system at all. ✓

**Verdict: include.** Weaker than Smith on C3, but the failure-to-update-after-warning-event is squarely longitudinal.

### EXCLUDED — Mary Forlin, 2026-0294 (University Hospitals Sussex)

Single continuous admission 21–28 July 2024. The coroner's concern — that no system "proactively flags up, drives or requires active consideration of tests" where antibiotics are not working — is thematically adjacent and mechanically identical to WardSafe's thesis. But there is no earlier closed contact.

**Verdict: exclude, `E1_single_episode`.** Tag as `adjacent_theme: true` and retain in the excluded register. Cases like this are useful supporting material for the argument that the *mechanism* is general, and should be citable as such — but they are not instances of the pattern and must not be counted toward the 100.

---

## Source hierarchy

> **Coverage warning (v1.1, corrected v1.2).** The Hospital Death category is *not* where most of this pattern lives. Of the seven included cases, only three are filed there. This is structural, not accidental: PFD reports are categorised by *where the death occurred*, and the discharge-boundary cases — which are the most relevant to WardSafe's thesis, because the boundary is where carry-forward fails hardest — are by definition filed under wherever the patient ended up, not the hospital that discharged them.
>
> **The v1.1 text named the wrong categories.** It was written from recollection rather than from the pages. Categories read off the live permalinks on 15 August 2026:
>
> | Category | Included cases |
> |---|---|
> | Hospital Death (Clinical Procedures and medical management) | `pfd-2026-0069` Smith, `pfd-2024-0458` Fallows, `pfd-2024-0284` Scott |
> | Community health care and emergency services | `pfd-2026-0049` George, `pfd-2025-0559` Cahill, `pfd-2025-0171` Thompson |
> | Child Death (from 2015) | `pfd-2025-0171` Thompson *(dual-filed with Community)* |
> | **Other related deaths** | `pfd-2025-0579` Gray |
> | Care Home Health | **none** |
>
> Three corrections follow. `pfd-2026-0049` is Community, not Care Home Health. `pfd-2025-0579` is **Other related deaths** — a category the v1.1 extension list did not include, so following that list would still have missed it. And a report may carry **more than one** category, so counts do not sum to the case count.
>
> `scripts/build-case-corpus.mjs` now crawls six categories: Hospital Death, Other, Community health care and emergency services, Child Death, Care Home Health, Emergency services. Care Home Health is included on the hypothesis that discharge-to-care-home cases land there, not on an observed hit — if it yields nothing after a full crawl, drop it and record that.
>
> The general lesson is worth keeping: **read the category off the page, not off this document.** A coverage argument built on remembered categories is exactly as reliable as its weakest recollection.

1. **Prevention of Future Deaths reports** (judiciary.uk) — primary. ~2,500 in the Hospital Death (Clinical Procedures and medical management) category, plus the adjacent categories noted above. Named, dated, quotable, with Trust responses published alongside.
2. **PHSO published decisions** — secondary. Anonymised, and weighted toward the complaint-that-went-nowhere. Weaker on clinical timeline detail, stronger on the organisational response.
3. **HSSIB national investigations** — supporting. Already root-caused and systemic; use for thematic framing rather than as individual cases.

Where a case appears in more than one source, record all references and cite the PFD as primary.
