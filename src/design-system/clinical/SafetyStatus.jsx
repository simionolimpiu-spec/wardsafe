import { getClinicalState } from './clinicalStates.js';

/**
 * Safety notice row: status bar + icon + title + optional detail and action.
 * Used for escalation state, allergies and rule-based safety flags.
 * Static by design: no animation, no role="alert".
 */
export function SafetyStatus({ status, state, title, children, action, icon, className = '', ...rest }) {
  const resolvedState = status?.state ?? state ?? 'neutral';
  const definition = getClinicalState(resolvedState);
  const Icon = icon ?? status?.icon ?? definition.icon;
  const heading = title ?? status?.label;

  return (
    <div
      className={['sf-safety-status', `sf-tone-${definition.tone}`, className].filter(Boolean).join(' ')}
      data-state={resolvedState}
      {...rest}
    >
      <Icon aria-hidden="true" className="sf-safety-status__icon" focusable="false" />
      <div className="sf-safety-status__body">
        <p className="sf-safety-status__title">{heading}</p>
        {children && <div className="sf-safety-status__detail">{children}</div>}
      </div>
      {action && <div className="sf-safety-status__action">{action}</div>}
    </div>
  );
}

/** Escalation-specific wrapper so escalation always reads the same way. */
export function EscalationState({ status, children, action }) {
  return (
    <SafetyStatus action={action} className="sf-escalation-state" status={status}>
      {children}
    </SafetyStatus>
  );
}
