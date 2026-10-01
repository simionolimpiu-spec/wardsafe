export function SbarDraftEditor({ draftText, draftSaveHint, onDraftChange, onSaveDraft, onGenerateDraft, isGeneratingDraft }) {
  return <section className="sbar-editor" aria-label="SBAR draft editor">
    <label className="draft-label" htmlFor="sbar-draft">Editable SBAR draft</label>
    <textarea id="sbar-draft" value={draftText} onChange={(event) => onDraftChange(event.target.value)}
      rows={8} aria-describedby="sbar-save-hint" />
    <p id="sbar-save-hint">{draftSaveHint ?? 'Fictional draft. Save to keep changes on this device.'}</p>
    <div className="draft-actions">
      <button className="primary-action" onClick={onSaveDraft} type="button">Save SBAR draft</button>
      <button className="secondary-action" disabled={isGeneratingDraft} onClick={onGenerateDraft} type="button">
        {isGeneratingDraft ? 'Generating draft' : 'Generate draft'}
      </button>
    </div>
  </section>;
}
