import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AccountRail from './AccountRail';
import NavDrawer from './NavDrawer';
import { NavShellProvider } from '../../contexts/NavShellContext';
import { useAuth } from '../../contexts/AuthContext';

const NO_CHROME_PATHS = ['/login', '/signup', '/register'];

/**
 * Prefixed paths render standalone: no header, no account rail, no footer.
 * The payment link is reached from an SMS/WhatsApp link, so it behaves like
 * login/signup — its own full-height page instead of a panel inside the app.
 */
const BARE_PREFIXES = ['/setup-account', '/pay'];

function isBarePath(pathname: string): boolean {
  return (
    NO_CHROME_PATHS.includes(pathname) ||
    BARE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

/**
 * Routes that must never be indexed: authenticated areas, the listing
 * wizard, and transactional pages reached from an SMS link.
 *
 * The noindex is emitted here rather than per page so that every private
 * route is covered by construction and cannot drift. Public pages render
 * their own `index, follow` through <Seo>, and because a path is either
 * private or public there is never a conflicting pair of robots tags.
 */
const PRIVATE_PATH_PREFIXES = [
  '/dashboard',
  '/settings',
  '/list-property',
  '/login',
  '/signup',
  '/register',
  '/pay',
  '/setup-account',
];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const bare = isBarePath(pathname);
  const showRail = !bare && isAuthenticated;

  return (
    <NavShellProvider>
      {isPrivatePath(pathname) ? <meta name="robots" content="noindex, nofollow" /> : null}
      <div className="flex min-h-screen flex-col bg-bg">
        {bare ? null : <Header />}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {showRail ? <AccountRail /> : null}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
        {bare ? null : <Footer />}
        <NavDrawer />
      </div>
    </NavShellProvider>
  );
}