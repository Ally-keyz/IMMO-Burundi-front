import { useLanguage } from '../contexts/LanguageContext';
import CategoryListingPage from '../components/explore/CategoryListingPage';

export default function BuyPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <CategoryListingPage
      eyebrow={t('cat.eyebrow')}
      title={t('cat.buy.title')}
      subtitle={t('cat.buy.subtitle')}
      query={{ listingType: 'SALE', sortBy: 'publishedAt', sortOrder: 'desc' }}
      openSearchTo="/search?listingType=SALE"
      seo={{
        title: 'Achat immobilier en Burundi',
        description:
          "ACHETER IMMOBILIER AU BURUNDI : maisons, villas, appartements et terrains à vendre à Bujumbura, Gitega, Ngozi et dans les 18 provinces. Prix en BIF, annonces vérifiées, contact direct avec l'agent.",
        keywords:
          'acheter maison Burundi, achat immobilier Bujumbura, immobilier à vendre Burundi, acheter terrain Burundi, propriété Burundi pas cher, maison à vendre Gitega, buy property Burundi, real estate Burundi',
        breadcrumbs: [
          { name: 'Accueil', path: '/' },
          { name: 'Acheter', path: '/buy' },
        ],
      }}
    />
  );
}