# Hardware And Software Requirements

## Developer Workstation

Minimum:

- Modern Windows, macOS or Linux laptop.
- 16 GB RAM.
- 4 CPU cores.
- 20 GB free disk space.
- Node.js LTS or newer.
- Git.
- GitHub CLI.
- Modern Chromium-based browser.

Recommended:

- 32 GB RAM.
- 8 CPU cores.
- Docker Desktop or equivalent container runtime.
- Local PostgreSQL or containerised PostgreSQL.
- Password manager and hardware-backed MFA where possible.

## Clinical Simulation / Workshop Setup

Minimum:

- Laptop running the local demo.
- Large monitor or projector.
- Modern browser.
- Stable internet if using cloud-hosted demo or AI provider.
- Fictional scenario pack.

Recommended:

- Facilitator laptop.
- Separate observer laptop for notes.
- Screen recording tool if participants consent.
- Printed worksheet for workflow observations.
- Private room for discussion.

## Pilot Environment

Minimum production-intent components:

- Authenticated web application.
- Backend API service.
- PostgreSQL database.
- Audit log storage.
- Secrets management.
- Encrypted storage.
- Monitoring and alerting.
- Backup and restore process.

Recommended pilot controls:

- Separate development, test and pilot environments.
- Infrastructure as code.
- CI/CD pipeline.
- Automated test suite.
- Vulnerability scanning.
- Centralised logs.
- Role-based access control.
- Incident response runbook.

## End-User Devices

Target devices:

- Trust-managed desktop workstations.
- Ward laptops on wheels.
- Tablets only if the dense board is redesigned for touch.

Browser support:

- Current Microsoft Edge.
- Current Google Chrome.

Display:

- Minimum usable width: 1280 px for the full board.
- Recommended ward-board display: 1920 x 1080 or larger.

Accessibility:

- Keyboard navigation.
- Visible focus states.
- Sufficient colour contrast.
- Text labels for status, not colour alone.

## Software Services Needed Later

- Identity provider.
- Email or notification service if notifications leave the app.
- EPR/FHIR integration gateway if live data is approved.
- Clinical terminology/reference service if coded data is used.
- AI provider service if draft generation moves beyond deterministic text.
- Analytics/reporting service for aggregated learning.
