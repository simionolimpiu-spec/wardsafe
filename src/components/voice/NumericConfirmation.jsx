import { useEffect, useState } from 'react';

const emptyFields = { label: '', value: '', unit: '', sourceSpan: '' };
export function NumericConfirmation({ safety, values, act, labelRef }) {
  const [fields, setFields] = useState(emptyFields);
  useEffect(() => { if (values.length) setFields(emptyFields); }, [values.length]);
  return (
    <section className="sf-voice__notice" aria-labelledby="voice-numbers-title">
      <h4 id="voice-numbers-title">Numbers need separate confirmation</h4>
      <p>Transcript review does not confirm numbers</p>
      <ul>
        <li>Numeric content detected: {safety.containsNumericContent ? 'yes' : 'no'}</li>
        <li>Teen/ty confusables: {safety.confusables.length ? [...new Set(safety.confusables)].join(', ') : 'none detected'}</li>
        <li>Missing units: {safety.missingUnits ? 'detected' : 'not detected'}</li>
        <li>Decimals: {safety.decimals ? 'detected' : 'not detected'}</li>
        <li>Negatives: {safety.negatives ? 'detected' : 'not detected'}</li>
      </ul>
      <p>Enter each value separately with a unit and the source words. Values remain review metadata.</p>
      <form noValidate onSubmit={(event) => {
        event.preventDefault();
        act('confirm-number', { value: { ...fields, value: fields.value.trim() === '' ? null : Number(fields.value) } });
      }}>
        <div className="sf-voice__fields">
          {Object.entries({ label: 'Value label', value: 'Numeric value', unit: 'Unit', sourceSpan: 'Source span' }).map(([key, label]) => (
            <label key={key} className="sf-voice__field">{label}
              <input ref={key === 'label' ? labelRef : undefined} value={fields[key]}
                inputMode={key === 'value' ? 'decimal' : undefined}
                onChange={(event) => setFields({ ...fields, [key]: event.target.value })} />
            </label>
          ))}
        </div>
        <button type="submit">Confirm value</button>
      </form>
      <p>{values.length} confirmed numbers.</p>
      {values.length > 0 && <ul aria-label="Separately confirmed values">{values.map((value, index) => (
        <li key={index}>{value.label}: {value.value} {value.unit}. Source: {value.sourceSpan}</li>
      ))}</ul>}
    </section>
  );
}
