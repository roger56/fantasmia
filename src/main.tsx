import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDemoData } from './utils/demoData'

// Initialize demo data
initializeDemoData();

// Filter external contentScript errors to reduce console noise
window.addEventListener('error', (event) => {
  const errorSource = event.filename || event.error?.stack || '';
  if (errorSource.includes('contentScript.js') || errorSource.includes('recorder.js')) {
    event.preventDefault();
    console.debug('[ext-noise] External script error filtered:', event.error?.message || event.message);
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const errorSource = event.reason?.stack || String(event.reason);
  if (errorSource.includes('contentScript.js') || errorSource.includes('recorder.js')) {
    event.preventDefault();
    console.debug('[ext-noise] External script promise rejection filtered:', event.reason);
  }
});

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
