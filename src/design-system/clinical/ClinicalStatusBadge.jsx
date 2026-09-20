import { Badge } from '../primitives/Badge.jsx';
import { getClinicalState } from './clinicalStates.js';

/**
 * Clinical state badge: colour + icon + text, never colour alone.
 * Pass a status object from clinicalStates.js ({ state, label, icon? }),
 * or `state` and `label` directly.
 */
export function ClinicalStatusBadge({ status, state, label, variant = 'subtle', className = '' }) {
  const resolvedState = status?.state ?? state ?? 'neutral';
  const resolvedLabel = status?.label ?? label;
  const definition = getClinicalState(resolvedState);
  const Icon = status?.icon ?? definition.icon;

  return (
    <Badge
      className={['sf-clinical-status', className].filter(Boolean).join(' ')}
      data-state={resolvedState}
      icon={Icon}
      tone={definition.tone}
      variant={variant}
    >
      {resolvedLabel}
    </Badge>
  );
}
