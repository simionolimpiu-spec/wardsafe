# SafeFlow Technology Stack

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
- Background worker for async tasks.

Why: This keeps development fast while creating a clean boundary between UI, workflow logic, integrations and AI providers.

### Data Layer

Recommended pilot data layer:

- PostgreSQL for relational workflow data.
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

### AI Layer

Recommended first AI approach:

- Keep deterministic rules for safety-gap detection.
- Use OpenAI API only for draft text generation, summarisation or wording assistance.
- Put all AI calls behind a server-side `DraftProvider` interface.
- Keep a deterministic fallback provider.
- Store prompt templates, model configuration and output metadata server-side.

Prototype status:

- The current repo includes a Node API route at `/api/drafts/sbar`.
- `npm run api` starts the local API on `127.0.0.1:8787`.
- When `OPENAI_API_KEY` is present, the server uses the OpenAI Responses API through the official JavaScript SDK.
- When the key is absent or the provider fails, the server and browser client use the deterministic fallback draft.
- The frontend never reads or stores an OpenAI API key.

Required AI safeguards:

- No browser-side API keys.
- No live patient data until approved.
- Evidence-bound prompts only.
- No autonomous diagnosis, prescribing or treatment instructions.
- Human-editable output.
- Audit record for draft creation, edit and save.

### Cloud Option

AWS-aligned pilot architecture:

- Amazon Cognito or approved identity provider for authentication.
- API Gateway or Application Load Balancer for API ingress.
- ECS Fargate or Lambda for app services.
- EventBridge for workflow events.
- Step Functions for orchestrated workflows when needed.
- Aurora PostgreSQL or RDS PostgreSQL for relational data.
- S3 for exports and attachments.
- CloudWatch for logs, metrics and alarms.
- KMS for encryption keys.
- Secrets Manager for secrets.
- WAF and VPC controls for production environments.

Cloud-agnostic equivalents can be used if a partner has a different hosting standard.

Prototype status:

- The repo now includes a local AWS CDK v2 foundation stack in `infra/aws/`.
- `npm run infra:synth` renders the CloudFormation template locally.
- The current stack provisions a private encrypted PostgreSQL database, encrypted private S3 bucket, KMS key, Secrets Manager entries, CloudWatch log group, private Lambda compute scaffold and private VPC endpoints for Secrets Manager/S3 access.
- `npm run db:manifest` prints deterministic checksums for the SQL schema and seed sources.
- No AWS deployment has been run from this repository.

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
