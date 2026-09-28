import { useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, CircleHelp, Compass, KeySquare, Landmark, PackageCheck, ShieldCheck, Star, UserPlus, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavShell } from '../../contexts/NavShellContext';

const GUEST_LINKS = [
  { to: '/buy', key: 'nav.buy', icon: <KeySquare className="h-5 w-5" aria-hidden="true" /> },
  { to: '/rent', key: 'nav.rent', icon: <Building2 className="h-5 w-5" aria-hidden="true" /> },
  { to: '/land', key: 'nav.land', icon: <Landmark className="h-5 w-5" aria-hidden="true" /> },
  { to: '/commercial', key: 'nav.commercial', icon: <Compass className="h-5 w-5" aria-hidden="true" /> },
  { to: '/featured', key: 'nav.featured', icon: <Star className="h-5 w-5" aria-hidden="true" /> },
  { to: '/verified', key: 'nav.verified', icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" /> },
  { to: '/agents', key: 'nav.agents', icon: <CalendarDays className="h-5 w-5" aria-hidden="true" /> },
  { to: '/about', key: 'nav.help', icon: <CircleHelp className="h-5 w-5" aria-hidden="true" /> },
];

export default function NavDrawer(): JSX.Element {
  const { t } = useLanguage();
  const { drawerOpen, setDrawerOpen } = useNavShell();
  const navigate = useNavigate();

  if (!drawerOpen) return <></>;

  const go = (to: string) => {
    setDrawerOpen(false);
    navigate(to);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-bg shadow-pop">
        <div className="flex h-16 items-center justify-between px-4">
          <span className="text-lg font-bold text-gray-900">{t('nav.menu')}</span>
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label={t('navigation.close')} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="scrollbar-hide flex-1 overflow-y-auto p-3">
          {GUEST_LINKS.map((l) => (
            <button key={l.to} type="button" onClick={() => go(l.to)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50">
              {l.icon}
              {t(l.key)}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => go('/login')} className="btn-outline rounded-full">
              {t('nav.login')}
            </button>
            <button type="button" onClick={() => go('/signup')} className="btn-primary rounded-full">
              {t('nav.register')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}