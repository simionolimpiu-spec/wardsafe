import { discoveryScenarios } from '../data/scenarioLibrary.js';

const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2
};

const CATEGORY_ORDER = {
  documentation_gap: 0,
  escalation_readiness: 1,
  risk_support_signal: 2,
  handover_cue: 3,
  discharge_readiness_blocker: 4,
  scenario_learning: 5,
  simulation_fallback: 6
};

const UNSAFE_TEXT_PATTERN = /\b(diagnos\w*|prescrib\w*|give potassium|patient needs potassium|ai decided|autonomous(?: clinical)? decision|treatment recommendation)\b/i;

export function buildSimulationReviewCues({ patient, signals, suggestions } = {}) {
  const safePatient = isPlainObject(patient) ? patient : {};
  const validSignals = normaliseRecords(signals).filter(isSimulationSignal);
  const validSuggestions = normaliseRecords(suggestions).filter(isSimulationSuggestion);
  const cues = [];

  const signalIndex = indexSignals(validSignals);
  const latestRelevantSignal = latestSignal(validSignals, (signal) =>
    isSignalCode(signal, 'potassium') ||
    isSignalCode(signal, 'magnesium') ||
    isSignalCode(signal, 'news2') ||
    isWorkflowPlanGapSignal(signal)
  );

  const documentationCue = buildDocumentationGapCue({ patient: safePatient, signalIndex, latestRelevantSignal });
  if (documentationCue) cues.push(documentationCue);

  const escalationCue = buildEscalationReadinessCue({
    patient: safePatient,
    signalIndex,
    signals: validSignals,
    latestRelevantSignal,
    suggestions: validSuggestions
  });
  if (escalationCue) cues.push(escalationCue);

  const riskSupportCues = validSuggestions
    .sort(compareSuggestions)
    .map((suggestion) => buildRiskSupportCue({ suggestion, patient: safePatient }));
  cues.push(...riskSupportCues);

  const handoverCue = buildHandoverCue({ patient: safePatient });
  if (handoverCue) cues.push(handoverCue);

  const dischargeCue = buildDischargeReadinessCue({ patient: safePatient });
  if (dischargeCue) cues.push(dischargeCue);

  const scenarioCue = buildScenarioLearningCue({
    documentationCue,
    escalationCue,
    handoverCue,
    dischargeCue
  });
  if (scenarioCue) cues.push(scenarioCue);

  const deduped = dedupeCues(cues).sort(compareCues);
  return deduped.length > 0 ? deduped : [buildFallbackCue({ patient: safePatient })];
}

function buildDocumentationGapCue({ patient, signalIndex, latestRelevantSignal }) {
  const potassiumSignal = signalIndex.potassium;
  const magnesiumSignal = signalIndex.magnesium;
  const workflowPlanGapSignal = signalIndex.workflowPlanGap;
  const evidence = [];
  const missingDataNotes = [];

  if (potassiumSignal && isSignalCode(potassiumSignal, 'potassium') && toNumber(potassiumSignal.value) != null) {
    evidence.push(signalEvidence(potassiumSignal));
  }

  if (magnesiumSignal && isMissingSignal(magnesiumSignal)) {
    evidence.push(signalEvidence(magnesiumSignal, 'Magnesium result not visible'));
    missingDataNotes.push('Magnesium result not visible.');
  }

  if (workflowPlanGapSignal) {
    evidence.push({
      signalId: workflowPlanGapSignal.signalId,
      label: workflowPlanGapLabel(workflowPlanGapSignal)
    });
    if (!safeText(patient.plan, '')) {
      missingDataNotes.push('No clear electrolyte plan documented.');
    }
  }

  if (Array.isArray(patient.uncertainty)) {
    for (const note of patient.uncertainty) {
      const safeNote = safeText(note, null);
      if (safeNote && /no clear electrolyte plan documented/i.test(safeNote)) {
        missingDataNotes.push('No clear electrolyte plan documented.');
        break;
      }
    }
  }

  const hasRelevantEvidence = evidence.length > 0 || missingDataNotes.length > 0;
  if (!hasRelevantEvidence) return null;

  const freshness = freshnessFromSignal(latestRelevantSignal, 'current', 'Latest signal received in the current simulation feed.');

  return createCue({
    patientId: safePatientId(patient),
    category: 'documentation_gap',
    priority: 'high',
    title: 'Review suggested: documentation gap',
    explanation: joinSentences([
      'Simulation-only evidence suggests a documentation gap around the current electrolyte review.',
      evidence.some((item) => /potassium/i.test(item.label ?? '')) ? 'Potassium trend is part of the current evidence.' : null,
      missingDataNotes.length > 0 ? 'Missing information is visible in the simulation record.' : null
    ]),
    evidence,
    freshness,
    missingDataNotes,
    suggestedHumanReviewAction: 'Human review required: check the latest blood results, confirm the plan, and document the outcome.'
  });
}

