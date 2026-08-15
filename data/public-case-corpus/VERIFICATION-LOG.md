# Verification Log

Records every source-check and audit against `INCLUSION-PROTOCOL.md`.
Append-only. Do not edit past entries — add a correcting entry instead.

---

## 2026-08-15 — Seed set source-check

**Scope:** all 3 records (2 included, 1 excluded).
**Method:** each cited permalink re-fetched independently of the extraction pass; every quoted string checked character-for-character against the live published report.

| Record | Permalink resolves | Quotes verbatim | Fields match source | Result |
|---|---|---|---|---|
| `pfd-2026-0069` Roger Smith | ✅ | ✅ | ⚠️ 1 error found | **corrected** |
| `pfd-2024-0458` Alan Fallows | ✅ | ✅ | ✅ | pass |
| `pfd-2026-0294` Mary Forlin *(excluded)* | ✅ | ✅ | ✅ | pass |

### Error found and corrected

**`pfd-2026-0069.source.response_published`** was recorded as `false`. The report page publishes *2026-0069 – Response from West Suffolk NHS Foundation Trust* (338.95 kb) alongside the report. Corrected to `true` on 2026-08-15.

Cause: the field was populated from the PDF of the report itself, which of course contains no response. Response status is only visible on the HTML permalink, under *Related content*.

**Process change:** `response_published` must be read from the HTML permalink, never from the report PDF. Note this applies to the harvester too — `scripts/build-case-corpus.mjs` caches the HTML page, so the signal is available; it is not yet extracted. Add before the field is used in any analysis.

### Note on apparent typos in quoted text

`pfd-2026-0069` quotes contain `clinican`, `precribe`, `prophalaxis`, `recived`. These are **verbatim from the coroner's report** and are correct as recorded. Do not silently correct quoted source text. If a future reader flags them, point them at the source rather than editing.

---

## 2026-08-15 — Second pass: five reports adjudicated (protocol v1.1)

**Scope:** 5 newly fetched reports — Pamela George `2026-0049`, Robert Prowse `2024-0166`, Ernest Gray `2025-0579`, David Scott `2024-0284`, Hailey Thompson `2025-0171`, Jennifer & Agnes Cahill `2025-0559` (6 reports, 5 fetch operations).
**Method:** full published PDF fetched for each; all fields and quotes taken from that text. **PDFs preferred over HTML permalinks** — roughly a third of the payload and no site navigation boilerplate. Recommend the harvester follow the `Related content` PDF link rather than parsing the page body.

**Result:** 4 included, 1 excluded, 1 included-with-caveat.

### Two protocol defects found

**1. C4 was under-specified as to *where* in the report the finding must appear.**
`pfd-2025-0559` (Cahill) states the longitudinal failure explicitly in the findings of fact — *"her subsequent antenatal appointments relied heavily on… what was perceived to be a definitive plan"* — while all ten numbered matters of concern address national home-birth guidance. Under a concerns-box-only reading this would have been wrongly excluded. **Fix:** C4 is tested against the whole report. Recorded in protocol v1.1.

**2. No exclusion code existed for "facts fit, coroner found otherwise".**
`pfd-2024-0166` (Prowse) meets C1–C3 cleanly — sepsis noted at triage, assessment closed as not immediately life-threatening, patient returned to an ambulance for 85 minutes — but the coroner's sixteen concerns are about ambulance capacity and ED crowding, and he expressly found the delay "was not caused by any individual failing". **Fix:** added `E7_mechanism_not_identified`. This is the protocol's most important constraint and it did not exist until a real case demanded it.

### Coverage defect found

Only 3 of 7 included cases sit in the **Hospital Death** PFD category. The rest are filed under Care Home Health, Child Death, and maternity, because PFD reports are categorised by *where the death occurred* — so discharge-boundary cases are filed under the destination, not the discharging hospital. **`scripts/build-case-corpus.mjs` crawls the Hospital Death category only and would have missed four of the seven.** Category list must be extended before the full run. Recorded in protocol v1.1 and MANIFEST.

### Honesty check applied

`pfd-2025-0171` (Hailey Thompson) — the coroner and jury both found the missed primary-care review was **not causative**. Included on the pattern, not on causation, with the non-causation finding recorded at the top of the adjudication note and flagged for any citation. Worth stating plainly: the corpus documents that the pattern recurs, not that it kills in every instance. Conflating the two would be the fastest way to lose an argument with a Trust.

---

