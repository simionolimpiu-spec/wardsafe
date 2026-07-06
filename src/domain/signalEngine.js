import { discoveryScenarios } from '../data/scenarioLibrary.js';
import { guardSimulationSignalOutputs } from './signalOutputGuard.js';

const CATEGORY_ORDER = {
  documentation: 0,
  'electrolyte-review': 1,
  'infection-review': 2,
  'sepsis-screen': 3,
  'falls-risk': 4,
  'medication-timing': 5,
  'deteriorating-obs': 6,
  escalation: 7,
  handover: 8,
  discharge: 9,
  learning: 10,
  'simulation-fallback': 11
};

const PRIORITY_ORDER = {
  blocker: 0,
  review: 1,
  watch: 2,
  learning: 3
};

export function buildSimulationSignals({
  patient,
  signals,
  suggestions,
  snapshotMeta: rawSnapshotMeta
} = {}) {
  const safePatient = isPlainObject(patient) ? patient : {};
  const patientId = safePatientId(safePatient);
  const snapshotMeta = normaliseSnapshotMeta(rawSnapshotMeta);
  const timelineSignals = normaliseSignals(signals, patientId);
  const riskSuggestions = normaliseSuggestions(suggestions, patientId);
  const signalIndex = indexSignals(timelineSignals);

  if (snapshotIsUnavailable(snapshotMeta) && timelineSignals.length === 0 && riskSuggestions.length === 0) {
    return guardSimulationSignalOutputs([buildFallbackSignal({ patient: safePatient, snapshotMeta })]);
  }

  const builtSignals = [
    buildDocumentationSignal({ patient: safePatient, signalIndex }),
    buildElectrolyteReviewSignal({ patient: safePatient, signalIndex, suggestions: riskSuggestions }),
    buildInfectionReviewSignal({ patient: safePatient, signalIndex, suggestions: riskSuggestions }),
    buildSepsisScreenSignal({ patient: safePatient, signalIndex }),
    buildFallsRiskSignal({ patient: safePatient, signalIndex }),
    buildMedicationTimingSignal({ patient: safePatient, signalIndex }),
    buildDeterioratingObsSignal({ patient: safePatient, signalIndex }),
    buildEscalationSignal({ patient: safePatient, signalIndex, suggestions: riskSuggestions }),
    buildHandoverSignal({ patient: safePatient }),
    buildDischargeSignal({ patient: safePatient }),
    buildLearningSignal({ patient: safePatient, signalIndex })
  ].filter(Boolean);

  const dedupedSignals = dedupeSignals(builtSignals).sort(compareSignals);
  const signalsToGuard = dedupedSignals.length > 0
    ? dedupedSignals
    : [buildFallbackSignal({ patient: safePatient })];

  return guardSimulationSignalOutputs(signalsToGuard);
}

export function buildSimulationReviewCues(input) {
  return buildSimulationSignals(input);
}

function buildDocumentationSignal({ patient, signalIndex }) {
  const evidence = [];
  const missingDataNotes = [];

  if (signalIndex.potassium) {
    evidence.push(signalEvidence(signalIndex.potassium));
  }
  if (signalIndex.magnesiumMissing) {
    evidence.push(signalEvidence(signalIndex.magnesiumMissing, 'Magnesium result not visible'));
    missingDataNotes.push('Magnesium result not visible.');
  }
  if (signalIndex.planGap) {
    evidence.push(signalEvidence(signalIndex.planGap, workflowSignalLabel(signalIndex.planGap)));
  }
  if (!safeText(patient.plan)) {
    missingDataNotes.push('No clear electrolyte plan documented.');
  }

  const normalisedNotes = uniqueStrings(missingDataNotes);
  if (evidence.length === 0 && normalisedNotes.length === 0) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'documentation',
    priority: 'review',
    title: 'Review suggested: documentation gap',
    explanation: joinSentences([
      'Simulation-only cue highlighting a documentation gap.',
      evidence.length > 0 ? 'Evidence to check is visible in the fictional record.' : null,
      normalisedNotes.length > 0 ? 'Missing information is also visible in the simulation workflow.' : null
    ]),
    evidence,
    suggestedHumanReviewAction: 'Human review required: confirm the visible evidence and document the current review status.',
    freshness: freshnessFromSignals([signalIndex.planGap, signalIndex.potassium, signalIndex.magnesiumMissing]),
    missingDataNotes: normalisedNotes
  });
}

