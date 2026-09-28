import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Info,
  LayoutDashboard,
  Lock,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CurrencyCode, Language } from '@immo/shared-types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { usersApi, getApiErrorMessage } from '../lib/api';
import PasswordInput from '../components/auth/PasswordInput';
import Modal from '../components/Modal';
import ProfileAvatar from '../components/ProfileAvatar';

const inputClass =
  'h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500';

const selectClass =
  'h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none focus:border-brand-500';

type SectionId = 'general' | 'photo' | 'personal' | 'security' | 'preferences';

const SECTIONS: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
  { id: 'general', label: 'General', icon: LayoutDashboard },
  { id: 'photo', label: 'Profile photo', icon: Camera },
  { id: 'personal', label: 'Personal information', icon: UserIcon },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
];

function roleLabel(role?: string): string {
  switch (role) {
    case 'AGENT':
    case 'FIELD_AGENT':
      return 'Agent';
    case 'ADMIN':
    case 'MAIN_ADMIN':
      return 'Administrator';
    case 'STAFF':
      return 'Staff';
    default:
      return 'Member';
  }
}

function CurrencyHint() {
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        tabIndex={0}
        aria-describedby="settings-currency-hint"
        title="Used for pricing and conversions across the platform."
        className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-700 focus-visible:text-gray-700"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        id="settings-currency-hint"
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-snug text-gray-50 opacity-0 shadow-pop transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 sm:block"
      >
        Used for pricing and conversions across the platform.
      </span>
    </span>
  );
}

/** Downscale an image file to a small JPEG blob for fast uploads. */
function resizeImageFile(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 512;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not prepare image.'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Could not encode image.'));
        },
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image.'));
    };
    img.src = url;
  });
}

