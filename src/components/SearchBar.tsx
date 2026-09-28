import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PROPERTY_TYPE_OPTIONS } from '../lib/constants';
import { listingTypeFromTab } from '../lib/search';

type SearchTab = 'BUY' | 'RENT' | 'LAND' | 'COMMERCIAL';

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className = '' }: SearchBarProps): JSX.Element {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SearchTab>('BUY');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [propertyId, setPropertyId] = useState('');

  const tabs: Array<{ id: SearchTab; labelKey: string }> = [
    { id: 'BUY', labelKey: 'search.tab.buy' },
    { id: 'RENT', labelKey: 'search.tab.rent' },
    { id: 'LAND', labelKey: 'search.tab.land' },
    { id: 'COMMERCIAL', labelKey: 'search.tab.commercial' },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const listingType = listingTypeFromTab(tab);
    if (listingType) params.set('listingType', listingType);
    if (tab === 'LAND' && !propertyType) params.set('propertyType', 'LAND');
    if (tab === 'COMMERCIAL' && !propertyType) params.set('propertyType', 'COMMERCIAL');
    if (location.trim()) params.set('q', location.trim());
    if (propertyType) params.set('propertyType', propertyType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (propertyId.trim()) params.set('q', propertyId.trim());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className={className}
      aria-label={t('search.title')}
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-full bg-field p-1" role="tablist" aria-label={t('search.title')}>
        {tabs.map((tb) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              tab === tb.id ? 'bg-surface text-gray-900 shadow-soft' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="sb-location" className="label">{t('search.location')}</label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id="sb-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('search.placeholder')}
              className="input !pl-9"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sb-type" className="label">{t('search.propertyType')}</label>
          <select id="sb-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="input">
            <option value="">{t('common.all')}</option>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sb-min" className="label">{t('search.minPrice')}</label>
          <input
            id="sb-min"
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0"
            className="input"
            inputMode="numeric"
          />
        </div>

        <div>
          <label htmlFor="sb-max" className="label">{t('search.maxPrice')}</label>
          <input
            id="sb-max"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="—"
            className="input"
            inputMode="numeric"
          />
        </div>

        <div>
          <label htmlFor="sb-bed" className="label">{t('search.bedrooms')}</label>
          <select id="sb-bed" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="input">
            <option value="">{t('common.any')}</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="submit" className="btn-dark">
          <Search className="h-4 w-4" aria-hidden="true" />
          {t('search.button')}
        </button>
      </div>
    </form>
  );
}