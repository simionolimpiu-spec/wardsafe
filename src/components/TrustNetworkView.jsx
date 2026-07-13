import {
  trustNetwork,
  getWardsForTrust,
  getPatientsForWard,
  getInterTrustJourneys
} from '../data/trustNetwork/index.js';

const OUTCOME_LABELS = {
  'returned-to-james-paget': 'Returns to James Paget',
  'discharge-with-package-of-care': 'Discharge with package of care'
};

function trustShortName(trustId) {
  const trust = trustNetwork.trusts.find((t) => t.id === trustId);
  return trust ? trust.shortName : trustId;
}

function trustPatientCount(trustId) {
  return getWardsForTrust(trustId).reduce((total, ward) => total + getPatientsForWard(ward.id).length, 0);
}

export function TrustNetworkView() {
  const journeys = getInterTrustJourneys();

  return (
    <section className="review-report-section trust-network-view" aria-label="Two-Trust Network">
      <div className="section-heading">
        <div>
          <h2>Two-Trust Network (simulation)</h2>
          <p>{trustNetwork.boundaryNote}</p>
        </div>
      </div>

      <div className="review-report-summary-grid">
        {trustNetwork.trusts.map((trust) => (
          <article className="review-report-summary-card" key={trust.id}>
            <span>{trust.role}</span>
            <strong>{trust.name}</strong>
            <small>
              {getWardsForTrust(trust.id).length} wards · {trustPatientCount(trust.id)} fictional patients
            </small>
          </article>
        ))}
      </div>

      <h3>Inter-trust handover journeys</h3>
      <p className="trust-network-note">
        Fictional journeys showing how a handover between the two trusts would function, how the health plan
        continues, and whether the patient returns to James Paget or moves to packages of care / discharge.
        Simulation-only. Human review required.
      </p>

      <div className="trust-network-journeys">
        {journeys.map((journey) => (
          <article className="trust-network-journey" key={journey.id}>
            <header className="trust-network-journey-head">
              <h4>{journey.title}</h4>
              <span className="trust-network-outcome" data-outcome={journey.outcome}>
                {OUTCOME_LABELS[journey.outcome] ?? journey.outcome}
              </span>
            </header>
            <p className="trust-network-summary">{journey.summary}</p>
            <ol className="trust-network-segments">
              {journey.segments.map((segment) => (
                <li className="trust-network-segment" key={`${journey.id}-${segment.order}`}>
                  <span className="trust-network-chip" data-trust={segment.trustId}>
                    {trustShortName(segment.trustId)}
                  </span>
                  <div className="trust-network-segment-body">
                    <strong>
                      {segment.wardName} <em>· {segment.stage}</em>
                    </strong>
                    <small>{segment.handoverNote}</small>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
