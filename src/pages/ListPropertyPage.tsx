import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, MapPin, PlusCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, geoApi, getApiErrorMessage } from '../lib/api';
import { isAgentRole } from '../lib/roles';

interface GeoItem {
  _id: string;
  code: string;
  name: string;
}

const inputClass =
  'h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500';

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'VILLA', 'OFFICE', 'SHOP', 'WAREHOUSE', 'INDUSTRIAL', 'LAND', 'FARM', 'COMMERCIAL', 'HOTEL', 'GUEST_HOUSE', 'OTHER'];

const LISTING_TYPES = ['SALE', 'RENT'];

export default function ListPropertyPage(): JSX.Element {
  const { t } = useLanguage();
  const { isAuthenticated, status, user } = useAuth();
  const navigate = useNavigate();

  const [provinces, setProvinces] = useState<GeoItem[]>([]);
  const [communes, setCommunes] = useState<GeoItem[]>([]);
  const [form, setForm] = useState({
    title: '',
    propertyType: 'HOUSE',
    listingType: 'SALE',
    priceAmount: '',
    priceCurrency: 'BIF',
    isNegotiable: false,
    surfaceArea: '',
    bedrooms: '',
    bathrooms: '',
    address: '',
    provinceId: '',
    communeId: '',
  });
  const [mediaText, setMediaText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: '/list-property' } });
    } else if (!isAgentRole(user?.role)) {
      navigate('/dashboard', { replace: true });
    }
  }, [status, isAuthenticated, user?.role, navigate]);

  useEffect(() => {
    geoApi
      .getProvinces()
      .then(setProvinces)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onProvince = (value: string) => {
    set('provinceId', value);
    set('communeId', '');
    if (value) {
      geoApi
        .getCommunes(value)
        .then(setCommunes)
        .catch(() => setCommunes([]));
    } else {
      setCommunes([]);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const mediaUrls = mediaText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        propertyType: form.propertyType,
        listingType: form.listingType,
        price: {
          amount: Number(form.priceAmount) || 0,
          currency: form.priceCurrency,
        },
        isNegotiable: form.isNegotiable,
        surfaceArea: form.surfaceArea ? Number(form.surfaceArea) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        provinceId: form.provinceId,
        communeId: form.communeId,
        address: form.address.trim() || undefined,
        locationPrecision: form.address ? 'APPROXIMATE' : 'HIDDEN',
        media: mediaUrls.length
          ? mediaUrls.map((url, i) => ({
              fileKey: url,
              url,
              caption: '',
              isPrimary: i === 0,
              mediaType: 'IMAGE',
              sortOrder: i,
            }))
          : undefined,
      };
      const property = await propertiesApi.create(body);
      setSuccess(`${property.title} was created. It is now in draft — submit it from the dashboard.`);
      setForm({
        title: '',
        propertyType: 'HOUSE',
        listingType: 'SALE',
        priceAmount: '',
        priceCurrency: 'BIF',
        isNegotiable: false,
        surfaceArea: '',
        bedrooms: '',
        bathrooms: '',
        address: '',
        provinceId: '',
        communeId: '',
      });
      setMediaText('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <h1 className="text-2xl font-extrabold text-gray-900">{t('list.title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('list.subtitle')}</p>

      <form onSubmit={submit} className="card mt-6 max-w-3xl p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <PlusCircle className="h-5 w-5 text-brand-600" aria-hidden="true" />
          {t('list.details')}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="lp-title" className="label">{t('list.titleLabel')} *</label>
            <input id="lp-title" required className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Modern 3-bedroom villa in Kiriri" />
          </div>
          <div>
            <label htmlFor="lp-type" className="label">{t('list.propertyType')}</label>
            <select id="lp-type" className="mt-1 h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500" value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>{pt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lp-listing" className="label">{t('list.listingType')}</label>
            <select id="lp-listing" className="mt-1 h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500" value={form.listingType} onChange={(e) => set('listingType', e.target.value)}>
              {LISTING_TYPES.map((lt) => (
                <option key={lt} value={lt}>{lt}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lp-price" className="label">{t('list.price')} *</label>
            <input id="lp-price" required type="number" min={0} className={inputClass} value={form.priceAmount} onChange={(e) => set('priceAmount', e.target.value)} placeholder="150000000" />
          </div>
          <div>
            <label htmlFor="lp-currency" className="label">{t('list.currency')}</label>
            <select id="lp-currency" className="mt-1 h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500" value={form.priceCurrency} onChange={(e) => set('priceCurrency', e.target.value)}>
              <option value="BIF">BIF</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label htmlFor="lp-surface" className="label">{t('list.surface')}</label>
            <input id="lp-surface" type="number" min={0} className={inputClass} value={form.surfaceArea} onChange={(e) => set('surfaceArea', e.target.value)} placeholder="m²" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lp-bed" className="label">{t('list.bedrooms')}</label>
              <input id="lp-bed" type="number" min={0} className={inputClass} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
            </div>
            <div>
              <label htmlFor="lp-bath" className="label">{t('list.bathrooms')}</label>
              <input id="lp-bath" type="number" min={0} className={inputClass} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
              {t('list.location')}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lp-province" className="label">{t('list.province')} *</label>
                <select id="lp-province" required className="mt-1 h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500" value={form.provinceId} onChange={(e) => onProvince(e.target.value)}>
                  <option value="">— Select —</option>
                  {provinces.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lp-commune" className="label">{t('list.commune')} *</label>
                <select id="lp-commune" required className="mt-1 h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500" value={form.communeId} onChange={(e) => set('communeId', e.target.value)} disabled={!form.provinceId}>
                  <option value="">— Select —</option>
                  {communes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="lp-address" className="label">{t('list.address')}</label>
                <input id="lp-address" className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Rohero, Avenue 13" />
              </div>
            </div>
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.isNegotiable}
            onChange={(e) => set('isNegotiable', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          {t('list.negotiable')}
        </label>

        <div className="mt-5">
          <label htmlFor="lp-media" className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <ImageIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {t('list.photos')}
          </label>
          <textarea
            id="lp-media"
            rows={3}
            value={mediaText}
            onChange={(e) => setMediaText(e.target.value)}
            placeholder={t('list.photosPlaceholder')}
            className="mt-2 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl p-3 text-sm bg-notVerified/10 text-notVerified">{error}</p>
        ) : null}
        {success ? (
          <p role="status" className="mt-4 rounded-xl p-3 text-sm bg-verified/10 text-verified">{success}</p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? t('common.loading') : t('list.submit')}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-outline">
            {t('list.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}