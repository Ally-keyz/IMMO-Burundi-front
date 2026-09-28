import { Link } from 'react-router-dom';
import { Facebook, Instagram, Music2, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface FooterLink {
  labelKey: string;
  to?: string;
  href?: string;
}

const COMPANY_LINKS: FooterLink[] = [
  { labelKey: 'footer.links.aboutUs', to: '/about' },
];

const SERVICES_LINKS: FooterLink[] = [
  { labelKey: 'footer.links.buy', to: '/buy' },
  { labelKey: 'footer.links.rent', to: '/rent' },
  { labelKey: 'footer.links.verification', to: '/verification-disclaimer' },
  { labelKey: 'footer.links.promotion', to: '/about' },
];

const LEGAL_LINKS: FooterLink[] = [
  { labelKey: 'footer.links.privacy', to: '/privacy' },
  { labelKey: 'footer.links.terms', to: '/terms' },
  { labelKey: 'footer.links.verificationDisclaimer', to: '/verification-disclaimer' },
  { labelKey: 'footer.links.cookies', to: '/cookies' },
];

const SOCIAL_LINKS: FooterLink[] = [
  { labelKey: 'footer.links.facebook', href: 'https://facebook.com' },
  { labelKey: 'footer.links.instagram', href: 'https://instagram.com' },
  { labelKey: 'footer.links.tiktok', href: 'https://tiktok.com' },
  { labelKey: 'footer.links.whatsapp', href: 'https://wa.me' },
];

export default function Footer(): JSX.Element {
  const { t, setLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();

  /* Logged-in users get a slim, link-free footer — no accent color, just a subtle bar. */
  if (isAuthenticated) {
    return (
      <footer className="border-t border-black/5 bg-surface">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-gray-500 sm:flex-row">
          <p className="flex items-center gap-2">
            <img src="/assets/brand/logo-crop.png" alt="IMMO BURUNDI" className="h-5 w-auto opacity-80" />
            © {new Date().getFullYear()} IMMO BURUNDI
          </p>
          <p>Bujumbura, Burundi</p>
        </div>
      </footer>
    );
  }

  const columns: Array<{ title: string; links: FooterLink[] }> = [
    { title: t('footer.company'), links: COMPANY_LINKS },
    { title: t('footer.services'), links: SERVICES_LINKS },
    { title: t('footer.legal'), links: LEGAL_LINKS },
  ];

  return (
    <footer className="border-t border-black/5 bg-accent text-ink">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/assets/brand/logo-crop.png" alt="IMMO BURUNDI" className="h-9 w-auto" />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/70">{t('footer.description')}</p>
            <div className="mt-4 flex items-center gap-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.labelKey}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-surface/40 hover:text-ink"
                  aria-label={t(link.labelKey)}
                >
                  {link.labelKey.includes('facebook') ? <Facebook className="h-4 w-4" /> : null}
                  {link.labelKey.includes('instagram') ? <Instagram className="h-4 w-4" /> : null}
                  {link.labelKey.includes('tiktok') ? <Music2 className="h-4 w-4" /> : null}
                  {link.labelKey.includes('whatsapp') ? <Phone className="h-4 w-4" /> : null}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.labelKey}>
                    {link.to ? (
                      <Link to={link.to} className="text-sm text-ink/70 transition-colors hover:text-ink">
                        {t(link.labelKey)}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-ink/70 transition-colors hover:text-ink"
                      >
                        {t(link.labelKey)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Languages */}
          <div>
            <h3 className="text-sm font-semibold text-ink">{t('common.language')}</h3>
            <ul className="mt-3 space-y-2">
              {(['fr', 'en', 'sw'] as const).map((lang) => (
                <li key={lang}>
                  <button type="button" onClick={() => setLanguage(lang)} className="text-sm text-ink/70 transition-colors hover:text-ink">
                    {lang === 'fr' ? 'Français' : lang === 'en' ? 'English' : 'Swahili'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-black/5 pt-6 text-xs text-ink/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} IMMO BURUNDI — {t('footer.tagline')}
          </p>
          <p>Bujumbura, Burundi</p>
        </div>
      </div>
    </footer>
  );
}