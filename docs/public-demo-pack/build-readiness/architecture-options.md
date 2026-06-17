# SafeFlow Architecture Options

## Option A: Static Simulation Prototype

Use now.

Shape:

- Vite React app.
- Local fictional data.
- Deterministic rule logic.
- No backend.
- No authentication.
- No live integrations.

Best for:

- Demonstrations.
- Early stakeholder feedback.
- UI flow validation.
- Public-safe sharing.

Limitations:

- No persistence.
- No real users or roles.
- No real audit store.
- No integration pathway.

## Option B: Secure Pilot Application

Recommended next target.

Shape:

- React frontend.
- Backend API.
- PostgreSQL database.
- Authenticated users and roles.
- Audit event service.
- AI draft provider service.
- Synthetic or de-identified data only at first.

Best for:

- Ward simulation workshops.
- Safety-case development.
- Product validation.
- Procurement and partner conversations.

Key decisions:

- Identity provider.
- Cloud provider.
- Data model.
- Audit event schema.
- AI provider boundary.

## Option C: Integrated Clinical System

Use only after evidence, safety and governance gates.

Shape:

- Read-only clinical data integrations.
- Role-based access tied to organisational identity.
- Clinical safety case.
- Information-governance approval.
- Operational support model.
- Monitoring, incident response and release controls.

Best for:

- Controlled pilot with real clinical workflows.

Risks:

- Integration complexity.
- Patient-identifiable data handling.
- Clinical safety obligations.
- Alert fatigue.
- Overreliance on AI output.

## Recommended Path

Move from A to B first. Do not jump directly from the static prototype to an integrated clinical system.

The next meaningful milestone is a secure pilot application using synthetic or de-identified data, with authentication, persistence, audit logging and server-side AI boundaries.
