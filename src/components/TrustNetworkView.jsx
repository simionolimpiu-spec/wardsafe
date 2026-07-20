import { useState } from 'react';
import {
  trustNetwork,
  getWardsForTrust,
  getPatientsForWard,
  getInterTrustJourneys,
  getPatientTimeline
} from '../data/trustNetwork/index.js';
import { compareWardDays } from '../domain/wardLongitudinalRollup.js';

function JourneyPatientTimeline({ patientId }) {
  const timeline = getPatientTimeline(patientId);
  if (!timeline) return null;
  return (
    <div className="trust-network-timeline" aria-label={`Fictional observation timeline for ${patientId}`}>
      <strong>Fictional patient {patientId} · observations ({timeline.trend})</strong>
      <div className="trust-network-obs-row">
        {timeline.points.map((pt) => (
          <span className="trust-network-obs" key={pt.order} title={`+${pt.offsetHours}h`}>
            <em>+{pt.offsetHours}h</em>
            RR {pt.respRate} · SpO₂ {pt.spo2}% · HR {pt.heartRate} · {pt.tempC}°C
          </span>
        ))}
      </div>
      <small>{timeline.trendNote}</small>
    </div>
  );
}

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

const WARD_TREND_DAYS = Object.freeze({ then: 1, now: 90 });
const WARD_TREND_PRESETS = Object.freeze([
  { value: '1-30', label: 'Day 1 vs Day 30', then: 1, now: 30 },
  { value: '1-90', label: 'Day 1 vs Day 90', then: 1, now: 90 },
  { value: '1-180', label: 'Day 1 vs Day 180', then: 1, now: 180 },
  { value: '1-365', label: 'Day 1 vs Day 365', then: 1, now: 365 },
  { value: '1-1300', label: 'Day 1 vs Day 1300', then: 1, now: 1300 }
]);
const WARD_OBSERVATION_LABELS = Object.freeze({
  respRate: 'Respiratory rate',
  spo2: 'SpO2',
  heartRate: 'Heart rate',
  systolicBp: 'Systolic BP',
  tempC: 'Temperature (C)'
});

function formatAverage(value) {
  return typeof value === 'number' ? value.toFixed(1) : '—';
}

function formatDelta(value) {
  if (typeof value !== 'number') return '—';
  if (value === 0) return '0.0';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}

function WardTrendRollup({ ward }) {
  const [dayA, setDayA] = useState(WARD_TREND_DAYS.then);
  const [dayB, setDayB] = useState(WARD_TREND_DAYS.now);
  const selectedPreset = WARD_TREND_PRESETS.find((preset) => preset.then === dayA && preset.now === dayB);
  const selectedValue = selectedPreset?.value ?? '1-90';
  const trend = compareWardDays(ward.id, dayA, dayB);

  function handlePresetChange(event) {
    const preset = WARD_TREND_PRESETS.find((option) => option.value === event.target.value) ?? WARD_TREND_DAYS;
    setDayA(preset.then);
    setDayB(preset.now);
  }

  return (
    <article className="trust-network-ward-trend" aria-label={`Ward trend (simulation) for ${ward.name}`}>
      <header className="trust-network-ward-trend-head">
        <div>
          <strong>Ward trend (simulation)</strong>
          <h4>{ward.name}</h4>
        </div>
        <div className="trust-network-ward-trend-range">
          <label htmlFor={`ward-trend-range-${ward.id}`}>Compare fictional days</label>
          <select
            id={`ward-trend-range-${ward.id}`}
            aria-label={`Compare fictional ward days for ${ward.name}`}
            onChange={handlePresetChange}
            value={selectedValue}
          >
            {WARD_TREND_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>{preset.label}</option>
            ))}
          </select>
          <span>{trend.dayA} -&gt; {trend.dayB}</span>
        </div>
      </header>
      <p className="trust-network-ward-trend-meta">
        Fictional cohort: {getPatientsForWard(ward.id).length} patients · average observation change
      </p>
      <table className="trust-network-ward-trend-table" aria-label={`Average observations for ${ward.name}`}>
        <thead>
          <tr>
            <th scope="col">Observation</th>
            <th scope="col">Then</th>
            <th scope="col">Now</th>
            <th scope="col">Delta</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(WARD_OBSERVATION_LABELS).map(([key, label]) => {
            const change = trend.averages[key];
            return (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{formatAverage(change.then)}</td>
                <td>{formatAverage(change.now)}</td>
                <td>{formatDelta(change.delta)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="trust-network-ward-trend-flags">
        <strong>Review-support flags:</strong> {trend.reviewFlagCount.then} then -&gt; {trend.reviewFlagCount.now} now
      </p>
      <small className="trust-network-ward-trend-note">{trend.trendNote}</small>
    </article>
  );
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
            <div className="trust-network-ward-trends">
              {getWardsForTrust(trust.id).map((ward) => (
                <WardTrendRollup key={ward.id} ward={ward} />
              ))}
            </div>
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
            <JourneyPatientTimeline patientId={journey.subjectPatientId} />
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
