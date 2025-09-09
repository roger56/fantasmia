import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDemoData } from './utils/demoData'

// Initialize demo data
initializeDemoData();

// Run automatic test when in development (only if profile is available)
if (import.meta.env.DEV) {
  import('./utils/storyManager').then(({ runAutomaticTest }) => {
    import('./utils/profileManager').then(({ getCurrentProfileId }) => {
      setTimeout(() => {
        const currentProfileId = getCurrentProfileId();
        if (currentProfileId) {
          runAutomaticTest().then(result => {
            console.log('M1 Test automatico:', result ? 'PASSED' : 'FAILED');
          });
        } else {
          console.log('M1 Test automatico: SKIPPED (nessun profilo selezionato)');
        }
      }, 2000); // Wait for initialization
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
