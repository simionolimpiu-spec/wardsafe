import { ArrowRight, FileText, Printer, ShieldCheck, Target, UsersRound } from 'lucide-react';

export function CepBrief() {
  return (
    <section className="pitch-band brief-band" id="cep-brief" aria-labelledby="cep-brief-title">
      <div className="pitch-section-inner">
        <div className="brief-sheet">
          <header className="brief-header">
            <div className="brief-heading-copy">
              <div className="section-kicker">
                <FileText aria-hidden="true" size={22} />
                <p className="pitch-eyebrow">One-page brief</p>
              </div>
              <h2 id="cep-brief-title">SafeFlow NHS CEP Brief</h2>
              <p className="brief-lede">
                A short brief for assessors, mentors and reviewers. The printable version keeps the
                same public-safe boundaries as the website.
              </p>
            </div>
            <div className="brief-actions">
              <button className="pitch-primary-action" onClick={() => window.print()} type="button">
                <Printer aria-hidden="true" size={19} />
                Print brief
              </button>
              <a className="pitch-secondary-action light" href="#pilot">
                Pilot pathway
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          </header>

          <dl className="brief-facts" aria-label="SafeFlow brief facts">
            <div>
              <dt>Product</dt>
              <dd>SafeFlow</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Early-stage prototype</dd>
            </div>
            <div>
              <dt>Primary creator</dt>
              <dd>Olimpiu "Oli" Simion</dd>
            </div>
            <div>
              <dt>Clinical contributor</dt>
              <dd>Mihaela "Mia" Simion</dd>
            </div>
          </dl>

          <div className="brief-grid">
            <section className="brief-block">
              <div className="brief-block-heading">
                <Target aria-hidden="true" size={18} />
                <h3>Problem</h3>
              </div>
              <p>
                Ward flow pressure, escalation gaps and handover drift can hide risk.
              </p>
            </section>

            <section className="brief-block">
              <div className="brief-block-heading">
                <FileText aria-hidden="true" size={18} />
                <h3>What SafeFlow does</h3>
              </div>
              <p>
                Simulation-first checks, risk signals, escalation prompts and audit learning in one
                workflow.
              </p>
            </section>

            <section className="brief-block">
              <div className="brief-block-heading">
                <ShieldCheck aria-hidden="true" size={18} />
                <h3>CEP focus</h3>
              </div>
              <p>
                Mentorship on clinical safety, IP, pilot design, governance and evidence generation.
              </p>
            </section>

            <section className="brief-block">
              <div className="brief-block-heading">
                <UsersRound aria-hidden="true" size={18} />
                <h3>Boundary</h3>
              </div>
              <ul>
                <li>No live patient records</li>
                <li>No NHS logo or endorsement</li>
                <li>No deployment or outcome claim</li>
                <li>Clinical judgement stays with staff</li>
              </ul>
            </section>
          </div>

          <div className="brief-footer">
            <div>
              <strong>12-month goals</strong>
              <p>
                Finalise the claims register, hazard log, safety case outline and shadow-mode
                evaluation route before any broader outreach.
              </p>
            </div>
            <div>
              <strong>Public boundary</strong>
              <p>
                SafeFlow remains simulation-only until the relevant NHS governance steps are in
                place.
              </p>
            </div>
          </div>

          <p className="brief-disclaimer">
            Early-stage disclaimer: SafeFlow is a simulation-only prototype and is not currently a
            medical device or deployed clinical system.
          </p>
        </div>
      </div>
    </section>
  );
}