function buildEscalationReadinessCue({ patient, signalIndex, signals, latestRelevantSignal, suggestions }) {
  const latestNews2Signal = signalIndex.news2 ?? latestSignal(signals, (signal) => isSignalCode(signal, 'news2'));
  const latestUrgentSuggestion = suggestions.find((suggestion) => suggestion.riskTier === 'urgent' || suggestion.riskType === 'missed_action');

  const latestNews2Value = toNumber(latestNews2Signal?.value);
  const hasActiveEscalation = patient.escalation === 'Active';
  const shouldFlag = latestNews2Value >= 7 || hasActiveEscalation || Boolean(latestUrgentSuggestion);
  if (!shouldFlag) return null;

  const evidence = [];
  if (latestNews2Signal) {
    evidence.push(signalEvidence(latestNews2Signal));
  }
  if (hasActiveEscalation) {
    evidence.push({ label: 'Active escalation is visible in the simulation workspace.' });
  }
  if (latestUrgentSuggestion) {
    evidence.push({
      label: safeText(latestUrgentSuggestion.title, 'Simulation risk-support signal requires review')
    });
  }

  return createCue({
    patientId: safePatientId(patient),
    category: 'escalation_readiness',
    priority: 'high',
    title: 'Review suggested: escalation readiness',
    explanation: joinSentences([
      latestNews2Value >= 7 ? `NEWS2 ${latestNews2Value} is visible in the simulation record.` : null,
      hasActiveEscalation ? 'An active escalation is already present.' : null,
      latestUrgentSuggestion ? 'A simulation risk suggestion also needs human review.' : null
    ]),
    evidence,
    freshness: freshnessFromSignal(latestNews2Signal ?? latestRelevantSignal, 'current', 'Current simulation evidence is available.'),
    missingDataNotes: [],
    suggestedHumanReviewAction: 'Human review required: confirm escalation ownership and document the next step.'
  });
}

function buildRiskSupportCue({ suggestion, patient }) {
  const evidence = normaliseSuggestionEvidence(suggestion);
  const freshness = suggestionFreshness(suggestion);
  const title = safeText(
    `Review suggested: ${suggestion.title}`,
    'Review suggested: risk-support signal'
  );
  const explanation = joinSentences([
    'Simulation-only risk-support signal.',
    safeText(suggestion.suggestedFlag, null),
    safeText(suggestion.suggestedBlocker, null)
  ]);
  const humanReviewAction = safeText(
    suggestion.suggestedTask,
    'Human review required: review the signal evidence and document the action.'
  );

  return createCue({
    patientId: safePatientId(patient),
    category: 'risk_support_signal',
    priority: suggestion.riskTier === 'urgent' ? 'high' : suggestion.riskTier === 'watch' ? 'medium' : 'low',
    title,
    explanation,
    evidence,
    freshness,
    missingDataNotes: normaliseMissingData(suggestion.missingData),
    suggestedHumanReviewAction: humanReviewAction.startsWith('Human review required')
      ? humanReviewAction
      : `Human review required: ${humanReviewAction}`
  });
}

