# SafeFlow evidence corpus — architecture, schema and safety boundary (SF-282/SF-283/SF-283b)

Status: architecture decided, extraction pipeline built and quality-filtered, 70 records ingested
and consolidated. Bibliographic only — no SafeFlow summaries or cue-type links yet (see Status and
next steps). Simulation-only prototype. Fictional patients only. Not for clinical use.
`master-narrative.md` remains the controlled wording source.

## Purpose

Build a queryable corpus of published literature across nursing, medicine and the allied health
professions, so that SafeFlow's teaching cues can be traced to the evidence that motivates them,
and so the same corpus can inform scenario authoring, the Patient Journey Twin, and any future
language-model work.

Target scale is hundreds of records, growing. This document defines the shape of that corpus and,
more importantly, the boundary it must not cross.

## The boundary — decided, not assumed

There are three ways a corpus like this could be wired in. Oli chose the middle one deliberately.

| Option | What it means | Decision |
|---|---|---|
| Authoring/QA only | Corpus never appears in the app | Not chosen — loses the in-app value |
| **Cue-level** | **Citations attach to a cue TYPE — "why this kind of prompt is taught"** | **CHOSEN** |
| Patient-level | Citations attach to a specific patient's flag | **Rejected** |

**Why patient-level was rejected.** Attaching literature to an individual patient's flag is the
step that turns a teaching tool into something that looks like evidence-based clinical decision
support. It would imply the tool has reasoned from evidence to a conclusion about that patient.
That would change SafeFlow's DCB0129/0160 position, its clinical-safety-case scope, and its
simulation-only claim all at once. It is out of scope and should stay out of scope.

**What cue-level means concretely.** The corpus answers "why does SafeFlow teach a worry
criterion at all?" It does not answer "why is this fictional patient flagged?" The citation
explains the existence of the teaching prompt, never the disposition of a patient.

### Rules that follow from that

1. Evidence links to a **cue type**, never to a patient ID, a scenario instance, a score, or a flag
   on a specific record.
2. Evidence never carries an instruction. No "consider escalating", no thresholds presented as
   actionable, no recommendation phrased for a patient in front of the user.
3. The existing framing is unchanged: human review required, clinical judgement central,
   simulation-only, fictional data.
4. Presence of a citation must never make a cue look more authoritative *about a patient*. If a
   design makes a flag look adjudicated because it has a reference next to it, that design is wrong
   regardless of what the reference says.
5. The corpus supports the Twin and any LLM work as **retrieval context for teaching material**,
   not as a clinical knowledge base to reason from about a case.

## Licensing — a hard constraint, verified not assumed

Copyright status was checked against real records before any bulk ingestion, and the result
materially shaped the schema. Of the first five sampled, **none was open access**:

- RCN Publishing: "All rights reserved. Not to be copied, transmitted or recorded in any way, in
  whole or part, without prior permission of the publishers."
- BMJ: "No commercial re-use."
- Wiley and Cochrane: all rights reserved.

**Therefore the corpus stores bibliographic metadata and SafeFlow's own written summaries. It does
not store abstracts.** Titles, journals, authors, DOIs and PMIDs are facts and are cited rather than
reproduced. MeSH terms are produced by the US National Library of Medicine.

This is enforced in code, not by convention: `scripts/evidence/extract-records.mjs` whitelists the
storable fields and throws on anything outside that set, and it discards abstract text at the
earliest point in the pipeline. A record cannot enter the corpus carrying an abstract.

## Schema

Each record:

```
pmid           string   PubMed identifier
doi            string   canonical link
title          string   factual citation
journal        string   full journal title
journalAbbrev  string   ISO abbreviation
year           number   NOT in the PubMed payload; enriched separately, never guessed
authors        string[] surnames only, capped at 8
meshTerms      string[] NLM-assigned, capped at 25
articleTypes   string[] NLM publication types — used for quality filtering
```

Two fields are added by SafeFlow rather than harvested, and both are required before a record can
be used to support a cue:

```
cueTypes        string[]  which teaching cue types this supports (never a patient or scenario ID)
verification    enum      'metadata-only' | 'abstract-read' | 'full-text-read'
safeflowSummary string    OUR OWN words. Never the publisher's abstract.
```

`verification` exists because of the lesson from SF-281: summaries written from abstracts are not
the same as summaries written from full texts, and the difference must be visible rather than
assumed. Nothing may be quoted in a stakeholder document at `metadata-only`.

## Discipline taxonomy — first wave

Approved scope covers all four:

- **Core deterioration and nursing** — failure to rescue, early warning scores, escalation and the
  afferent limb, missed nursing care, handover and SBAR, nurse worry and intuition.
