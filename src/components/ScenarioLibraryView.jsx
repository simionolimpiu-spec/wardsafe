import { useState } from 'react';
import { ClipboardCheck, FileSearch, ShieldCheck } from 'lucide-react';
import {
  biasAwarenessCues,
  discoveryScenarios,
  initialHazardControls,
  staffingContextNote
} from '../data/scenarioLibrary.js';
import {
  SCORE_COMPARISON_PARAMETERS,
  SCORE_COMPARISON_SNAPSHOTS,
  compareScoringSystems
} from '../domain/scoreComparison.js';

export function ScenarioLibraryView() {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(SCORE_COMPARISON_SNAPSHOTS[0].id);
  const selectedSnapshot = SCORE_COMPARISON_SNAPSHOTS.find(({ id }) => id === selectedSnapshotId) ?? SCORE_COMPARISON_SNAPSHOTS[0];
  const comparison = compareScoringSystems(selectedSnapshot.observations);

  return (
    <section className="scenario-library" aria-label="Discovery scenario library">
      <div className="section-heading">
        <FileSearch aria-hidden="true" size={22} />
        <div>
          <p className="eyebrow">Product discovery</p>
          <h2>Discovery Scenario Library</h2>
        </div>
      </div>

      <div className="scenario-grid">
        {discoveryScenarios.map((scenario) => (
          <article className="scenario-card" key={scenario.id}>
            <h3>{scenario.title}</h3>
            <p>{scenario.wardContext}</p>
            <div className="scenario-review">
              <strong>Review prompt</strong>
              <span>{scenario.reviewPrompt}</span>
            </div>
            <div className="scenario-columns">
              <ScenarioList icon={ClipboardCheck} items={scenario.successSignals} title="Success signals" tone="success" />
              <ScenarioList icon={ShieldCheck} items={scenario.hazards} title="Hazards to watch" tone="hazard" />
            </div>
            <p className="evidence-line"><strong>Evidence expected:</strong> {scenario.evidenceExpected.join(', ')}</p>
          </article>
        ))}
      </div>

      <section className="score-comparison-panel" aria-label="Scoring systems comparison (simulation)">
        <div className="score-comparison-heading">
          <div>
            <p className="eyebrow">Simulation teaching mode</p>
            <h3>Scoring systems comparison</h3>
            <p>Compare the same fictional observations under two scoring conventions.</p>
          </div>
          <label className="score-comparison-select">
            <span>Fictional observation snapshot</span>
            <select
              aria-label="Fictional observation snapshot"
              value={selectedSnapshot.id}
              onChange={(event) => setSelectedSnapshotId(event.target.value)}
            >
              {SCORE_COMPARISON_SNAPSHOTS.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>{snapshot.label}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="score-comparison-snapshot-note"><strong>{selectedSnapshot.label}:</strong> {selectedSnapshot.description}</p>

        <dl className="score-comparison-observations" aria-label="Selected fictional observations">
          {SCORE_COMPARISON_PARAMETERS.map(({ key, label, unit }) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{formatObservation(selectedSnapshot.observations[key], key)} <small>{unit}</small></dd>
            </div>
          ))}
        </dl>

        <div className="score-comparison-grid">
          <ScoreComparisonCard title="NEWS2 - England convention" result={comparison.news2} />
          <ScoreComparisonCard title="MEWS-style variant (as used in several international systems)" result={comparison.mewsStyle} />
        </div>

        <p className="score-comparison-note"><strong>Comparison note:</strong> {comparison.comparisonNote}</p>
        <p className="score-comparison-boundary">Simulation only - fictional observations - human review required</p>
      </section>

      <aside className="hazard-controls" aria-label="Initial hazard controls">
        <h3>Initial hazard controls</h3>
        <ul>
          {initialHazardControls.map((control) => <li key={control}>{control}</li>)}
        </ul>
      </aside>

      <aside className="scenario-staffing-context" aria-label="Staffing and skill-mix context">
        <h3>{staffingContextNote.title}</h3>
        <ul>
          {staffingContextNote.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <p><small><strong>Evidence:</strong> {staffingContextNote.evidence}</small></p>
      </aside>

      <aside className="scenario-bias-awareness" aria-label="Notice your thinking">
        <h3>{biasAwarenessCues.title}</h3>
        <p className="scenario-bias-awareness-intro">Optional reflective teaching prompt for simulation review.</p>
        <ul>
          {biasAwarenessCues.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <p><small><strong>Evidence:</strong> {biasAwarenessCues.evidence}</small></p>
        <p className="scenario-bias-awareness-boundary">
          This prompt does not score the scenario or change or validate a clinical decision; human review and clinical judgement remain central.
        </p>
      </aside>
    </section>
  );
}

function ScoreComparisonCard({ title, result }) {
  return (
    <article className="score-comparison-card">
      <div className="score-comparison-card-heading">
        <h4>{title}</h4>
        <span aria-label={`${result.total} total points`}>{result.total}</span>
      </div>
      <p className="score-comparison-total-label">Total points</p>
      <ul className="score-comparison-points">
        {SCORE_COMPARISON_PARAMETERS.map(({ key, label }) => (
          <li key={key}>
            <span>{label}</span>
            <strong>{formatPoints(result.perParameter[key])}</strong>
          </li>
        ))}
      </ul>
      <p className="score-comparison-convention"><strong>Review convention:</strong> {result.escalationConvention}</p>
    </article>
  );
}

function formatObservation(value, key) {
  if (key === 'consciousness') return formatConsciousness(value);
  return value;
}

function formatConsciousness(value) {
  if (value === 'voice') return 'Voice';
  if (value === 'pain') return 'Pain';
  if (value === 'unresponsive') return 'Unresponsive';
  return 'Alert';
}

function formatPoints(points) {
  if (points == null) return 'Not scored in this variant';
  return `${points} point${points === 1 ? '' : 's'}`;
}

function ScenarioList({ icon: Icon, items, title, tone = 'success' }) {
  return (
    <div className={`scenario-list ${tone}`}>
      <h4><Icon aria-hidden="true" size={17} /> {title}</h4>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
