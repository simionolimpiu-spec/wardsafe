import { ArrowRight, ExternalLink, PlayCircle } from 'lucide-react';
import { AssuranceGrid } from './AssuranceGrid.jsx';
import { ClinicalPathwayVisual } from './ClinicalPathwayVisual.jsx';
import { CepBrief } from './CepBrief.jsx';
import { ModuleMosaic } from './ModuleMosaic.jsx';
import { PilotStepper } from './PilotStepper.jsx';
import { ProductHeroVisual } from './ProductHeroVisual.jsx';

const proofPoints = [
  { value: 'Simulation-first', label: 'fictional data only' },
  { value: 'Pilot next', label: 'single-ward pathway' },
  { value: '0', label: 'live patient records' }
];

const sourceLinks = [
  {
    label: 'NHS Clinical Entrepreneur Programme',
    href: 'https://nhscep.com/'
  },
  {
    label: 'NHS England Clinical Entrepreneur overview',
    href: 'https://www.england.nhs.uk/aac/what-we-do/how-can-the-aac-help-me/clinical-entrepreneur-training-programme/'
  },
  {
    label: 'NHS England acute patient flow guidance',
    href: 'https://www.england.nhs.uk/long-read/urgent-and-emergency-care-acute-patient-flow/'
  },
  {
    label: 'Olimpiu Simion public LinkedIn profile',
    href: 'https://uk.linkedin.com/in/olimpiu-simion-277467185'
  },
  {
    label: 'Mia Simion public LinkedIn profile',
    href: 'https://www.linkedin.com/in/mia-simion-msc-rn-1501ba66/'
  },
  {
    label: 'DTAC guidance',
    href: 'https://digital.nhs.uk/services/digital-technology-assessment-criteria-dtac'
  },
  {
    label: 'DCB0129',
    href: 'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/'
  },
  {
    label: 'DCB0160',
    href: 'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems/'
  },
  {
    label: 'DSPT',
    href: 'https://digital.nhs.uk/cyber-and-data-security/cyber-security-services/data-security-and-protection-toolkit'
  },
  {
    label: 'NHS supplier logo guidance',
    href: 'https://www.england.nhs.uk/nhsidentity/faq/can-suppliers-to-the-nhs-use-the-nhs-identity/'
  }
];