- **Allied health** — dysphagia and aspiration (SLT), mobility, falls and deconditioning (physio),
  functional decline and discharge readiness (OT), malnutrition screening (dietetics).
- **Medical** — sepsis recognition, frailty, delirium, acute kidney injury.
- **Pharmacy and medication safety** — medication-related deterioration, polypharmacy in frailty,
  anticoagulation. Note this sits closest to the prescribing boundary SafeFlow must not cross:
  records here support teaching that medication is a deterioration factor, never what to give.

## Quality filtering — built (SF-283b)

The first extraction run surfaced two problems that made it clear raw search output cannot go
straight into the corpus. Both are now enforced in code in `extract-records.mjs`, not just
documented:

- **Conference proceedings and other secondary content.** PMID 27885969 is the collected abstracts
  of a critical-care symposium, not a study, and it matched three separate searches. Records whose
  `articleTypes` include Conference Proceedings, Comment, Editorial, News, Newspaper Article,
  Retracted Publication or Retraction of Publication are excluded automatically.
- **Language.** A record nobody on the team can read cannot honestly be summarised, and must not be
  marked `abstract-read`. Records where `language !== 'eng'` are excluded automatically. Three were
  caught this way: PMID 31758214 and 26841942 (German), PMID 35301868 (German, Swiss handover
  study).

Excluded records are never silently dropped — they are written to a companion `*-excluded.json`
file with pmid, title and reason, consolidated into `evidence-corpus-excluded.json`.

**A third problem the automated filter cannot catch: topical mismatch from a bad source ID.**
PMID 30175361, harvested against the malnutrition search, turned out on inspection to be a
nanotechnology paper about Raman spectroscopy — a transcription error somewhere in the original
horizon-scan search, not a malnutrition source at all. Caught by reading the title before writing
the record, not by any field-level rule, and excluded manually with that reasoning recorded. This
is the argument for keeping a human read of every batch even after the automated filter exists:
type and language checks catch format problems, not whether the paper is actually about anything
relevant.

## Year enrichment — built (SF-283b)

Some PubMed metadata records carry a `publication_date.year` field and some do not — inconsistent
across records, with older records less likely to have it (e.g. the 2002 Aiken *JAMA* paper lacked
it entirely). Where present, the extractor uses it directly. Where absent, a separate script,
`scripts/evidence/enrich-years.mjs`, looks the DOI up in Crossref (`api.crossref.org`) — a public,
unauthenticated, non-copyrighted bibliographic registry — and reads only the publication year from
the response. Records without a DOI, or whose DOI Crossref does not recognise, keep `year: null`
rather than receiving a guessed value. Every record in the consolidated corpus currently has a
year.

## What this does not claim

The corpus establishes that the failure modes SafeFlow simulates are named, measured and taken
seriously across the professions. It does not validate SafeFlow, and no volume of citations will.
The distinction held throughout the rest of the demo pack applies here without modification: this
is evidence about the problem, not evidence about the product.

## Status and next steps

Built so far (SF-283, SF-283b): the licence-safe extractor with an automated quality filter
(article-type and language exclusion), a year-enrichment script (Crossref, DOI-keyed), a
consolidation script (`scripts/evidence/consolidate.mjs`) that merges every ingestion wave into
one deduplicated corpus, and **70 verified records** across all four disciplines in
`scripts/evidence/evidence-corpus.json` — every one with a real publication year, none carrying an
abstract (checked programmatically, not just by field whitelist: the consolidated file was grepped
for the literal string "abstract" and returned zero matches). Notable records include Aiken et al.
(2002, *JAMA*) — the landmark staffing, mortality and failure-to-rescue study — the Surviving
Sepsis Campaign 2021 guidelines, multiple NEWS2 validation studies spanning Singapore, Colombia and
India, the eCARTv5 machine-learning early warning score (with FDA clearance), 4AT delirium
screening validation in Swedish and general ED populations, ESPEN's 2023/2024 polymorbid nutrition
guidelines, and five SBAR/structured-handover studies. Seven records were found and excluded rather
than ingested: one conference-proceedings collection and five non-English records via the automated
filter, plus one topical mismatch (a nanotechnology paper wrongly harvested against the
malnutrition search) caught by manual read — see `evidence-corpus-excluded.json`.

Outstanding:

1. Further scale-up toward hundreds — 70 is the first two combined waves, not the target size.
2. The cue-type mapping and query layer (SF-284), with tests that lock the patient-level boundary.
3. SafeFlow-written summaries, each carrying an explicit verification level. No record currently
   has a `safeflowSummary` or `verification` value — the corpus is bibliographic only until this is
   done, and must not be presented as more than that in the interim.
