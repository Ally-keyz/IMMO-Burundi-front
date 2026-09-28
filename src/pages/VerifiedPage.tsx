import { useLanguage } from '../contexts/LanguageContext';
import CategoryListingPage from '../components/explore/CategoryListingPage';

export default function VerifiedPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <CategoryListingPage
      eyebrow={t('cat.eyebrow')}
      title={t('cat.verified.title')}
      subtitle={t('cat.verified.subtitle')}
      query={{ verificationStatus: 'VERIFIED', sortBy: 'publishedAt', sortOrder: 'desc' }}
      openSearchTo="/search?verificationStatus=VERIFIED"
      seo={{
        title: 'Propriétés vérifiées au Burundi',
        description:
          'PROPRIÉTÉS VÉRIFIÉES AU BURUNDI : achetez en toute confiance. Titres et informations contrôlés par nos équipes à Bujumbura et dans les 18 provinces.',
        keywords:
          'propriétés vérifiées Burundi, immobilier vérifié Bujumbura, acheter sans risque Burundi, verified property Burundi, maison vérifiée Burundi',
        breadcrumbs: [
          { name: 'Accueil', path: '/' },
          { name: 'Vérifiées', path: '/verified' },
        ],
      }}
    />
  );
}