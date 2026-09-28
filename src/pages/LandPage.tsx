import { useLanguage } from '../contexts/LanguageContext';
import CategoryListingPage from '../components/explore/CategoryListingPage';

export default function LandPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <CategoryListingPage
      eyebrow={t('cat.eyebrow')}
      title={t('cat.land.title')}
      subtitle={t('cat.land.subtitle')}
      query={{ propertyType: 'LAND', sortBy: 'publishedAt', sortOrder: 'desc' }}
      openSearchTo="/search?propertyType=LAND"
      seo={{
        title: 'Terrain à vendre au Burundi',
        description:
          'TERRAIN À VENDRE AU BURUNDI : parcelles constructibles, terrains agricoles et terres à bâtir à Bujumbura, Gitega, Ngozi, Kayanza et dans les 18 provinces. Prix au m² en BIF, contact direct avec le propriétaire.',
        keywords:
          'terrain à vendre Burundi, terrain constructible Bujumbura, parcelle à bâtir Burundi, terrain agricole Burundi, buy land Burundi, terrain Gitega, terrain Ngozi',
        breadcrumbs: [
          { name: 'Accueil', path: '/' },
          { name: 'Terrains', path: '/land' },
        ],
      }}
    />
  );
}