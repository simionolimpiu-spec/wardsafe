import { RotateCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SettingsView({ settings, onSave, onRequestReset }) {
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
    </section>
  );
}
