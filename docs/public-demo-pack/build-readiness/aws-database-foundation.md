# SafeFlow AWS And Database Foundation

This is the first buildable AWS/database slice for SafeFlow. It is a local infrastructure-as-code and schema scaffold only. It does not deploy resources, connect to live clinical systems or store live patient data.

## What Exists In This Repo

- `infra/aws/app.js` defines the CDK entry point.
- `infra/aws/safeflowFoundationStack.js` defines the first AWS foundation stack.
- `infra/aws/environmentProfiles.js` defines dev, simulation and restricted pilot settings.
- `database/schema.sql` defines the PostgreSQL workflow schema.
- `database/seed.sql` loads fictional SafeFlow discovery data.
- `database/migrationManifest.js` builds deterministic migration-source checksums.
- `database/migrationApproval.json` records the approved simulation-only SQL checksums.
- `database/migrationRunner.js` validates approval gates and runs migrations transactionally.
- `infra/aws/lambda/safeflowApi/index.mjs` defines a private Lambda handler scaffold.
- `infra/**/*.test.js` and `database/**/*.test.js` check the safety boundaries.

## AWS Foundation

The CDK stack currently synthesizes:

- VPC with separate application and isolated data subnets.
- RDS PostgreSQL 16 database, private, encrypted and deletion-protected.
- Generated database credentials in AWS Secrets Manager.
- Customer managed KMS key with key rotation.
- Private S3 bucket for exports/documents with block public access, KMS encryption, SSL enforcement and versioning.
- Secrets Manager placeholder for the server-side OpenAI provider configuration.
- CloudWatch log group for future API service logs.
- Private Lambda compute scaffold for the SafeFlow API.
- VPC endpoints for private Secrets Manager and S3 access from the application tier.
- Security groups that allow PostgreSQL only from the application tier.

The stack deliberately does not include live FHIR/EPR integrations, production identity or public endpoints yet. API Gateway or an external load balancer should be added only after the identity model, deployment environment and safety case are locked.

## Database Foundation

The PostgreSQL schema starts with:

- `users`
- `wards`
- `patient_summaries`
- `observations`
- `safety_flags`
- `tasks`
- `escalations`
- `handover_items`
- `discharge_blockers`
- `draft_notes`
- `audit_events`
- `discovery_scenarios`
- `hazard_log_entries`

The schema avoids direct patient identifiers and uses synthetic patient references such as `DCU-031`. It includes structured evidence fields for flags and draft notes, plus append-oriented audit events for clinically relevant workflow actions.

The migration manifest command gives reviewers a deterministic list of SQL sources, file sizes and checksums. The migration runner refuses to plan unless `SAFEFLOW_SIMULATION_ONLY=true` is set, and refuses execution unless `SAFEFLOW_MIGRATION_APPROVED=true` and `DATABASE_URL` are also set. The checked approval file only covers the current fictional schema and seed data.

## Local Commands

```powershell
npm test -- infra/aws/safeflowFoundationStack.test.js database/schema.test.js
npm run infra:synth:dev
npm run infra:synth:simulation
npm run db:manifest
$env:SAFEFLOW_SIMULATION_ONLY="true"; npm run db:migrate:plan
npm run infra:synth
```

`npm run infra:synth` renders CloudFormation locally. It should be used for review only until an AWS account, deployment role, budget guardrail and environment policy are agreed.

`npm run db:migrate:execute` is intentionally gated. It should only be used against an approved simulation database with `SAFEFLOW_SIMULATION_ONLY=true`, `SAFEFLOW_MIGRATION_APPROVED=true` and `DATABASE_URL` set.

## Next AWS Steps

1. Run and record the first simulation backup/restore drill in an approved AWS account.
2. Add automated backup/restore evidence checks to CI/CD where appropriate.
3. Add Cognito or partner-approved identity provider integration.
4. Add authenticated API ingress only after identity is ready.
5. Add backup/restore runbook and retention decisions.
6. Add CloudWatch alarms, structured logs and audit export strategy.
7. Add CI synth/test checks before any deploy path.
