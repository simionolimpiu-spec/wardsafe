# SafeFlow — Portable Patient Journey Across Trusts (Concept)

Status: simulation-only prototype. Fictional patients only. Not for clinical use. Human review required. This is a concept + a **simulation** of the idea — it is **not** a live cross-trust patient record or data-sharing system.

`master-narrative.md` is the controlled wording source.

## The idea (the differentiator)

A patient's **journey and history travels with them** across NHS trusts. When a fictional patient:

- **relocates** to another area,
- is **temporarily** somewhere else,
- is **found / taken ill away from home**, or
- is **transferred** to a specialist centre,

…the receiving trust can see the continuing picture, the **health plan continues**, and the patient either **returns to the originating trust** or moves to **packages of care / discharge** near their new home. Crucially, a **learning copy of the journey returns to the originating trust** so the sending ward can learn and teach from what happened next.

Two values in one: **continuity for the patient**, and a **teaching feedback loop** for the originating team.

## What is built now (simulation)

`src/data/trustNetwork/` models this across a network of real-named England trusts — James Paget (exact wards), Norfolk & Norwich and Addenbrooke's/Cambridge (sourced wards), plus West Suffolk, Ipswich (ESNEFT) and Queen Elizabeth King's Lynn (representative units). Every **patient and journey is fictional**. It includes:

- portable cross-trust journeys (relocation / temporary-visitor / specialist-transfer / inter-trust-handover),
- a **learning record returned to the originating (home) trust** for each journey, with teaching points,
- referential-integrity checks and a CSV/manifest export.

This demonstrates the vision for review-support, learning and teaching — with no real data.

## The honest boundary (why the live version is future discovery)

A **live** version of "one portable record across trusts" is exactly the space the NHS already governs heavily:

- It moves **identifiable patient data between organisations** — multiple data controllers, **data-sharing agreements**, and a **DPIA** are mandatory.
- The NHS already has the mechanisms this would have to align with — **Shared Care Records (ShCR)**, **GP Connect**, and NHS England's federated data platform. SafeFlow must **integrate with / respect** these, never bypass them, and never present itself as an alternative source of truth.
- It needs **information-governance sign-off** (Caldicott/IG/SIRO), a **lawful basis**, a **consent/transparency model**, and a **clinical-safety-case** scope change.

So: **the live cross-trust record stays FUTURE DISCOVERY**, gated behind the information-governance homework already logged (see `ig-checklist.md`). What we build and show now is the **simulation** of the journey and the learning loop — valuable, safe, and demonstrable today.

## Open questions before any live build

- Who is the data controller for the portable record at each hop, and what is the lawful basis?
- How does it relate to the Shared Care Record / GP Connect rather than duplicate them?
- What is the consent / transparency model for the patient across trusts?
- What DPIA and data-sharing agreements are required, and who signs them?
- How is the "learning copy back to the originating trust" de-identified / governed for teaching use?

## Alignment, not replacement (Shared Care Record / GP Connect)

A live version must **align with and read from** existing NHS interoperability, never become a competing source of truth:

- **Shared Care Records (ShCR)** and **GP Connect** already federate a patient's record across organisations — the portable journey would surface/annotate that, not duplicate it.
- SafeFlow's contribution is the **review-support + teaching layer** on top: the explainable review cues, the continuing-plan view, and the **learning copy back to the originating trust** — the part that is genuinely new and that the ShCR does not itself provide.
- The de-identified **learning/teaching copy** is a distinct governance case from the live care record and would be handled separately (aggregate/teaching use, not identifiable care data).

## Status

Concept + simulation delivered (trust network + portable journeys + learning copies). The live cross-trust record remains future discovery, contingent on the IG work above. No real patient data is used at any point.
