import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Seo } from '../components/seo/Seo';

export default function NotFoundPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <Seo
        title="Page introuvable"
        description="Cette page n'existe pas ou a été déplacée. Retrouvez les propriétés disponibles sur IMMO BURUNDI."
        path="/404"
        noindex
      />
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Compass className="h-10 w-10" aria-hidden="true" />
      </span>
      <p className="mt-6 text-5xl font-extrabold text-gray-900">404</p>
      <h1 className="mt-2 text-xl font-bold text-gray-900">{t('error.notFound')}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">{t('error.notFoundDesc')}</p>
      <Link to="/" className="btn-primary mt-8">
        {t('error.backHome')}
      </Link>
    </div>
  );
}