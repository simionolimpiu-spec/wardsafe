# Security And Assurance Readiness

## Security Principles

- Least privilege access.
- Role-based permissions.
- Audit every clinically relevant workflow event.
- Encrypt data in transit and at rest.
- Store secrets outside source code.
- Separate development, test and pilot environments.
- Use synthetic or de-identified data until approvals are complete.

## Clinical Safety Principles

- Define intended use.
- Define users and clinical context.
- Maintain a hazard log.
- Maintain clinical risk controls.
- Review safety risks with a qualified clinical safety lead.
- Test safety scenarios before live use.
- Treat AI output as draft support only.

NHS England describes digital clinical safety assurance as a clinical risk-management activity and identifies DCB0129 for manufacturers and DCB0160 for deployment/use organisations. Current applicability should be confirmed with a qualified clinical safety officer and the implementing organisation.

## Information Governance

Before live patient data:

- Confirm data controller and processor roles.
- Complete data protection impact assessment where required.
- Define retention and deletion policy.
- Define access policy.
- Define incident response process.
- Confirm hosting and data residency requirements.
- Confirm whether data will be used for product improvement, audit or research.

## AI Assurance

Before AI with clinical context:

- Define what AI is allowed to do.
- Define what AI is not allowed to do.
- Keep prompts evidence-bound.
- Log model, prompt version and generated output metadata.
- Require human review and edit before use.
- Test for unsafe clinical language.
- Monitor false positives and false negatives.

## Technical Assurance

Minimum checks:

- Unit tests.
- UI journey tests.
- Browser tests.
- Accessibility review.
- Dependency vulnerability scan.
- Static analysis.
- Backup/restore test.
- Penetration test before production.

## Useful Public References

- NHS England digital clinical safety assurance: https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/
- NHS England digital clinical safety strategy: https://www.england.nhs.uk/patient-safety/patient-safety-systems/digital-clinical-safety-strategy/
- NHS England Digital API catalogue: https://digital.nhs.uk/developer/api-catalogue
- NHS England What Good Looks Like framework: https://transform.england.nhs.uk/digitise-connect-transform/what-good-looks-like/

These references are starting points, not approval. A real deployment must follow the partner organisation's current policies.
