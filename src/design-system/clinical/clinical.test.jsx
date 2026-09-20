import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { scanStrictSafetyLanguage } from '../../domain/safetyLanguage.js';
import { ClinicalStatusBadge } from './ClinicalStatusBadge.jsx';
import { ClinicalValue } from './ClinicalValue.jsx';
import { PatientBanner } from './PatientBanner.jsx';
import { REVIEW_CUE_BOUNDARY, ReviewCue, ReviewCueGroup } from './ReviewCue.jsx';
import { SafetyStatus } from './SafetyStatus.jsx';
import { escalationStatus, reviewPriorityStatus, riskStatus } from './clinicalStates.js';

const cue = {
  id: 'cue-1',
  category: 'documentation',
  priority: 'blocker',
  title: 'Review suggested: documentation gap',
  explanation: 'Simulation-only cue. Evidence to check is visible in the fictional record.',
  evidence: [{ label: 'Potassium 3.1 mmol/L final at 09:10' }],
  freshness: { label: 'Latest simulated signal feed' },
  missingDataNotes: ['Magnesium result not visible.'],
  suggestedHumanReviewAction: 'Human review required: confirm the visible evidence and document the outcome.',
  ruleId: 'documentation-gap',
  rationale: 'A documentation cue appears alongside an unresolved safety flag.',
  threshold: '1 documentation cue plus an unresolved safety flag'
};

const UNSAFE = /diagnos|prescrib|administer|treatment recommendation|AI decision|AI decided|automatic escalation|autonomous/i;

describe('clinical state mapping', () => {
  it('maps only existing data values and reserves critical for high risk and active escalation', () => {
    expect(riskStatus('High').state).toBe('critical');
    expect(riskStatus('Medium').state).toBe('warning');
    expect(riskStatus('Low').state).toBe('success');
    expect(riskStatus(undefined)).toEqual({ state: 'neutral', label: 'Risk not recorded' });
    expect(escalationStatus('Active').state).toBe('critical');
    expect(escalationStatus('Monitoring').state).toBe('information');
    expect(escalationStatus('None').state).toBe('neutral');
  });

  it('never maps any review cue priority to critical', () => {
    for (const priority of ['blocker', 'review', 'watch', 'learning', undefined, 'unexpected']) {
      expect(reviewPriorityStatus(priority).state).not.toBe('critical');
    }
  });
});

