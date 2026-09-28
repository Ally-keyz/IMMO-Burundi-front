import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import type { Language } from '@immo/shared-types';
import { DEFAULT_LANGUAGE, translate } from '../i18n/translations';

const STORAGE_KEY = 'immo_language';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom crash screen. Receives a reset callback that re-renders the children. */
  fallback?: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Reads the persisted language directly - this component sits above LanguageProvider,
 *  so calling useLanguage() here would throw inside the crash handler. */
function currentLanguage(): Language {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'en' || raw === 'fr' || raw === 'sw' ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function ErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }): JSX.Element {
  const lang = currentLanguage();
  const t = (key: string): string => translate(lang, key);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-surface p-6 text-center shadow-pop">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-notVerified/10">
          <AlertTriangle className="h-6 w-6 text-notVerified" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-gray-900">{t('error.generic')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('error.boundaryBody')}</p>

        {error.message ? (
          <p className="mt-4 max-h-24 overflow-y-auto rounded-lg bg-gray-50 p-3 text-left font-mono text-xs break-words text-gray-600">
            {error.message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={onRetry} className="btn-primary justify-center">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('error.retry')}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-outline justify-center"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('error.reload')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Catches render/lifecycle errors so one broken component cannot blank the whole app. */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    /* Surfaced in the console only - there is no error reporting service wired up yet. */
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset);
    return <ErrorScreen error={error} onRetry={this.reset} />;
  }
}
