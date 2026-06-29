import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const appWiringMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  requestRiskSuggestions: vi.fn(),
  requestSignalTimeline: vi.fn()
}));

vi.mock('./state/useSimulationWorkspace.js', async () => {
  const actual = await vi.importActual('./state/useSimulationWorkspace.js');
  const workspace = await vi.importActual('./state/simulationWorkspace.js');

  return {
    ...actual,
    useSimulationWorkspace: () => ({
      state: workspace.createInitialSimulationState(),
      dispatch: appWiringMocks.dispatch,
      reset: vi.fn()
    })
  };
});

vi.mock('./services/signalClient.js', () => ({
  requestRiskSuggestions: appWiringMocks.requestRiskSuggestions,
  requestSignalTimeline: appWiringMocks.requestSignalTimeline
}));

import App from './App.jsx';

describe('App signal wiring', () => {
  beforeEach(() => {
    appWiringMocks.dispatch.mockReset();
    appWiringMocks.requestRiskSuggestions.mockReset();
    appWiringMocks.requestSignalTimeline.mockReset();
  });

  it('dispatches a safe signal snapshot for the selected fictional patient', async () => {
    appWiringMocks.requestSignalTimeline.mockResolvedValue([
      {
        signalId: 'signal-dcu-031-news2-0915',
        syntheticPatientRef: 'DCU-031',
        simulationOnly: true,
        sourceFreshness: 'current',
        effectiveAt: '2026-06-10T09:15:00.000Z'
      }
    ]);
    appWiringMocks.requestRiskSuggestions.mockResolvedValue([
      {
        suggestionId: 'suggestion-dcu-031-electrolyte-review',
        syntheticPatientRef: 'DCU-031',
        simulationOnly: true,
        requiresHumanReview: true,
        title: 'Review suggested: electrolyte review'
      }
    ]);

    render(<App />);

    await waitFor(() => {
      expect(appWiringMocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'signal/snapshotStored',
          payload: expect.objectContaining({
            patientId: 'DCU-031',
            snapshot: expect.objectContaining({
              signalTimeline: expect.arrayContaining([
                expect.objectContaining({
                  signalId: 'signal-dcu-031-news2-0915'
                })
              ]),
              riskSuggestions: expect.arrayContaining([
                expect.objectContaining({
                  suggestionId: 'suggestion-dcu-031-electrolyte-review'
                })
              ]),
              sourceFreshness: expect.objectContaining({ state: 'current' }),
              receivedAt: '2026-06-10T09:15:00.000Z'
            })
          })
        })
      );
    });

    expect(screen.getByRole('complementary', { name: /patient safety panel/i })).toBeInTheDocument();
  });

  it('dispatches a fallback snapshot when signal reads are unavailable', async () => {
    appWiringMocks.requestSignalTimeline.mockResolvedValue(null);
    appWiringMocks.requestRiskSuggestions.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(appWiringMocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'signal/snapshotStored',
          payload: expect.objectContaining({
            patientId: 'DCU-031',
            snapshot: expect.objectContaining({
              signalTimeline: [],
              riskSuggestions: [],
              sourceFreshness: expect.objectContaining({ state: 'unavailable' }),
              missingDataNotes: expect.arrayContaining(['No signal snapshot available yet.']),
              receivedAt: null
            })
          })
        })
      );
    });
  });
});
