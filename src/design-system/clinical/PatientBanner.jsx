import { CircleDashed, TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import { ClinicalStatusBadge } from './ClinicalStatusBadge.jsx';
import { SimulationLabel } from './SimulationLabel.jsx';

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function visible(facts) {
  return (Array.isArray(facts) ? facts : []).filter((fact) => fact && hasValue(fact.value));
}

/**
 * Display name, simulation label and identifiers.
 * Identifiers without a value are omitted, never invented.
 */
export function PatientIdentityBlock({
  displayName,
  identifiers = [],
  headingId,
  headingLevel = 2,
  simulation = true,
  simulationLabel
}) {
  const Heading = `h${Math.min(Math.max(headingLevel, 1), 4)}`;
  const shown = visible(identifiers);

  return (
    <div className="sf-patient-identity">
      <div className="sf-patient-identity__name-row">
        <Heading className="sf-patient-identity__name" id={headingId}>{displayName}</Heading>
        {simulation && <SimulationLabel>{simulationLabel}</SimulationLabel>}
      </div>
      {shown.length > 0 && (
        <dl className="sf-patient-identity__ids">
          {shown.map((fact) => (
            <div className="sf-fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd className="sf-numeric">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/**
 * Location and care-context facts (ward, hospital, responsible nurse).
 * Renders nothing when no fact has a value.
 */
export function PatientContextStrip({ facts = [], label = 'Patient context' }) {
  const shown = visible(facts);
  if (shown.length === 0) return null;

  return (
    <dl aria-label={label} className="sf-patient-context">
      {shown.map((fact) => (
        <div className="sf-fact" key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Allergy line. Always rendered so absence is explicit.
 * allergies: string[] (empty = none recorded) or null/undefined (not available).
 * Never "NKDA": the fixture does not record that allergies were checked.
 */
export function PatientAllergyStrip({ allergies }) {
  if (!Array.isArray(allergies)) {
    return (
      <p className="sf-allergy-strip sf-tone-neutral" data-state="neutral">
        <CircleDashed aria-hidden="true" className="sf-allergy-strip__icon" focusable="false" />
        <span><strong>Allergies:</strong> information not available</span>
      </p>
    );
  }

  if (allergies.length === 0) {
    return (
      <p className="sf-allergy-strip sf-tone-neutral" data-state="neutral">
        <CircleDashed aria-hidden="true" className="sf-allergy-strip__icon" focusable="false" />
        <span><strong>Allergies:</strong> none recorded in this simulation record</span>
      </p>
    );
  }

  return (
    <p className="sf-allergy-strip sf-tone-warning" data-state="warning">
      <TriangleAlert aria-hidden="true" className="sf-allergy-strip__icon" focusable="false" />
      <span><strong>Allergies:</strong> {allergies.join(', ')}</span>
    </p>
  );
}

/**
 * Patient-context banner. Order is fixed by DESIGN.md section 12:
 * identity, simulation label, location/context, allergies, current status.
 * `children` renders after the statuses (for example a SafetyStatus line).
 */
export function PatientBanner({
  displayName,
  identifiers = [],
  context = [],
  allergies,
  statuses = [],
  headingLevel = 2,
  simulation = true,
  simulationLabel,
  children,
  className = ''
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={['sf-patient-banner', className].filter(Boolean).join(' ')}>
      <PatientIdentityBlock
        displayName={displayName}
        headingId={headingId}
        headingLevel={headingLevel}
        identifiers={identifiers}
        simulation={simulation}
        simulationLabel={simulationLabel}
      />
      <PatientContextStrip facts={context} />
      <PatientAllergyStrip allergies={allergies} />
      {statuses.length > 0 && (
        <ul aria-label="Current status" className="sf-patient-banner__statuses">
          {statuses.map((item) => (
            <li key={item.label}>
              <ClinicalStatusBadge status={item} />
            </li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}