function buildHandoverCue({ patient }) {
  const handoverComplete = toNumber(patient.handoverComplete);
  const openTasks = Array.isArray(patient.tasks)
    ? patient.tasks.filter((task) => task && task.status !== 'Done')
    : [];

  if ((handoverComplete == null || handoverComplete >= 100) && openTasks.length === 0) {
    return null;
  }

  return createCue({
    patientId: safePatientId(patient),
    category: 'handover_cue',
    priority: 'medium',
    title: 'Review suggested: handover cue',
    explanation: joinSentences([
      handoverComplete == null
        ? 'Handover completion is not available in the simulation workspace.'
        : `Handover is ${handoverComplete}% complete.`,
      openTasks.length > 0 ? `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} remain.` : null,
      patient.escalation === 'Active' ? 'An active escalation may need to be handed over clearly.' : null
    ]),
    evidence: [
      ...(handoverComplete == null ? [] : [{ label: `Handover complete: ${handoverComplete}%` }]),
      ...(openTasks.length > 0 ? [{ label: `Open tasks: ${openTasks.length}` }] : []),
      ...(patient.escalation === 'Active' ? [{ label: 'Active escalation is visible.' }] : [])
    ],
    freshness: freshnessFromPatient('current', 'Derived from the current simulation workspace state.'),
    missingDataNotes: openTasks.length > 0 ? ['Outstanding tasks remain visible.'] : [],
    suggestedHumanReviewAction: 'Human review required: confirm ownership of outstanding tasks and update the handover summary.'
  });
}

function buildDischargeReadinessCue({ patient }) {
  const dischargeBlockers = Array.isArray(patient.dischargeBlockers)
    ? patient.dischargeBlockers.map((blocker) => safeText(blocker, null)).filter(Boolean)
    : [];
  const dischargeReady = patient.dischargeReady === true;
  if (dischargeReady && dischargeBlockers.length === 0) {
    return null;
  }

  return createCue({
    patientId: safePatientId(patient),
    category: 'discharge_readiness_blocker',
    priority: 'medium',
    title: 'Review suggested: discharge-readiness blocker',
    explanation: joinSentences([
      dischargeReady ? 'Discharge is marked ready in the simulation workspace.' : 'Discharge is not ready in the simulation workspace.',
      dischargeBlockers.length > 0 ? 'One or more blockers are still visible.' : null
    ]),
    evidence: [
      { label: `Discharge ready: ${dischargeReady ? 'Yes' : 'No'}` },
      ...dischargeBlockers.map((blocker) => ({ label: `Blocker: ${blocker}` }))
    ],
    freshness: freshnessFromPatient('current', 'Derived from the current simulation workspace state.'),
    missingDataNotes: dischargeBlockers.length > 0 ? dischargeBlockers.map((blocker) => `${blocker}.`) : [],
    suggestedHumanReviewAction: 'Human review required: confirm which blocker remains and document the discharge plan.'
  });
}

function buildScenarioLearningCue({ documentationCue, escalationCue, handoverCue, dischargeCue }) {
  const scenario = pickScenario({
    documentationCue,
    escalationCue,
    handoverCue,
    dischargeCue
  });

  if (!scenario) return null;

  return createCue({
    patientId: documentationCue?.patientId ?? escalationCue?.patientId ?? handoverCue?.patientId ?? dischargeCue?.patientId ?? 'unknown',
    category: 'scenario_learning',
    priority: 'low',
    title: `Scenario learning cue: ${scenario.title}`,
    explanation: joinSentences([
      safeText(scenario.reviewPrompt, null),
      'Use this simulation example to compare evidence, missing information, and review actions.'
    ]),
    evidence: [
      { label: scenario.wardContext },
      ...(scenario.successSignals?.length > 0 ? [{ label: scenario.successSignals[0] }] : []),
      ...(scenario.hazards?.length > 0 ? [{ label: scenario.hazards[0] }] : [])
    ].filter((item) => safeText(item.label, null)),
    freshness: freshnessFromPatient('current', 'Derived from the current simulation scenario library.'),
    missingDataNotes: [],
    suggestedHumanReviewAction: 'Human review required: compare the current cues with the scenario checklist and record any learning point.'
  });
}

