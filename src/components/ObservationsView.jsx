import { useEffect, useState } from 'react';

export function ObservationsView({ patient, onRecord }) {
  const [news2, setNews2] = useState(String(patient.news2));
  const [error, setError] = useState('');

  useEffect(() => {
    setNews2(String(patient.news2));
    setError('');
  }, [patient.id]);

  function submit(event) {
    event.preventDefault();
    const value = Number(news2);
    if (!Number.isInteger(value) || value < 0 || value > 20) {
      setError('NEWS2 must be a whole number from 0 to 20.');
      return;
    }

    setError('');
    onRecord({
      patientId: patient.id,
      news2: value,
      respiratoryRate: '',
      oxygenSaturation: ''
    });
  }

  return (
    <section className="operational-view" aria-labelledby="observations-title">
      <header className="view-heading">
        <div>
          <p className="eyebrow">Fictional record</p>
          <h2 id="observations-title">Observations</h2>
        </div>
        <strong>{patient.id}</strong>
      </header>
      <div className="observation-summary">
        <strong>Current NEWS2 {patient.news2}</strong>
        <span>{patient.currentState.join(' | ')}</span>
      </div>
      <form className="inline-form" onSubmit={submit}>
        <label htmlFor="news2-input">
          NEWS2
          <input
            aria-describedby={error ? 'news2-error' : undefined}
            id="news2-input"
            inputMode="numeric"
            onChange={(event) => setNews2(event.target.value)}
            value={news2}
          />
        </label>
        {error && <p id="news2-error" role="alert">{error}</p>}
        <button className="primary-action" type="submit">Record simulated observation</button>
      </form>
      <ol aria-label="Recorded observations" className="timeline observation-timeline">
        {patient.observations.map((item) => (
          <li key={item.id}>
            <strong>NEWS2 {item.news2}</strong>
            <span>{item.time} - simulation entry</span>
          </li>
        ))}
      </ol>
      {patient.observations.length === 0 && (
        <p className="empty-state">No additional simulated observations recorded.</p>
      )}
    </section>
  );
}
