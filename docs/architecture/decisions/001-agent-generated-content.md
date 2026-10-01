# ADR: Generated content never becomes source truth or instructions

Status: implemented for the simulation-only agent foundation v0.1.

## Context

WardSafe combines fictional source data, reproducible signals, generated interpretations and explicit human review. Reusing a generated summary as instructions or silently copying it into a source fact would erase this distinction and weaken provenance.

## Decision

Keep four separate trust domains: source facts, deterministic derivations, AI interpretation and human decision. Keep general reference knowledge separately labelled. Only application-created system instructions have instruction authority.

Generated reviews and summaries remain untrusted, including after a person accepts them. A human edit is a separate human-authored event, linked to the original generated event. Source facts, their timestamps and record identifiers remain unchanged. The UI exposes these distinctions and the source-to-review event chain.

The orchestrator executes a bounded fixed sequence of read-only tools and a mock model call. It stops for human review. Recording that review creates no clinical action. Timeout, cancellation, invalid output or a denied tool stops the run without a proposed cue.

## Consequences

- No automatic promotion of a summary to system instructions or source evidence.
- No autonomous clinical decisions, diagnosis, prescribing or treatment recommendations.
- More explicit metadata and event links, with understandable provenance for the reviewer.
- Factory identity and mock actor references are local application safeguards, not production authentication.
- Future storage, external models, clinical deployment and FHIR adapters require separate design, validation and governance.

See [the architecture](../agent-foundation.md) for the implemented interfaces and limitations.
