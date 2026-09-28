import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import PreloadGate from './components/loading/PreloadGate';
import './index.css';

try {
  const stored = localStorage.getItem('immo_theme');
  const dark =
    stored === 'dark' ||
    (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch {
  /* storage unavailable — theme resolves when ThemeProvider mounts */
}

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');

createRoot(container).render(
  <BrowserRouter>
    {/* Outermost so a crash inside a provider still leaves the user a recoverable screen
        instead of a blank page. */}
    <ErrorBoundary>
      <PreloadGate>
        <App />
      </PreloadGate>
    </ErrorBoundary>
  </BrowserRouter>,
);