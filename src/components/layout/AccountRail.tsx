import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  Eye,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRailCounts } from '../../lib/railCounts';
import { ADMIN_TAB_IDS, defaultTabForRole } from './accountTabs';
import { isAgentRole, isMainAdminRole } from '../../lib/roles';
import { useNavShell } from '../../contexts/NavShellContext';
import ProfileAvatar from '../ProfileAvatar';

interface RailItem {
  id: string;
  label: string;
  icon: JSX.Element;
  badge?: number;
  action?: 'settings' | 'feedback' | 'logout' | 'profile';
  expand?: boolean;
}

export default function AccountRail(): JSX.Element | null {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { railCollapsed, setRailCollapsed } = useNavShell();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isAgent = isAgentRole(user?.role);
  const isMainAdmin = isMainAdminRole(user?.role);
  const counts = useRailCounts(isMainAdmin ? 'ADMIN' : isAgent ? 'AGENT' : 'CUSTOMER');
  const [mPropsOpen, setMPropsOpen] = useState(false);
  const [collapsedHover, setCollapsedHover] = useState(false);

  const siteHomeItem: RailItem = { id: 'siteHome', label: t('nav.home'), icon: <Home className="h-6 w-6" aria-hidden="true" /> };

  const adminItems: RailItem[] = [
    { id: 'overview', label: t('dashboard.overview'), icon: <LayoutDashboard className="h-6 w-6" aria-hidden="true" />, badge: counts.overview },
    { id: 'agents', label: t('dashboard.agents'), icon: <Users className="h-6 w-6" aria-hidden="true" />, badge: counts.agents },
    { id: 'properties', label: t('dashboard.properties'), icon: <Building2 className="h-6 w-6" aria-hidden="true" />, badge: counts.properties },
    { id: 'bookings', label: t('dashboard.bookings'), icon: <CalendarDays className="h-6 w-6" aria-hidden="true" />, badge: counts.bookings },
    { id: 'requests', label: t('dashboard.requests'), icon: <MessageSquareText className="h-6 w-6" aria-hidden="true" />, badge: counts.requests },
    { id: 'verification', label: t('dashboard.verification'), icon: <ShieldCheck className="h-6 w-6" aria-hidden="true" />, badge: counts.verification },
  ];

  const roleItems: RailItem[] = isMainAdmin
    ? adminItems
    : isAgent
      ? [
          { id: 'home', label: t('dashboard.home'), icon: <Home className="h-6 w-6" aria-hidden="true" /> },
          {
            id: 'myProperties',
            label: t('dashboard.myProperties'),
            icon: <Building2 className="h-6 w-6" aria-hidden="true" />,
            badge: counts.myProperties,
            expand: true,
          },
          {
            id: 'verification',
            label: t('dashboard.verification'),
            icon: <ShieldCheck className="h-6 w-6" aria-hidden="true" />,
            badge: counts.verification,
          },
          { id: 'analytics', label: t('dashboard.analytics'), icon: <BarChart3 className="h-6 w-6" aria-hidden="true" /> },
          { id: 'bookings', label: t('dashboard.inbox'), icon: <CalendarDays className="h-6 w-6" aria-hidden="true" />, badge: counts.bookings },
        ]
      : [
          siteHomeItem,
          { id: 'favorites', label: t('dashboard.favorites'), icon: <Heart className="h-6 w-6" aria-hidden="true" />, badge: counts.favorites },
          { id: 'recentViews', label: t('dashboard.recentViews'), icon: <Eye className="h-6 w-6" aria-hidden="true" />, badge: counts.recentViews },
          { id: 'visits', label: t('dashboard.visits'), icon: <CalendarDays className="h-6 w-6" aria-hidden="true" />, badge: counts.visits },
          { id: 'applications', label: t('dashboard.applications'), icon: <Building2 className="h-6 w-6" aria-hidden="true" />, badge: counts.applications },
        ];

  const footerItems: RailItem[] = [
    { id: 'settings', label: t('dashboard.settings'), icon: <Settings className="h-6 w-6" aria-hidden="true" />, action: 'settings' },
    { id: 'feedback', label: t('nav.feedback'), icon: <MessageSquareText className="h-6 w-6" aria-hidden="true" />, action: 'feedback' },
    { id: 'logout', label: t('auth.logout'), icon: <LogOut className="h-6 w-6" aria-hidden="true" />, action: 'logout' },
  ];

  const isDashboardActive = location.pathname === '/dashboard';
  const requestedTab = searchParams.get('tab');
  /* Admin tabs live in the rail now, so the rail is what reads `?tab=`; without a
     valid value the admin lands on Overview. */
  const activeTab = isMainAdmin
    ? isDashboardActive
      ? requestedTab && (ADMIN_TAB_IDS as readonly string[]).includes(requestedTab)
        ? requestedTab
        : 'overview'
      : ''
    : requestedTab || (isDashboardActive ? defaultTabForRole(isAgent) : '');

  if (!isAuthenticated) return null;

  const openTab = (id: string, status?: string) => {
    setCollapsedHover(false);
    navigate(status ? `/dashboard?tab=${id}&status=${status}` : `/dashboard?tab=${id}`);
  };

  const handleItem = (item: RailItem) => {
    if (item.id === 'siteHome') {
      setCollapsedHover(false);
      navigate('/');
      return;
    }
    if (item.action === 'logout') {
      void logout();
      navigate('/');
      return;
    }
    if (item.action === 'settings') {
      navigate('/settings');
      return;
    }
    if (item.action === 'feedback') {
      navigate('/about');
      return;
    }
    if (item.expand) {
      if (railCollapsed) {
        /* collapsed rail: clicking the rail icon first expands, then shows nested */
        setRailCollapsed(false);
      } else {
        setMPropsOpen((v) => !v);
      }
      return;
    }
    openTab(item.id);
  };

  /* Every status an agent can end up in must be reachable here, otherwise a listing
     can be invisible under every filter. New listings arrive as SUBMITTED. */
  const mPropsSubLinks = [
    { status: '', label: t('dashboard.propFilterAll') },
    { status: 'PUBLISHED', label: t('dashboard.propFilterActive') },
    { status: 'SUBMITTED', label: t('dashboard.propFilterReview') },
    { status: 'NEEDS_CORRECTION', label: t('dashboard.propFilterChanges') },
    { status: 'REJECTED', label: t('dashboard.propFilterRejected') },
    { status: 'DRAFT', label: t('dashboard.propFilterDraft') },
    { status: 'ARCHIVED', label: t('dashboard.propFilterArchive') },
    { status: 'SOLD', label: t('dashboard.propFilterSold') },
    { status: 'RENTED', label: t('dashboard.propFilterRented') },
  ];

  const itemClass = (active: boolean) =>
    `group flex h-11 w-full items-center gap-3 rounded-xl px-3 transition-colors ${
      active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const mPropsActive = activeTab === 'myProperties' || (isDashboardActive && Boolean(searchParams.get('status')));

  const navActive = (id: string) =>
    id === 'siteHome' ? location.pathname === '/' : activeTab === id || (id === 'home' && isDashboardActive && !activeTab);

  /* Collapsed icon rail (desktop) */
  if (railCollapsed) {
    return (
      <aside
        aria-label={t('dashboard.title')}
        className="sticky top-16 hidden h-[calc(100vh-64px)] w-[76px] shrink-0 flex-col self-start overflow-y-auto bg-bg px-2 py-3 lg:flex"
      >
        {/* Profile */}
        <button type="button" onClick={() => navigate('/settings')} className="mb-3 flex h-12 w-full items-center justify-center" aria-label={t('dashboard.sidebar.profile')}>
          <ProfileAvatar user={user} sizeClass="h-10 w-10" textClass="text-sm" alt="" />
        </button>

        <div className="flex flex-col gap-1">
          {roleItems.map((item) =>
            item.expand ? (
              <div key={item.id} className="relative" onMouseEnter={() => setCollapsedHover(true)} onMouseLeave={() => setCollapsedHover(false)}>
                <button
                  type="button"
                  onClick={() => handleItem(item)}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  className={`flex h-12 w-full items-center justify-center rounded-xl transition-colors ${
                    mPropsActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                </button>
                {collapsedHover ? (
                  <div className="absolute left-full top-0 z-30 ml-2 w-48 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-pop">
                    {mPropsSubLinks.map((s) => (
                      <button key={s.status} type="button" onClick={() => openTab('myProperties', s.status)} className="flex h-9 w-full items-center rounded-lg px-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItem(item)}
                title={item.label}
                aria-label={item.label}
aria-current={navActive(item.id) ? 'page' : undefined}
                  className={`relative flex h-12 w-full items-center justify-center rounded-xl transition-colors ${
                    navActive(item.id) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-notVerified px-1 text-[10px] font-bold text-white">{item.badge > 9 ? '9+' : item.badge}</span>
                ) : null}
              </button>
            ),
          )}
        </div>

        <div className="mt-auto flex flex-col gap-1 border-t border-gray-100 pt-2">
          {footerItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItem(item)}
              title={item.label}
              aria-label={item.label}
              className="flex h-12 w-full items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              {item.icon}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  /* Expanded labeled sidebar (desktop) + horizontal strip (mobile) */
  return (
    <aside
      aria-label={t('dashboard.title')}
      className="w-full bg-bg lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-64px)] lg:w-[252px] lg:shrink-0 lg:flex-col lg:self-start lg:overflow-y-auto lg:px-3 lg:py-4"
    >
      {/* Profile block (expanded only) */}
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="mb-4 hidden w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors lg:flex hover:bg-gray-50"
      >
        <ProfileAvatar user={user} sizeClass="h-10 w-10" textClass="text-sm" alt="" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-gray-900">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="block truncate text-xs text-gray-500">{t('dashboard.sidebar.profile')}</span>
        </span>
      </button>

      <nav className="scrollbar-hide flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {roleItems.map((item) =>
          item.expand ? (
            <div key={item.id} className="hidden lg:block">
              <button
                type="button"
                onClick={() => handleItem(item)}
                aria-current={activeTab === item.id ? 'page' : undefined}
                className={`${itemClass(mPropsActive)} ${mPropsActive ? 'font-semibold' : ''}`}
              >
                {item.icon}
                <span className="min-w-0 flex-1 truncate text-[13px]">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-notVerified px-1 text-[10px] font-bold text-white">{item.badge > 9 ? '9+' : item.badge}</span>
                ) : null}
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${mPropsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {/* Sub-links: μStudio-style expandable nested item */}
              <div className={`overflow-hidden transition-all ${mPropsOpen ? 'mt-1 max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="ml-6 flex flex-col border-l border-gray-200 py-1">
                  {mPropsSubLinks.map((s) => (
                    <button
                      key={s.status || 'all'}
                      type="button"
                      onClick={() => openTab('myProperties', s.status)}
                      aria-current={(searchParams.get('status') ?? '') === s.status && activeTab === 'myProperties' ? 'page' : undefined}
                      className={`rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                        (searchParams.get('status') ?? '') === s.status && activeTab === 'myProperties'
                          ? 'bg-gray-100 font-semibold text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItem(item)}
              aria-label={item.label}
              aria-current={navActive(item.id) ? 'page' : undefined}
              className={`relative shrink-0 lg:w-full lg:justify-start lg:px-3 ${itemClass(navActive(item.id))} ${
                navActive(item.id) ? 'font-semibold' : ''
              }`}
            >
              {item.icon}
              <span className="hidden truncate text-[13px] lg:block">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-notVerified px-1 text-[10px] font-bold text-white lg:static lg:ml-auto">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </button>
          ),
        )}
      </nav>

      <div className="mt-auto hidden border-t border-gray-200 pt-2 lg:block">
        {footerItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItem(item)}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}