function buildElectrolyteReviewSignal({ patient, signalIndex, suggestions }) {
  const potassiumSignal = signalIndex.potassium;
  const latestPotassium = latestLab(patient.labs?.potassium);
  const firstPotassium = firstLab(patient.labs?.potassium);
  const latestCreatinine = latestLab(patient.labs?.creatinine);
  const firstCreatinine = firstLab(patient.labs?.creatinine);
  const relatedSuggestion = suggestions.find((suggestion) => matchesReviewTheme(suggestion, ['electrolyte', 'potassium', 'magnesium']));

  const potassiumLow = toNumber(potassiumSignal?.value) != null && toNumber(potassiumSignal?.value) <= 3.4;
  const potassiumFalling = firstPotassium && latestPotassium && latestPotassium.value < firstPotassium.value;
  const renalChange = firstCreatinine && latestCreatinine && latestCreatinine.value > firstCreatinine.value;
  const needsReview = potassiumLow || potassiumFalling || renalChange || Boolean(relatedSuggestion);
  if (!needsReview) {
    return null;
  }

  const evidence = [];
  if (potassiumSignal) {
    evidence.push(signalEvidence(potassiumSignal));
  }
  if (signalIndex.magnesiumMissing) {
    evidence.push(signalEvidence(signalIndex.magnesiumMissing, 'Magnesium result not visible'));
  }
  if (renalChange) {
    evidence.push({
      id: 'renal-function-change',
      label: `Creatinine changed from ${firstCreatinine.value} to ${latestCreatinine.value}`
    });
  }
  if (relatedSuggestion) {
    const derivedSuggestionEvidence = suggestionEvidence(relatedSuggestion);
    if (derivedSuggestionEvidence.length > 0) {
      evidence.push(...derivedSuggestionEvidence);
    } else {
      evidence.push({
        id: relatedSuggestion.suggestionId,
        label: safeText(relatedSuggestion.title, 'Simulation risk-support signal requires review')
      });
    }
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'electrolyte-review',
    priority: 'review',
    title: 'Review suggested: electrolyte review',
    explanation: joinSentences([
      'Simulation-only cue highlighting electrolyte evidence to check.',
      potassiumLow ? 'A low potassium result is visible in the fictional signal feed.' : null,
      renalChange ? 'Changing renal function is also visible in the fictional record.' : null,
      signalIndex.magnesiumMissing ? 'A missing magnesium result remains visible.' : null
    ]),
    evidence,
    suggestedHumanReviewAction: 'Human review required: review the visible blood trend, confirm ownership, and document the outcome.',
    freshness: freshnessFromSignals([potassiumSignal, signalIndex.magnesiumMissing]),
    missingDataNotes: signalIndex.magnesiumMissing ? ['Magnesium result not visible.'] : []
  });
}

function buildInfectionReviewSignal({ patient, signalIndex, suggestions }) {
  const hasSepsisFlag = Array.isArray(patient.riskFlags)
    && patient.riskFlags.some((flag) => /sepsis concern/i.test(String(flag)));
  const urineCultureSignal = signalIndex.urineCulture;
  const news2Signal = signalIndex.news2;
  const relatedSuggestion = suggestions.find((suggestion) => matchesReviewTheme(suggestion, ['sepsis', 'infection', 'culture']));
  const shouldShow = hasSepsisFlag || Boolean(urineCultureSignal) || Boolean(relatedSuggestion);
  if (!shouldShow) {
    return null;
  }

  const evidence = [];
  if (hasSepsisFlag) {
    evidence.push({ id: 'risk-flag-sepsis-concern', label: 'Risk flag: Sepsis Concern' });
  }
  if (news2Signal) {
    evidence.push(signalEvidence(news2Signal, observationSignalLabel(news2Signal)));
  }
  if (urineCultureSignal) {
    evidence.push(signalEvidence(urineCultureSignal));
  }
  if (patient.escalation === 'Active') {
    evidence.push({ id: 'active-escalation', label: 'Active escalation is visible in the simulation workspace.' });
  }
  if (relatedSuggestion) {
    evidence.push({
      id: relatedSuggestion.suggestionId,
      label: safeText(relatedSuggestion.title, 'Simulation risk-support signal requires review')
    });
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'infection-review',
    priority: 'review',
    title: 'Review suggested: infection review',
    explanation: joinSentences([
      'Simulation-only cue highlighting infection-related evidence to check.',
      hasSepsisFlag ? 'A sepsis concern flag is visible in the fictional workflow.' : null,
      urineCultureSignal ? 'A microbiology signal is also visible in the current simulation feed.' : null
    ]),
    evidence,
    suggestedHumanReviewAction: 'Human review required: confirm the visible escalation context and update the handover or documentation summary.',
    freshness: freshnessFromSignals([news2Signal, urineCultureSignal]),
    missingDataNotes: []
  });
}