## 2026-08-15 — Third pass: machine validation, harvester first run, and a systematic field audit

**Scope:** all 9 records, `schema.json`, and `scripts/build-case-corpus.mjs`.
**Method:** schema validation run; harvester executed against the live site for the first time; parser output compared field-by-field against the hand-adjudicated records; `response_published` audited across every record by re-fetching each HTML permalink.

### 1. `response_published` was wrong on 6 of 9 records — and wrong in exactly the predicted place

The 15 August first-pass entry above corrected this field on `pfd-2026-0069`, identified the cause (it had been read from the report PDF, which by construction cannot contain a response), recorded the process change, and listed *"source-check the five second-pass records"* as outstanding. That check has now been run, and every single unchecked record was wrong.

| Record | Recorded | Actual | Responses published |
|---|---|---|---|
| `pfd-2024-0284` Scott | false | **true** | Warrington Hospitals |
| `pfd-2025-0171` Thompson | false | **true** | SSP Health / Ashton Medical Practice; Greater Manchester ICB |
| `pfd-2025-0559` Cahill | false | **true** | **7** — AACE, NICE, NHS England, NMC, RCM, RCOG, DHSC |
| `pfd-2025-0579` Gray | false | **true** | East Kent Hospitals University NHS FT |
| `pfd-2026-0049` George | false | **true** | Cann House / Premiere Health Ltd |
| `pfd-2024-0166` Prowse *(excluded)* | false | **true** | DHSC |

The three records that were correct — `pfd-2026-0069`, `pfd-2024-0458`, `pfd-2026-0294` — are precisely the three that had been independently source-checked. The field was 100% accurate where it was verified and 100% wrong where it was not. All six corrected.

**This is the finding, not the fix.** A known-defective field was left in place across six records because the correcting entry recorded the *process change* without back-filling the *existing data*. `pfd-2025-0559` had **seven** published responses recorded as none — and "no organisation responded" is a claim the corpus would have made in Cahill's name, about a maternity case involving two deaths, on the strength of a field nobody had checked. Where a defect is found in one record, re-run it across all of them in the same session.

### 2. The pre-filter would have discarded 2 of the 4 hand-included cases it was tested against

The harvester's gate required both a multiple-contact and a longitudinal-failure signal. Run against the four cases already included by hand, it rejected **`pfd-2026-0049` (George)** and **`pfd-2025-0171` (Thompson)** — a 50% false-negative rate on the only set where the right answer is known.

Both misses were non-Hospital discharge-boundary cases: exactly the cases the v1.1 coverage warning identifies as most valuable. The pre-filter was therefore compounding the very bias the category extension was written to remove.

Cause: the coroners phrased the longitudinal failure in shapes the lexicon had no pattern for — an *absent* system (*"The system for ensuring that discharge summaries are actioned was not available for me to see"*) rather than a *missing* one, and information recorded *outside* the record system (*"not on the medical records system where an auditable trail would exist"*).

Two changes:

- **Lexicon extended** with patterns taken from the C4 evidence those adjudications actually quoted. All four now gate. **This is not evidence of recall** — the patterns were tuned on the cases they were derived from, so matching them is circular. Recall on unseen reports is unmeasured.
- **The gate no longer deletes anything.** A report showing one of the two signals now drops to a `borderline` tier and is still written to the worklist. A lexicon will always lag reports not yet written, so it may cost a case its ranking but must not cost the case itself — the same "never silently drop a record" rule the evidence corpus already applies to exclusions.

### 3. Two categories in the coverage warning were misattributed, and one included case is in a category nobody was crawling

Categories were read off the live pages rather than from the protocol's prose:

| Case | Protocol said | Actually filed under |
|---|---|---|
| `pfd-2026-0049` George | Care Home Health | Community health care and emergency services |
| `pfd-2025-0579` Gray | *(implicitly hospital/other)* | **Other related deaths** |
| `pfd-2025-0171` Thompson | Child Death | Child Death **and** Community *(dual-filed)* |

Confirmed distribution of the seven: Hospital 3, Community 3, Child Death 1, Other 1. **No included case is in Care Home Health at all.**

So the category extension was itself incomplete: `Other related deaths` (79 pages) was in neither the original nor the extended list, and Gray would still have been missed. Now added. Care Home Health is retained, but as a hypothesis about where discharge-to-care-home cases would land — not an observed hit. Reports can also carry more than one category, so category counts do not sum to the case count.

### 4. Four report-page markup variants, three of which parsed as empty