function buildFallbackCue({ patient }) {
  return createCue({
    patientId: safePatientId(patient),
    category: 'simulation_fallback',
    priority: 'medium',
    title: 'Review suggested: simulation data unavailable',
    explanation: 'SafeFlow could not build review cues from the current simulation signal feed. Human review required.',
    evidence: [{ label: 'Signal data missing or malformed in simulation.' }],
    freshness: freshnessFromMissingData(),
    missingDataNotes: ['Signal timeline unavailable or malformed.'],
    suggestedHumanReviewAction: 'Human review required: confirm the simulation patient record and rerun the signal feed.'
  });
}

function pickScenario({ documentationCue, escalationCue, handoverCue, dischargeCue }) {
  if (documentationCue) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-electrolyte-aki') ?? null;
  }
  if (escalationCue || handoverCue) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-sepsis-handover') ?? null;
  }
  if (dischargeCue) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-discharge-blocker') ?? null;
  }
  return null;
}

function normaliseRecords(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isPlainObject).slice().sort((left, right) => timestamp(right) - timestamp(left) || stableId(right).localeCompare(stableId(left)));
}

function normaliseSuggestionEvidence(suggestion) {
  return (Array.isArray(suggestion.evidence) ? suggestion.evidence : [])
    .filter(isPlainObject)
    .map((item) => ({
      label: safeText(item.label, null),
      signalCode: safeText(item.signalCode, null)
    }))
    .filter((item) => item.label)
    .map((item) => ({ label: item.label, ...(item.signalCode ? { signalCode: item.signalCode } : {}) }));
}

function normaliseMissingData(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => safeText(item, null))
    .filter(Boolean)
    .map((item) => (item.endsWith('.') ? item : `${item}.`));
}

function buildEscalationCue({ patient, latestRelevantSignal, suggestions }) {
  const latestNews2Signal = latestSignal([...(signalListFromPatient(patient)), ...latestRelevantSignal ? [latestRelevantSignal] : []], (signal) => isSignalCode(signal, 'news2'));
  const latestNews2Value = toNumber(latestNews2Signal?.value);
  const urgentSuggestion = suggestions.find((suggestion) => suggestion.riskTier === 'urgent' || suggestion.riskType === 'missed_action');
  const hasActiveEscalation = patient.escalation === 'Active';
  const shouldFlag = latestNews2Value >= 7 || hasActiveEscalation || Boolean(urgentSuggestion);
  if (!shouldFlag) return null;

  const evidence = [];
  if (latestNews2Signal) {
    evidence.push(signalEvidence(latestNews2Signal));
  }
  if (hasActiveEscalation) {
    evidence.push({ label: 'Active escalation is visible in the simulation workspace.' });
  }
  if (urgentSuggestion) {
    evidence.push({ label: safeText(urgentSuggestion.title, 'Simulation risk-support signal requires review') });
  }

  return createCue({
    patientId: safePatientId(patient),
    category: 'escalation_readiness',
    priority: 'high',
    title: 'Review suggested: escalation readiness',
    explanation: joinSentences([
      latestNews2Value >= 7 ? `NEWS2 ${latestNews2Value} is visible in the simulation record.` : null,
      hasActiveEscalation ? 'An active escalation is already present.' : null,
      urgentSuggestion ? 'A simulation risk suggestion also needs human review.' : null
    ]),
    evidence,
    freshness: freshnessFromSignal(latestNews2Signal ?? latestRelevantSignal, 'current', 'Current simulation evidence is available.'),
    missingDataNotes: [],
    suggestedHumanReviewAction: 'Human review required: confirm escalation ownership and document the next step.'
  });
}