function buildSepsisScreenSignal({ patient, signalIndex }) {
  const sepsisScreenSignal = signalIndex.sepsisScreen;
  if (!sepsisScreenSignal) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'sepsis-screen',
    priority: 'review',
    title: 'Review suggested: sepsis-screen cue',
    explanation: joinSentences([
      'Simulation-only cue highlighting sepsis-screen evidence to check.',
      'A sepsis-screen signal is visible in the fictional workflow.'
    ]),
    evidence: [signalEvidence(sepsisScreenSignal)],
    suggestedHumanReviewAction: 'Human review required: confirm the visible sepsis-screen status and document the outcome.',
    freshness: freshnessFromSignals([sepsisScreenSignal]),
    missingDataNotes: []
  });
}

function buildFallsRiskSignal({ patient, signalIndex }) {
  const fallsRiskSignal = signalIndex.fallsRisk;
  if (!fallsRiskSignal) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'falls-risk',
    priority: 'watch',
    title: 'Review suggested: falls-risk cue',
    explanation: joinSentences([
      'Simulation-only cue highlighting falls-risk evidence to check.',
      'A falls-risk signal is visible in the fictional workflow.'
    ]),
    evidence: [signalEvidence(fallsRiskSignal)],
    suggestedHumanReviewAction: 'Human review required: confirm the visible falls-risk context and document the outcome.',
    freshness: freshnessFromSignals([fallsRiskSignal]),
    missingDataNotes: []
  });
}

function buildMedicationTimingSignal({ patient, signalIndex }) {
  const medicationTimingSignal = signalIndex.medicationTiming;
  if (!medicationTimingSignal) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'medication-timing',
    priority: 'review',
    title: 'Review suggested: medication-timing cue',
    explanation: joinSentences([
      'Simulation-only cue highlighting medication-timing evidence to check.',
      'A medication-timing signal is visible in the fictional workflow.'
    ]),
    evidence: [signalEvidence(medicationTimingSignal)],
    suggestedHumanReviewAction: 'Human review required: confirm the visible medication timing and document the outcome.',
    freshness: freshnessFromSignals([medicationTimingSignal]),
    missingDataNotes: []
  });
}

function buildDeterioratingObsSignal({ patient, signalIndex }) {
  const deterioratingObsSignal = signalIndex.deterioratingObs;
  if (!deterioratingObsSignal) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'deteriorating-obs',
    priority: 'blocker',
    title: 'Review suggested: deteriorating observations cue',
    explanation: joinSentences([
      'Simulation-only cue highlighting deteriorating observations to check.',
      'A worsening observation trend is visible in the fictional workflow.'
    ]),
    evidence: [signalEvidence(deterioratingObsSignal)],
    suggestedHumanReviewAction: 'Human review required: confirm the visible observation trend and document the next review step.',
    freshness: freshnessFromSignals([deterioratingObsSignal]),
    missingDataNotes: []
  });
}

