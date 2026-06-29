# SafeFlow Environment Profiles

SafeFlow uses explicit environment profiles so infrastructure settings do not drift between local development, simulation review and any future pilot. The profiles live in `infra/aws/environmentProfiles.js` and are consumed by the CDK app and foundation stack.

## Profiles

| Profile | Current status | Data classification | RDS backup retention | Backup window | Multi-AZ | Database teardown |
| --- | --- | --- | --- | --- | --- | --- |
| `dev` | Local/synthesis use; AWS deployment not approved | Synthetic only | 1 day | 01:00-02:00 UTC | No | Destroy; no deletion protection |
| `simulation` | Current AWS-ready profile; Free plan compatible | Synthetic only | 1 day | 02:00-03:00 UTC | No | Destroy; no deletion protection |
| `pilot` | Restricted; synthesis/deployment blocked by default | Synthetic only; live patient data is out of scope | 14 days | 03:00-04:00 UTC | Yes | Retain; deletion protection enabled |

The `pilot` profile is a future configuration target, not permission to use live patient data. It remains synthetic-only and requires explicit clinical-safety, information-governance, data-protection, hosting and cost approvals.

## Commands

```powershell
npm run infra:synth:dev
npm run infra:synth:simulation
```

The default `npm run infra:synth` uses `simulation` unless `SAFEFLOW_ENVIRONMENT` or CDK context `safeflowEnvironment` selects another profile.

Restricted profile synthesis requires an explicit local gate:

```powershell
$env:SAFEFLOW_RESTRICTED_ENVIRONMENT_APPROVED="true"
npm run infra:synth -- -c safeflowEnvironment=pilot
```

That gate exists for local template review. It is a process safeguard, not an IAM control, and it does not approve deployment, live integrations or live patient data. Do not use the gate with `cdk deploy`.

The CDK app also requires context `safeFlowOperation=synth` or `safeFlowOperation=deploy`. Deploy operation rejects `dev` and `pilot`, and requires `SAFEFLOW_DEPLOYMENT_APPROVED=true` for the simulation profile. The repository includes local gated deploy-prep scripts for the simulation profile, but CI never configures AWS credentials or deploys resources.

## Shared Controls

- PostgreSQL remains private and encrypted.
- `simulation` and `dev` are cleanup-friendly synthetic profiles: automated backups are deleted with the DB instance, deletion protection is disabled and the DB is not retained by CloudFormation.
- `pilot` keeps retained automated backups and deletion protection enabled for future controlled reviews.
- Tags are copied to snapshots.
- Lambda receives the selected environment and `synthetic-only` data classification.
- Public API ingress remains absent.
