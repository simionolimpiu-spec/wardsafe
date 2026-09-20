/**
 * Quiet, non-clinical information block (context, integration notes, help).
 * Not for clinical states: use SafetyStatus or ReviewCue for those.
 */
export function InformationPanel({ icon: Icon, title, children, className = '', ...rest }) {
  return (
    <div className={['sf-info-panel', className].filter(Boolean).join(' ')} {...rest}>
      {Icon && <Icon aria-hidden="true" className="sf-info-panel__icon" focusable="false" />}
      <div className="sf-info-panel__body">
        {title && <strong className="sf-info-panel__title">{title}</strong>}
        {children && <div className="sf-info-panel__content">{children}</div>}
      </div>
    </div>
  );
}