function compareCues(left, right) {
  const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
  if (priorityDelta !== 0) return priorityDelta;

  const categoryDelta = categoryRank(left.category) - categoryRank(right.category);
  if (categoryDelta !== 0) return categoryDelta;

  return stableTitle(left.title).localeCompare(stableTitle(right.title));
}

function compareSuggestions(left, right) {
  return timestamp(right) - timestamp(left) || stableId(left).localeCompare(stableId(right));
}

function createCue({
  patientId,
  category,
  priority,
  title,
  explanation,
  evidence,
  freshness,
  missingDataNotes,
  suggestedHumanReviewAction
}) {
  return {
    cueId: `cue-${safeIdSegment(patientId)}-${category}`,
    type: 'review_suggested',
    category,
    title: safeText(title, 'Review suggested: simulation review'),
    explanation: safeText(explanation, 'Simulation-only review cue. Human review required.'),
    evidence: Array.isArray(evidence) ? evidence.filter(isPlainObject).map((item) => ({
      ...(item.signalId ? { signalId: item.signalId } : {}),
      ...(item.suggestionId ? { suggestionId: item.suggestionId } : {}),
      label: safeText(item.label, 'Simulation evidence available.')
    })) : [],
    freshness,
    missingDataNotes: Array.isArray(missingDataNotes) ? missingDataNotes.filter(Boolean) : [],
    suggestedHumanReviewAction: safeText(
      suggestedHumanReviewAction,
      'Human review required: review the simulation evidence and document the outcome.'
    ),
    priority,
    humanReviewRequired: true,
    simulationOnly: true
  };
}

function signalEvidence(signal, fallbackLabel) {
  return {
    signalId: signal.signalId,
    label: safeText(fallbackLabel ?? signalLabel(signal), 'Simulation signal available.')
  };
}

function signalLabel(signal) {
  const displayName = safeText(signal.displayName, 'Signal');
  const value = signal.value == null || signal.value === '' ? 'result not visible' : safeText(String(signal.value), 'result not visible');
  const unit = signal.unit ? ` ${safeText(signal.unit, '')}` : '';
  const status = signal.status ? ` ${safeText(signal.status, 'current')}` : '';
  const time = signalTimeLabel(signal);
  return `${displayName} ${value}${unit}${status} at ${time}`.replace(/\s+/g, ' ').trim();
}

function workflowPlanGapLabel(signal) {
  const displayName = safeText(signal.displayName, 'Monitoring plan');
  const value = safeText(String(signal.value ?? 'unclear'), 'unclear');
  return `${displayName} ${value} at ${signalTimeLabel(signal)}`.replace(/\s+/g, ' ').trim();
}

function signalTimeLabel(signal) {
  const value = signal.effectiveAt ?? signal.resultedAt ?? signal.receivedAt;
  if (!value) return 'unknown time';
  return String(value).slice(11, 16);
}

function freshnessFromSignal(signal, state, note) {
  if (!signal) return freshnessFromMissingData();
  return {
    state: safeText(signal.sourceFreshness, state ?? 'current'),
    note: safeText(note ?? `Latest signal received at ${signalTimeLabel(signal)}.`, 'Latest signal received in the current simulation feed.')
  };
}

function freshnessFromPatient(state, note) {
  return {
    state: state ?? 'current',
    note: note ?? 'Derived from the current simulation workspace state.'
  };
}

function freshnessFromMissingData() {
  return {
    state: 'unavailable',
    note: 'No usable signal timeline is available.'
  };
}

function latestSignal(signals, predicate) {
  return signals.filter(predicate).sort((left, right) => timestamp(right) - timestamp(left) || stableId(right).localeCompare(stableId(left)))[0] ?? null;
}

