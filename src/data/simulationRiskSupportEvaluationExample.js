import { simulationRiskSupportEvaluationScenarios } from './simulationRiskSupportEvaluationScenarios.js';
import { evaluateSimulationRiskSupportScenarios } from '../domain/simulationRiskSupportEvaluation.js';

export const simulationRiskSupportEvaluationExample = evaluateSimulationRiskSupportScenarios({
  scenarios: simulationRiskSupportEvaluationScenarios
});
