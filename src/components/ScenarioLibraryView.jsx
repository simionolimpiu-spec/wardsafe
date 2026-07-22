import { ClipboardCheck, FileSearch, ShieldCheck } from 'lucide-react';
import { discoveryScenarios, initialHazardControls, staffingContextNote } from '../data/scenarioLibrary.js';

export function ScenarioLibraryView() {
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
    </section>
  );
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
