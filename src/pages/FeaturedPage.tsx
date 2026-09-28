import { useLanguage } from '../contexts/LanguageContext';
import CategoryListingPage from '../components/explore/CategoryListingPage';

export default function FeaturedPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <CategoryListingPage
      eyebrow={t('cat.eyebrow')}
      title={t('cat.featured.title')}
      subtitle={t('cat.featured.subtitle')}
      query={{ isFeatured: true, sortBy: 'publishedAt', sortOrder: 'desc' }}
      openSearchTo="/search?isFeatured=true"
      seo={{
        title: 'Propriétés en vedette au Burundi',
        description:
          'LES MEILLEURES PROPRIÉTÉS DU BURUNDI : une sélection de maisons, villas, terrains et commerces en vedette à Bujumbura et dans les 18 provinces, mise à jour chaque jour.',
        keywords:
          'immobilier en vedette Burundi, propriétés en vedette Bujumbura, immobilier de luxe Burundi, villa de luxe Bujumbura, featured property Burundi',
        breadcrumbs: [
          { name: 'Accueil', path: '/' },
          { name: 'En vedette', path: '/featured' },
        ],
      }}
    />
  );
}