import { ShieldCheck } from 'lucide-react';

export function SafetyBanner() {
  return (
    <section className="safety-banner" id="simulation-safety-note" aria-label="Simulation safety boundary">
      <ShieldCheck aria-hidden="true" size={22} />
      <div>
        <strong>Simulation only</strong>
        <span>
          Public preview boundary. Fictional patient data only. Not clinical advice, not diagnosis, not prescribing, not for live clinical use, and not live NHS deployment. Not affiliated with or endorsed by the NHS. Human review required.
        </span>
      </div>
    </section>
  );
}
