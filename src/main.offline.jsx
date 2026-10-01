// ---------------------------------------------------------------------------
// WardSafe / SafeFlow — OFFLINE SINGLE-FILE ENTRY POINT
//
// Identical to main.jsx except for two things:
//   1. Imports the latin-only Inter subsets, so the inlined font payload stays
//      small enough to ship as one self-contained .html file.
//   2. Neutralises the optional backend API before the app mounts (below).
//
// This file is ONLY used by the offline build. main.jsx is untouched.
// ---------------------------------------------------------------------------
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import App from './App.jsx';
import { PrimaryCareApp } from './PrimaryCareApp.jsx';
import { SimulationAccessGate } from './SimulationAccessGate.jsx';
import { PRIMARY_CARE_PATHWAY } from './data/primaryCareScenarios.js';
import { MotionProvider } from './motion/index.jsx';
import './styles/index.css';

// --- Offline API shim -------------------------------------------------------
// The signal/audit/draft clients optionally enrich the simulation from a local
// API server. In the offline build there is no server, and on a static origin
// the browser blocks the request anyway — which works (every client already
// treats a failure as "return null" and falls back to local computation) but
// fills the console with CORS errors and adds a visible delay on first paint.
//
// Intercepting /api/* here means the clients get an immediate, clean "no data"
// answer and never touch the network at all. Nothing else is affected.
const realFetch = globalThis.fetch?.bind(globalThis);
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input?.url ?? '';
  if (/(^|\/)api\/(simulation|audit|drafts?|readiness|workspace)/.test(url)) {
    return Promise.resolve(
      new Response(null, { status: 503, statusText: 'Offline build — no API' })
    );
  }
  return realFetch ? realFetch(input, init) : Promise.reject(new Error('fetch unavailable'));
};
// ---------------------------------------------------------------------------

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionProvider>
      <SimulationAccessGate>
        {({ pathway, signOut, switchPathway }) => pathway === PRIMARY_CARE_PATHWAY
          ? <PrimaryCareApp onPathwayChange={switchPathway} onSignOut={signOut} />
          : <App onPathwayChange={switchPathway} onSignOut={signOut} initialView="hospitals" />}
      </SimulationAccessGate>
    </MotionProvider>
  </React.StrictMode>
);
