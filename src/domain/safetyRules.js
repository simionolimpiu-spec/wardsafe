function latest(values) {
  return values?.[values.length - 1];
}

function first(values) {
  return values?.[0];
}

function hasDiuretic(medicines = []) {
  return medicines.some((medicine) => /furosemide|bumetanide|bendroflumethiazide|spironolactone/i.test(medicine));
}

export function evaluatePotassiumSafetyGap(patient) {
  const potassiumValues = patient.labs?.potassium ?? [];
  const magnesiumValues = patient.labs?.magnesium ?? [];
  const creatinineValues = patient.labs?.creatinine ?? [];
  const firstPotassium = first(potassiumValues);
  const latestPotassium = latest(potassiumValues);
  const firstCreatinine = first(creatinineValues);
  const latestCreatinine = latest(creatinineValues);
  const reasons = [];
  const missingInformation = [];
  const recommendedNursingActions = [
    'Check latest U&Es and magnesium result.',
    'Check observations, medicines chart and relevant local escalation route.',
    'Escalate to the medical team if no current plan is visible.',
    'Document concern, who was contacted, response and outcome.'
  ];

  const potassiumFalling = Boolean(
    firstPotassium &&
      latestPotassium &&
      latestPotassium.value < firstPotassium.value &&
      latestPotassium.value <= 3.4
  );

  if (potassiumFalling) {
    reasons.push(`Potassium has fallen from ${firstPotassium.value} to ${latestPotassium.value} mmol/L.`);
  } else {
    reasons.push('No low falling potassium trend detected.');
  }

  if (hasDiuretic(patient.medicines)) {
    reasons.push('Diuretic therapy is present.');
  }

  if (patient.symptoms?.some((symptom) => /weakness|poor oral intake|falls/i.test(symptom))) {
    reasons.push('Symptoms or context include weakness, poor intake or falls risk.');
  }

  if (firstCreatinine && latestCreatinine && latestCreatinine.value > firstCreatinine.value) {
    reasons.push('Renal function has changed since earlier bloods.');
  }

  if (magnesiumValues.length === 0) {
    missingInformation.push('Magnesium result not visible.');
  }

  if (!patient.plan?.trim()) {
    missingInformation.push('No clear electrolyte plan documented.');
  }

  const level = potassiumFalling && (hasDiuretic(patient.medicines) || missingInformation.length > 0) ? 'medium' : 'none';

  return {
    level,
    title: level === 'none' ? 'No electrolyte safety gap currently flagged' : 'Possible electrolyte / AKI safety gap',
    reasons,
    missingInformation,
    confidence: level === 'none' ? 'Low concern from current simulated evidence' : 'Moderate concern from simulated evidence',
    limitations: [
      'This is a simulated rule for workflow demonstration.',
      'SafeFlow cannot see live charts, prescribing decisions or local policy in this prototype.'
    ],
    recommendedNursingActions,
    boundary: 'SafeFlow supports recognition, checking, escalation and documentation; it does not prescribe, diagnose or replace clinical judgement.'
  };
}
