import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline caching and installation
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available, auto-updating...');
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for complete offline use.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
