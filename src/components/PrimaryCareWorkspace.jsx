import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  FileText,
  Inbox,
  Link2,
  Users
} from 'lucide-react';
import { buildPrimaryCareReviewCues, getPrimaryCareTrafficState } from '../domain/primaryCareReview.js';

const viewConfiguration = {
  'practice-overview': {
    title: 'Primary Care Review Board',
    description: 'Structured review of simulated contact, continuity, referral and follow-up records.',
    filter: () => true
  },
  'contact-requests': {
    title: 'Contact Requests',
    description: 'Review the structured information recorded across online, telephone and walk-in contacts.',
    filter: () => true
  },
  continuity: {
    title: 'Continuity Review',
    description: 'Review simulated contacts where continuity has been requested or needs an owner recorded.',
    filter: (record) => record.continuityRequested
  },
  'results-follow-up': {
    title: 'Results Follow-up',
    description: 'Review acknowledgement and ownership fields for simulated results records.',
    filter: (record) => record.resultVisible
  },
  referrals: {
    title: 'Referral Readiness',
    description: 'Review whether the explicit background and workflow fields are complete before human review.',
    filter: (record) => record.referralPlanned
  },
  'primary-tasks': {
    title: 'Review Tasks',
    description: 'Consolidated documentation and workflow cues requiring a recorded human review.',
    filter: (record) => getPrimaryCareTrafficState(record) !== 'green'
  },
  coordination: {
    title: 'Care Coordination',
    description: 'Simulated continuity and follow-up ownership records requiring coordination.',
    filter: (record) => record.continuityRequested || !record.followUpOwnerRecorded
  }
};

const trafficLabels = {
  red: 'Documentation blocker',
  amber: 'Review required',
  green: 'Recorded fields complete'
};

