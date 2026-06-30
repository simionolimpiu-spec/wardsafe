import { DatabaseZap, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

const roleModeOptions = [
  { value: 'clinical-staff', label: 'Clinical staff' },
  { value: 'educator-simulation', label: 'Educator / simulation' },
  { value: 'family-safe-preview', label: 'Family-safe preview' }
];

const densityOptions = [
  { value: false, label: 'Comfortable' },
  { value: true, label: 'Compact' }
];

const detailOptions = [
  { value: 'summary', label: 'Summary' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' }
];

const graphVisibilityOptions = [
  { value: 'clinical-only', label: 'Clinical only' },
  { value: 'hidden', label: 'Hidden in family-safe preview' }
];

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
    <section className="operational-view settings-view" aria-labelledby="settings-title">
      <header className="view-heading">
        <div>
          <p className="eyebrow">Presentation and review controls</p>
          <h2 id="settings-title">Settings</h2>
        </div>
      </header>

      <form
        className="settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <div className="settings-grid">
          <label htmlFor="simulation-user">
            Simulation identity
            <input
              id="simulation-user"
              onChange={(event) => setDraft((current) => ({ ...current, simulationUser: event.target.value }))}
              value={draft.simulationUser}
            />
          </label>

          <label htmlFor="draft-provider">
            Draft provider
            <select
              id="draft-provider"
              onChange={(event) => setDraft((current) => ({ ...current, draftProvider: event.target.value }))}
              value={draft.draftProvider}
            >
              <option value="auto">Automatic server boundary</option>
              <option value="deterministic">Deterministic only</option>
            </select>
          </label>
        </div>

        <SettingChoiceGroup
          label="Layout density"
          note="Comfortable keeps the demo airy. Compact reduces vertical space for shift use."
          onChange={(value) => setDraft((current) => ({ ...current, compactMode: value }))}
          options={densityOptions}
          value={draft.compactMode}
        />

        <SettingChoiceGroup
          label="Role mode"
          note="Clinical staff and educator views show the full simulation detail. Family-safe preview keeps the language calm and plain."
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              roleMode: value,
              graphVisibility: value === 'family-safe-preview' ? 'hidden' : current.graphVisibility
            }))
          }
          options={roleModeOptions}
          value={draft.roleMode}
        />

        <SettingChoiceGroup
          label="Detail level"
          note="Summary keeps the surface lighter. Detailed keeps the evidence trail visible for staff review."
          onChange={(value) => setDraft((current) => ({ ...current, detailLevel: value }))}
          options={detailOptions}
          value={draft.detailLevel}
        />

        <SettingChoiceGroup
          label="Graph visibility"
          note="Clinical-only graphs remain staff-facing. Family-safe preview hides the trend surfaces."
          onChange={(value) => setDraft((current) => ({ ...current, graphVisibility: value }))}
          options={graphVisibilityOptions}
          value={draft.graphVisibility}
        />

        <button className="primary-action settings-save" type="submit">
          <Save aria-hidden="true" size={16} />
          Save settings
        </button>
      </form>

      <div className="danger-zone">
        <div>
          <strong>Reset simulation</strong>
          <p>Restore the committed fictional patients, tasks, escalations and audit seed.</p>
        </div>
        <button className="secondary-action" onClick={onRequestReset} type="button">
          <RotateCcw aria-hidden="true" size={16} />
          Reset simulation
        </button>
      </div>

      <div className="integration-check">
        <div>
          <strong>Backend workspace source</strong>
          <p>Check the server-side simulation contract without replacing browser-local edits.</p>
        </div>
        <button
          className="secondary-action"
          disabled={isCheckingBackend}
          onClick={onCheckBackend}
          type="button"
        >
          <DatabaseZap aria-hidden="true" size={16} />
          {isCheckingBackend ? 'Checking...' : 'Check backend workspace'}
        </button>
        {backendWorkspace && (
          <dl className="source-summary">
            <div>
              <dt>Source</dt>
              <dd>{backendWorkspace.source}</dd>
            </div>
            <div>
              <dt>Patients</dt>
              <dd>{backendWorkspace.patientCount} fictional patients</dd>
            </div>
            <div>
              <dt>Open tasks</dt>
              <dd>{backendWorkspace.openTaskCount}</dd>
            </div>
            <div>
              <dt>Escalations</dt>
              <dd>{backendWorkspace.activeEscalationCount}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="integration-check">
        <div>
          <strong>Build readiness</strong>
          <p>
            Review the server-side safety boundary, providers and migration approval state. Simulation output for
            preview only. Not clinically validated and not for clinical decision-making.
          </p>
        </div>
        <button
          className="secondary-action"
          disabled={isCheckingReadiness}
          onClick={onCheckReadiness}
          type="button"
        >
          <ShieldCheck aria-hidden="true" size={16} />
          {isCheckingReadiness ? 'Checking...' : 'Check build readiness'}
        </button>
        {readinessReport && (
          <>
            <dl className="source-summary">
              <div>
                <dt>Migrations</dt>
                <dd>{readinessReport.migrationLabel}</dd>
              </div>
              <div>
                <dt>Draft</dt>
                <dd>{readinessReport.draftProvider}</dd>
              </div>
              <div>
                <dt>Workspace</dt>
                <dd>{readinessReport.workspaceProvider}</dd>
              </div>
              <div>
                <dt>Audit</dt>
                <dd>{readinessReport.auditProvider}</dd>
              </div>
              <div>
                <dt>Signals</dt>
                <dd>{readinessReport.signalProvider}</dd>
              </div>
              <div>
                <dt>Suggestions</dt>
                <dd>{readinessReport.suggestionProvider}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{readinessReport.databaseLabel}</dd>
              </div>
            </dl>
            <p className="risk-support-boundary">{readinessReport.boundaryNote}</p>
          </>
        )}
      </div>
    </section>
  );
}

function SettingChoiceGroup({ label, note, options, value, onChange }) {
  return (
    <section className="settings-choice-group" aria-labelledby={slugify(label)}>
      <div className="settings-choice-copy">
        <span id={slugify(label)}>{label}</span>
        <small>{note}</small>
      </div>
      <div className="segmented-control settings-segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={value === option.value ? 'active' : ''}
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
