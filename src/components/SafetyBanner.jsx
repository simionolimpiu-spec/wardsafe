import { ShieldCheck } from 'lucide-react';

export function SafetyBanner() {
  return (
    <section className="safety-banner" aria-label="Simulation safety boundary">
      <ShieldCheck aria-hidden="true" size={22} />
      <div>
        <strong>Simulation only</strong>
        <span>No live patient data, no NHS endorsement, no prescribing or diagnosis.</span>
      </div>
    </section>
  );
}
