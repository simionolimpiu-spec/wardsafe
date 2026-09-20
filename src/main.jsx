import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import App from './App.jsx';
import { PrimaryCareApp } from './PrimaryCareApp.jsx';
import { SimulationAccessGate } from './SimulationAccessGate.jsx';
import { PRIMARY_CARE_PATHWAY } from './data/primaryCareScenarios.js';
import { MotionProvider } from './motion/index.jsx';
import './styles/index.css';

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
