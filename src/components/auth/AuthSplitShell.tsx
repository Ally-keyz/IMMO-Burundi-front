import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AuthPhotoPanel from './AuthPhotoPanel';

interface AuthSplitShellProps {
  children: ReactNode;
  /** Replaces the photo/video panel — used by the payment page. */
  panel?: ReactNode;
  /** Wordmark ("IMMO BURUNDI") instead of the logo image, for pages that want a text-only brand. */
  wordmark?: boolean;
}

export default function AuthSplitShell({ children, panel, wordmark = false }: AuthSplitShellProps): JSX.Element {
  return (
    <div className="flex min-h-[100dvh] bg-bg px-4 py-3 sm:px-6 sm:py-4">
      <div className="m-auto flex w-full max-w-[980px] overflow-hidden rounded-lg bg-surface border md:max-h-[calc(100dvh-1.5rem)]">
        <div className="flex flex-1 flex-col px-5 py-4 sm:px-8 sm:py-5 lg:px-12 md:w-1/2 md:min-h-0 md:flex-none md:shrink-0 md:overflow-hidden">
        <div className="flex w-full items-baseline justify-center">
          {wordmark ? (
            <h1 className="text-lg font-bold text-gray-900 md:text-xl desktop:text-2xl">
              <span className="text-blue-600">IMMO</span> BURUNDI
            </h1>
          ) : (
            <>
              <img src="/assets/brand/logo-crop.png" alt="IMMO BURUNDI" className="h-10 w-14 md:h-7 desktop:h-10" />
              <h1 className="ml-2 text-lg text-gray-900 font-bold  md:text-xl desktop:text-2xl mt-5">BURUNDI</h1>
            </>
          )}
        </div>
          <div className="flex flex-1 flex-col justify-center py-2">{children}</div>

          <div aria-label="Legal">
            <nav className="flex items-center gap-2 text-xs text-gray-400">
              <Link to="/privacy" className="transition-colors hover:text-gray-600">
                Privacy
              </Link>
              <span aria-hidden="true">·</span>
              <Link to="/terms" className="transition-colors hover:text-gray-600">
                Legal
              </Link>
            </nav>
            <p className="mt-1 text-xs text-gray-400">©Copyright Our Property Pty Ltd 2023</p>
          </div>
        </div>

        {panel ?? <AuthPhotoPanel />}
      </div>
    </div>
  );
}