import { Activity, BarChart3, FileCheck2, ShieldCheck } from 'lucide-react';

const signalRows = [
  {
    title: 'Readiness check',
    detail: 'Open'
  },
  {
    title: 'Escalation prompt',
    detail: 'Queued'
  },
  {
    title: 'Audit learning',
    detail: 'Ready'
  }
];

export function InteractiveDashboard() {
  return (
    <section className="interactive-dashboard" aria-label="SafeFlow dashboard preview">
      <header className="interactive-dashboard__header">
        <div>
          <span className="interactive-dashboard__eyebrow">Ward board</span>
          <strong>Simulation view</strong>
        </div>
        <span className="interactive-dashboard__badge">Fictional data only</span>
      </header>

      <div className="interactive-dashboard__stats" aria-hidden="true">
        <span>
          <Activity aria-hidden="true" size={14} />
          Signals
        </span>
        <span>
          <BarChart3 aria-hidden="true" size={14} />
          Flow
        </span>
        <span>
          <FileCheck2 aria-hidden="true" size={14} />
          Audit
        </span>
      </div>

      <div className="interactive-dashboard__list">
        {signalRows.map((row, index) => (
          <article className="interactive-dashboard__row" key={row.title}>
            <span className="interactive-dashboard__index">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{row.title}</strong>
              <p>{row.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <footer className="interactive-dashboard__footer" aria-hidden="true">
        <span>
          <ShieldCheck aria-hidden="true" size={14} />
          Human review
        </span>
        <span>Open in prototype</span>
      </footer>
    </section>
  );
}
