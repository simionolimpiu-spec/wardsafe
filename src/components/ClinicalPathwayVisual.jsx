const pathwaySteps = [
  {
    title: 'Readiness',
    detail: 'Checks before action',
    compactDetail: 'checks'
  },
  {
    title: 'Signal',
    detail: 'Surface the risk',
    compactDetail: 'signal'
  },
  {
    title: 'Escalate',
    detail: 'Prepare the handoff',
    compactDetail: 'SBAR'
  },
  {
    title: 'Audit',
    detail: 'Capture what changed',
    compactDetail: 'learn'
  }
];

export function ClinicalPathwayVisual({ compact = false }) {
  return (
    <section
      className={`clinical-pathway${compact ? ' clinical-pathway--compact' : ''}`}
      aria-label="SafeFlow clinical pathway"
    >
      <header className="clinical-pathway__header">
        <span className="clinical-pathway__eyebrow">Clinical pathway</span>
        <strong>Signal to learning</strong>
      </header>

      <ol className="clinical-pathway__steps">
        {pathwaySteps.map((step, index) => (
          <li key={step.title}>
            <span className="clinical-pathway__index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{step.title}</strong>
            <span>{compact ? step.compactDetail : step.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
