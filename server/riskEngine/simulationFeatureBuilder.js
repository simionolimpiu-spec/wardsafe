export const SIGNAL_FEATURE_SET_VERSION = 'signal-features-v0';

export function buildSimulationSignalFeatures({ patientId, signals = [] } = {}) {
  const simulationSignals = signals
    .filter((signal) => signal?.simulationOnly === true)
    .filter((signal) => !patientId || signal.syntheticPatientRef === patientId);

  const latestNews2Signal = latestSignal(simulationSignals, (signal) =>
    normaliseCode(signal.signalCode) === 'news2'
  );
  const potassiumSignal = latestSignal(simulationSignals, (signal) =>
    normaliseCode(signal.signalCode) === 'potassium'
  );
  const magnesiumSignal = latestSignal(simulationSignals, (signal) =>
    normaliseCode(signal.signalCode) === 'magnesium'
  );
  const workflowPlanGapSignal = latestSignal(simulationSignals, (signal) =>
    normaliseCode(signal.signalCode).includes('plan_gap') ||
    normaliseCode(signal.value).includes('unclear')
  );
  const microbiologySignal = latestSignal(simulationSignals, (signal) =>
    signal.sourceType === 'microbiology' && signal.status === 'preliminary'
  );

  const latestNews2 = numericValue(latestNews2Signal?.value);
  const potassium = numericValue(potassiumSignal?.value);
  const lowPotassium = potassium != null && potassium < 3.5;
  const missingMagnesium = Boolean(
    magnesiumSignal &&
    (magnesiumSignal.status === 'missing' || magnesiumSignal.value == null || magnesiumSignal.value === '')
  );
  const workflowPlanGap = Boolean(workflowPlanGapSignal);
  const preliminaryMicrobiology = Boolean(microbiologySignal);
  const evidence = [];
  const missingData = [];

  if (lowPotassium) {
    evidence.push({
      signalId: potassiumSignal.signalId,
      label: `Potassium ${potassiumSignal.value} ${potassiumSignal.unit ?? ''} final at ${formatSignalTime(potassiumSignal)}`.replace(/\s+/g, ' ').trim()
    });
  }

  if (missingMagnesium) {
    evidence.push({
      signalId: magnesiumSignal.signalId,
      label: 'Magnesium result not visible'
    });
    missingData.push('Magnesium result not visible');
  }

  if (latestNews2 != null) {
    evidence.push({
      signalId: latestNews2Signal.signalId,
      label: `NEWS2 ${latestNews2} at ${formatSignalTime(latestNews2Signal)}`
    });
  }

  if (workflowPlanGap) {
    evidence.push({
      signalId: workflowPlanGapSignal.signalId,
      label: `Monitoring plan unclear at ${formatSignalTime(workflowPlanGapSignal)}`
    });
  }

  if (preliminaryMicrobiology) {
    evidence.push({
      signalId: microbiologySignal.signalId,
      label: `${microbiologySignal.displayName} ${microbiologySignal.value} at ${formatSignalTime(microbiologySignal)}`
    });
  }

  return {
    patientId,
    featureSetVersion: SIGNAL_FEATURE_SET_VERSION,
    latestNews2,
    lowPotassium,
    missingMagnesium,
    workflowPlanGap,
    preliminaryMicrobiology,
    evidence,
    missingData,
    simulationOnly: true
  };
}

function latestSignal(signals, predicate) {
  return signals
    .filter(predicate)
    .sort((left, right) => timestamp(right) - timestamp(left))[0] ?? null;
}

function numericValue(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function timestamp(signal) {
  return Date.parse(signal.effectiveAt ?? signal.resultedAt ?? signal.receivedAt ?? '') || 0;
}

function formatSignalTime(signal) {
  const value = signal.effectiveAt ?? signal.resultedAt ?? signal.receivedAt;
  if (!value) return 'unknown time';
  const date = value instanceof Date ? value.toISOString() : String(value);
  return date.slice(11, 16);
}

function normaliseCode(value) {
  return String(value ?? '').toLowerCase();
}
