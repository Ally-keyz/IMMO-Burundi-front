import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorState({ title, message, onRetry, retryLabel }: ErrorStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-notVerified/10 text-notVerified">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {message ? <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-outline mt-6">
          {retryLabel ?? 'Retry'}
        </button>
      ) : null}
    </div>
  );
}