import { BookOpenCheck, CheckCircle2, GraduationCap, Layers3, Medal, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { scoreMicroLearningModule, summariseMicroLearningModule } from './domain/microLearning.js';
import { microLearningFixtures } from './data/microLearningFixtures.js';
import { SafetyBanner } from './components/SafetyBanner.jsx';

export function LearningHubView() {
  const [selectedModuleId, setSelectedModuleId] = useState(microLearningFixtures[0]?.id ?? '');
  const [answers, setAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);

  const selectedModule = useMemo(
    () => microLearningFixtures.find((module) => module.id === selectedModuleId) ?? microLearningFixtures[0] ?? null,
    [selectedModuleId]
  );
  const moduleSummary = useMemo(
    () => summariseMicroLearningModule(selectedModule ?? {}),
    [selectedModule]
  );

  useEffect(() => {
    setAnswers({});
    setScoreResult(null);
  }, [selectedModuleId]);

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: Number(value)
    }));
  }

  function scoreModule(event) {
    event.preventDefault();
    if (!selectedModule) {
      return;
    }

    setScoreResult(scoreMicroLearningModule(selectedModule, answers));
  }

  return (
    <section className="operational-view learning-hub-view" aria-labelledby="learning-hub-title">
      <header className="view-heading learning-hub-heading">
        <div>
          <p className="eyebrow">Learning layer</p>
          <h2 id="learning-hub-title">Learning Hub</h2>
          <p className="learning-hub-copy">
            Simulation-only prototype. Fictional modules only. Points are a motivational learning record, not a formal assessment or regulatory sign-off.
          </p>
          {selectedModule && (
            <p className="learning-hub-copy learning-hub-module-copy">
              <strong>{selectedModule.title}</strong> | {selectedModule.ward} | {selectedModule.trust}
            </p>
          )}
        </div>
        <label className="learning-hub-switcher" htmlFor="learning-module-switcher">
          <span>Module</span>
          <select
            id="learning-module-switcher"
            onChange={(event) => setSelectedModuleId(event.target.value)}
            value={selectedModuleId}
          >
            {microLearningFixtures.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      <SafetyBanner />

      <div className="learning-hub-disclosure">
        <div>
          <strong>Simulation-only prototype</strong>
          <p>Questions are fictional and are meant for practice, discussion, and human review.</p>
        </div>
        <span className="learning-hub-disclosure-pill">
          <Sparkles aria-hidden="true" size={16} />
          Fictional data only
        </span>
      </div>

      <div className="learning-hub-layout">
        <aside className="learning-hub-sidebar">
          <article className="learning-hub-module-card">
            <div className="section-heading">
              <BookOpenCheck aria-hidden="true" size={20} />
              <div>
                <h3>Module summary</h3>
                <p>Interactive, ward-specific, and interprofessional.</p>
              </div>
            </div>

            <dl className="learning-hub-meta">
              <div>
                <dt>Topic</dt>
                <dd>{moduleSummary.topic}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{formatLabel(moduleSummary.format)}</dd>
              </div>
              <div>
                <dt>Questions</dt>
                <dd>{moduleSummary.questionCount}</dd>
              </div>
              <div>
                <dt>Trust</dt>
                <dd>{moduleSummary.trust}</dd>
              </div>
            </dl>

            <div className="learning-hub-chip-row" aria-label="Interprofessional professions">
              {moduleSummary.professions.map((profession) => (
                <span className="learning-hub-chip" key={profession}>
                  {formatProfession(profession)}
                </span>
              ))}
            </div>
          </article>

          <article className="learning-hub-result-card">
            <div className="section-heading">
              <GraduationCap aria-hidden="true" size={20} />
              <div>
                <h3>Score snapshot</h3>
                <p>Updated whenever the module is scored.</p>
              </div>
            </div>
            {scoreResult ? (
              <div className="learning-hub-score">
                <strong>{scoreResult.score}</strong>
                <span>/ {scoreResult.maxScore}</span>
                <p>{scoreResult.badgeEarned ? 'Badge earned' : 'Badge not yet earned'}</p>
                <small>{scoreResult.pointsEarned} points earned</small>
              </div>
            ) : (
              <p className="learning-hub-placeholder">Choose answers, then score the module to see points and badge status.</p>
            )}
          </article>
        </aside>

        <form className="learning-hub-quiz" onSubmit={scoreModule}>
          <div className="section-heading">
            <Layers3 aria-hidden="true" size={20} />
            <div>
              <h3>{selectedModule?.title ?? 'Learning module'}</h3>
              <p>{selectedModule?.topic ?? 'general learning'} | {selectedModule?.format ?? 'micro'}</p>
            </div>
          </div>

          <div className="learning-hub-question-list">
            {selectedModule?.questions.map((question) => {
              const result = scoreResult?.questionResults.find((item) => item.questionId === question.id) ?? null;

              return (
                <fieldset className="learning-hub-question" key={question.id}>
                  <legend>{question.prompt}</legend>
                  <div className="learning-hub-options">
                    {question.options.map((option, index) => (
                      <label key={`${question.id}-${index}`}>
                        <input
                          checked={answers[question.id] === index}
                          name={question.id}
                          onChange={() => updateAnswer(question.id, index)}
                          type="radio"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>

                  {result && (
                    <p className={`learning-hub-feedback ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {result.isCorrect ? 'Correct. ' : 'Not quite. '}
                      {question.explanation}
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>

          <div className="learning-hub-actions">
            <button className="primary-action" type="submit">
              Score module
            </button>
            <span className="learning-hub-action-note">
              {scoreResult ? `Score recorded at ${scoreResult.score}/${scoreResult.maxScore}.` : 'No score recorded yet.'}
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}

function formatLabel(value) {
  return value === 'course' ? 'Course' : 'Micro';
}

function formatProfession(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'Interprofessional';
  return text[0].toUpperCase() + text.slice(1);
}
