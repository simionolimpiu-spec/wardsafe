import { useEffect, useRef, useState } from 'react';
import { Building2, Eye, EyeOff, LockKeyhole, ShieldCheck, Stethoscope } from 'lucide-react';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { PRIMARY_CARE_PATHWAY, WARD_PATHWAY } from './data/primaryCareScenarios.js';

export const SIMULATION_SESSION_KEY = 'safeflow:simulation-session';
export const SIMULATION_PATHWAY_KEY = 'safeflow:simulation-pathway';

function hasSimulationSession() {
  return typeof window !== 'undefined' && window.sessionStorage.getItem(SIMULATION_SESSION_KEY) === 'active';
}

function getSimulationPathway() {
  if (typeof window === 'undefined') return WARD_PATHWAY;
  const requestedPathway = new URLSearchParams(window.location.search).get('pathway');
  if ([WARD_PATHWAY, PRIMARY_CARE_PATHWAY].includes(requestedPathway)) return requestedPathway;
  const storedPathway = window.sessionStorage.getItem(SIMULATION_PATHWAY_KEY);
  return [WARD_PATHWAY, PRIMARY_CARE_PATHWAY].includes(storedPathway) ? storedPathway : WARD_PATHWAY;
}

export function SimulationAccessGate({ children }) {
  const reduceMotion = useReducedMotion();
  const [isSignedIn, setIsSignedIn] = useState(hasSimulationSession);
  const [pathway, setPathway] = useState(getSimulationPathway);
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (!isSignedIn) return;
    window.requestAnimationFrame(() => workspaceRef.current?.querySelector('h1')?.focus());
  }, [isSignedIn]);

  function signIn(selectedPathway = pathway) {
    window.sessionStorage.setItem(SIMULATION_SESSION_KEY, 'active');
    window.sessionStorage.setItem(SIMULATION_PATHWAY_KEY, selectedPathway);
    setPathway(selectedPathway);
    setIsSignedIn(true);
  }

  function switchPathway(selectedPathway) {
    if (![WARD_PATHWAY, PRIMARY_CARE_PATHWAY].includes(selectedPathway)) return;
    window.sessionStorage.setItem(SIMULATION_PATHWAY_KEY, selectedPathway);
    setPathway(selectedPathway);
  }

  function signOut() {
    window.sessionStorage.removeItem(SIMULATION_SESSION_KEY);
    window.sessionStorage.removeItem(SIMULATION_PATHWAY_KEY);
    setIsSignedIn(false);
  }

  return (
    <LazyMotion features={domAnimation} strict>
      {isSignedIn ? (
        <m.div
          animate={{ opacity: 1 }}
          initial={reduceMotion ? false : { opacity: 0 }}
          ref={workspaceRef}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          {typeof children === 'function' ? children({ pathway, signOut, switchPathway }) : children}
        </m.div>
      ) : (
        <SimulationSignIn initialPathway={pathway} onSignIn={signIn} reduceMotion={reduceMotion} />
      )}
    </LazyMotion>
  );
}

