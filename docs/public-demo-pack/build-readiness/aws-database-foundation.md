# SafeFlow AWS And Database Foundation

This is the first buildable AWS/database slice for SafeFlow. It is a local infrastructure-as-code and schema scaffold only. It does not deploy resources, connect to live clinical systems or store live patient data.

## What Exists In This Repo

- `infra/aws/app.js` defines the CDK entry point.
- `infra/aws/safeflowFoundationStack.js` defines the first AWS foundation stack.
- `database/schema.sql` defines the PostgreSQL workflow schema.
- `database/seed.sql` loads fictional SafeFlow discovery data.
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
- Security groups that allow PostgreSQL only from the application tier.

The stack deliberately does not include live FHIR/EPR integrations, production identity, public endpoints or application containers yet. Those should be added after the workflow, safety case, access model and environment strategy are locked.

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

## Local Commands

```powershell
npm test -- infra/aws/safeflowFoundationStack.test.js database/schema.test.js
npm run infra:synth
```

`npm run infra:synth` renders CloudFormation locally. It should be used for review only until an AWS account, deployment role, budget guardrail and environment policy are agreed.

## Next AWS Steps

1. Add environment configuration for `dev`, `simulation` and `pilot`.
2. Add API compute, probably ECS Fargate or Lambda, behind a private service boundary.
3. Add Cognito or partner-approved identity provider integration.
4. Add database migrations rather than raw schema application.
5. Add backup/restore runbook and retention decisions.
6. Add CloudWatch alarms, structured logs and audit export strategy.
7. Add CI synth/test checks before any deploy path.
