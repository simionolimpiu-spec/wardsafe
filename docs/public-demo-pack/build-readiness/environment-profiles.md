# SafeFlow Environment Profiles

SafeFlow uses explicit environment profiles so infrastructure settings do not drift between local development, simulation review and any future pilot. The profiles live in `infra/aws/environmentProfiles.js` and are consumed by the CDK app and foundation stack.

## Profiles

| Profile | Current status | Data classification | RDS backup retention | Backup window | Multi-AZ |
| --- | --- | --- | --- | --- | --- |
| `dev` | Local/synthesis use; AWS deployment not approved | Synthetic only | 1 day | 01:00-02:00 UTC | No |
| `simulation` | Current AWS-ready profile | Synthetic only | 7 days | 02:00-03:00 UTC | No |
| `pilot` | Restricted; synthesis/deployment blocked by default | Synthetic only; live patient data is out of scope | 14 days | 03:00-04:00 UTC | Yes |

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

The CDK app also requires context `safeFlowOperation=synth` or `safeFlowOperation=deploy`. Deploy operation rejects `dev` and `pilot`, and requires `SAFEFLOW_DEPLOYMENT_APPROVED=true` for the simulation profile. No deployment command or deployment role is included in this repository.

## Shared Controls

- PostgreSQL remains private and encrypted.
- Automated backups are retained when the DB instance is removed from the stack.
- Deletion protection remains enabled.
- Tags are copied to snapshots.
- Lambda receives the selected environment and `synthetic-only` data classification.
- Public API ingress remains absent.