function buildEscalationSignal({ patient, signalIndex, suggestions }) {
  const news2Signal = signalIndex.news2;
  const news2Value = toNumber(news2Signal?.value);
  const urgentSuggestion = suggestions.find((suggestion) => suggestion.riskTier === 'urgent' || suggestion.riskType === 'missed_action');
  const hasActiveEscalation = patient.escalation === 'Active';
  if (!hasActiveEscalation && news2Value == null && !urgentSuggestion) {
    return null;
  }

  const evidence = [];
  if (news2Signal) {
    evidence.push(signalEvidence(news2Signal, observationSignalLabel(news2Signal)));
  }
  if (hasActiveEscalation) {
    evidence.push({ id: 'active-escalation', label: 'Active escalation is visible in the simulation workspace.' });
  }
  if (urgentSuggestion) {
    evidence.push({
      id: urgentSuggestion.suggestionId,
      label: safeText(urgentSuggestion.title, 'Simulation risk-support signal requires review')
    });
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'escalation',
    priority: 'watch',
    title: 'Review suggested: escalation readiness',
    explanation: joinSentences([
      'Simulation-only cue highlighting escalation readiness.',
      news2Value != null ? `NEWS2 ${news2Value} is visible in the fictional record.` : null,
      hasActiveEscalation ? 'An active escalation is already present.' : null
    ]),
    evidence,
    suggestedHumanReviewAction: 'Human review required: confirm escalation ownership and document the next review step.',
    freshness: freshnessFromSignals([news2Signal]),
    missingDataNotes: []
  });
}

function buildHandoverSignal({ patient }) {
  const handoverComplete = toNumber(patient.handoverComplete);
  const openTasks = Array.isArray(patient.tasks)
    ? patient.tasks.filter((task) => task && task.status !== 'Done')
    : [];
  const needsHandoverReview = handoverComplete == null || handoverComplete < 100 || openTasks.length > 0 || patient.escalation === 'Active';
  if (!needsHandoverReview) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'handover',
    priority: 'watch',
    title: 'Review suggested: handover cue',
    explanation: joinSentences([
      handoverComplete == null ? 'Handover completion is not visible in the current simulation workspace.' : `Handover is ${handoverComplete}% complete.`,
      openTasks.length > 0 ? `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} remain visible.` : null,
      patient.escalation === 'Active' ? 'The active escalation may need clear handover ownership.' : null
    ]),
    evidence: [
      ...(handoverComplete == null ? [] : [{ id: 'handover-complete', label: `Handover ${handoverComplete}% complete` }]),
      ...openTasks.map((task) => ({
        id: task.id,
        label: `Open task: ${safeText(task.label, 'Visible task')}`
      })),
      ...(patient.escalation === 'Active' ? [{ id: 'handover-escalation', label: 'Active escalation is visible.' }] : [])
    ],
    suggestedHumanReviewAction: 'Human review required: confirm task ownership and update the handover summary.',
    freshness: {
      state: 'current',
      label: 'Derived from the current simulation workspace state'
    },
    missingDataNotes: []
  });
}

function buildDischargeSignal({ patient }) {
  const dischargeBlockers = Array.isArray(patient.dischargeBlockers)
    ? patient.dischargeBlockers.map((blocker, index) => ({
        id: `blocker-${index + 1}`,
        label: safeText(blocker)
      })).filter((blocker) => blocker.label)
    : [];
  if (patient.dischargeReady === true && dischargeBlockers.length === 0) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'discharge',
    priority: 'blocker',
    title: 'Review suggested: discharge-readiness blocker',
    explanation: joinSentences([
      patient.dischargeReady === true
        ? 'The fictional patient is marked discharge ready, but a visible blocker still needs review.'
        : 'The fictional patient is not yet ready for discharge in the current workspace.',
      dischargeBlockers.length > 0 ? 'One or more discharge-readiness blockers remain visible.' : null
    ]),
    evidence: [
      { id: 'discharge-ready', label: `Discharge ready: ${patient.dischargeReady === true ? 'Yes' : 'No'}` },
      ...dischargeBlockers.map((blocker) => ({
        id: blocker.id,
        label: `Blocker: ${blocker.label}`
      }))
    ],
    suggestedHumanReviewAction: 'Human review required: confirm which discharge blocker remains and document the current plan.',
    freshness: {
      state: 'current',
      label: 'Derived from the current simulation workspace state'
    },
    missingDataNotes: dischargeBlockers.map((blocker) => `${blocker.label}.`)
  });
}