function signalListFromPatient(patient) {
  if (!isPlainObject(patient) || !Array.isArray(patient.observations)) return [];
  return patient.observations.map((observation, index) => ({
    signalId: observation.id ?? `observation-${index + 1}`,
    syntheticPatientRef: patient.id,
    sourceSystem: 'simulation-workspace',
    sourceType: 'observation',
    signalCode: 'news2',
    displayName: 'NEWS2',
    value: observation.news2,
    status: 'final',
    effectiveAt: observation.time ? `2026-06-10T${String(observation.time).slice(0, 5)}:00.000Z` : null,
    sourceFreshness: 'current',
    simulationOnly: true
  }));
}

function indexSignals(signals) {
  return {
    potassium: latestSignal(signals, (signal) => isSignalCode(signal, 'potassium')),
    magnesium: latestSignal(signals, (signal) => isSignalCode(signal, 'magnesium')),
    news2: latestSignal(signals, (signal) => isSignalCode(signal, 'news2')),
    workflowPlanGap: latestSignal(signals, (signal) => isWorkflowPlanGapSignal(signal))
  };
}

function isSimulationSignal(signal) {
  return isPlainObject(signal) && signal.simulationOnly === true && typeof signal.signalId === 'string' && typeof signal.syntheticPatientRef === 'string';
}

function isSimulationSuggestion(suggestion) {
  return isPlainObject(suggestion) && suggestion.simulationOnly === true && suggestion.requiresHumanReview === true && typeof suggestion.suggestionId === 'string';
}

function isWorkflowPlanGapSignal(signal) {
  const value = String(signal?.value ?? '').trim();
  return isSignalCode(signal, 'electrolyte_plan_gap') || /unclear/i.test(value);
}

function isSignalCode(signal, code) {
  return String(signal?.signalCode ?? '').toLowerCase() === code.toLowerCase();
}

function isMissingSignal(signal) {
  return signal.status === 'missing' || signal.value == null || signal.value === '';
}

function safeText(value, fallback) {
  if (value == null) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  return UNSAFE_TEXT_PATTERN.test(text) ? fallback : text;
}

function joinSentences(parts) {
  return parts
    .filter(Boolean)
    .map((part) => String(part).trim().replace(/\.$/, ''))
    .join('. ')
    .concat(parts.some(Boolean) ? '.' : '');
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function timestamp(item) {
  return Date.parse(item?.effectiveAt ?? item?.resultedAt ?? item?.receivedAt ?? item?.createdAt ?? item?.updatedAt ?? '') || 0;
}

function stableId(item) {
  return String(item?.signalId ?? item?.suggestionId ?? item?.cueId ?? '');
}

function stableTitle(value) {
  return String(value ?? '');
}

function priorityRank(priority) {
  return PRIORITY_ORDER[priority] ?? PRIORITY_ORDER.medium;
}

function categoryRank(category) {
  return CATEGORY_ORDER[category] ?? CATEGORY_ORDER.simulation_fallback;
}

function safeIdSegment(value) {
  const segment = String(value ?? 'unknown').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return segment || 'unknown';
}

function dedupeCues(cues) {
  const seen = new Set();
  const deduped = [];

  for (const cue of cues) {
    if (seen.has(cue.cueId)) continue;
    seen.add(cue.cueId);
    deduped.push(cue);
  }

  return deduped;
}

function safePatientId(patient) {
  return isPlainObject(patient) && typeof patient.id === 'string' && patient.id.trim() ? patient.id : 'unknown';
}

function suggestionFreshness(suggestion) {
  const stamp = suggestion.updatedAt ?? suggestion.createdAt;
  if (!stamp) return freshnessFromMissingData();
  return {
    state: 'current',
    note: `Suggestion created at ${String(stamp).slice(11, 16)}.`
  };
}
