# SafeFlow AWS Free Tier Setup

This guide is for a first SafeFlow simulation-only AWS account in the London region (`eu-west-2`). It is a deploy-prep checklist for fictional data only.

## Before Any CDK Diff Or Deploy

- Use AWS Free Tier cautiously: free-tier and credit offers still need billing alerts and cleanup discipline.
- Confirm the root account has MFA enabled.
- Confirm no root access keys exist.
- Confirm an AWS Budget exists with alerts before resources are deployed.
- Keep the account in `eu-west-2` for SafeFlow simulation work.
- Use only fictional SafeFlow data. No live patient data, no NHS systems, no direct care identifiers.

## Local Environment Template

Use `.env.aws.example` as the safe reference template. Do not commit real AWS credentials or secrets.

Required confirmations for deploy-prep:

```powershell
$env:AWS_PROFILE="safeflow-free-tier"
$env:AWS_REGION="eu-west-2"
$env:CDK_DEFAULT_REGION="eu-west-2"
$env:SAFEFLOW_ENVIRONMENT="simulation"
$env:SAFEFLOW_SIMULATION_ONLY="true"
$env:SAFEFLOW_ACCOUNT_MFA_CONFIRMED="true"
$env:SAFEFLOW_BUDGET_CONFIRMED="true"
$env:SAFEFLOW_DEPLOYMENT_APPROVED="false"
```

Keep `SAFEFLOW_DEPLOYMENT_APPROVED=false` while reviewing templates. Set it to `true` only for an intentional `cdk diff` or `cdk deploy` session.

## Safe Commands

```powershell
npm run infra:synth:simulation
npm run infra:deploy:preflight
npm run infra:diff:simulation
```

`infra:deploy:preflight` does not call AWS. It checks the local environment for simulation-only mode, London region, MFA confirmation, budget confirmation and explicit deployment approval.

## Deployment Command

Only after a human review of the CDK diff:

```powershell
$env:SAFEFLOW_DEPLOYMENT_APPROVED="true"
npm run infra:deploy:simulation
```

The first deployment target remains simulation-only. It creates private AWS foundation resources for SafeFlow review and does not approve live clinical integrations.

## Database Migration

Database migration execution stays separate from CDK deployment:

```powershell
$env:SAFEFLOW_SIMULATION_ONLY="true"
$env:SAFEFLOW_MIGRATION_APPROVED="true"
$env:DATABASE_URL="postgresql://..."
npm run db:migrate:execute
```

Use migration execution only against an approved simulation database. The repository deliberately keeps migration approval separate from infrastructure deployment approval.

## Cleanup Reminder

RDS, KMS, logs and retained resources can create cost. Before leaving the AWS account idle, review the deployed stack, retained resources, CloudWatch logs, snapshots, budgets and billing dashboard.