function buildLearningSignal({ patient, signalIndex }) {
  const scenario = pickScenario({ patient, signalIndex });
  if (!scenario) {
    return null;
  }

  return createSignal({
    patientId: safePatientId(patient),
    category: 'learning',
    priority: 'learning',
    title: `Scenario learning cue: ${scenario.title}`,
    explanation: joinSentences([
      'Simulation-only cue for learning and audit review.',
      safeText(scenario.reviewPrompt),
      'Use this structured review prompt to compare visible evidence, missing information, and the current workflow response.'
    ]),
    evidence: [
      { id: `${scenario.id}-context`, label: safeText(scenario.wardContext, 'Simulation scenario context') },
      ...(scenario.successSignals?.length ? [{ id: `${scenario.id}-success`, label: safeText(scenario.successSignals[0]) }] : []),
      ...(scenario.hazards?.length ? [{ id: `${scenario.id}-hazard`, label: safeText(scenario.hazards[0]) }] : [])
    ].filter((item) => item.label),
    suggestedHumanReviewAction: 'Human review required: compare the current simulation cues with the scenario learning points and record any observation.',
    freshness: {
      state: 'current',
      label: 'Derived from the current simulation scenario library'
    },
    missingDataNotes: []
  });
}

function buildFallbackSignal({ patient, snapshotMeta = null }) {
  const missingDataNotes = Array.isArray(snapshotMeta?.missingDataNotes) && snapshotMeta.missingDataNotes.length > 0
    ? snapshotMeta.missingDataNotes
    : ['Signal timeline unavailable or malformed.'];

  return createSignal({
    patientId: safePatientId(patient),
    category: 'simulation-fallback',
    priority: 'review',
    title: 'Review suggested: simulation data unavailable',
    explanation: 'Simulation-only cue. No usable signal snapshot is available for this fictional patient yet.',
    evidence: [{ id: 'missing-snapshot', label: 'Signal timeline unavailable or malformed in simulation.' }],
    suggestedHumanReviewAction: 'Human review required: confirm the fictional patient record and refresh the simulation signal feed.',
    freshness: snapshotMeta?.sourceFreshness ?? {
      state: 'unavailable',
      label: 'No signal freshness available'
    },
    missingDataNotes
  });
}

function createSignal({
  patientId,
  category,
  priority,
  title,
  explanation,
  evidence,
  suggestedHumanReviewAction,
  freshness,
  missingDataNotes
}) {
  return {
    id: `simulation-signal-${safeIdSegment(patientId)}-${safeIdSegment(category)}`,
    category,
    priority,
    title,
    explanation,
    evidence: Array.isArray(evidence) ? evidence : [],
    suggestedHumanReviewAction,
    simulationOnly: true,
    humanReviewRequired: true,
    unsafeClinicalAdvice: false,
    freshness: freshness ?? null,
    missingDataNotes: Array.isArray(missingDataNotes) ? missingDataNotes : []
  };
}

function normaliseSignals(signals, patientId) {
  return normaliseRecords(signals)
    .filter(
      (signal) =>
        signal.simulationOnly === true &&
        typeof signal.signalId === 'string' &&
        typeof signal.syntheticPatientRef === 'string' &&
        signal.syntheticPatientRef.trim() === patientId
    )
    .sort(compareByTime);
}

function normaliseSuggestions(suggestions, patientId) {
  return normaliseRecords(suggestions)
    .filter(
      (suggestion) =>
        suggestion.simulationOnly === true &&
        suggestion.requiresHumanReview === true &&
        typeof suggestion.suggestionId === 'string' &&
        typeof suggestion.syntheticPatientRef === 'string' &&
        suggestion.syntheticPatientRef.trim() === patientId
    )
    .sort(compareByTime);
}

function normaliseSnapshotMeta(snapshotMeta) {
  if (!isPlainObject(snapshotMeta)) {
    return null;
  }

  const sourceFreshness = isPlainObject(snapshotMeta.sourceFreshness)
    ? {
        state: safeText(snapshotMeta.sourceFreshness.state, 'unavailable'),
        label: safeText(snapshotMeta.sourceFreshness.label, 'No signal freshness available')
      }
    : null;

  return {
    sourceFreshness,
    missingDataNotes: Array.isArray(snapshotMeta.missingDataNotes)
      ? snapshotMeta.missingDataNotes.filter(Boolean).map((note) => String(note).trim()).filter(Boolean)
      : []
  };
}

function snapshotIsUnavailable(snapshotMeta) {
  return snapshotMeta?.sourceFreshness?.state === 'unavailable';
}

