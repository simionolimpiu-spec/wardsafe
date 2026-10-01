# SafeFlow agent foundation (SF-305)

Simulation-only groundwork for AI review support. Fictional data only. Human review required. Not clinically validated and not for clinical decision-making. Code: `src/agent/`.

## Trust tiers

Every item the agent handles carries one tier. The tier decides what the item may be used for.

| Tier | Example | Can instruct the model | Can be stored as a fact |
| --- | --- | --- | --- |
| `source-fact` | A fictional potassium result with provenance | No | Yes |
| `deterministic-derivation` | A lab trend or rule-based review cue | No | No, it is derived |
| `ai-interpretation` | A model-drafted review | No | No, never |
| `human-decision` | A nurse accepts, edits or rejects the draft | No | Recorded as an event |
| `reference-knowledge` | Evidence corpus records | No | No |

Only instructions made by `createSystemInstruction` can instruct a model. Identity is held in a WeakSet, so copies or look-alike objects are refused.

## Boundaries enforced in code

- Tools are read-only. Names must start with `get`, permissions must start with `read:`, and input and output schemas are closed.
- Clinical free text, retrieved knowledge and earlier AI output reach the model only inside escaped `untrusted_data` blocks.
- Model output must match a closed schema, cite only evidence IDs that were in the prompt, stay within length limits, and avoid banned wording (diagnosis, prescribing, dosing, discharge safety, autonomy). Anything else is rejected with a code.
- External model providers are disabled. Only the mock provider runs in this build.
- Sessions are append-only. Human review and recorded actions need a human actor. A session cannot be completed while an AI review is waiting for human review.

## Not yet built

The scenario debrief that uses this layer (Build Plan Go 6). A real provider behind the existing OpenAI SBAR provider pattern, which stays off unless a key is set.
