import { useRef } from 'react';
import { useModalFocusTrap } from './useModalFocusTrap.js';

export function SimulationDialog({ title, children, confirmLabel, onConfirm, onClose }) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useModalFocusTrap({
    active: true,
    containerRef: dialogRef,
    initialFocusRef: cancelButtonRef,
    onEscape: onClose
  });

  return (
    <>
      <div aria-hidden="true" className="dialog-backdrop" onMouseDown={onClose} role="presentation" />
      <section aria-labelledby="simulation-dialog-title" aria-modal="true" className="simulation-dialog" ref={dialogRef} role="dialog" tabIndex={-1}>
        <h2 id="simulation-dialog-title">{title}</h2>
        {children}
        <div className="dialog-actions">
          <button ref={cancelButtonRef} className="secondary-action" onClick={onClose} type="button">Cancel</button>
          <button className="primary-action" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </section>
    </>
  );
}
