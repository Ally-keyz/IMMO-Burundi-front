import { useLanguage } from '../contexts/LanguageContext';
import CategoryListingPage from '../components/explore/CategoryListingPage';

export default function RentPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <CategoryListingPage
      eyebrow={t('cat.eyebrow')}
      title={t('cat.rent.title')}
      subtitle={t('cat.rent.subtitle')}
      query={{ listingType: 'RENT', sortBy: 'publishedAt', sortOrder: 'desc' }}
      openSearchTo="/search?listingType=RENT"
      seo={{
        title: 'Location immobilière au Burundi',
        description:
          "LOCATION IMMOBILIERE AU BURUNDI : appartements, villas et maisons à louer à Bujumbura et dans tout le pays. Prix en BIF, annonces vérifiées, bail clair et contact direct avec le propriétaire.",
        keywords:
          'location maison Burundi, appartement à louer Bujumbura, louer immobilier Burundi, location villa Bujumbura, rent property Burundi, housing Burundi',
        breadcrumbs: [
          { name: 'Accueil', path: '/' },
          { name: 'Louer', path: '/rent' },
        ],
      }}
    />
  );
}