import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, MapPin, PlusCircle, UploadCloud, X } from 'lucide-react';
import type { PropertySummaryDTO } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { filesApi, propertiesApi, geoApi, getApiErrorMessage } from '../../lib/api';
import Modal from '../../components/Modal';
import PropertySavedSuccessModal from '../../components/PropertySavedSuccessModal';

interface GeoItem {
  _id: string;
  code: string;
  name: string;
}

/** A photo the agent picked this session, tracked until the server has a copy. */
interface PickedPhoto {
  key: string;
  previewUrl: string;
  /** Set once the upload resolves; absent while in flight or when it failed. */
  uploadedUrl?: string;
  failed?: boolean;
}

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (property: PropertySummaryDTO) => void;
  property?: PropertySummaryDTO | null;
}

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'VILLA', 'OFFICE', 'SHOP', 'WAREHOUSE', 'LAND', 'OTHER'];
const LISTING_TYPES = ['SALE', 'RENT'];

/** A listing needs a real photo set before it is worth submitting for review. */
const MIN_MEDIA = 4;
const MAX_MEDIA = 12;

const inputClass =
  'h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500';

export default function AddPropertyModal({ open, onClose, onCreated, property }: AddPropertyModalProps): JSX.Element {
  const { t } = useLanguage();
  const editing = Boolean(property);
  const [step, setStep] = useState<1 | 2>(1);
  /* Step 2 is taller than the modal body, so without this the details form opens
     part-way down and the first fields are out of view. */
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [step, open]);
  const [provinces, setProvinces] = useState<GeoItem[]>([]);
  const [communes, setCommunes] = useState<GeoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickedRef = useRef<PickedPhoto[]>([]);
  const [picked, setPicked] = useState<PickedPhoto[]>([]);
  const [mediaText, setMediaText] = useState('');
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Confirmation shown after a successful save, so the agent gets explicit
     feedback instead of the wizard just disappearing. */
  const [saved, setSaved] = useState<{ property: PropertySummaryDTO; mode: 'created' | 'updated'; photoCount: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  /* dragenter/dragleave also fire for child nodes, so a plain boolean flickers as
     the pointer crosses the previews. Counting entries keeps the highlight steady. */
  const dragDepth = useRef(0);

  useEffect(() => {
    if (!open) return;
    /* Photos are step 1, so the wizard has to open on the photo step - not details. */
    setStep(1);
    setSaved(null);
    pickedRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPicked([]);
    setError(null);
    setCommunes([]);
    setMediaText((property?.media ?? []).map((m) => m.url ?? '').filter(Boolean).join('\n'));
    setForm({
      title: property?.title ?? '',
      propertyType: property?.propertyType ?? 'HOUSE',
      listingType: property?.listingType ?? 'SALE',
      priceAmount: property?.price?.amount ? String(property.price.amount) : '',
      priceCurrency: property?.price?.currency ?? 'BIF',
      isNegotiable: Boolean(property?.features?.isNegotiable),
      surfaceArea: property?.features?.surfaceArea != null ? String(property.features.surfaceArea) : '',
      bedrooms: property?.features?.bedrooms != null ? String(property.features.bedrooms) : '',
      bathrooms: property?.features?.bathrooms != null ? String(property.features.bathrooms) : '',
      address: property?.location?.address ?? '',
      provinceId: property?.location?.province?._id ?? '',
      communeId: property?.location?.commune?._id ?? '',
    });
  }, [open, property]);

  useEffect(() => {
    if (!open) return;
    geoApi
      .getProvinces()
      .then(setProvinces)
      .catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const provinceId = property?.location?.province?._id;
    if (!provinceId) return;
    geoApi
      .getCommunes(provinceId)
      .then(setCommunes)
      .catch(() => setCommunes([]));
  }, [open, property]);

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

  const mediaUrls = useMemo(
    () =>
      mediaText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    [mediaText],
  );

  const appendMediaUrl = (url: string) =>
    setMediaText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')}\n${url}` : url));

  const dropMediaUrl = (url: string) =>
    setMediaText((prev) => prev.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && s !== url).join('\n'));

  /**
   * Picked files are uploaded straight away rather than kept as local previews:
   * the property payload only carries URLs, so a preview that never reaches the
   * server would be silently discarded on save.
   */
  const onPickedFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    const room = Math.max(0, MAX_MEDIA - mediaUrls.length);
    if (room === 0) {
      setError(t('list.photoLimit', { count: MAX_MEDIA }));
      return;
    }
    if (images.length > room) setError(t('list.photoLimit', { count: MAX_MEDIA }));
    else setError(null);
    for (const file of images.slice(0, room)) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      setPicked((prev) => [...prev, { key, previewUrl }]);
      void filesApi
        .uploadImage(file, file.name)
        .then((res) => {
          appendMediaUrl(res.url);
          setPicked((prev) => prev.map((p) => (p.key === key ? { ...p, uploadedUrl: res.url } : p)));
        })
        .catch((err) => {
          setError(getApiErrorMessage(err));
          setPicked((prev) => prev.map((p) => (p.key === key ? { ...p, failed: true } : p)));
        });
    }
    /* Allow re-picking the same file after a removal. */
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePicked = (photo: PickedPhoto) => {
    URL.revokeObjectURL(photo.previewUrl);
    if (photo.uploadedUrl) dropMediaUrl(photo.uploadedUrl);
    setPicked((prev) => prev.filter((p) => p.key !== photo.key));
  };

  /* ── drag & drop ────────────────────────────────────────────
     Gated on `types` containing "Files" so dragging selected text or a link
     through the zone is ignored instead of being swallowed. */
  const draggingFiles = (e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.types.includes('Files');

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggingFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragActive(true);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggingFiles(e)) return;
    /* Required, or the browser navigates to the dropped file. */
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragActive) return;
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    onPickedFiles(e.dataTransfer.files);
  };

  /* Object URLs outlive the component unless revoked. Tracked through a ref so the
     cleanup runs on unmount only - keying it on `picked` would revoke previews
     that are still on screen. */
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  useEffect(
    () => () => {
      pickedRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    },
    [],
  );

  const uploading = picked.some((p) => !p.uploadedUrl && !p.failed);
  const enoughPhotos = mediaUrls.length >= MIN_MEDIA;
  const canContinue = enoughPhotos && !uploading;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        propertyType: form.propertyType,
        listingType: form.listingType,
        price: { amount: Number(form.priceAmount) || 0, currency: form.priceCurrency },
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
      const isUpdate = Boolean(editing && property);
      const savedProperty = isUpdate && property
        ? await propertiesApi.update(property._id, body)
        : await propertiesApi.create(body);
      /* Capture the photo count before the reset effect clears the textarea. */
      const photoCount = mediaUrls.length;
      onCreated(savedProperty);
      onClose();
      setSaved({ property: savedProperty, mode: isUpdate ? 'updated' : 'created', photoCount });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={editing ? t('dashboard.editProperty') : step === 1 ? t('dashboard.addNew') : t('list.details')} size="lg" bodyRef={bodyRef}>
      {/* Step bar */}
      <div className="mb-5 flex items-center gap-2">
        {([1, 2] as const).map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                s === step ? 'bg-ink text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm font-medium ${s === step ? 'text-gray-900' : 'text-gray-400'}`}>
              {s === 1 ? t('list.photos') : t('list.details')}
            </span>
            {s === 1 ? <span className="ml-1 h-px flex-1 bg-gray-200" /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div>
          {/* Drop target: the picker, the previews and the hint all sit inside it, so
              images can be released anywhere in this step. */}
          <div
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed px-4 pb-4 pt-6 transition-colors ${
              dragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Circular upload zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full bg-gray-100 text-gray-400 ring-1 ring-dashed ring-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-600"
                aria-label={t('list.selectFiles')}
              >
                <UploadCloud className="h-7 w-7" aria-hidden="true" />
                <span className="mt-1.5 text-xs font-medium">{t('list.selectFiles')}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPickedFiles(e.target.files)}
              />

              <p
                className={`max-w-[38ch] text-center text-sm font-medium ${dragActive ? 'text-brand-700' : 'text-gray-400'}`}
              >
                {dragActive ? t('list.dropActive') : t('list.dropzoneHint')}
              </p>
            </div>

            {picked.length > 0 ? (
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {picked.map((photo, i) => (
                  <div key={photo.key} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                    <span className="absolute left-1 top-1 rounded bg-gray-950/60 px-1.5 text-[10px] font-bold text-white">{i + 1}</span>
                    {!photo.uploadedUrl && !photo.failed ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-gray-950/50 text-white">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      </span>
                    ) : null}
                    {photo.failed ? (
                      <span className="absolute inset-x-0 bottom-0 bg-notVerified/80 px-1 py-0.5 text-center text-[9px] font-semibold text-white">
                        {t('list.photoFailed')}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removePicked(photo)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-950/60 text-white"
                      aria-label={t('list.removePhoto')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {t('list.dropHint')}
          </p>
          <label htmlFor="ap-media" className="sr-only">{t('list.photos')}</label>
          <textarea
            id="ap-media"
            rows={3}
            value={mediaText}
            onChange={(e) => setMediaText(e.target.value)}
            /* Keeps a dropped file from being typed into the field as a path. */
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            placeholder={t('list.photosPlaceholder')}
            className="mt-4 w-full rounded-lg border border-gray-200 bg-surface px-3.5 py-2.5 text-body text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500"
          />
          <p className="mt-3 text-xs text-gray-400">{t('list.uploadNotice')}</p>

          <p
            role="status"
            className={`mt-3 text-sm font-medium ${enoughPhotos ? 'text-verified' : 'text-notVerified'}`}
          >
            {uploading
              ? t('list.photoUploading')
              : enoughPhotos
                ? t('list.photoCountOk', { count: mediaUrls.length })
                : t('list.photoCountMissing', { count: MIN_MEDIA - mediaUrls.length })}
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">{error}</p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="btn-outline">
              {t('list.cancel')}
            </button>
            <button type="button" disabled={!canContinue} onClick={() => setStep(2)} className="btn-primary">
              {editing ? t('list.photos') : t('dashboard.addNew')} →
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ap-title" className="label">{t('list.titleLabel')} *</label>
              <input id="ap-title" required className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Modern 3-bedroom villa in Kiriri" />
            </div>
            <div>
              <label className="label">{t('list.propertyType')}</label>
              <select className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none focus:border-brand-500" value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{pt.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('list.listingType')}</label>
              <select className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none focus:border-brand-500" value={form.listingType} onChange={(e) => set('listingType', e.target.value)}>
                {LISTING_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('list.price')} *</label>
              <input required type="number" min={0} className={inputClass} value={form.priceAmount} onChange={(e) => set('priceAmount', e.target.value)} placeholder="150000000" />
            </div>
            <div>
              <label className="label">{t('list.currency')}</label>
              <select className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none focus:border-brand-500" value={form.priceCurrency} onChange={(e) => set('priceCurrency', e.target.value)}>
                <option value="BIF">BIF</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="label">{t('list.surface')}</label>
              <input type="number" min={0} className={inputClass} value={form.surfaceArea} onChange={(e) => set('surfaceArea', e.target.value)} placeholder="m²" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('list.bedrooms')}</label>
                <input type="number" min={0} className={inputClass} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
              </div>
              <div>
                <label className="label">{t('list.bathrooms')}</label>
                <input type="number" min={0} className={inputClass} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {t('list.location')}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ap-province" className="label">{t('list.province')} *</label>
                  <select id="ap-province" required className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none focus:border-brand-500" value={form.provinceId} onChange={(e) => onProvince(e.target.value)}>
                    <option value="">—</option>
                    {provinces.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ap-commune" className="label">{t('list.commune')} *</label>
                  <select id="ap-commune" required className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none focus:border-brand-500" value={form.communeId} onChange={(e) => set('communeId', e.target.value)} disabled={!form.provinceId}>
                    <option value="">—</option>
                    {communes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="ap-address" className="label">{t('list.address')}</label>
                  <input id="ap-address" className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Rohero, Avenue 13" />
                </div>
              </div>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.isNegotiable} onChange={(e) => set('isNegotiable', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            {t('list.negotiable')}
          </label>

          {error ? (
            <p role="alert" className="mt-4 rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">{error}</p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setStep(1)} className="btn-outline">
              ← {t('common.previous')}
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? t('common.loading') : editing ? t('common.save') : t('list.submit')}
            </button>
          </div>
        </form>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {t('list.needHelp')}
      </p>
      </Modal>

      <PropertySavedSuccessModal
        open={saved !== null}
        propertyTitle={saved?.property.title ?? ''}
        photoCount={saved?.photoCount ?? 0}
        status={saved?.property.status}
        mode={saved?.mode ?? 'created'}
        onClose={() => setSaved(null)}
      />
    </>
  );
}