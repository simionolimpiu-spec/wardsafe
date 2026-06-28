import { discoveryScenarios } from './scenarioLibrary.js';
import { simulatedPatients } from './simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from '../domain/safetyRules.js';
import { buildSimulationRiskSupportContract } from '../domain/simulationRiskSupport.js';

const examplePatient = JSON.parse(JSON.stringify(simulatedPatients[0]));

export const simulationRiskSupportContractExample = buildSimulationRiskSupportContract({
  patient: examplePatient,
  journey: discoveryScenarios[0],
  safetyFlag: evaluatePotassiumSafetyGap(examplePatient)
});
