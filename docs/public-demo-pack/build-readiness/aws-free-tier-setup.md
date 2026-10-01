# SafeFlow AWS Free Tier Setup

This guide is for a first SafeFlow simulation-only AWS account in the London region (`eu-west-2`). It is a deploy-prep checklist for fictional data only.

## Before Any CDK Diff Or Deploy

- Use AWS Free Tier cautiously: free-tier and credit offers still need billing alerts and cleanup discipline.
- Confirm the root account has MFA enabled.
- Confirm no root access keys exist.
- Do not use the root identity for SafeFlow CLI, CDK diff or deploy commands.
- Configure a non-root IAM or IAM Identity Center profile for `AWS_PROFILE`.
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
$env:SAFEFLOW_ALLOWED_ORIGIN="https://preview.example.com"
$env:SAFEFLOW_PREVIEW_ACCESS_TOKEN="replace-with-a-long-random-preview-token"
$env:SAFEFLOW_SIMULATION_ONLY="true"
$env:SAFEFLOW_ACCOUNT_MFA_CONFIRMED="true"
$env:SAFEFLOW_BUDGET_CONFIRMED="true"
$env:SAFEFLOW_DEPLOYMENT_APPROVED="false"
```

Keep `SAFEFLOW_DEPLOYMENT_APPROVED=false` while reviewing templates. Set it to `true` only for an intentional `cdk diff` or `cdk deploy` session. The preview access token must be a non-placeholder value before public preview diff or deploy commands run.

## Safe Commands

```powershell
npm run infra:synth:simulation
npm run infra:deploy:preflight
npm run infra:diff:simulation
```

`infra:deploy:preflight` checks the local environment for simulation-only mode, London region, MFA confirmation, budget confirmation and explicit deployment approval. It also verifies the AWS caller identity and refuses root credentials.

## Deployment Command

Only after a human review of the CDK diff:

```powershell
$env:SAFEFLOW_DEPLOYMENT_APPROVED="true"
npm run infra:deploy:simulation
```

The first deployment target remains simulation-only. It creates private AWS foundation resources for SafeFlow review and does not approve live clinical integrations.

## Database Migration

Database migration execution stays separate from CDK deployment. The deployed simulation stack includes a private migration Lambda because the RDS database is not publicly reachable.

```powershell
$migrationFunction = aws cloudformation describe-stacks `
  --stack-name safeflow-simulation-foundation `
  --profile safeflow-free-tier `
  --region eu-west-2 `
  --query "Stacks[0].Outputs[?OutputKey=='MigrationFunctionName'].OutputValue | [0]" `
  --output text

aws lambda invoke `
  --function-name $migrationFunction `
  --cli-binary-format raw-in-base64-out `
  --payload '{"action":"execute-approved-simulation-migration","approved":true}' `
  --profile safeflow-free-tier `
  --region eu-west-2 `
  .\safeflow-migration-result.json
```

Use migration execution only against an approved simulation database. The repository deliberately keeps migration approval separate from infrastructure deployment approval, and the Lambda refuses execution unless the invoke payload includes `approved=true`.

## Cleanup Reminder

RDS, KMS, logs and retained resources can create cost. Before leaving the AWS account idle, review the deployed stack, retained resources, CloudWatch logs, snapshots, budgets and billing dashboard.

The simulation profile uses a one-day RDS backup retention period because the AWS Free plan rejected longer retention during first deployment testing. The simulation database is also configured without deletion protection and without DB retention so failed or abandoned synthetic deployments can be cleaned up without leaving paid network dependencies behind.
