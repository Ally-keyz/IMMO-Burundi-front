import { useLanguage } from '../contexts/LanguageContext';
import CategoryListingPage from '../components/explore/CategoryListingPage';

export default function CommercialPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <CategoryListingPage
      eyebrow={t('cat.eyebrow')}
      title={t('cat.commercial.title')}
      subtitle={t('cat.commercial.subtitle')}
      query={{ propertyType: 'COMMERCIAL', sortBy: 'publishedAt', sortOrder: 'desc' }}
      openSearchTo="/search?propertyType=COMMERCIAL"
      seo={{
        title: 'Immobilier commercial au Burundi',
        description:
          "IMMOBILIER COMMERCIAL AU BURUNDI : bureaux, commerces, entrepôts et espaces à louer ou à vendre à Bujumbura. Locations pour entreprises, prix en BIF, annonces vérifiées.",
        keywords:
          'immobilier commercial Burundi, bureau à louer Bujumbura, local commercial Burundi, entrepôt à louer Burundi, shop for rent Bujumbura, commercial property Burundi',
        breadcrumbs: [
          { name: 'Accueil', path: '/' },
          { name: 'Commercial', path: '/commercial' },
        ],
      }}
    />
  );
}