describe('ClinicalStatusBadge', () => {
  it('shows the state as visible text with a decorative icon, never colour alone', () => {
    render(<ClinicalStatusBadge status={riskStatus('High')} />);

    const label = screen.getByText('High risk');
    const badge = label.closest('.sf-badge');
    expect(badge).toHaveAttribute('data-state', 'critical');
    expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ClinicalValue', () => {
  it('shows "Not recorded" rather than inventing a value', () => {
    render(<ClinicalValue label="Magnesium" unit="mmol/L" value={null} />);
    expect(screen.getByText('Not recorded')).toBeInTheDocument();
    expect(screen.queryByText('mmol/L')).not.toBeInTheDocument();
  });
});

describe('SafetyStatus', () => {
  it('is a static notice and never a live alert', () => {
    render(<SafetyStatus role="note" aria-label="Patient review alert" status={escalationStatus('Active')}>Detail</SafetyStatus>);
    expect(screen.getByRole('note', { name: 'Patient review alert' })).toHaveTextContent('Escalation active');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('PatientBanner', () => {
  function renderBanner(props = {}) {
    return render(
      <PatientBanner
        allergies={['Penicillin', 'Latex']}
        context={[
          { label: 'Ward', value: 'Day Care Unit' },
          { label: 'Hospital', value: undefined },
          { label: 'Responsible nurse', value: 'Leanne Mitchell' }
        ]}
        displayName="DCU-031"
        identifiers={[{ label: 'Name', value: 'Patient 031' }, { label: 'Age', value: 57 }]}
        statuses={[riskStatus('High'), escalationStatus('Active')]}
        {...props}
      />
    );
  }

  it('exposes identity, simulation context, location, allergies and status in order', () => {
    renderBanner();

    const banner = screen.getByRole('region', { name: 'DCU-031' });
    expect(within(banner).getByRole('heading', { level: 2, name: 'DCU-031' })).toBeInTheDocument();
    expect(within(banner).getByText('Fictional scenario')).toBeInTheDocument();
    expect(within(banner).getByText('Patient 031')).toBeInTheDocument();
    expect(within(banner).getByText('Day Care Unit')).toBeInTheDocument();
    expect(banner).toHaveTextContent('Allergies: Penicillin, Latex');
    expect(within(banner).getByRole('list', { name: 'Current status' })).toHaveTextContent(/High risk.*Escalation active/);

    const text = banner.textContent;
    const order = ['DCU-031', 'Fictional scenario', 'Day Care Unit', 'Allergies', 'High risk'].map((part) => text.indexOf(part));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('omits context fields that the data does not contain', () => {
    renderBanner();
    expect(screen.queryByText('Hospital')).not.toBeInTheDocument();
  });

  it('states explicitly when no allergies are recorded, without claiming NKDA', () => {
    renderBanner({ allergies: [] });
    const banner = screen.getByRole('region', { name: 'DCU-031' });
    expect(banner).toHaveTextContent(/none recorded in this simulation record/i);
    expect(banner.textContent).not.toMatch(/NKDA|no known/i);
  });

  it('distinguishes unavailable allergy data from an empty list', () => {
    renderBanner({ allergies: undefined });
    expect(screen.getByRole('region', { name: 'DCU-031' })).toHaveTextContent(/information not available/i);
  });
});

describe('ReviewCue', () => {
  it('is an article with a heading, text metadata and the human review line', () => {
    render(<ReviewCue cue={cue} />);

    const article = screen.getByRole('article');
    expect(within(article).getByRole('heading', { level: 4, name: cue.title })).toBeInTheDocument();
    expect(within(article).getByText('Documentation')).toBeInTheDocument();
    expect(within(article).getByText('Blocker')).toBeInTheDocument();
    expect(within(article).getByText('Evidence to check')).toBeInTheDocument();
    expect(within(article).getByText('Magnesium result not visible.')).toBeInTheDocument();
    expect(within(article).getByText(/^Human review required:/)).toBeInTheDocument();
  });

  it('never renders in the critical tone, even at blocker priority', () => {
    const { container } = render(<ReviewCue cue={cue} />);
    expect(container.querySelector('.sf-tone-critical, [data-state="critical"]')).toBeNull();
  });

  it('puts the rule rationale in a focusable native disclosure', async () => {
    const user = userEvent.setup();
    render(<ReviewCue cue={cue} />);

    const summary = screen.getByText('Why flagged').closest('summary');
    const details = summary.closest('details');
    expect(details).not.toHaveAttribute('open');

    // Native <details>/<summary> gives Enter and Space toggling in browsers;
    // jsdom does not emulate that, so check focusability and activation.
    summary.focus();
    expect(summary).toHaveFocus();
    await user.click(summary);
    expect(details).toHaveAttribute('open');
    expect(details).toHaveTextContent(cue.rationale);
    expect(details).toHaveTextContent(cue.ruleId);
  });

  it('adds no unsafe clinical wording of its own', () => {
    const { container } = render(<ReviewCue cue={cue} />);
    expect(scanStrictSafetyLanguage(container.textContent).passed).toBe(true);
    expect(container.textContent).not.toMatch(UNSAFE);
  });
});

describe('ReviewCueGroup simulation boundary', () => {
  it('always shows the simulation-only, human review and not-clinically-validated wording', () => {
    for (const props of [{ cues: [cue] }, { cues: [] }, { available: false }]) {
      const { unmount } = render(<ReviewCueGroup headingId="cues" {...props} />);
      const region = screen.getByRole('region', { name: 'Simulation Review Cues' });
      expect(region).toHaveTextContent(REVIEW_CUE_BOUNDARY.summary);
      expect(region).toHaveTextContent('Not clinically validated and not for clinical decision-making.');
      expect(region.textContent).not.toMatch(UNSAFE);
      unmount();
    }
  });

  it('never uses a live alert role for cues', () => {
    render(<ReviewCueGroup cues={[cue]} headingId="cues" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows explicit unavailable and empty messages', () => {
    const { rerender } = render(<ReviewCueGroup available={false} headingId="cues" />);
    expect(screen.getByText('No signal snapshot available yet.')).toBeInTheDocument();

    rerender(<ReviewCueGroup cues={[]} headingId="cues" />);
    expect(screen.getByText('No current simulation review cues for this patient.')).toBeInTheDocument();
  });
});
