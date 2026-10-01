import { isNonEmptyString } from './domainValues.js';

const systemInstructions = new WeakSet();

export function createSystemInstruction({ id, text }) {
  if (!isNonEmptyString(id) || !isNonEmptyString(text)) {
    throw new TypeError('System instruction id and text are required.');
  }
  const instruction = Object.freeze({
    type: 'system_instruction', origin: 'system-authored', id, text, simulationOnly: true
  });
  systemInstructions.add(instruction);
  return instruction;
}

export function isInstructionEligible(item) {
  return systemInstructions.has(item);
}