export function SafeFlowPitch({ onOpenPrototype }) {
  return (
    <main className="pitch-site">
      <section className="pitch-hero" aria-labelledby="pitch-title">
        <nav className="pitch-nav" aria-label="SafeFlow promotion">
          <a className="pitch-brand" href="#top" aria-label="SafeFlow home">
            <span className="pitch-mark" aria-hidden="true">SF</span>
            <span>SafeFlow</span>
          </a>
          <div className="pitch-links">
            <a href="#modules">Modules</a>
            <a href="#pathway">Pathway</a>
            <a href="#pilot">Pilot</a>
            <a href="#assurance">Assurance</a>
            <a href="#cep-brief">Brief</a>
            <a href="#team">Team</a>
            <button className="pitch-nav-action" onClick={onOpenPrototype} type="button">
              <PlayCircle aria-hidden="true" size={18} />
              Prototype
            </button>
          </div>
        </nav>

        <div className="hero-layout" id="top">
          <div className="hero-content">
            <p className="pitch-eyebrow">Nurse-led ward safety workflow</p>
            <h1 id="pitch-title">Make ward risk visible before escalation is missed.</h1>
            <p className="hero-lede">
              SafeFlow brings readiness checks, risk signals, escalation prompts and audit
              learning into one simulation-first workflow for ward teams.
            </p>
            <div className="creator-strip" aria-label="SafeFlow contributors">
              <span>Primary creator: Olimpiu &quot;Oli&quot; Simion</span>
              <span>Clinical contributor: Mihaela &quot;Mia&quot; Simion</span>
            </div>
            <div className="hero-actions">
              <a className="pitch-primary-action" href="#cep-brief">
                Open CEP brief
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a className="pitch-secondary-action light" href="#pilot">
                View pilot pathway
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          </div>

          <ProductHeroVisual />
        </div>
      </section>

      <section className="pitch-band pitch-highlights" aria-label="SafeFlow prototype highlights">
        <div className="pitch-section-inner metrics-row">
          {proofPoints.map((item) => (
            <article className="pitch-metric" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="pitch-section" id="modules" aria-labelledby="modules-title">
        <div className="pitch-section-inner section-intro">
          <div>
            <p className="pitch-eyebrow">Core modules</p>
            <h2 id="modules-title">Six surfaces, one simulation-first workflow.</h2>
            <p>
              SafeFlow keeps the product narrow on purpose. Each surface exists to support
              review, handover and a future governed pilot.
            </p>
          </div>
        </div>
        <div className="pitch-section-inner">
          <ModuleMosaic />
        </div>
      </section>

      <section className="pitch-band" id="pathway" aria-labelledby="pathway-title">
        <div className="pitch-section-inner split-section">
          <div>
            <p className="pitch-eyebrow">Clinical pathway</p>
            <h2 id="pathway-title">One workflow from readiness to learning.</h2>
            <p>
              The pathway stays human-led. SafeFlow surfaces the next check, the next concern and
              the next review point without taking clinical responsibility away from the team.
            </p>
          </div>
          <ClinicalPathwayVisual />
        </div>
      </section>

      <section className="pitch-section" id="pilot" aria-labelledby="pilot-title">
        <div className="pitch-section-inner">
          <PilotStepper onOpenPrototype={onOpenPrototype} />
        </div>
      </section>

      <section className="pitch-band" id="assurance">
        <div className="pitch-section-inner">
          <AssuranceGrid />
        </div>
      </section>

      <section className="pitch-section team-band" id="team" aria-labelledby="team-title">
        <div className="pitch-section-inner">
          <div className="section-kicker">
            <span className="pitch-eyebrow">Contributors</span>
          </div>
          <h2 id="team-title">Two contributors, one clear product direction.</h2>
          <div className="team-grid">
            <article className="team-card primary-contributor">
              <span className="contributor-rank">Primary creator</span>
              <h3>Created by Olimpiu &quot;Oli&quot; Simion</h3>
              <p>
                Oli leads SafeFlow product direction, build decisions and the public pitch.
                His role is kept deliberately concise so the page stays focused on the workflow.
              </p>
              <a href="https://uk.linkedin.com/in/olimpiu-simion-277467185" target="_blank" rel="noreferrer">
                Public LinkedIn profile
                <ExternalLink aria-hidden="true" size={16} />
              </a>
            </article>
            <article className="team-card">
              <span className="contributor-rank">Clinical contributor</span>
              <h3>Clinical contribution by Mihaela &quot;Mia&quot; Simion</h3>
              <p>
                Mia keeps the story grounded in nursing practice, safe escalation and handover
                boundaries. The public profile is reflected conservatively here.
              </p>
              <a href="https://www.linkedin.com/in/mia-simion-msc-rn-1501ba66/" target="_blank" rel="noreferrer">
                Public LinkedIn profile
                <ExternalLink aria-hidden="true" size={16} />
              </a>
            </article>
          </div>
        </div>
      </section>

      <CepBrief />

      <footer className="pitch-footer" aria-label="SafeFlow footer">
        <div className="pitch-section-inner footer-layout">
          <div>
            <strong>SafeFlow</strong>
            <p>
              SafeFlow is an early-stage simulation-first prototype. It does not claim NHS approval,
              clinical validation, live deployment or clinical decision-support status.
            </p>
          </div>
          <div className="source-list" aria-label="Sources reviewed">
            {sourceLinks.map((source) => (
              <a href={source.href} key={source.href} target="_blank" rel="noreferrer">
                {source.label}
                <ExternalLink aria-hidden="true" size={15} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
