/**
 * A labelled clinical value with its unit. Tabular numerals so values align.
 * Missing values render "Not recorded", never an invented value.
 *
 * `emphasis="observation"` gives the large observation style (ObservationValue).
 * `state` is optional; when set, a status bar and `stateLabel` text are shown
 * so the value never relies on colour alone.
 */
export function ClinicalValue({
  label,
  value,
  unit,
  context,
  state,
  stateLabel,
  emphasis = 'standard',
  as: Element = 'div',
  className = ''
}) {
  const hasValue = value !== null && value !== undefined && value !== '';
  const classes = [
    'sf-clinical-value',
    `sf-clinical-value--${emphasis}`,
    state ? `sf-clinical-value--stated sf-tone-${state}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Element className={classes}>
      <span className="sf-clinical-value__label">{label}</span>
      <span className="sf-clinical-value__reading">
        {hasValue ? (
          <>
            <span className="sf-clinical-value__value sf-numeric">{value}</span>
            {unit && <span className="sf-clinical-value__unit">{unit}</span>}
          </>
        ) : (
          <span className="sf-clinical-value__missing">Not recorded</span>
        )}
      </span>
      {state && stateLabel && <span className="sf-clinical-value__state">{stateLabel}</span>}
      {context && <span className="sf-clinical-value__context">{context}</span>}
    </Element>
  );
}

export function ObservationValue(props) {
  return <ClinicalValue emphasis="observation" {...props} />;
}
