import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDemoData } from './utils/demoData'

// Initialize demo data
initializeDemoData();

// Run automatic test when in development
if (import.meta.env.DEV) {
  import('./utils/storyManager').then(({ runAutomaticTest }) => {
    setTimeout(() => {
      runAutomaticTest().then(result => {
        console.log('M1 Test automatico:', result ? 'PASSED' : 'FAILED');
      });
    }, 2000); // Wait for initialization
  });
}

createRoot(document.getElementById("root")!).render(<App />);
