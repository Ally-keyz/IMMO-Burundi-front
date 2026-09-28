import { Award, BadgeCheck, Globe, Handshake, ShieldCheck, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Seo, withGlobalJsonLd } from '../components/seo/Seo';

export default function AboutPage(): JSX.Element {
  const { t } = useLanguage();

  const values = [
    { icon: ShieldCheck, titleKey: 'about.values.trust', descKey: 'about.values.trustDesc' },
    { icon: BadgeCheck, titleKey: 'about.values.transparency', descKey: 'about.values.transparencyDesc' },
    { icon: Award, titleKey: 'about.values.quality', descKey: 'about.values.qualityDesc' },
    { icon: Globe, titleKey: 'about.values.accessibility', descKey: 'about.values.accessibilityDesc' },
  ];

    return (
      <div>
        <Seo
          title="À propos d'IMMO BURUNDI"
          description="IMMO BURUNDI est la marketplace immobilière du Burundi : achat, location et vente de propriétés à Bujumbura et dans les 18 provinces, avec des agents et des biens vérifiés."
          path="/about"
          keywords="IMMO Burundi, marketplace immobilière Burundi, agence immobilière Bujumbura, acheter propriété Burundi"
          jsonLd={withGlobalJsonLd(null)}
        />
      <section className="container-page py-14 text-center sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{t('about.hero.title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500">{t('about.hero.subtitle')}</p>
      </section>

      <section className="container-page pb-14">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-accent">
              <Target className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-bold text-gray-900">{t('about.mission.title')}</h2>
          </div>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">{t('about.mission.body')}</p>
          <p className="mt-4 leading-relaxed text-gray-500">
            From Bujumbura to Muyinga, we help buyers, tenants and investors discover verified properties while giving
            owners and professional agents the tools to reach the right audience. Every listing carries a transparent
            verification status and an original price, and our team works to keep the marketplace free of fraud.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 py-14">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-gray-900">{t('about.values.title')}</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.titleKey} className="rounded-2xl border border-gray-200 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-ink">
                  <v.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{t(v.titleKey)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-accent p-8 text-center text-ink sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <Handshake className="h-10 w-10" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-bold">{t('contact.title')}</h3>
              <p className="text-sm text-ink/75">{t('contact.subtitle')}</p>
            </div>
          </div>
          <a
            href={`mailto:hello@immoburundi.bi?subject=${encodeURIComponent(t('contact.listTitle'))}`}
            className="btn bg-surface text-accent-strong hover:bg-gray-50"
          >
            {t('contact.submit')}
          </a>
        </div>
      </section>
    </div>
  );
}