function indexSignals(signals) {
  return {
    potassium: findLatestSignal(signals, (signal) => isSignalCode(signal, 'potassium')),
    magnesiumMissing: findLatestSignal(signals, (signal) => isSignalCode(signal, 'magnesium') && isMissingSignal(signal)),
    news2: findLatestSignal(signals, (signal) => isSignalCode(signal, 'news2')),
    planGap: findLatestSignal(signals, (signal) => isSignalCode(signal, 'electrolyte_plan_gap') || /unclear/i.test(String(signal.value ?? ''))),
    urineCulture: findLatestSignal(signals, (signal) => isSignalCode(signal, 'urine_culture')),
    sepsisScreen: findLatestSignal(signals, (signal) => isSignalCode(signal, 'sepsis_screen')),
    fallsRisk: findLatestSignal(signals, (signal) => isSignalCode(signal, 'falls_risk')),
    medicationTiming: findLatestSignal(signals, (signal) => isSignalCode(signal, 'medication_timing')),
    deterioratingObs: findLatestSignal(signals, (signal) => isSignalCode(signal, 'deteriorating_obs')),
    respiratoryRateSignals: findSignals(signals, (signal) => isSignalCode(signal, 'respiratory_rate')),
    confusionSignal: findLatestSignal(signals, (signal) => isSignalCode(signal, 'confusion')),
    oxygenSaturationSignals: findSignals(signals, (signal) => isSignalCode(signal, 'oxygen_saturation'))
  };
}

function pickScenario({ patient, signalIndex }) {
  if (signalIndex.deterioratingObs) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-surgical-postop-deterioration') ?? null;
  }

  if (signalIndex.sepsisScreen) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-paediatric-sepsis-screen') ?? null;
  }

  if (signalIndex.fallsRisk) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-community-falls-risk') ?? null;
  }

  if (signalIndex.medicationTiming) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-community-medication-timing') ?? null;
  }

  if (isRisingTrend(signalIndex.respiratoryRateSignals)) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-respiratory-rate-trend') ?? null;
  }

  if (signalIndex.confusionSignal) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-new-onset-confusion') ?? null;
  }

  if (isFallingTrend(signalIndex.oxygenSaturationSignals)) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-falling-oxygen-saturation') ?? null;
  }

  if (signalIndex.potassium || signalIndex.magnesiumMissing || signalIndex.planGap) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-electrolyte-aki') ?? null;
  }

  if (Array.isArray(patient.riskFlags) && patient.riskFlags.some((flag) => /sepsis concern/i.test(String(flag)))) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-sepsis-handover') ?? null;
  }

  if (patient.dischargeReady === false || (Array.isArray(patient.dischargeBlockers) && patient.dischargeBlockers.length > 0)) {
    return discoveryScenarios.find((scenario) => scenario.id === 'scenario-discharge-blocker') ?? null;
  }

  return null;
}

function signalEvidence(signal, fallbackLabel) {
  return {
    id: signal.signalId,
    label: fallbackLabel ?? signalLabel(signal)
  };
}

function signalLabel(signal) {
  const displayName = safeText(signal.displayName, 'Signal');
  const value = signal.value == null || signal.value === '' ? 'result not visible' : safeText(String(signal.value), 'result not visible');
  const unit = signal.unit ? ` ${safeText(signal.unit)}` : '';
  const status = signal.status ? ` ${safeText(signal.status)}` : '';
  return `${displayName} ${value}${unit}${status} at ${signalTimeLabel(signal)}`.replace(/\s+/g, ' ').trim();
}

function workflowSignalLabel(signal) {
  const displayName = safeText(signal?.displayName, 'Signal');
  const value = signal?.value == null || signal.value === '' ? 'result not visible' : safeText(String(signal.value), 'result not visible');
  return `${displayName} ${value} at ${signalTimeLabel(signal)}`.replace(/\s+/g, ' ').trim();
}

function observationSignalLabel(signal) {
  const displayName = safeText(signal?.displayName, 'Signal');
  const value = signal?.value == null || signal.value === '' ? 'result not visible' : safeText(String(signal.value), 'result not visible');
  return `${displayName} ${value} at ${signalTimeLabel(signal)}`.replace(/\s+/g, ' ').trim();
}

function suggestionEvidence(suggestion) {
  if (!Array.isArray(suggestion?.evidence)) {
    return [];
  }

  return suggestion.evidence
    .map((item, index) => {
      const label = safeText(item?.label);
      if (!label) {
        return null;
      }

      return {
        id: typeof item?.signalCode === 'string' && item.signalCode.trim()
          ? `suggestion-evidence-${item.signalCode.trim().toLowerCase()}`
          : `${suggestion.suggestionId}-evidence-${index + 1}`,
        label
      };
    })
    .filter(Boolean);
}

