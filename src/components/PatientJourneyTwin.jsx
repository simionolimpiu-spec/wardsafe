import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ALL_WARDS, TRUSTS } from '../data/trustNetwork/trusts.js';
import {
  buildEpisodes,
  compareDays,
  getPatientDay
} from '../domain/longitudinalJourney.js';

const DEFAULT_PATIENT_ID = 'SF-TL-001';
const DEFAULT_LATEST_DAY = 1300;
const MAX_SPARKLINE_POINTS = 80;
const WARD_BY_ID = new Map(ALL_WARDS.map((ward) => [ward.id, ward]));
const TRUST_BY_ID = new Map(TRUSTS.map((trust) => [trust.id, trust]));

const OBSERVATION_DEFINITIONS = Object.freeze([
  { key: 'respRate', label: 'Respiratory rate', unit: 'breaths/min', color: 'var(--sf-blue)' },
  { key: 'spo2', label: 'Oxygen saturation', unit: '%', color: 'var(--sf-green)' },
  { key: 'heartRate', label: 'Heart rate', unit: 'beats/min', color: 'var(--sf-amber)' },
  { key: 'systolicBp', label: 'Systolic blood pressure', unit: 'mmHg', color: 'var(--sf-blue-deep)' },
  { key: 'tempC', label: 'Temperature', unit: 'C', color: 'var(--sf-red)' },
  { key: 'consciousness', label: 'Consciousness', unit: 'recorded text', color: 'var(--sf-grey-500)', dash: '5 3' }
]);

const PHASE_LABELS = Object.freeze({
  admission: 'Admission',
  wardMove: 'Ward',
  interTrustTransfer: 'Transfer',
  discharge: 'Discharge',
  community: 'Community',
  readmission: 'Readmission'
});

