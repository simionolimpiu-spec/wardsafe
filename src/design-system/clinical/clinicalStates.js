import {
  CircleCheck,
  CircleDashed,
  Eye,
  FlaskConical,
  GraduationCap,
  Info,
  OctagonAlert,
  Siren,
  TriangleAlert
} from 'lucide-react';

/**
 * Single source of truth for clinical state presentation (SF-295).
 * Feature components map data to a state here and never choose colours.
 * Spec: docs/design/SAFeflow-DESIGN.md section 3.2.
 *
 * These mappers only translate values that already exist in SafeFlow data.
 * They add no clinical thresholds.
 */
export const CLINICAL_STATES = Object.freeze({
  critical: { tone: 'critical', icon: OctagonAlert },
  warning: { tone: 'warning', icon: TriangleAlert },
  review: { tone: 'review', icon: Eye },
  information: { tone: 'information', icon: Info },
  success: { tone: 'success', icon: CircleCheck },
  neutral: { tone: 'neutral', icon: CircleDashed },
  simulation: { tone: 'simulation', icon: FlaskConical }
});

export function getClinicalState(state) {
  return CLINICAL_STATES[state] ?? CLINICAL_STATES.neutral;
}

function status(state, label, extra = {}) {
  return { state, label, ...extra };
}

/** patient.risk: 'High' | 'Medium' | 'Low'. */
export function riskStatus(risk) {
  const value = typeof risk === 'string' ? risk.trim() : '';
  const map = {
    high: status('critical', 'High risk'),
    medium: status('warning', 'Medium risk'),
    low: status('success', 'Low risk')
  };
  return map[value.toLowerCase()] ?? status('neutral', value ? `${value} risk` : 'Risk not recorded');
}

/** patient.escalation: 'Active' | 'Monitoring' | 'None'. */
export function escalationStatus(escalation) {
  const map = {
    Active: status('critical', 'Escalation active', { icon: Siren }),
    Monitoring: status('information', 'Monitoring'),
    None: status('neutral', 'No active escalation')
  };
  return map[escalation] ?? status('neutral', escalation ? `Escalation ${escalation}` : 'Escalation not recorded');
}

/** task.status: 'Due' | 'Done'. */
export function taskStatus(taskState) {
  const map = {
    Done: status('success', 'Done'),
    Due: status('information', 'Due')
  };
  return map[taskState] ?? status('neutral', taskState || 'Status not recorded');
}

/**
 * Review cue priority from the simulation signal engine.
 * Never critical: a cue is information requiring human review, not an alarm.
 */
export function reviewPriorityStatus(priority) {
  const map = {
    blocker: status('warning', 'Blocker', { icon: OctagonAlert }),
    review: status('review', 'Review'),
    watch: status('information', 'Watch'),
    learning: status('neutral', 'Learning', { icon: GraduationCap })
  };
  return map[priority] ?? status('review', 'Review');
}

export const REVIEW_CATEGORY_LABELS = Object.freeze({
  documentation: 'Documentation',
  'electrolyte-review': 'Electrolyte review',
  'infection-review': 'Infection review',
  'sepsis-screen': 'Sepsis screen',
  'falls-risk': 'Falls risk',
  'medication-timing': 'Medication timing',
  'deteriorating-obs': 'Deteriorating observations',
  escalation: 'Escalation',
  handover: 'Handover',
  discharge: 'Discharge',
  learning: 'Learning',
  heuristic: 'Heuristic',
  'simulation-fallback': 'Fallback'
});

export function reviewCategoryLabel(category) {
  return REVIEW_CATEGORY_LABELS[category] ?? 'Simulation cue';
}