function freshnessFromSignals(signals) {
  const latestSignal = [...signals].filter(Boolean).sort(compareByTime)[0] ?? null;
  if (!latestSignal) {
    return {
      state: 'current',
      label: 'Derived from the current fictional workflow state'
    };
  }

  return {
    state: safeText(latestSignal.sourceFreshness, 'current'),
    label: `Latest simulated signal feed at ${signalTimeLabel(latestSignal)}`
  };
}

function normaliseRecords(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isPlainObject).map((record) => clone(record));
}

function dedupeSignals(signals) {
  const seen = new Set();
  const deduped = [];

  for (const signal of signals) {
    if (seen.has(signal.id)) {
      continue;
    }
    seen.add(signal.id);
    deduped.push(signal);
  }

  return deduped;
}

function compareSignals(left, right) {
  const categoryDelta = categoryRank(left.category) - categoryRank(right.category);
  if (categoryDelta !== 0) {
    return categoryDelta;
  }

  const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return String(left.id).localeCompare(String(right.id));
}

function compareByTime(left, right) {
  return timestamp(right) - timestamp(left) || stableId(left).localeCompare(stableId(right));
}

function findLatestSignal(signals, predicate) {
  return signals.filter(predicate).sort(compareByTime)[0] ?? null;
}

function findSignals(signals, predicate) {
  return signals.filter(predicate).sort(compareByTime);
}

function isRisingTrend(signals) {
  if (!Array.isArray(signals) || signals.length < 2) {
    return false;
  }

  const latestValue = toNumber(signals[0]?.value);
  const earliestValue = toNumber(signals[signals.length - 1]?.value);
  return latestValue != null && earliestValue != null && latestValue > earliestValue;
}

function isFallingTrend(signals) {
  if (!Array.isArray(signals) || signals.length < 2) {
    return false;
  }

  const latestValue = toNumber(signals[0]?.value);
  const earliestValue = toNumber(signals[signals.length - 1]?.value);
  return latestValue != null && earliestValue != null && latestValue < earliestValue;
}

function matchesReviewTheme(suggestion, keywords) {
  const haystack = [
    suggestion?.title,
    suggestion?.suggestedFlag,
    suggestion?.suggestedBlocker,
    suggestion?.riskType
  ].map((value) => String(value ?? '').toLowerCase()).join(' ');

  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function isSignalCode(signal, code) {
  return String(signal?.signalCode ?? '').toLowerCase() === code.toLowerCase();
}

function isMissingSignal(signal) {
  return signal?.status === 'missing' || signal?.value == null || signal?.value === '';
}

function signalTimeLabel(signal) {
  const value = signal?.effectiveAt ?? signal?.resultedAt ?? signal?.receivedAt;
  return typeof value === 'string' && value.length >= 16 ? value.slice(11, 16) : 'unknown time';
}

function firstLab(values) {
  return Array.isArray(values) && values.length > 0 ? values[0] : null;
}

function latestLab(values) {
  return Array.isArray(values) && values.length > 0 ? values[values.length - 1] : null;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeText(value, fallback = null) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function joinSentences(parts) {
  const sentences = parts
    .filter(Boolean)
    .map((part) => String(part).trim().replace(/\.$/, ''));

  return sentences.length > 0 ? `${sentences.join('. ')}.` : '';
}

function toNumber(value) {
  if (value == null || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function timestamp(record) {
  return Date.parse(record?.effectiveAt ?? record?.resultedAt ?? record?.receivedAt ?? record?.createdAt ?? record?.updatedAt ?? '') || 0;
}

function stableId(record) {
  return String(record?.signalId ?? record?.suggestionId ?? record?.id ?? '');
}

function categoryRank(category) {
  return CATEGORY_ORDER[category] ?? CATEGORY_ORDER['simulation-fallback'];
}

function priorityRank(priority) {
  return PRIORITY_ORDER[priority] ?? PRIORITY_ORDER.review;
}

function safePatientId(patient) {
  return typeof patient?.id === 'string' && patient.id.trim() ? patient.id.trim() : 'unknown';
}

function safeIdSegment(value) {
  const segment = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return segment || 'unknown';
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