export function PatientJourneyTwin({ patient = null } = {}) {
  const patientId = typeof patient?.id === 'string' && patient.id.trim() ? patient.id.trim() : DEFAULT_PATIENT_ID;
  const latestDay = getLatestDayForPatient(patient);
  const [selectedDay, setSelectedDay] = useState(latestDay);
  const boundedSelectedDay = clampDay(selectedDay, latestDay);

  useEffect(() => {
    if (selectedDay !== boundedSelectedDay) {
      setSelectedDay(boundedSelectedDay);
    }
  }, [boundedSelectedDay, selectedDay]);

  const episodes = useMemo(() => buildEpisodes(patientId, latestDay), [latestDay, patientId]);
  const comparison = useMemo(
    () => compareDays(patientId, boundedSelectedDay, latestDay),
    [boundedSelectedDay, latestDay, patientId]
  );
  const patientDays = useMemo(
    () => Array.from({ length: latestDay }, (_, index) => getPatientDay(patientId, index + 1)),
    [latestDay, patientId]
  );
  const currentEpisode = episodes.find((episode) => (
    boundedSelectedDay >= episode.startDay
      && (episode.endDay === null || boundedSelectedDay <= episode.endDay)
  )) ?? episodes[episodes.length - 1];

  function selectDay(day) {
    setSelectedDay(clampDay(day, latestDay));
  }

  return (
    <section className="workflow-view twin-view" aria-labelledby="patient-journey-twin-title">
      <div className="section-heading twin-header">
        <Sparkles aria-hidden="true" size={22} />
        <div>
          <p className="eyebrow">Simulation longitudinal review</p>
          <h2 id="patient-journey-twin-title">Patient Journey Twin</h2>
          <p className="twin-boundary-note">
            Simulation-only longitudinal journey for review and learning. Fictional patient data. Not a live
            clinical record. Human review required.
          </p>
          <div className="twin-summary-strip" aria-label="Patient Journey Twin safety summary">
            <span className="twin-summary-chip">Fictional patient ID: {patientId}</span>
            <span className="twin-summary-chip">{latestDay} journey days</span>
            <span className="twin-summary-chip">Simulation-only</span>
            <span className="twin-summary-chip">No live patient data</span>
          </div>
        </div>
      </div>

      <section className="twin-patient-card twin-longitudinal-card" aria-label="Longitudinal journey review">
        <header className="twin-patient-heading">
          <div>
            <p className="eyebrow">Fictional journey record</p>
            <h3>{patientId}</h3>
            <p>Review the journey one day at a time. The latest day is the comparison point labelled now.</p>
          </div>
          <span className="twin-simulation-badge">Human review required</span>
        </header>

        <div className="twin-day-scrubber" aria-label="Journey day controls">
          <div className="twin-day-scrubber-heading">
            <div>
              <label htmlFor="journey-day-scrubber">Journey day</label>
              <p id="journey-day-scrubber-help">Use the slider, arrow keys, or the previous and next controls.</p>
            </div>
            <output aria-live="polite" htmlFor="journey-day-scrubber">
              Day {boundedSelectedDay} of {latestDay}
            </output>
          </div>
          <div className="twin-day-scrubber-controls">
            <button
              aria-label="Previous journey day"
              disabled={boundedSelectedDay === 1}
              onClick={() => selectDay(boundedSelectedDay - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
              Previous
            </button>
            <input
              aria-describedby="journey-day-scrubber-help"
              aria-label="Journey day scrubber"
              aria-valuetext={`Day ${boundedSelectedDay} of ${latestDay}`}
              data-testid="journey-day-scrubber"
              id="journey-day-scrubber"
              max={latestDay}
              min="1"
              onChange={(event) => selectDay(Number(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  selectDay(boundedSelectedDay - 1);
                } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  selectDay(boundedSelectedDay + 1);
                } else if (event.key === 'Home') {
                  event.preventDefault();
                  selectDay(1);
                } else if (event.key === 'End') {
                  event.preventDefault();
                  selectDay(latestDay);
                } else if (event.key === 'PageUp') {
                  event.preventDefault();
                  selectDay(boundedSelectedDay - 30);
                } else if (event.key === 'PageDown') {
                  event.preventDefault();
                  selectDay(boundedSelectedDay + 30);
                }
              }}
              step="1"
              type="range"
              value={boundedSelectedDay}
            />
            <button
              aria-label="Next journey day"
              disabled={boundedSelectedDay === latestDay}
              onClick={() => selectDay(boundedSelectedDay + 1)}
              type="button"
            >
              Next
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
          <p className="twin-selected-episode" aria-live="polite">
            Current chapter: <strong>{formatPhase(currentEpisode?.phase)}</strong> at {formatLocation(currentEpisode?.location, currentEpisode?.phase)}
          </p>
        </div>

        <nav className="twin-chapter-nav" aria-label="Journey chapters">
          <p className="twin-subsection-label">Episode chapters</p>
          <div className="twin-chapter-strip">
            {episodes.map((episode, index) => {
              const isCurrent = episode.episodeId === currentEpisode?.episodeId;
              const previousEpisode = episodes[index - 1];
              const interTrust = episode.phase === 'interTrustTransfer'
                || episode.trustId !== previousEpisode?.trustId;
              const endDay = episode.endDay ?? latestDay;

              return (
                <button
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${formatPhase(episode.phase)}, ${formatDayRange(episode.startDay, endDay)}, ${formatLocation(episode.location, episode.phase)}`}
                  className={`twin-chapter${isCurrent ? ' twin-chapter--current' : ''}`}
                  data-phase={episode.phase}
                  key={episode.episodeId}
                  onClick={() => selectDay(episode.startDay)}
                  type="button"
                >
                  <span className="twin-chapter-title">{formatPhase(episode.phase)}</span>
                  <span className="trust-network-chip twin-chapter-trust" data-trust={episode.trustId}>
                    {trustShortName(episode.trustId)}
                  </span>
                  <span className="twin-chapter-range">{formatDayRange(episode.startDay, endDay)}</span>
                  {interTrust && <small>Inter-trust segment</small>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="twin-review-grid">
          <ThenNowPanel comparison={comparison} />
          <TrendPanel
            latestDay={latestDay}
            patientDays={patientDays}
            selectedDay={boundedSelectedDay}
          />
        </div>
      </section>
    </section>
  );
}

function ThenNowPanel({ comparison }) {
  const observationRows = OBSERVATION_DEFINITIONS.map((definition) => {
    const change = comparison.observations[definition.key];
    return { ...definition, ...change };
  });

  return (
    <section className="twin-then-now-panel" aria-labelledby="twin-then-now-title">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Review comparison</p>
          <h3 id="twin-then-now-title">Then vs now</h3>
        </div>
        <span className="twin-panel-context">Day {comparison.dayA} vs day {comparison.dayB}</span>
      </div>

      <p className="twin-review-note">{comparison.trendNote}</p>

      <dl className="twin-location-phase-grid">
        <div>
          <dt>Location then</dt>
          <dd>{formatLocation(comparison.location.then)}</dd>
        </div>
        <div>
          <dt>Location now</dt>
          <dd>{formatLocation(comparison.location.now)}</dd>
        </div>
        <div>
          <dt>Phase then</dt>
          <dd>{comparison.episodePhase.then}</dd>
        </div>
        <div>
          <dt>Phase now</dt>
          <dd>{comparison.episodePhase.now}</dd>
        </div>
      </dl>

      <div className="twin-observation-table-wrap">
        <table className="twin-observation-table" aria-label="Then versus now observations">
          <thead>
            <tr>
              <th scope="col">Observation</th>
              <th scope="col">Then</th>
              <th scope="col">Now</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {observationRows.map((observation) => {
              const direction = getDirection(observation);
              return (
                <tr key={observation.key}>
                  <th scope="row">
                    {observation.label}
                    <small>{observation.unit}</small>
                  </th>
                  <td>{formatObservationValue(observation.then)}</td>
                  <td>{formatObservationValue(observation.now)}</td>
                  <td>
                    <span
                      aria-label={`${direction.label} ${formatDelta(observation.delta)}`}
                      className={`twin-delta twin-delta--${direction.className}`}
                    >
                      <span aria-hidden="true">{direction.arrow}</span> {formatDelta(observation.delta)}
                    </span>
                    <small className="twin-change-note">{buildChangeNote(observation)}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrendPanel({ latestDay, patientDays, selectedDay }) {
  return (
    <section className="twin-trend-panel" aria-labelledby="twin-trends-title">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Across the scrubbed range</p>
          <h3 id="twin-trends-title">Observation trends</h3>
        </div>
        <span className="twin-panel-context">Text values included</span>
      </div>
      <div className="twin-trend-list">
        {OBSERVATION_DEFINITIONS.map((definition) => {
          const series = patientDays.map((day) => ({ day: day.dayNumber, value: day.observations[definition.key] }));
          return (
            <article className="twin-trend-card" key={definition.key}>
              <div className="twin-trend-card-heading">
                <strong>{definition.label}</strong>
                <span>{definition.unit}</span>
              </div>
              <Sparkline
                color={definition.color}
                dash={definition.dash}
                label={definition.label}
                latestDay={latestDay}
                selectedDay={selectedDay}
                series={series}
              />
              <p className="twin-sparkline-values">
                Values: {formatSeriesValues(series, selectedDay, latestDay)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Sparkline({ color, dash = 'none', label, latestDay, selectedDay, series }) {
  const sampledSeries = sampleSeries(series, MAX_SPARKLINE_POINTS);
  const values = sampledSeries.map((point) => typeof point.value === 'number' ? point.value : 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 240;
  const height = 64;
  const padding = 8;
  const points = sampledSeries
    .map((point, index) => {
      const numericValue = typeof point.value === 'number' ? point.value : 0;
      const x = padding + (index / Math.max(sampledSeries.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((numericValue - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const selectedPoint = series.find((point) => point.day === selectedDay) ?? series[series.length - 1];
  const selectedIndex = sampledSeries.findIndex((point) => point.day === selectedPoint?.day);
  const selectedX = selectedIndex >= 0
    ? padding + (selectedIndex / Math.max(sampledSeries.length - 1, 1)) * (width - padding * 2)
    : null;

  return (
    <svg
      aria-label={`${label} trend across day 1 to day ${latestDay}`}
      className="twin-sparkline"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      style={{ '--sparkline-color': color }}
    >
      <line className="twin-sparkline-baseline" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
      <polyline className="twin-sparkline-line" fill="none" points={points} style={{ strokeDasharray: dash }} />
      {selectedX !== null && (
        <line
          aria-hidden="true"
          className="twin-sparkline-marker"
          x1={selectedX}
          x2={selectedX}
          y1={padding}
          y2={height - padding}
        />
      )}
    </svg>
  );
}

function formatPhase(phase) {
  return PHASE_LABELS[phase] ?? 'Journey phase';
}

function formatLocation(location, phase = null) {
  if (phase === 'community') return 'Community follow-up';
  const ward = WARD_BY_ID.get(location?.wardId);
  if (ward?.name) return ward.name;
  const trust = TRUST_BY_ID.get(location?.trustId);
  return trust?.shortName ?? 'Simulation location';
}

function trustShortName(trustId) {
  return TRUST_BY_ID.get(trustId)?.shortName ?? trustId ?? 'Simulation trust';
}

function getLatestDayForPatient(patient) {
  const candidate = Number(patient?.latestDay ?? patient?.journeyDays);
  if (Number.isFinite(candidate) && candidate > 0) return Math.min(Math.floor(candidate), DEFAULT_LATEST_DAY);
  return DEFAULT_LATEST_DAY;
}

function getDirection(observation) {
  if (typeof observation.delta === 'number') {
    if (observation.delta > 0) return { className: 'up', label: 'Higher', arrow: '↑' };
    if (observation.delta < 0) return { className: 'down', label: 'Lower', arrow: '↓' };
    return { className: 'same', label: 'Same', arrow: '→' };
  }
  if (Object.is(observation.then, observation.now)) return { className: 'same', label: 'Same', arrow: '→' };
  return { className: 'same', label: 'Text changed', arrow: '↔' };
}

function buildChangeNote(observation) {
  if (typeof observation.delta === 'number') {
    if (observation.delta === 0) {
      return 'No difference is recorded in this simulation window; use the row to support human review.';
    }
    const direction = observation.delta > 0 ? 'higher' : 'lower';
    return `Recorded value is ${direction} now by ${formatAbsolute(observation.delta)} ${observation.unit}; human review can consider the surrounding simulation context.`;
  }
  if (Object.is(observation.then, observation.now)) {
    return 'The same text is recorded on both simulation days; human review remains required.';
  }
  return 'Recorded text differs between the simulation days; compare the entries with human review.';
}

function formatObservationValue(value) {
  if (value === null || value === undefined || value === '') return 'Not recorded';
  return String(value);
}

function formatDelta(delta) {
  if (delta === null || delta === undefined) return 'Text change';
  if (delta === 0) return '0';
  return `${delta > 0 ? '+' : ''}${delta}`;
}

function formatAbsolute(value) {
  return Math.abs(Number(value)).toString();
}

function sampleSeries(series, maxPoints) {
  if (series.length <= maxPoints) return series;
  const step = (series.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => series[Math.round(index * step)]);
}

function formatSeriesValues(series, selectedDay, latestDay) {
  if (series.length === 0) return 'No values recorded.';
  const days = new Set([1, selectedDay, latestDay]);
  if (series.length <= 12) {
    series.forEach((point) => days.add(point.day));
  } else {
    const step = Math.max(1, Math.floor(series.length / 6));
    for (let day = 1; day <= latestDay; day += step) days.add(day);
  }

  return [...days]
    .filter((day) => day >= 1 && day <= latestDay)
    .sort((left, right) => left - right)
    .map((day) => {
      const point = series[day - 1];
      return `Day ${day}: ${formatObservationValue(point?.value)}`;
    })
    .join(' | ');
}

function formatDayRange(startDay, endDay) {
  return startDay === endDay ? `Day ${startDay}` : `Days ${startDay}-${endDay}`;
}

function clampDay(value, latestDay) {
  const safeLatestDay = Math.max(1, Math.floor(Number(latestDay) || 1));
  const safeDay = Math.floor(Number(value) || 1);
  return Math.min(Math.max(safeDay, 1), safeLatestDay);
}