export default function SettingsPage(): JSX.Element {
  const { user, updateUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [section, setSection] = useState<SectionId>('general');

  /* Personal information */
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  });
  const personalSnapshot = () => JSON.stringify(profile);
  const [savedPersonal, setSavedPersonal] = useState<string>(personalSnapshot);
  const personalDirty = personalSnapshot() !== savedPersonal;
  const [personalMsg, setPersonalMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* Security */
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const securityValid =
    Boolean(pwd.current) && pwd.next.length >= 8 && pwd.next === pwd.confirm;
  const [securityMsg, setSecurityMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* Profile photo */
  const [selected, setSelected] = useState<{ blob: Blob; name: string; preview: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const savePersonal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?._id) return;
    setSaving(true);
    setPersonalMsg(null);
    try {
      const updated = await usersApi.update(user._id, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        email: profile.email || undefined,
      });
      updateUser(updated);
      setSavedPersonal(personalSnapshot());
      setPersonalMsg({ ok: true, text: 'Your personal information was saved.' });
    } catch (err) {
      setPersonalMsg({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?._id || !securityValid) return;
    setSaving(true);
    setSecurityMsg(null);
    try {
      await usersApi.update(user._id, { currentPassword: pwd.current, password: pwd.next });
      setPwd({ current: '', next: '', confirm: '' });
      setSecurityMsg({ ok: true, text: 'Your password was changed.' });
    } catch (err) {
      setSecurityMsg({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoMsg({ ok: false, text: 'Please choose an image file (PNG, JPG, WEBP or GIF).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMsg({ ok: false, text: 'The image must be 5 MB or smaller.' });
      return;
    }
    try {
      setSelected(null);
      const blob = await resizeImageFile(file);
      setPhotoMsg(null);
      setSelected({ blob, name: `${(file.name.replace(/\.[^.]+$/, '') || 'photo').slice(0, 40)}.jpg`, preview: URL.createObjectURL(blob) });
    } catch (err) {
      setPhotoMsg({ ok: false, text: getApiErrorMessage(err) || 'Could not read this image.' });
    }
  };

  const savePhoto = async () => {
    if (!user?._id || !selected) return;
    setPhotoBusy(true);
    setPhotoMsg(null);
    try {
      const uploaded = await usersApi.uploadProfilePhoto(selected.blob, selected.name);
      const updated = await usersApi.update(user._id, { photoUrl: uploaded.url });
      updateUser(updated);
      setPhotoMsg({ ok: true, text: 'Profile photo updated.' });
      URL.revokeObjectURL(selected.preview);
      setSelected(null);
    } catch (err) {
      setPhotoMsg({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!user?._id) return;
    setPhotoBusy(true);
    setPhotoMsg(null);
    try {
      const updated = await usersApi.update(user._id, { photoUrl: '' });
      updateUser(updated);
      setPhotoMsg({ ok: true, text: 'Profile photo removed.' });
    } catch (err) {
      setPhotoMsg({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const photoUrl = selected?.preview ?? user?.photoUrl ?? '';
  const previewUrl = selected ? photoUrl : '';
  const hasStoredPhoto = Boolean(user?.photoUrl);

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : undefined;

  return (
    <Modal open onClose={close} title="Account settings" size="xl" headerDivider fullBleed>
      <div className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col sm:flex-row">
          {/* Sidebar navigation */}
          <nav
            aria-label="Settings sections"
            className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-gray-200 px-3 py-2 scrollbar-hide sm:w-56 sm:flex-col sm:gap-0 sm:overflow-visible sm:border-b-0 sm:border-r sm:px-2 sm:py-4"
          >
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:w-full ${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 hidden h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-ink transition-opacity sm:block"
                    style={{ opacity: active ? 1 : 0 }}
                  />
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Content pane */}
          <div className="min-w-0 flex-1 px-6 py-5">
            <div className="mx-auto w-full max-w-3xl">
              {section === 'general' ? (
                <div>
                  <h3 className="section-title">General</h3>
                  <p className="mt-1 text-sm text-gray-500">An overview of your Immo Burundi account.</p>

                  <div className="mt-6 flex flex-col gap-5 rounded-xl border border-gray-200 bg-gray-50/50 p-5 sm:flex-row sm:items-center">
                    <ProfileAvatar user={user} sizeClass="h-20 w-20" textClass="text-lg" alt="Profile" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-gray-900">
                          {user?.firstName ?? ''} {user?.lastName ?? ''}
                        </p>
                        <span className="rounded-full border border-gray-200 bg-surface px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {roleLabel(user?.role)}
                        </span>
                      </div>
                      {user?.email ? (
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                          <Mail className="h-4 w-4" aria-hidden="true" /> {user.email}
                        </p>
                      ) : null}
                      {user?.phone ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                          <Phone className="h-4 w-4" aria-hidden="true" /> {user.phone}
                        </p>
                      ) : null}
                      {joined ? <p className="mt-0.5 text-sm text-gray-500">Member since {joined}</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {section === 'photo' ? (
                <div>
                  <h3 className="section-title">Profile photo</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload a photo straight from your computer. It is shown next to your name across the platform.
                  </p>

                  <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
                    <ProfileAvatar user={user} src={photoUrl} sizeClass="h-24 w-24" textClass="text-lg" alt="Profile preview" />
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={onPickPhoto}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary" disabled={photoBusy}>
                          <Camera className="h-4 w-4" aria-hidden="true" />
                          Choose photo
                        </button>
                        {previewUrl ? (
                          <>
                            <button type="button" onClick={savePhoto} className="btn-primary" disabled={photoBusy}>
                              {photoBusy ? 'Uploading…' : 'Save photo'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (selected) URL.revokeObjectURL(selected.preview);
                                setSelected(null);
                                setPhotoMsg(null);
                              }}
                              className="btn-outline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : null}
                        {!previewUrl && hasStoredPhoto ? (
                          <button type="button" onClick={removePhoto} className="btn-outline text-notVerified" disabled={photoBusy}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Remove photo
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-gray-500">PNG, JPG, WEBP or GIF. Maximum 5 MB.</p>
                    </div>
                  </div>

                  {photoMsg ? (
                    <p
                      role="alert"
                      className={`mt-4 rounded-xl p-3 text-sm ${
                        photoMsg.ok ? 'bg-verified/10 text-verified' : 'bg-notVerified/10 text-notVerified'
                      }`}
                    >
                      {photoMsg.text}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {section === 'personal' ? (
                <div>
                  <h3 className="section-title">Personal information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your name, phone number and email address.
                  </p>

                  <form id="settings-personal-form" onSubmit={savePersonal} className="mt-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="settings-first" className="label">
                          First name
                        </label>
                        <input
                          id="settings-first"
                          className={inputClass}
                          value={profile.firstName}
                          onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-last" className="label">
                          Last name
                        </label>
                        <input
                          id="settings-last"
                          className={inputClass}
                          value={profile.lastName}
                          onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-phone" className="label">
                          Phone
                        </label>
                        <input
                          id="settings-phone"
                          type="tel"
                          className={inputClass}
                          value={profile.phone}
                          onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-email" className="label">
                          Email
                        </label>
                        <input
                          id="settings-email"
                          type="email"
                          className={inputClass}
                          value={profile.email}
                          onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        />
                      </div>
                    </div>

                    {personalMsg ? (
                      <p
                        role="alert"
                        className={`mt-4 rounded-xl p-3 text-sm ${
                          personalMsg.ok ? 'bg-verified/10 text-verified' : 'bg-notVerified/10 text-notVerified'
                        }`}
                      >
                        {personalMsg.text}
                      </p>
                    ) : null}
                  </form>
                </div>
              ) : null}

              {section === 'security' ? (
                <div>
                  <h3 className="section-title">Security</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Change the password you use to sign in to your account.
                  </p>

                  <form id="settings-security-form" onSubmit={savePassword} className="mt-6 max-w-md space-y-4">
                    <div>
                      <label htmlFor="settings-pwd-current" className="label">
                        Current password
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Lock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                        <PasswordInput
                          id="settings-pwd-current"
                          value={pwd.current}
                          onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                          autoComplete="current-password"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="settings-pwd-new" className="label">
                        New password
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Lock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                        <PasswordInput
                          id="settings-pwd-new"
                          value={pwd.next}
                          onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="settings-pwd-confirm" className="label">
                        Confirm new password
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Lock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                        <PasswordInput
                          id="settings-pwd-confirm"
                          value={pwd.confirm}
                          onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                          autoComplete="new-password"
                          placeholder="Repeat the new password"
                        />
                      </div>
                    </div>
                  </form>

                  {securityMsg ? (
                    <p
                      role="alert"
                      className={`mt-4 max-w-md rounded-xl p-3 text-sm ${
                        securityMsg.ok ? 'bg-verified/10 text-verified' : 'bg-notVerified/10 text-notVerified'
                      }`}
                    >
                      {securityMsg.text}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {section === 'preferences' ? (
                <div>
                  <h3 className="section-title">Appearance and preferences</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your choices are saved automatically on this device and stay until you change them.
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <span className="label">Theme</span>
                      <div className="flex max-w-md gap-2">
                        {(
                          [
                            { value: 'light', label: 'Light', icon: Sun },
                            { value: 'dark', label: 'Dark', icon: Moon },
                          ] as const
                        ).map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setTheme(value)}
                            aria-pressed={theme === value}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                              theme === value
                                ? 'border-gray-900 bg-ink text-white dark:border-gray-200'
                                : 'border-gray-200 bg-surface text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 max-w-md gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="settings-lang" className="label">
                          Preferred language
                        </label>
                        <select
                          id="settings-lang"
                          className={selectClass}
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as Language)}
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                          <option value="sw">Swahili</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="mb-1.5 flex items-center gap-2">
                          <label htmlFor="settings-currency" className="label mb-0">
                            Default currency
                          </label>
                          <CurrencyHint />
                        </div>
                        <select
                          id="settings-currency"
                          className={selectClass}
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        >
                          <option value="BIF">BIF</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 pb-6 pt-4">
          <button type="button" onClick={close} className="btn-outline">
            Close
          </button>
          {(section === 'personal' || section === 'security') ? (
            <button
              type="submit"
              form={section === 'personal' ? 'settings-personal-form' : 'settings-security-form'}
              disabled={saving || (section === 'personal' ? !personalDirty : !securityValid)}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}