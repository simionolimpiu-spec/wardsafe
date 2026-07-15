import {
  trustNetwork,
  getWardsForTrust,
  getPatientsForWard,
  getInterTrustJourneys
} from '../data/trustNetwork/index.js';

const OUTCOME_LABELS = {
  'returned-to-james-paget': 'Returns to James Paget',
  'discharge-with-package-of-care': 'Discharge with package of care',
  'continues-at-new-trust': 'Care continues at new trust',
  'returned-home-with-learning-copy': 'Returns home + learning copy'
};

const JOURNEY_TYPE_LABELS = {
  'inter-trust-handover': 'Inter-trust handover',
  'specialist-transfer': 'Specialist transfer',
  relocation: 'Relocation',
  'temporary-visitor': 'Away from home'
};

function trustPatientCount(trustId) {
  return getWardsForTrust(trustId).reduce((total, ward) => total + getPatientsForWard(ward.id).length, 0);
}

export function TrustNetworkView() {
  const journeys = getInterTrustJourneys();

  return (
    <section className="review-report-section trust-network-view" aria-label="England Trust Network">
      <div className="section-heading">
        <div>
          <h2>England Trust Network (simulation)</h2>
          <p>{trustNetwork.boundaryNote}</p>
        </div>
      </div>

      <div className="review-report-summary-grid">
        {trustNetwork.trusts.map((trust) => (
          <article className="review-report-summary-card" key={trust.id}>
            <span>{trust.region} · {trust.role}</span>
            <strong>{trust.name}</strong>
            <small>
              {getWardsForTrust(trust.id).length} wards · {trustPatientCount(trust.id)} fictional patients · source: {trust.wardSource}
            </small>
          </article>
        ))}
      </div>

      <h3>Portable patient journeys across trusts</h3>
      <p className="trust-network-note">
        Fictional journeys showing how a patient's history travels with them across trusts — on relocation, a
        temporary visit, being found away from home, or a specialist transfer — how the health plan continues,
        and how a <strong>learning copy returns to the originating trust for teaching</strong>. Simulation-only.
        Human review required. Not a live cross-trust record.
      </p>

      <div className="trust-network-journeys">
        {journeys.map((journey) => (
          <article className="trust-network-journey" key={journey.id}>
            <header className="trust-network-journey-head">
              <div>
                <span className="trust-network-type">{JOURNEY_TYPE_LABELS[journey.journeyType] ?? journey.journeyType}</span>
                <h4>{journey.title}</h4>
              </div>
              <span className="trust-network-outcome" data-outcome={journey.outcome}>
                {OUTCOME_LABELS[journey.outcome] ?? journey.outcome}
              </span>
            </header>
            <p className="trust-network-summary">{journey.summary}</p>
            <ol className="trust-network-segments">
              {journey.segments.map((segment) => (
                <li className="trust-network-segment" key={`${journey.id}-${segment.order}`}>
                  <span className="trust-network-chip" data-trust={segment.trustId}>
                    {segment.trustShortName}
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
            <div className="trust-network-learning">
              <strong>Learning copy → {journey.learningRecord.returnedToTrustName}</strong>
              <small>{journey.learningRecord.summary}</small>
              <ul>
                {journey.learningRecord.teachingPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
