import { ArrowRight, CircleAlert, FileText, ShieldCheck, Waypoints } from 'lucide-react';
import { CepBrief } from './components/CepBrief.jsx';
import { ClinicalPathwayVisual } from './components/ClinicalPathwayVisual.jsx';
import { InteractiveDashboard } from './components/InteractiveDashboard.jsx';
import { ProductHeroVisual } from './components/ProductHeroVisual.jsx';

const governancePoints = [
  'Simulation-first workflow with no patient data shown',
  'Prepared for governance review before any pilot pathway',
  'Designed to support clinical judgement, not replace it'
];

const previewPoints = [
  'Readiness checks',
  'Risk signal review',
  'Escalation prompts',
  'Audit learning'
];

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="site-shell">
        <header className="site-header">
          <a className="site-brand" href="#top">
            <span aria-hidden="true" className="brand-mark">SF</span>
            <span className="brand-copy">
              <span className="brand-name">SafeFlow</span>
              <span className="brand-tag">Simulation-first ward safety workflow</span>
            </span>
          </a>
          <nav aria-label="Primary" className="site-nav">
            <a href="#product-preview">Product preview</a>
            <a href="#pilot-pathway">Pilot pathway</a>
            <a href="#cep-brief">CEP brief</a>
          </nav>
        </header>

        <main id="main-content">
          <section className="hero-band" id="top">
            <div className="hero-layout">
              <div className="hero-copy">
                <p className="eyebrow">Nurse-led ward safety workflow</p>
                <span className="simulation-label hero-badge">Simulation preview · stakeholder discovery</span>
                <h1>Make ward risk visible before escalation is missed.</h1>
                <p className="hero-intro">
                  SafeFlow is an early-stage digital safety platform for ward teams. It brings readiness
                  checks, risk signals, escalation prompts, and audit learning into one simulation-first
                  workflow so clinical teams can test safety processes before moving anywhere near live deployment.
                </p>
                <div className="hero-actions">
                  <a className="primary-link" href="#cep-brief">
                    Open CEP brief
                    <ArrowRight aria-hidden="true" size={18} />
                  </a>
                  <a className="secondary-link" href="#pilot-pathway">View pilot pathway</a>
                </div>
                <div className="hero-meta" role="list" aria-label="SafeFlow overview">
                  {governancePoints.map((item) => (
                    <div className="hero-meta-item" key={item} role="listitem">
                      <ShieldCheck aria-hidden="true" size={18} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ProductHeroVisual />
            </div>
          </section>

          <section aria-label="Simulation safety boundary" className="boundary-band">
            <div className="boundary-grid">
              <div className="boundary-callout">
                <div className="boundary-heading">
                  <ShieldCheck aria-hidden="true" size={20} />
                  <h3>Simulation preview</h3>
                </div>
                <p>
                  Fictional workflow only. No patient data shown. Not clinically validated.
                  Not for clinical decision-making.
                </p>
              </div>
              <div className="boundary-callout">
                <div className="boundary-heading">
                  <Waypoints aria-hidden="true" size={20} />
                  <h3>What this preview shows</h3>
                </div>
                <p>
                  Structured handover, discharge readiness, patient-safety signals, escalation prompts,
                  and audit learning for workflow discovery conversations.
                </p>
              </div>
              <div className="boundary-callout">
                <div className="boundary-heading">
                  <CircleAlert aria-hidden="true" size={20} />
                  <h3>What this preview does not show</h3>
                </div>
                <p>
                  Clinical validation, live NHS integration, real ML-backed risk modelling, or
                  deployment-ready clinical decision support.
                </p>
              </div>
            </div>
          </section>

          <section className="site-section" id="product-preview">
            <div className="section-intro">
              <p className="eyebrow">Interactive product preview</p>
              <h2>One calm workspace for readiness, signals, escalation, and learning.</h2>
              <p>
                The preview below uses fictional, simulation-only content to show how SafeFlow could make
                ward pressure visible without leaning on alarm-heavy dashboards or overclaiming clinical capability.
              </p>
              <div className="inline-list" role="list" aria-label="Preview features">
                {previewPoints.map((item) => (
                  <span className="inline-pill" key={item} role="listitem">{item}</span>
                ))}
              </div>
            </div>
            <InteractiveDashboard />
          </section>

          <section className="site-section site-section-alt" id="pilot-pathway">
            <div className="section-intro">
              <p className="eyebrow">Pilot pathway</p>
              <h2>Trace the route from bedside observation to audit learning.</h2>
              <p>
                This pathway is designed for governance review and simulation walk-throughs. Each step shows
                what the workflow captures, what it avoids, and how SafeFlow keeps the clinician in charge.
              </p>
            </div>
            <ClinicalPathwayVisual />
          </section>

          <section className="site-section" id="cep-brief">
            <div className="section-intro">
              <p className="eyebrow">CEP brief</p>
              <h2>Summarise the early-stage product case without overstating readiness.</h2>
              <p>
                This brief keeps the language governance-safe: early-stage, simulation-first, mapped against
                ward workflow needs, and prepared for review before any live deployment decision.
              </p>
            </div>
            <CepBrief />
          </section>
        </main>

        <footer className="site-footer">
          <div>
            <strong>SafeFlow</strong>
            <p>
              Early-stage digital health product preview for simulation, governance review,
              and workflow validation.
            </p>
          </div>
          <div className="footer-note">
            <FileText aria-hidden="true" size={18} />
            <p>No patient data shown. No NHS endorsement claimed. Human review remains essential.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
