import { useEffect, useRef } from 'react';

export function SimulationDialog({ title, children, confirmLabel, onConfirm, onClose }) {
  const titleRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    titleRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()} role="presentation">
      <section aria-labelledby="simulation-dialog-title" aria-modal="true" className="simulation-dialog" role="dialog">
        <h2 id="simulation-dialog-title" ref={titleRef} tabIndex="-1">{title}</h2>
        {children}
        <div className="dialog-actions">
          <button className="secondary-action" onClick={onClose} type="button">Cancel</button>
          <button className="primary-action" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