export function PrimaryCareWorkspace({
  activeView,
  auditEvents,
  notes,
  onNoteChange,
  onSaveNote,
  onSelectRecord,
  scenario,
  selectedRecord,
  status,
  summary
}) {
  if (activeView === 'primary-reports') {
    return <PrimaryCareReport scenario={scenario} summary={summary} />;
  }

  if (activeView === 'primary-scenarios') {
    return <PrimaryCareScenarioView scenario={scenario} />;
  }

  if (activeView === 'primary-audit') {
    return <PrimaryCareAuditView auditEvents={auditEvents} />;
  }

  if (activeView === 'primary-settings') {
    return <PrimaryCareSettingsView />;
  }

  const configuration = viewConfiguration[activeView] ?? viewConfiguration['practice-overview'];
  const visibleRecords = scenario.contacts.filter(configuration.filter);
  const effectiveSelectedRecord = visibleRecords.find((record) => record.id === selectedRecord?.id)
    ?? visibleRecords[0]
    ?? selectedRecord;

  return (
    <section aria-label={configuration.title} className="primary-care-view">
      <header className="board-header primary-care-heading">
        <div>
          <p className="eyebrow">{scenario.practiceName} · simulated pathway</p>
          <h2>{configuration.title}</h2>
          <p>{configuration.description}</p>
        </div>
        <TrafficLegend />
      </header>

      {activeView === 'practice-overview' && <PrimaryCareSummary summary={summary} />}

      <div className="primary-care-layout">
        <section aria-label="Primary care contact records" className="ward-board primary-care-board">
          <div className="primary-care-table-wrap">
            <table aria-label="Primary care contact review list" className="primary-care-table">
              <thead>
                <tr>
                  <th scope="col">Simulated patient</th>
                  <th scope="col">Request</th>
                  <th scope="col">Channel</th>
                  <th scope="col">Recorded owner</th>
                  <th scope="col">Next review</th>
                  <th scope="col">Workflow status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => {
                  const traffic = getPrimaryCareTrafficState(record);
                  return (
                    <tr className={effectiveSelectedRecord?.id === record.id ? 'selected-row' : ''} key={record.id}>
                      <td>
                        <button onClick={() => onSelectRecord(record.id)} type="button">
                          <strong>{record.id}</strong>
                          <span>{record.label}</span>
                        </button>
                      </td>
                      <td>{record.requestType}</td>
                      <td>{record.channel}<small>{record.receivedAt}</small></td>
                      <td>{record.assignedTo}</td>
                      <td>{record.nextReview}</td>
                      <td><TrafficStatus traffic={traffic} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visibleRecords.length === 0 && (
            <p className="primary-care-empty">No simulated records match this pathway view.</p>
          )}
        </section>

        {effectiveSelectedRecord && (
          <PrimaryCareDetail
            note={notes[effectiveSelectedRecord.id] ?? ''}
            onNoteChange={(value) => onNoteChange(effectiveSelectedRecord.id, value)}
            onSaveNote={() => onSaveNote(effectiveSelectedRecord.id)}
            record={effectiveSelectedRecord}
          />
        )}
      </div>
      {status && <p className="status-message" role="status">{status}</p>}
    </section>
  );
}

function PrimaryCareSummary({ summary }) {
  const cards = [
    { icon: Inbox, label: 'Contact records', value: summary.totalContacts },
    { icon: AlertTriangle, label: 'Documentation blockers', value: summary.documentationBlockers, className: 'summary-card-danger' },
    { icon: FileClock, label: 'Review items', value: summary.reviewItems, className: 'summary-card-warning' },
    { icon: Users, label: 'Continuity requests', value: summary.continuityRequests },
    { icon: CheckCircle2, label: 'Recorded fields complete', value: summary.completeRecords, className: 'summary-card-success' }
  ];

  return (
    <section aria-label="Primary care pathway summary" className="board-summary-cards">
      {cards.map(({ className = '', icon: Icon, label, value }) => (
        <article className={`summary-card ${className}`} key={label}>
          <span aria-hidden="true" className="summary-card-icon"><Icon size={18} /></span>
          <div><span>{label}</span><strong>{value}</strong></div>
        </article>
      ))}
    </section>
  );
}

function PrimaryCareDetail({ note, onNoteChange, onSaveNote, record }) {
  const cues = buildPrimaryCareReviewCues(record);
  const traffic = getPrimaryCareTrafficState(record);
  return (
    <aside aria-label={`Primary care review detail for ${record.id}`} className="patient-panel primary-care-detail">
      <header>
        <div><p>Simulated record</p><h2>{record.id}</h2><span>{record.label}</span></div>
        <TrafficStatus traffic={traffic} />
      </header>
      <p className="primary-care-boundary">
        Workflow documentation status only. This is not a clinical risk score. Human review required.
      </p>
      <dl className="primary-care-record-summary">
        <div><dt>Request</dt><dd>{record.requestType}</dd></div>
        <div><dt>Channel</dt><dd>{record.channel} at {record.receivedAt}</dd></div>
        <div><dt>Recorded owner</dt><dd>{record.assignedTo}</dd></div>
        <div><dt>Next review</dt><dd>{record.nextReview}</dd></div>
      </dl>
      <section aria-labelledby={`review-cues-${record.id}`}>
        <h3 id={`review-cues-${record.id}`}>Explainable review cues</h3>
        <ul className="primary-care-cue-list">
          {cues.map((cue) => (
            <li className={`primary-care-cue cue-${cue.traffic}`} key={cue.id}>
              <span aria-hidden="true" className={`traffic-dot traffic-${cue.traffic}`} />
              <div><strong>{cue.title}</strong><p>{cue.explanation}</p></div>
            </li>
          ))}
        </ul>
      </section>
      <div className="primary-care-note">
        <label htmlFor={`primary-care-note-${record.id}`}>Human review note</label>
        <textarea
          id={`primary-care-note-${record.id}`}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Record a simulated review note"
          rows="4"
          value={note}
        />
        <button onClick={onSaveNote} type="button"><ClipboardCheck aria-hidden="true" size={17} /> Save review note</button>
      </div>
    </aside>
  );
}

function TrafficLegend() {
  return (
    <div aria-label="Workflow traffic-light legend" className="traffic-legend" role="group">
      {Object.entries(trafficLabels).map(([traffic, label]) => (
        <span key={traffic}><span aria-hidden="true" className={`traffic-dot traffic-${traffic}`} />{label}</span>
      ))}
      <small>Documentation status, not clinical severity</small>
    </div>
  );
}

function TrafficStatus({ traffic }) {
  return (
    <span className={`traffic-status traffic-status-${traffic}`}>
      <span aria-hidden="true" className={`traffic-dot traffic-${traffic}`} />
      {trafficLabels[traffic]}
    </span>
  );
}

function PrimaryCareReport({ scenario, summary }) {
  return (
    <section aria-label="Primary care pathway report" className="operational-view primary-care-report">
      <p className="eyebrow">{scenario.practiceName} · simulation report</p>
      <h2>Primary Care Pathway Report</h2>
      <p>Human-readable summary of deterministic documentation checks. Simulated data only.</p>
      <PrimaryCareSummary summary={summary} />
      <div className="primary-care-report-grid">
        <article><FileText aria-hidden="true" /><h3>Access documentation</h3><p>{summary.totalContacts} simulated contact records available for structured review.</p></article>
        <article><Link2 aria-hidden="true" /><h3>Referral completeness</h3><p>{summary.referralReviews} referral record requires human completeness review.</p></article>
        <article><Users aria-hidden="true" /><h3>Continuity</h3><p>{summary.continuityRequests} simulated contacts record a continuity preference.</p></article>
      </div>
    </section>
  );
}

function PrimaryCareScenarioView({ scenario }) {
  return (
    <section aria-label="Primary care simulation scenarios" className="operational-view primary-care-static-view">
      <p className="eyebrow">Simulation scenario</p>
      <h2>Primary Care Scenario</h2>
      <h3>{scenario.focusLabel}</h3>
      <p>{scenario.description}</p>
      <ul>
        <li>Simulated patient references only.</li>
        <li>Explicit deterministic documentation checks.</li>
        <li>No diagnosis, prescribing or autonomous clinical decision-making.</li>
        <li>Human review and clinical judgement remain central.</li>
      </ul>
    </section>
  );
}

function PrimaryCareAuditView({ auditEvents }) {
  return (
    <section aria-label="Primary care audit trail" className="operational-view primary-care-static-view">
      <p className="eyebrow">Human-review history</p>
      <h2>Primary Care Audit Trail</h2>
      <ol className="primary-care-audit-list">
        {auditEvents.map((event) => <li key={event.id}><time>{event.time}</time><strong>{event.label}</strong><span>{event.detail}</span></li>)}
      </ol>
    </section>
  );
}

function PrimaryCareSettingsView() {
  return (
    <section aria-label="Primary care pathway settings" className="operational-view primary-care-static-view">
      <p className="eyebrow">Pathway configuration</p>
      <h2>Primary Care Settings</h2>
      <p>Use the Care setting control above to move between Ward care and Primary care simulations.</p>
      <dl className="primary-care-settings-list">
        <div><dt>Data</dt><dd>Simulated browser-local records only</dd></div>
        <div><dt>Logic</dt><dd>Explainable deterministic documentation checks</dd></div>
        <div><dt>Clinical use</dt><dd>Not for live clinical deployment</dd></div>
        <div><dt>Review</dt><dd>Human review required</dd></div>
      </dl>
    </section>
  );
}
