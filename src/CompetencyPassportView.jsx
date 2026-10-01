import {
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  PlusCircle,
  Sparkles,
  UserRound
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  buildCompetencyPassportSummary,
  normalisePassportEntry,
  NMC_PROFICIENCY_TAGS,
  PROGRESSION_POINTS
} from './domain/competencyPassport.js';
import { competencyPassportFixtures } from './data/competencyPassportFixtures.js';
import { SafetyBanner } from './components/SafetyBanner.jsx';

const INITIAL_FORM_STATE = {
  procedure: '',
  participationLevel: 'observed',
  verifierName: '',
  verifierRole: 'nurse'
};

const PARTICIPATION_LEVEL_OPTIONS = [
  { value: 'observed', label: 'Observed' },
  { value: 'assisted', label: 'Assisted' },
  { value: 'performed-supervised', label: 'Performed supervised' },
  { value: 'performed-independent', label: 'Performed independent' }
];

const VERIFIER_ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'hca', label: 'HCA' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'doctor', label: 'Doctor' }
];

const NMC_TAG_LABELS = new Map(NMC_PROFICIENCY_TAGS.map((tag) => [tag.id, tag.label]));

export function CompetencyPassportView() {
  const [selectedStudentId, setSelectedStudentId] = useState(competencyPassportFixtures[0]?.studentId ?? '');
  const [passportByStudent, setPassportByStudent] = useState(() => buildPassportState(competencyPassportFixtures));
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  const selectedStudent = useMemo(
    () => competencyPassportFixtures.find((student) => student.studentId === selectedStudentId) ?? competencyPassportFixtures[0] ?? null,
    [selectedStudentId]
  );
  const selectedEntries = passportByStudent[selectedStudent?.studentId ?? ''] ?? [];
  const summary = useMemo(() => buildCompetencyPassportSummary(selectedEntries), [selectedEntries]);
  const placementLookup = useMemo(() => buildPlacementLookup(selectedStudent?.placements ?? []), [selectedStudent]);
  const latestPlacement = selectedStudent?.placements?.at(-1) ?? selectedStudent?.placements?.[0] ?? null;

  function handleSubmit(event) {
    event.preventDefault();

    const procedure = form.procedure.trim();
    if (!procedure || !selectedStudent || !latestPlacement) {
      return;
    }

    const entryDraft = normalisePassportEntry({
      id: `SF-CP-${selectedStudent.studentId}-${String(selectedEntries.length + 1).padStart(2, '0')}`,
      studentId: selectedStudent.studentId,
      placementId: latestPlacement.placementId,
      placementLabel: latestPlacement.placementLabel,
      placementWard: latestPlacement.placementWard,
      placementTrust: latestPlacement.placementTrust,
      procedure,
      participationLevel: form.participationLevel,
      date: new Date().toISOString().slice(0, 10),
      verifier: {
        name: form.verifierName.trim() || 'Fictional reviewer',
        role: form.verifierRole
      },
      verified: true,
      points: PROGRESSION_POINTS[form.participationLevel] ?? 0,
      nmcProficiencies: inferNmcProficiencies(procedure, form.participationLevel),
      order: selectedEntries.length
    }, selectedEntries.length);

    setPassportByStudent((current) => ({
      ...current,
      [selectedStudent.studentId]: [...(current[selectedStudent.studentId] ?? []), entryDraft]
    }));
    setForm(INITIAL_FORM_STATE);
  }

  return (
    <section className="operational-view competency-passport-view" aria-labelledby="competency-passport-title">
      <header className="view-heading competency-passport-heading">
        <div>
          <p className="eyebrow">Education passport</p>
          <h2 id="competency-passport-title">Portable Competency Passport</h2>
          <p className="competency-passport-copy">
            Simulation-only prototype. Fictional students and placements only. Points are a motivational learning record, not a formal competency assessment or regulatory sign-off.
          </p>
          {selectedStudent && (
            <p className="competency-passport-copy competency-passport-student-copy">
              <strong>{selectedStudent.studentName}</strong> | {selectedStudent.programme} | Year {selectedStudent.year}
            </p>
          )}
        </div>
        <label className="passport-switcher" htmlFor="passport-student-switcher">
          <span>Student</span>
          <select
            id="passport-student-switcher"
            onChange={(event) => setSelectedStudentId(event.target.value)}
            value={selectedStudentId}
          >
            {competencyPassportFixtures.map((student) => (
              <option key={student.studentId} value={student.studentId}>
                {student.studentName}
              </option>
            ))}
          </select>
        </label>
      </header>

      <SafetyBanner />

      <div className="passport-disclosure">
        <div>
          <strong>Simulation-only prototype</strong>
          <p>Entries are for learning visibility and human review. They are not formal competency sign-off.</p>
        </div>
        <span className="passport-disclosure-pill">
          <Sparkles aria-hidden="true" size={16} />
          Fictional data only
        </span>
      </div>

      <div className="passport-summary-grid">
        <MetricCard icon={Award} label="Total points" value={`${summary.totalPoints}`} note="Verified entries only" />
        <MetricCard icon={CheckCircle2} label="Verified entries" value={`${summary.verifiedEntryCount}`} note="Recorded and checked" />
        <MetricCard icon={UserRound} label="Placements" value={`${summary.placementCount}`} note="Cumulative passport trail" />
        <MetricCard icon={ClipboardList} label="Procedures" value={`${summary.procedureCount}`} note="Unique verified procedures" />
      </div>

      <div className="passport-insight-grid">
        <article className="passport-panel passport-coverage-panel">
          <div className="section-heading">
            <BookOpenCheck aria-hidden="true" size={20} />
            <div>
              <h3>NMC proficiency coverage</h3>
              <p>Verified evidence mapped to a small nursing-first tag set.</p>
            </div>
          </div>
          <div className="passport-coverage-grid">
            {summary.nmcCoverage.tagRows.map((tag) => (
              <div className="passport-coverage-row" key={tag.id}>
                <div>
                  <strong>{tag.label}</strong>
                  <span>{tag.verifiedEntryCount} verified entries</span>
                </div>
                <span className={`passport-coverage-status ${tag.covered ? 'covered' : 'gap'}`}>
                  {tag.covered ? 'Covered' : 'Gap'}
                </span>
              </div>
            ))}
          </div>
          <p className="passport-coverage-summary">
            {summary.nmcCoverage.coveredCount} of {summary.nmcCoverage.totalCount} proficiency tags covered ({summary.nmcCoverage.coveragePercent}%).
          </p>
        </article>

        <article className="passport-panel passport-proactivity-panel">
          <div className="section-heading">
            <ActivityGlyph />
            <div>
              <h3>Proactivity</h3>
              <p>Breadth of procedures + verified entries + self-initiated activity.</p>
            </div>
          </div>
          <div className="passport-proactivity-score">
            <strong>{summary.proactivity.score}</strong>
            <span>/ 100</span>
          </div>
          <div className="passport-proactivity-details">
            <dl>
              <div>
                <dt>Breadth</dt>
                <dd>{summary.proactivity.breadthCount}</dd>
              </div>
              <div>
                <dt>Verified</dt>
                <dd>{summary.proactivity.verifiedEntryCount}</dd>
              </div>
              <div>
                <dt>Self-initiated</dt>
                <dd>{summary.proactivity.selfInitiatedCount}</dd>
              </div>
            </dl>
          </div>
        </article>
      </div>

      <section className="passport-placement-list" aria-label="Placement history">
        {summary.placementGroups.map((group) => {
          const placement = placementLookup.get(group.placementId) ?? group;

          return (
            <article className="passport-placement-card" key={group.placementId}>
              <div className="section-heading">
                <CalendarDays aria-hidden="true" size={18} />
                <div>
                  <h3>{placement.placementLabel}</h3>
                  <p>
                    {placement.placementWard} | {placement.placementTrust}
                  </p>
                </div>
                <span className="passport-placement-points">{group.verifiedPoints} points</span>
              </div>

              <dl className="passport-placement-meta">
                <div>
                  <dt>Period</dt>
                  <dd>{placement.period}</dd>
                </div>
                <div>
                  <dt>Entries</dt>
                  <dd>{group.totalEntryCount}</dd>
                </div>
                <div>
                  <dt>Verified</dt>
                  <dd>{group.verifiedEntryCount}</dd>
                </div>
                <div>
                  <dt>Procedures</dt>
                  <dd>{group.procedureCount}</dd>
                </div>
              </dl>

              <ol className="passport-entry-list" aria-label={`${placement.placementLabel} entries`}>
                {group.entries.map((entry) => (
                  <PassportEntry key={entry.id} entry={entry} />
                ))}
              </ol>
            </article>
          );
        })}
      </section>

      <form className="passport-form" onSubmit={handleSubmit}>
        <div className="section-heading">
          <PlusCircle aria-hidden="true" size={20} />
          <div>
            <p className="eyebrow">Local entry capture</p>
            <h3>Mark a new entry</h3>
          </div>
        </div>

        <div className="passport-form-grid">
          <label>
            Procedure
            <input
              aria-label="Procedure"
              onChange={(event) => setForm((current) => ({ ...current, procedure: event.target.value }))}
              value={form.procedure}
            />
          </label>
          <label>
            Participation level
            <select
              aria-label="Participation level"
              onChange={(event) => setForm((current) => ({ ...current, participationLevel: event.target.value }))}
              value={form.participationLevel}
            >
              {PARTICIPATION_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Verifier name
            <input
              aria-label="Verifier name"
              onChange={(event) => setForm((current) => ({ ...current, verifierName: event.target.value }))}
              value={form.verifierName}
            />
          </label>
          <label>
            Verifier role
            <select
              aria-label="Verifier role"
              onChange={(event) => setForm((current) => ({ ...current, verifierRole: event.target.value }))}
              value={form.verifierRole}
            >
              {VERIFIER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="passport-form-note">
          New entries are attached to the latest placement in this simulation-only prototype.
        </p>

        <div className="passport-form-actions">
          <button className="primary-action" type="submit">
            Add entry
          </button>
        </div>
      </form>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <article className="passport-metric-card">
      <Icon aria-hidden="true" size={18} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

function PassportEntry({ entry }) {
  return (
    <li className="passport-entry">
      <div className="passport-entry-header">
        <div>
          <strong>{entry.procedure}</strong>
          <p>{formatParticipationLevel(entry.participationLevel)}</p>
        </div>
        <span className={`passport-entry-state ${entry.verified ? 'verified' : 'pending'}`}>
          {entry.verified ? 'Verified' : 'Pending'}
        </span>
      </div>

      <div className="passport-entry-meta">
        <span>{entry.date}</span>
        <span>
          {entry.verifier.name} ({formatRole(entry.verifier.role)})
        </span>
        <span>{entry.verified ? `${entry.points} points` : '0 points'}</span>
      </div>

      <div className="passport-entry-tag-list">
        {entry.nmcProficiencies.map((tag) => (
          <span className="passport-entry-tag" key={`${entry.id}-${tag}`}>
            {NMC_TAG_LABELS.get(tag) ?? tag}
          </span>
        ))}
      </div>
    </li>
  );
}

function ActivityGlyph() {
  return (
    <span className="passport-activity-icon" aria-hidden="true">
      <Sparkles size={18} />
    </span>
  );
}

function buildPassportState(fixtures = []) {
  return Object.fromEntries(
    fixtures.map((student) => [
      student.studentId,
      Array.isArray(student.entries)
        ? student.entries.map((entry, index) =>
          normalisePassportEntry({
            ...entry,
            verifier: { ...entry.verifier },
            nmcProficiencies: Array.isArray(entry.nmcProficiencies) ? [...entry.nmcProficiencies] : [],
            order: index
          }, index)
        ).filter(Boolean)
        : []
    ])
  );
}

function buildPlacementLookup(placements = []) {
  return new Map(
    placements.map((placement) => [placement.placementId, placement])
  );
}

function formatParticipationLevel(value) {
  const labels = {
    observed: 'Observed',
    assisted: 'Assisted',
    'performed-supervised': 'Performed supervised',
    'performed-independent': 'Performed independent'
  };

  return labels[value] ?? 'Observed';
}

function formatRole(role) {
  const text = String(role ?? '').trim();
  if (!text) return 'nurse';
  return text.toUpperCase() === 'HCA' ? 'HCA' : text[0].toUpperCase() + text.slice(1);
}

function inferNmcProficiencies(procedure, participationLevel) {
  const text = procedure.toLowerCase();
  const tags = new Set(['documentation-and-recording']);

  if (text.includes('handover') || text.includes('summary') || text.includes('update')) {
    tags.add('communication');
  }

  if (text.includes('wound') || text.includes('observation') || text.includes('check')) {
    tags.add('assessment-and-observation');
  }

  if (text.includes('medicine') || text.includes('medication')) {
    tags.add('medicines-safety');
  }

  if (text.includes('escalation') || text.includes('risk') || participationLevel === 'performed-independent') {
    tags.add('escalation-and-collaboration');
  }

  if (text.includes('comfort') || text.includes('education')) {
    tags.add('person-centred-care');
  }

  return [...tags];
}
