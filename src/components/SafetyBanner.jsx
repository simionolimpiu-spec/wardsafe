import { ShieldCheck } from 'lucide-react';

export function SafetyBanner() {
  return (
    <section className="safety-banner" aria-label="Simulation safety boundary">
      <ShieldCheck aria-hidden="true" size={22} />
      <div>
        <strong>Simulation only</strong>
        <span>
          Public preview boundary. Fictional patient data only. Not clinical advice, not diagnosis, not prescribing, not live NHS deployment. Human review required.
        </span>
      </div>
    </section>
  );
}