First live crawl: 146 reports across five categories. The Reg 28 body is a `govuk-table`, but because pages are pasted from each coroner's own Word document the markup varies:

1. `<td>3</td><td><strong>HEADING</strong><br>body</td>` — majority
2. no `<strong>` at all, heading as plain text — `2026-0020`, `2025-0289` *(the latter also carries a stray `file:///C:/Users/…/msohtmlclip1/` image tag from the paste)*
3. one cell, box number inline: `<td>1. <strong>CORONER</strong> body</td>` — `2025-0413`
4. **no table at all — body published only in the PDF** — `2025-0368`

Variants 2 and 3 yielded no text and would have scored zero, indistinguishable from a report with nothing in it. Parser now handles all three HTML variants; re-run gives 145/146 parsed with ~100% field extraction.

Variant 4 is a source limitation, not a parser fault, and the two are now reported separately: PDF-only reports are marked `body_source: 'pdf-only'` and listed in the worklist under **"Not screened"**, because a zero score in the below-threshold tier reads as a considered rejection when nothing was ever read.

This partially reverses the second-pass recommendation to fetch PDFs instead of page bodies. Declined for the general case — the HTML carries the full text, `response_published` is visible *only* on the HTML so the page must be fetched regardless, and PDF extraction would need a new dependency. But for the ~1% of reports with no HTML body, the PDF is the only source, and that needs a decision rather than silence.

### Schema

`exclusion_reason` was missing `E7_mechanism_not_identified` — added in protocol v1.1 and in use on `excluded/pfd-2024-0166.json`, so strict validation rejected that record. Added. `sensitive_handling` was already declared; the outstanding item claiming otherwise was stale.

All 9 records now validate. Validation runs via `node scripts/validate-case-corpus.mjs` — zero-dependency, rather than adding `ajv` to `package.json` for a corpus check. It fails loudly on any schema keyword it does not implement, so it cannot silently pass a rule it is not enforcing, and it was itself checked with three seeded-defect runs to confirm it rejects what it should.

---

## Outstanding

- [x] ~~Schema validation not yet run~~ — done 15 Aug. `node scripts/validate-case-corpus.mjs`, 9/9 valid. Excluded records validate with `contacts.minItems` relaxed, as anticipated.
- [x] ~~Harvester not yet executed~~ — done 15 Aug. `--pages 3` over five categories (146 reports), then `--pages 2` over six (117). Four markup variants found and three fixed.
- [x] ~~Source-check the five second-pass records~~ — done 15 Aug for `response_published` specifically; 6 of 9 records were wrong and are corrected. **Note this was a single-field audit, not a full re-adjudication** — see the first item below.
- [x] ~~Harvester category list~~ — extended to six categories, including `Other related deaths`, which the first extension had also missed.
- [x] ~~`sensitive_handling` not in `schema.json`~~ — it already was. `exclusion_reason` was missing `E7`; that is what needed adding.
- [x] ~~Harvester should fetch PDFs~~ — declined for the general case with reasons recorded; needed only for the ~1% of reports with no HTML body, which is still an open decision (below).

- [ ] **Full re-verification of the five second-pass records.** Only `response_published` has been re-checked. Every other field on those records still rests on a single fetch with no second read — and that one field was wrong on all of them, which is not encouraging about the rest. Quotes, dates, intervals and C1–C4 evidence still need a character-for-character re-check against source.
- [ ] **Decide what to do with PDF-only reports.** ~1% publish no HTML body. Either add a PDF text dependency, or adopt an explicit rule that they are opened by hand from the "Not screened" list. Currently they are visible but unhandled.
- [ ] **Measure the pre-filter's real recall.** The lexicon was tuned on the four cases it had missed, so its current 4/4 is circular and proves nothing about unseen reports. The honest measurement is to adjudicate a random sample of the `below` tier by hand and count how many should have been caught. Until then, treat recall as unknown.
- [ ] **Tune signal weights against adjudicated outcomes** — still untouched. Weights remain the original crude guesses; the manifest should record any tuning.
- [ ] **Independent re-adjudication** (protocol §Adjudication rules, rule 5) — not meaningful at n=9. Due once ~20 cases are decided.
- [ ] **Inter-rater disagreement rate** — not yet measurable.
- [ ] **Full crawl not yet run.** Six categories total roughly 500 listing pages and ~5,000 reports; at the 1.2s courtesy delay that is several hours. Only the newest 2–3 pages per category have been screened so far.
