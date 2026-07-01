# SafeFlow Codex Instructions

## Project identity

SafeFlow is an early-stage NHS-facing clinical workflow and patient-flow safety platform. It is being prepared as a professional promotional and pitch website for the NHS Clinical Entrepreneur Programme.

Primary creator: Olimpiu "Oli" Simion.
Clinical contributor: Mihaela "Mia" Simion, MSc RN.
Mia LinkedIn: https://www.linkedin.com/in/mia-simion-msc-rn-1501ba66/

Do not reverse the contributor hierarchy. Oli is primary creator. Mia is secondary contributor and clinical-facing credibility contributor.

## Tone and positioning

The website must sound clinically credible, commercially mature, and NHS-aware.

Avoid:
- hype
- fake traction
- fake NHS endorsement
- fake pilot claims
- unverified claims from LinkedIn
- "revolutionary AI" language
- stock healthtech cliches
- using the NHS logo or NHS lozenge
- implying SafeFlow is approved, deployed, CE/UKCA marked, DTAC passed, or clinically certified unless explicitly stated by the user

Use:
- clear clinical workflow language
- NHS adoption language
- governance readiness language
- patient safety and staff workload framing
- practical pilot pathway
- evidence-generation language
- founder credibility
- responsible innovation framing

## Core message

SafeFlow helps ward teams see operational risk earlier, coordinate escalation more clearly, and create a safer flow of clinical work from admission to discharge.

It is not just a dashboard. It is a safety loop:
1. Detect pressure
2. Prioritise risk
3. Escalate clearly
4. Coordinate action
5. Handover safely
6. Learn from workflow friction

## NHS CEP alignment

The website must explicitly map SafeFlow to the NHS Clinical Entrepreneur Programme:
- frontline-origin problem
- patient benefit
- staff benefit
- NHS operational value
- scalable digital product potential
- need for mentorship
- need for commercial, IP, governance and pilot support
- readiness for structured development

## Compliance and governance messaging

Include a serious section titled "Built for NHS adoption, not just demonstration."

Mention readiness pathways:
- DTAC domains: clinical safety, data protection, technical security, interoperability, usability and accessibility
- DCB0129 manufacturer clinical risk management
- DCB0160 deployment/use clinical risk management
- DSPT readiness if accessing NHS patient data or systems
- GDPR/data minimisation
- role-based access
- audit trail
- human-in-the-loop clinical responsibility
- WCAG 2.2 AA accessibility target

Important: phrase all of this as a roadmap/readiness position, not as completed certification.

## Visual design rules

Use a premium NHS-compatible healthtech visual style:
- white/off-white background
- deep navy or near-black text
- restrained blue accent
- no neon gimmicks
- no fake medical imagery
- no readable patient data
- no NHS logo
- no hospital logos unless provided and permitted
- no faces unless licensed
- accessible contrast
- clear keyboard focus states
- mobile-first

Font:
- Use Arial/Helvetica/system sans-serif by default.
- Do not import or bundle Frutiger unless user confirms licence.

## Benchmark inspiration

Use design lessons from Abridge, Nabla, Corti, and Huma:
- Abridge: enterprise-grade positioning, workflow stages, outcome metrics, clinical trust
- Nabla: clear clinician benefit statistics and specialty coverage
- Corti: developer-grade clinical AI infrastructure, safety, auditability, APIs
- Huma: regulated platform, deployment scale, remote monitoring and care pathway framing

Do not copy their wording or layout directly.

## Required website sections

1. Hero
2. Problem
3. What SafeFlow does
4. The SafeFlow safety loop
5. Why this matters to the NHS
6. NHS CEP fit
7. Product modules
8. Pilot and evidence roadmap
9. Governance and adoption readiness
10. Founder and contributor story
11. CTA section
12. Footer with early-stage disclaimer

## Founder copy rules

Use:
"Created by Olimpiu 'Oli' Simion"
"Clinical contribution by Mihaela 'Mia' Simion, MSc RN"

For Mia:
- mention registered nurse only if already known/provided
- mention NHS frontline experience only if already known/provided
- use her LinkedIn URL
- do not invent awards, qualifications, roles, or dates

For Oli:
- search for public profile information if internet access is available
- if not verified, keep copy conservative:
  "Oli leads the product concept, digital build, and SafeFlow platform direction."

## Testing requirements

After changes:
- npm run build must pass
- npm test must pass where available
- Playwright e2e tests must pass on desktop and mobile
- Add accessibility checks using axe where possible
- Check Lighthouse basics if possible
- Check responsive layout at mobile, tablet, desktop
- Ensure all CTAs work
- Ensure the interactive prototype remains accessible through the CTA

## Deliverables

Update:
- src/App.jsx
- src/styles.css
- index.html
- tests/e2e where appropriate
- package.json scripts if needed
- README or docs if helpful

Add:
- accessibility test if missing
- structured metadata
- Open Graph metadata
- favicon/manifest if appropriate
- early-stage disclaimer

Final report must include:
- files changed
- commands run
- test results
- assumptions made
- claims that still need user verification
