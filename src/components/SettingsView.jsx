import { DatabaseZap, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SettingsView({
  backendWorkspace,
  isCheckingBackend,
  isCheckingReadiness,
  readinessReport,
  settings,
  onCheckBackend,
  onCheckReadiness,
  onSave,
  onRequestReset
}) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => setDraft(settings), [settings]);

  return (
    <section className="operational-view" aria-labelledby="settings-title">
      <header className="view-heading"><div><p className="eyebrow">Browser-local preferences</p><h2 id="settings-title">Settings</h2></div></header>
      <form className="settings-form" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <label htmlFor="simulation-user">Simulation identity<input id="simulation-user" onChange={(event) => setDraft((current) => ({ ...current, simulationUser: event.target.value }))} value={draft.simulationUser} /></label>
        <label htmlFor="draft-provider">Draft provider<select id="draft-provider" onChange={(event) => setDraft((current) => ({ ...current, draftProvider: event.target.value }))} value={draft.draftProvider}><option value="auto">Automatic server boundary</option><option value="deterministic">Deterministic only</option></select></label>
        <label className="toggle-row"><input checked={draft.compactMode} onChange={(event) => setDraft((current) => ({ ...current, compactMode: event.target.checked }))} type="checkbox" />Compact workspace density</label>
        <button className="primary-action" type="submit"><Save aria-hidden="true" size={16} /> Save settings</button>
      </form>
      <div className="danger-zone">
        <div><strong>Reset simulation</strong><p>Restore the committed fictional patients, tasks, escalations and audit seed.</p></div>
        <button className="secondary-action" onClick={onRequestReset} type="button"><RotateCcw aria-hidden="true" size={16} /> Reset simulation</button>
      </div>
      <div className="integration-check">
        <div><strong>Backend workspace source</strong><p>Check the server-side simulation contract without replacing browser-local edits.</p></div>
        <button className="secondary-action" disabled={isCheckingBackend} onClick={onCheckBackend} type="button"><DatabaseZap aria-hidden="true" size={16} /> {isCheckingBackend ? 'Checking...' : 'Check backend workspace'}</button>
        {backendWorkspace && (
          <dl className="source-summary">
            <div><dt>Source</dt><dd>{backendWorkspace.source}</dd></div>
            <div><dt>Patients</dt><dd>{backendWorkspace.patientCount} fictional patients</dd></div>
            <div><dt>Open tasks</dt><dd>{backendWorkspace.openTaskCount}</dd></div>
            <div><dt>Escalations</dt><dd>{backendWorkspace.activeEscalationCount}</dd></div>
          </dl>
        )}
      </div>
      <div className="integration-check">
        <div><strong>Build readiness</strong><p>Review the server-side safety boundary, providers and migration approval state. Simulation output for preview only. Not clinically validated and not for clinical decision-making.</p></div>
        <button className="secondary-action" disabled={isCheckingReadiness} onClick={onCheckReadiness} type="button"><ShieldCheck aria-hidden="true" size={16} /> {isCheckingReadiness ? 'Checking...' : 'Check build readiness'}</button>
        {readinessReport && (
          <>
            <dl className="source-summary">
              <div><dt>Migrations</dt><dd>{readinessReport.migrationLabel}</dd></div>
              <div><dt>Draft</dt><dd>{readinessReport.draftProvider}</dd></div>
              <div><dt>Workspace</dt><dd>{readinessReport.workspaceProvider}</dd></div>
              <div><dt>Audit</dt><dd>{readinessReport.auditProvider}</dd></div>
              <div><dt>Signals</dt><dd>{readinessReport.signalProvider}</dd></div>
              <div><dt>Suggestions</dt><dd>{readinessReport.suggestionProvider}</dd></div>
              <div><dt>Database</dt><dd>{readinessReport.databaseLabel}</dd></div>
            </dl>
            <p className="risk-support-boundary">{readinessReport.boundaryNote}</p>
          </>
        )}
      </div>
    </section>
  );
}
