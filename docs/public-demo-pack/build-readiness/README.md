# SafeFlow Build Readiness Pack

This folder describes what is needed to turn the SafeFlow simulation prototype into a production-intent product.

The pack is public-safe. It avoids confidential invention details, avoids official NHS branding, and assumes fictional data until a formal clinical, information-governance and integration process is in place.

## Documents

- `implementation-blueprint.md` - staged build plan from prototype to pilot.
- `technology-stack.md` - recommended frontend, backend, data, AI and cloud technologies.
- `hardware-software-requirements.md` - minimum and target hardware/software needs.
- `architecture-options.md` - prototype, pilot and scaled architecture choices.
- `data-integration-map.md` - how SafeFlow could connect to clinical systems later.
- `security-and-assurance.md` - safety, security and assurance work needed before clinical use.
- `delivery-roadmap.md` - phased delivery milestones and evidence gates.
- `aws-database-foundation.md` - first local AWS CDK and PostgreSQL scaffold.
- `environment-profiles.md` - dev, simulation and restricted future-pilot settings.
- `aws-free-tier-setup.md` - first-account checklist, London-region env template and gated deploy commands.
- `backup-restore-runbook.md` - simulation-only backup/restore drill and evidence process.
- `ci-quality-gates.md` - non-deploying GitHub checks for app, infrastructure and migrations.

## Templates

Templates are in `../templates/` and can be copied into a project workspace when planning a pilot or stakeholder review.
