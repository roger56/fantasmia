import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { autoCleanupRussiaStories } from '@/utils/cleanupStories';

createRoot(document.getElementById("root")!).render(<App />);

// Auto cleanup stories containing "russia"
autoCleanupRussiaStories();
