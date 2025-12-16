import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDemoData } from './utils/demoData'
import { AGDataReset } from './utils/agDataReset'

// Initialize demo data
initializeDemoData();

// AG data reset is now manual - no automatic reset on every page load

// Development diagnostics (light logging)
if (import.meta.env.DEV) {
  console.debug('[dev-init] HMR active, CPU optimizations enabled');
  console.debug('[dev-init] AGDataReset: manual only (use /debug-indexeddb)');
  console.debug('[dev-init] Event debounce: 150ms for UI sync events');
}

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

// Automatic test disabled to reduce CPU usage in development
// Run manually via console: runAutomaticTest() if needed

createRoot(document.getElementById("root")!).render(<App />);
