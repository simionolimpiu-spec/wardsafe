# docs/product

Versioned product-level source documents.

## What is in here

- `2026-07-01-product-white-paper-baseline.md` — the original SafeFlow product white paper,
  preserved verbatim as a dated historical baseline.

## Read this before using anything in this folder

These are **provenance records, not current-state documents.** They are versioned so the project
has an auditable record of what it said about itself and when, which is exactly the point of a
baseline. They are deliberately **not** updated in place — editing them would destroy the thing
that makes them useful.

`docs/public-demo-pack/master-narrative.md` is the controlled wording source. Its control rule is
unchanged and applies here too: **if a document in this folder conflicts with the master narrative,
the master narrative wins.** `CONTROL.md` is the live status record.

If you need to know what SafeFlow is and does *today*, read the master narrative and CONTROL.md.
If you need to know what SafeFlow claimed on a given date, read the baseline for that date.

## Why the baselines are not gated by the safety-language scan

Every stakeholder-facing document in `docs/public-demo-pack/` is checked by the automated
wording scan in `src/domain/safetyLanguage.test.js`. Files in this folder are excluded on purpose.

A historical baseline is only worth keeping if it is unaltered. Gating it would eventually force a
choice between failing CI and rewriting the historical record to match current wording — and
rewriting it is the wrong answer. The protection instead comes from the header on each baseline
file, which states plainly that the document is superseded and points to the controlled source.

Each baseline was read in full before being committed, and confirmed to contain no real patient
data, no realistic patient identifiers, no NHS logo or wordmark, and no claim of live clinical
deployment. Superseded framing is expected and acceptable here; unsafe content is not, and would be
grounds for not versioning the file at all.

For the record, the 1 July 2026 baseline was also run through the boundary-aware scan at the time
of committing and passed clean. It is left ungated by choice, not because it would fail.
