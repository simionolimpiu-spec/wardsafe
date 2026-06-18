# SafeFlow AWS And Database Foundation

This is the first buildable AWS/database slice for SafeFlow. It is a local infrastructure-as-code and schema scaffold only. It does not deploy resources, connect to live clinical systems or store live patient data.

## What Exists In This Repo

- `infra/aws/app.js` defines the CDK entry point.
- `infra/aws/safeflowFoundationStack.js` defines the first AWS foundation stack.
- `database/schema.sql` defines the PostgreSQL workflow schema.
- `database/seed.sql` loads fictional SafeFlow discovery data.
- `database/migrationManifest.js` builds deterministic migration-source checksums.
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

The migration manifest command gives reviewers a deterministic list of SQL sources, file sizes and checksums. It is not a live migration runner yet.

## Local Commands

```powershell
npm test -- infra/aws/safeflowFoundationStack.test.js database/schema.test.js
npm run db:manifest
npm run infra:synth
```

`npm run infra:synth` renders CloudFormation locally. It should be used for review only until an AWS account, deployment role, budget guardrail and environment policy are agreed.

## Next AWS Steps

1. Add environment configuration for `dev`, `simulation` and `pilot`.
2. Add a real migration runner with approval gates and rollback notes.
3. Add Cognito or partner-approved identity provider integration.
4. Add authenticated API ingress only after identity is ready.
5. Add backup/restore runbook and retention decisions.
6. Add CloudWatch alarms, structured logs and audit export strategy.
7. Add CI synth/test checks before any deploy path.
