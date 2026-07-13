# SafeFlow — RBAC & Audit-Logging Concept (SF-207)

Status: simulation-only prototype. This is a design/readiness concept only. Nothing here is implemented as a live security control, and none of it processes real patient data. No live deployment follows from this document (R-003: deployment is an explicit, separate human decision).

`master-narrative.md` is the controlled wording source. SafeFlow remains simulation-only and does not replace any live clinical, quality, or identity system.

## Purpose

Describe, at a readiness level, how role-based access control (RBAC) and audit logging *would* be designed if SafeFlow ever moved beyond the simulation prototype toward a governed pilot. This lets a reviewer see that access control and auditability have been thought through, without building or enabling anything now.

## Why it is not built now

The current prototype uses fictional data only, so there is no confidential data to protect and no real user identities to authenticate. Building live RBAC/audit now would add security surface and complexity with no real-data benefit. RBAC and audit become relevant only at the pilot stage described in the IG checklist (`ig-checklist.md`), and only after the governance gates there are cleared.

## Role model (concept)

Illustrative roles for a future governed deployment (fictional, for design only):

- **Viewer** — read simulated review cues and exports; no configuration.
- **Practice educator / reviewer** — as Viewer, plus generate and file the Ward Quality & Safety Review export and review Competency Passport learning evidence.
- **Ward manager / governance lead** — as above, plus access ward-level (aggregate, non-identifying) learning assurance and quality summaries.
- **Administrator** — user and configuration management; no ability to alter safety guards or the simulation-only boundary.

Principle: **least privilege**. No role can disable the safety-language guards, the simulation-only boundary, or the human-review framing.

## Audit-logging (concept)

For a future governed deployment, an append-only audit trail would record: who did what, when, and to which record — for example, generating or exporting a report, opening a review, or changing configuration. Design intents:

- **Non-repudiation:** each entry ties an action to an authenticated actor and timestamp.
- **Tamper-evidence:** append-only; no in-place edits or deletes of audit entries.
- **Minimal, purpose-bound data:** audit entries capture the action and actor reference, not clinical content beyond what the action requires; no direct patient identifiers in logs.
- **Retention & access:** retention schedule and read access defined with the IG/DPO function before any real use.

The existing prototype already models a safe shape here: the simulation services attach simulation-only, non-identifying envelopes and there is a fictional audit event path — this concept describes how that would harden for a real deployment, not a change to the prototype.

## Alignment with governance

Any move toward live RBAC/audit is downstream of: the clinical safety case (`clinical-safety-case-outline.md`), the staged IG checklist (`ig-checklist.md`), and DTAC/DCB readiness. This document is a placeholder for that design work, not authorisation to begin it.

## What this document does NOT do

- Does not enable, configure, or deploy any authentication, authorisation, or logging system.
- Does not process, store, or reference real user or patient data.
- Does not change the prototype's behaviour or its simulation-only boundary.
