# SafeFlow Technology Stack

> Readiness note: the AWS material below is a mock/readiness stack only. It is not wired into the app, does not require live AWS deployment, and is separate from any future implementation decision. See `CONTROL.md` SF-104 and `docs/public-demo-pack/build-readiness/architecture-options.md`.

## Recommended Stack For The Next Build

### Frontend

- React with Vite for the current prototype.
- TypeScript when the app moves beyond prototype.
- Plain CSS or a controlled component system for clinical-style dense interfaces.
- React Testing Library for UI behavior tests.
- Playwright for browser journey tests.

Why: The product needs fast iteration, accessible UI patterns and reliable browser-level verification.

### Backend

Recommended first backend:

- Node.js with Fastify or NestJS.
- REST APIs for app workflows.
- OpenAPI schema for API contracts.
- Server-side validation with Zod or similar.
- Token verification, RBAC enforcement and audit logging remain server-side.
- Long-running workflow orchestration moves out of the browser; the AWS mock direction uses Step Functions for that role.

Why: This keeps development fast while creating a clean boundary between UI, workflow logic, integrations and AI providers.

### Data Layer

Recommended pilot data layer:

- PostgreSQL or Aurora PostgreSQL for relational workflow data.
- Object storage for exports and attachments.
- Append-only audit event table.
- Migration tool such as Prisma Migrate, Drizzle Kit or Flyway.

Core tables:

- users
- wards
- patients or patient_summaries
- observations
- tasks
- escalations
- handover_items
- discharge_blockers
- safety_flags
- draft_notes
- audit_events

The audit model should preserve role, subject and action metadata while avoiding raw token storage and direct patient identifiers.

### AI Layer

Recommended first AI approach:

- Keep deterministic rules for safety-gap detection.
- Put all AI calls behind a server-side `DraftProvider` interface.
- In the AWS mock/readiness direction, that provider can be backed by a Bedrock/LLM layer for draft text generation and wording assistance.
- Keep a deterministic fallback provider.
- Store prompt templates, model configuration and output metadata server-side.

Prototype status:

- The current repo includes a Node API route at `/api/drafts/sbar`.
- `npm run api` starts the local API on `127.0.0.1:8787`.
- When `OPENAI_API_KEY` is present, the server uses the OpenAI Responses API through the official JavaScript SDK.
- When the key is absent or the provider fails, the server and browser client use the deterministic fallback draft.
- The local OpenAI path is separate from the AWS mock/readiness direction in SF-104.
- The frontend never reads or stores an OpenAI API key.

Required AI safeguards:

- No browser-side API keys.
- No live patient data in the current SafeFlow environments.
- Evidence-bound prompts only.
- No autonomous diagnosis, prescribing or treatment instructions.
- Human-editable output.
- Audit record for draft creation, edit and save.

### AWS Mock / Readiness Architecture

This is the SF-104 direction in documentation form only. It is a planning shape, not a deployment plan.

- Amazon Cognito or another approved identity provider issues bearer tokens.
- The backend verifies those tokens and maps claims to roles and permissions.
- Step Functions orchestrates workflow transitions such as draft request, review, save and export.
- Aurora PostgreSQL stores relational state, draft notes and append-only audit events.
- A Bedrock/LLM layer sits behind the server-side `DraftProvider` interface.
- S3 stores exports and attachments.
- CloudWatch, KMS, Secrets Manager and WAF or VPC controls support operations and security.
- No live deployment, no SDK wiring and no browser-side AWS access are included in the repo.

### Integrations

Later integration candidates:

- FHIR APIs for observations, demographics, documents and records where available.
- HL7 feeds where FHIR is not available.
- EPR task/notes integration where allowed.
- Staff directory or identity provider.
- Local clinical coding/reference data.

Integration should start read-only and simulation-backed. Writeback requires a separate safety and governance decision.

## Technologies To Avoid Early

- Direct AI calls from the browser.
- Live EPR writeback in the MVP.
- Hard-coded clinical rules in UI components.
- Untraceable prompt chains.
- Non-audited data changes.
- Unapproved use of identifiable patient data.
- Direct AWS SDK calls from the browser or any other path that bypasses the server-side provider boundary.
