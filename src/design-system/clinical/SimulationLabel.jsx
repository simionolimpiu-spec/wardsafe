import { FlaskConical } from 'lucide-react';
import { Badge } from '../primitives/Badge.jsx';

/**
 * Marks fictional or simulated data. Dashed slate style so it is never
 * confused with a clinical state. Do not remove from fixture-backed screens.
 */
export function SimulationLabel({ children = 'Fictional scenario', className = '' }) {
  return (
    <Badge className={['sf-simulation-label', className].filter(Boolean).join(' ')} icon={FlaskConical} tone="simulation">
      {children}
    </Badge>
  );
}
