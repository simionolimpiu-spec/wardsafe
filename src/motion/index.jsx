/* WardSafe motion primitives
 * -----------------------------------------------------------------------------
 * Thin wrappers over framer-motion so that:
 *   1. every animated surface shares one set of durations and easings
 *      (mirrored from src/styles/motion.css),
 *   2. prefers-reduced-motion is handled once, here, not per component,
 *   3. no safety-bearing value can be animated into existence.
 *
 * Import from './motion' — do not import framer-motion directly in views.
 */
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';

export { AnimatePresence, motion, useReducedMotion };

/* Seconds, because framer-motion works in seconds. Keep in step with
 * src/styles/motion.css if either side changes. */
export const DURATION = {
  instant: 0.09,
  fast: 0.16,
  base: 0.24,
  slow: 0.32,
  exitFast: 0.11,
  exitBase: 0.16,
  exitSlow: 0.2
};

export const EASE = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.3, 0, 1, 1]
};

export const STAGGER = 0.04;

/* Wrap the app once. Sets the shared transition and, when the user asks for
 * reduced motion, tells framer-motion to drop transform/layout animation and
 * keep only opacity — the documented "reducedMotion: user" behaviour. */
export function MotionProvider({ children }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.base, ease: EASE.standard }}
    >
      {children}
    </MotionConfig>
  );
}

/* ---------------------------------------------------------------------------
 * Variants
 * ------------------------------------------------------------------------- */

/* Content arriving in place — cards, panels, popovers. */
export const rise = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.decelerate } },
  exit: { opacity: 0, y: 4, transition: { duration: DURATION.exitBase, ease: EASE.accelerate } }
};

/* Replacing content inside the same container — view switches. Crossfade only,
 * no directional slide: nurses switch views laterally and a directional wipe
 * implies a hierarchy that is not there. */
export const crossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: DURATION.exitFast, ease: EASE.standard } }
};

/* Drawers slide from the edge they are anchored to, preserving spatial
 * continuity with the control that opened them. */
export const drawerRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: DURATION.slow, ease: EASE.decelerate } },
  exit: { opacity: 0, x: 24, transition: { duration: DURATION.exitSlow, ease: EASE.accelerate } }
};

/* Parent of a list/grid. Children use `staggerItem`. */
export const staggerList = {
  initial: {},
  animate: { transition: { staggerChildren: STAGGER } },
  exit: {}
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.decelerate } },
  exit: { opacity: 0, transition: { duration: DURATION.exitFast } }
};

/* Press feedback for tappable cards and buttons. */
export const press = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.985 },
  transition: { duration: DURATION.instant, ease: EASE.standard }
};

/* ---------------------------------------------------------------------------
 * Safety guard
 * -------------------------------------------------------------------------
 * Use for any element carrying a clinical value: an escalation count, a
 * risk-support signal, a documentation gap, a NEWS-style total.
 *
 * The value is rendered immediately and is never animated. Only the
 * surrounding surface is allowed a fade, and only to draw the eye to a change
 * the nurse has already been told about in text. There is no count-up, no
 * number roll, and no delayed reveal — a number that is mid-animation is a
 * number that can be misread, and a screen reader would announce a value the
 * eye cannot yet confirm.
 */
export function SafetyValue({ children, className, changed = false }) {
  const reduced = useReducedMotion();
  if (reduced || !changed) {
    return <span className={className}>{children}</span>;
  }
  return (
    <motion.span
      className={className}
      /* Opacity floor of 0.55 — the value stays legible throughout. */
      initial={{ opacity: 0.55 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.fast, ease: EASE.standard }}
    >
      {children}
    </motion.span>
  );
}
