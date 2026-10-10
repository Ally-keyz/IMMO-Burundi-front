import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  Heart,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavShell } from '../../contexts/NavShellContext';
import LanguageDropdown from './LanguageDropdown';
import CurrencyDropdown from './CurrencyDropdown';
import ThemeToggle from './ThemeToggle';
import SearchModal from '../SearchModal';
import Popover from '../Popover';
import { isAgentRole } from '../../lib/roles';
import ProfileAvatar from '../ProfileAvatar';

export default function Header(): JSX.Element {
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { toggleRail, setDrawerOpen } = useNavShell();
  const navigate = useNavigate();
  const location = useLocation();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const avatarPanelRef = useRef<HTMLDivElement>(null);

  const go = (path: string) => {
    setAvatarOpen(false);
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setAvatarOpen(false);
    void logout();
    navigate('/');
  };

  /* On the home page the hero video runs edge-to-edge under the bar, so the
     header floats transparently above it with light controls (see index.css). */
  const isHome = location.pathname === '/';

  return (
    <header
      className={
        isHome
          ? 'header-over-hero absolute inset-x-0 top-0 z-40 h-16 bg-transparent'
          : 'sticky top-0 z-40 h-16 bg-bg'
      }
    >
      <div className="scrollbar-hide flex h-full items-center gap-1 overflow-x-auto px-3 sm:gap-2 lg:px-4">
        {/* Hamburger — toggles sidebar (logged in) or nav drawer (guests) */}
        <button
          type="button"
          onClick={() => (isAuthenticated ? toggleRail() : setDrawerOpen(true))}
          aria-label={t('nav.menu')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Logo — unchanged brand/logo asset */}
        <Link to="/" className="flex shrink-0 items-center self-center" aria-label="IMMO BURUNDI — Home">
          <img src="/assets/brand/logo-crop.png" alt="IMMO BURUNDI" className="h-8 w-auto sm:h-9 md:h-10" />
          <span className="header-logo-wordmark ml-2 hidden text-lg font-bold text-gray-900 md:inline">
            <span className="text-blue-600">IMMO</span> BURUNDI
          </span>
        </Link>

        <div className="mx-1 flex-1" />

        {/* Circular icon buttons */}
        {isAuthenticated && user && isAgentRole(user.role) ? null : location.pathname.startsWith('/property/') ? null : (
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          aria-label={t('common.search')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <Search className="h-6 w-6" aria-hidden="true" />
        </button>
        )}

        <ThemeToggle />
        <LanguageDropdown />
        <CurrencyDropdown />

        <button
          type="button"
          onClick={() => go('/about')}
          aria-label={t('nav.help')}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:flex"
        >
          <CircleHelp className="h-6 w-6" aria-hidden="true" />
        </button>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => go('/dashboard?tab=notifications')}
            aria-label={t('nav.notifications')}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <Bell className="h-6 w-6" aria-hidden="true" />
            {unreadCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-notVerified px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
        ) : null}

        {/* Primary CTA pill — "Create" equivalent for agents */}
        {isAuthenticated && user && isAgentRole(user.role) ? (
          <button
            type="button"
            onClick={() => go('/dashboard?tab=myProperties&add=1')}
            className="hidden h-9 items-center gap-2 rounded-full bg-ink px-4 text-ui font-medium text-white transition-colors hover:bg-gray-800 md:inline-flex"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {t('nav.listProperty')}
          </button>
        ) : null}

        {/* Avatar / auth */}
        {isAuthenticated && user ? (
          <div ref={avatarRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAvatarOpen((v) => !v)}
              aria-expanded={avatarOpen}
              aria-label={t('nav.dashboard')}
              className="flex items-center rounded-full py-0.5 pl-0.5 pr-1 transition-colors hover:bg-gray-100"
            >
              <ProfileAvatar user={user} alt="" />
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${avatarOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <Popover
              open={avatarOpen}
              anchor={avatarRef}
              panelRef={avatarPanelRef}
              className="w-72 rounded-xl border border-gray-200 bg-surface p-2 shadow-pop"
            >
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <ProfileAvatar user={user} sizeClass="h-10 w-10" textClass="text-sm" alt="" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-sm text-gray-500">{user.email || user.phone}</p>
                </div>
              </div>
              <div className="mt-1 border-t border-gray-100 py-1">
                {[
                  ...(isAgentRole(user.role)
                    ? [{ labelKey: 'dashboard.myProperties', to: '/dashboard?tab=myProperties', icon: <Building2 className="h-4 w-4" /> }]
                    : []),
                  { labelKey: 'dashboard.favorites', to: '/dashboard?tab=favorites', icon: <Heart className="h-4 w-4" /> },
                  { labelKey: 'dashboard.notifications', to: '/dashboard?tab=notifications', icon: <Bell className="h-4 w-4" /> },
                  { labelKey: 'dashboard.settings', to: '/settings', icon: <Settings className="h-4 w-4" /> },
                ].map((l) => (
                  <button
                    key={l.labelKey}
                    type="button"
                    onClick={() => go(l.to)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-base text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {l.icon}
                    {t(l.labelKey)}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-base text-notVerified transition-colors hover:bg-notVerified/5"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('auth.logout')}
                </button>
              </div>
            </Popover>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => go('/login')}
              className="rounded-full px-3 py-1.5 text-ui font-medium text-gray-900 transition-colors hover:bg-gray-100"
            >
              {t('nav.login')}
            </button>
            <button type="button" onClick={() => go('/signup')} className="btn-primary px-4 py-1.5 rounded-full">
              {t('nav.register')}
            </button>
          </div>
        )}
      </div>

      {/* Close overlays on outside click */}
      {avatarOpen ? (
        <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} aria-hidden="true" />
      ) : null}

      {/* Search modal */}
      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </header>
  );
}