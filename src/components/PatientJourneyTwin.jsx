import {
  Activity,
  ClipboardList,
  FlaskConical,
  MessageSquare,
  Sparkles,
  UserRound
} from 'lucide-react';
import { buildPatientTimelineCollection } from '../domain/patientTimeline.js';
import { patientTimelineFixtures } from '../data/patientTimelineFixtures.js';

const PATIENT_TIMELINES = buildPatientTimelineCollection(patientTimelineFixtures);

const ENTRY_META = {
  vital: {
    label: 'Observation',
    icon: Activity,
    className: 'twin-entry--vital'
  },
  lab: {
    label: 'Lab result',
    icon: FlaskConical,
    className: 'twin-entry--lab'
  },
  review_cue: {
    label: 'Review cue',
    icon: MessageSquare,
    className: 'twin-entry--review_cue'
  },
  audit_event: {
    label: 'Audit event',
    icon: ClipboardList,
    className: 'twin-entry--audit_event'
  }
};

export function PatientJourneyTwin({ patient = null } = {}) {
  const hasTimelines = PATIENT_TIMELINES.length > 0;

  return (
    <section className="workflow-view twin-view" aria-labelledby="patient-journey-twin-title">
      <div className="section-heading twin-header">
        <Sparkles aria-hidden="true" size={22} />
        <div>
          <p className="eyebrow">Simulation Patient Twin</p>
          <h2 id="patient-journey-twin-title">Patient Journey Twin</h2>
          <p className="twin-boundary-note">
            Patient Journey Twin / Simulation Patient Twin — simulation-only timeline for review and
            learning. Not a live clinical record. Human review required.
          </p>
          <div className="twin-summary-strip" aria-label="Twin preview summary">
            <span className="twin-summary-chip">{PATIENT_TIMELINES.length} fictional patient timelines</span>
            <span className="twin-summary-chip">Simulation-only</span>
            <span className="twin-summary-chip">No live patient data</span>
          </div>
          {patient && (
            <p className="twin-context">
              Current board selection: <strong>{patient.id}</strong> <span>{patient.name}</span>.
              The timelines below remain separate fictional demo sequences.
            </p>
          )}
        </div>
      </div>

      {!hasTimelines ? (
        <p className="empty-state">No patient timeline is available yet.</p>
      ) : (
        <div className="twin-patients">
          {PATIENT_TIMELINES.map((timeline) => (
            <section
              className="twin-patient-card"
              key={timeline.patientId}
              aria-labelledby={`twin-patient-${timeline.patientId}`}
            >
              <div className="section-heading twin-patient-heading">
                <UserRound aria-hidden="true" size={18} />
                <div>
                  <h3 id={`twin-patient-${timeline.patientId}`}>{timeline.patientName}</h3>
                  <p>
                    {timeline.patientRef} · {timeline.wardName}
                  </p>
                </div>
                <span className="twin-simulation-badge">{timeline.simulationLabel}</span>
              </div>

              <dl className="twin-patient-meta">
                <div>
                  <dt>Source</dt>
                  <dd>{timeline.source}</dd>
                </div>
                <div>
                  <dt>Clinical use</dt>
                  <dd>{timeline.clinicalUse}</dd>
                </div>
                <div>
                  <dt>Timeline entries</dt>
                  <dd>{timeline.timeline.length}</dd>
                </div>
              </dl>

              <div className="twin-note-grid">
                <NoteBlock title="Missing information" items={timeline.missingInformation} />
                <NoteBlock title="Limitations" items={timeline.limitations} />
              </div>

              <ol className="timeline twin-timeline" aria-label={`${timeline.patientName} timeline`}>
                {timeline.timeline.map((entry) => (
                  <TimelineEntry key={`${timeline.patientId}-${entry.order}-${entry.type}`} entry={entry} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function TimelineEntry({ entry }) {
  const meta = ENTRY_META[entry.type] ?? {
    label: 'Simulation entry',
    icon: Activity,
    className: 'twin-entry--unknown'
  };
  const Icon = meta.icon;

  return (
    <li className={`twin-entry ${meta.className}`}>
      <Icon aria-hidden="true" size={16} />
      <div className="twin-entry-body">
        <div className="twin-entry-header">
          <div>
            <strong>{entry.label}</strong>
            <p className="twin-entry-type">{meta.label}</p>
          </div>
          <span className="twin-entry-badge">{entry.simulationLabel}</span>
        </div>

        <p>{entry.detail}</p>

        <small className="twin-entry-meta">
          <span>{formatTimelineTimestamp(entry.timestamp)}</span>
          <span>{entry.type.replace(/_/g, ' ')}</span>
          <span>{entry.source}</span>
        </small>

        <div className="twin-entry-notes">
          <NoteBlock title="Missing information" items={entry.missingInformation} compact />
          <NoteBlock title="Limitations" items={entry.limitations} compact />
        </div>
      </div>
    </li>
  );
}

function NoteBlock({ title, items = [], compact = false }) {
  const notes = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className={`twin-note-block${compact ? ' twin-note-block--compact' : ''}`}>
      <strong>{title}</strong>
      {notes.length === 0 ? (
        <p>None recorded.</p>
      ) : (
        <ul>
          {notes.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTimelineTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}