function SimulationSignIn({ initialPathway, onSignIn, reduceMotion }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pathway, setPathway] = useState(initialPathway);
  const [errors, setErrors] = useState({});
  const errorSummaryRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter an email address in the expected format.';
    }

    if (password.length < 8) {
      nextErrors.password = 'Enter at least 8 characters for this prototype session.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    onSignIn(pathway);
  }

  return (
    <main className="access-shell">
      <a className="skip-link" href="#simulation-sign-in">Skip to sign in</a>
      <m.section
        animate={{ opacity: 1, y: 0 }}
        className="access-introduction"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
      >
        <div className="access-brand">
          <span aria-hidden="true" className="access-brand-mark">SF</span>
          <div>
            <strong>SafeFlow Nursing</strong>
            <span>Simulation-only prototype</span>
          </div>
        </div>

        <div className="access-copy">
          <p className="access-kicker"><ShieldCheck aria-hidden="true" size={18} /> Structured review support</p>
          <h1>Clearer care workflows, with clinical judgement kept central.</h1>
          <p>
            Review fictional ward or primary care activity, surface documentation gaps and support safer coordination in a learning environment.
          </p>
        </div>

        <dl className="access-benefits">
          <div>
            <dt>Documentation</dt>
            <dd>Explainable cues make missing or unclear records easier to review.</dd>
          </div>
          <div>
            <dt>Continuity</dt>
            <dd>Structured checks help teams review handover and continuity records.</dd>
          </div>
          <div>
            <dt>Escalation</dt>
            <dd>Human-led escalation readiness remains visible and auditable.</dd>
          </div>
        </dl>

        <p className="access-boundary">
          Fictional patient data only. Structured review support for simulation. Human review required; clinical judgement remains central. Not for live clinical use.
        </p>
      </m.section>

      <m.section
        animate={{ opacity: 1, y: 0 }}
        aria-labelledby="simulation-sign-in-title"
        className="access-card"
        id="simulation-sign-in"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        transition={{ delay: reduceMotion ? 0 : 0.05, duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
      >
        <div className="access-card-heading">
          <span aria-hidden="true" className="access-lock"><LockKeyhole size={20} /></span>
          <div>
            <p>Prototype access</p>
            <h2 id="simulation-sign-in-title">Sign in to SafeFlow</h2>
          </div>
        </div>
        <p className="access-card-intro">
          This local gate demonstrates the intended sign-in experience. It is not production authentication.
        </p>

        {Object.keys(errors).length > 0 && (
          <div className="access-error-summary" ref={errorSummaryRef} role="alert" tabIndex="-1">
            <strong>There is a problem</strong>
            <ul>
              {errors.email && <li><a href="#simulation-email">{errors.email}</a></li>}
              {errors.password && <li><a href="#simulation-password">{errors.password}</a></li>}
            </ul>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit}>
          <fieldset className="pathway-choice">
            <legend>Choose simulation pathway</legend>
            <label className={pathway === WARD_PATHWAY ? 'is-selected' : ''}>
              <input
                checked={pathway === WARD_PATHWAY}
                name="simulation-pathway"
                onChange={() => setPathway(WARD_PATHWAY)}
                type="radio"
                value={WARD_PATHWAY}
              />
              <Building2 aria-hidden="true" size={20} />
              <span><strong>Ward care</strong><small>Ward review, handover and discharge readiness</small></span>
            </label>
            <label className={pathway === PRIMARY_CARE_PATHWAY ? 'is-selected' : ''}>
              <input
                checked={pathway === PRIMARY_CARE_PATHWAY}
                name="simulation-pathway"
                onChange={() => setPathway(PRIMARY_CARE_PATHWAY)}
                type="radio"
                value={PRIMARY_CARE_PATHWAY}
              />
              <Stethoscope aria-hidden="true" size={20} />
              <span><strong>Primary care</strong><small>Access, continuity, referrals and follow-up</small></span>
            </label>
          </fieldset>

          <div className="access-field">
            <label htmlFor="simulation-email">Work email</label>
            <input
              aria-describedby={errors.email ? 'simulation-email-error simulation-access-note' : 'simulation-access-note'}
              aria-invalid={Boolean(errors.email)}
              autoComplete="username"
              id="simulation-email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            {errors.email && <span className="access-field-error" id="simulation-email-error">{errors.email}</span>}
          </div>

          <div className="access-field">
            <label htmlFor="simulation-password">Password</label>
            <div className="password-field">
              <input
                aria-describedby={errors.password ? 'simulation-password-error simulation-access-note' : 'simulation-access-note'}
                aria-invalid={Boolean(errors.password)}
                autoComplete="current-password"
                id="simulation-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="password-visibility"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
              </button>
            </div>
            {errors.password && <span className="access-field-error" id="simulation-password-error">{errors.password}</span>}
          </div>

          <p className="access-note" id="simulation-access-note">
            For prototype review, use any email-shaped address and at least 8 characters. Credentials are not sent or stored.
          </p>
          <button className="access-submit" type="submit">Enter simulation workspace</button>
        </form>

        <p className="access-human-review"><ShieldCheck aria-hidden="true" size={17} /> Human review required throughout</p>
      </m.section>
    </main>
  );
}
