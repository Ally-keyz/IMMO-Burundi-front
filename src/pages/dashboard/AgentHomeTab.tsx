import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Pencil, Plus, Sparkles } from 'lucide-react';
import type { AgentPropertyDTO } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { agentPropertiesApi } from '../../lib/api';
import { formatCompact } from '../../lib/format';
import EmptyState from '../../components/EmptyState';
import AddPropertyModal from './AddPropertyModal';

const TIPS = ['dashboard.cards.tip1', 'dashboard.cards.tip2', 'dashboard.cards.tip3'];

export default function AgentHomeTab(): JSX.Element {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<AgentPropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [tip, setTip] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agentPropertiesApi.list({ page: 1, pageSize: 50 });
      setProperties(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(
    () =>
      properties.reduce(
        (acc, property) => ({
          views: acc.views + (property.stats?.views ?? property.agentAnalytics?.viewsGenerated ?? 0),
          inquiries: acc.inquiries + (property.ownerAnalytics?.enquiries ?? property.agentAnalytics?.enquiriesGenerated ?? 0),
        }),
        { views: 0, inquiries: 0 },
      ),
    [properties],
  );

  const published = properties.filter((p) => p.status === 'PUBLISHED').length;

  const quickButtons = [
    { key: 'add', label: t('dashboard.addNew'), icon: <Plus className="h-6 w-6" aria-hidden="true" />, onClick: () => setAddOpen(true) },
    { key: 'analytics', label: t('dashboard.analytics'), icon: <Sparkles className="h-6 w-6" aria-hidden="true" />, onClick: () => navigate('/dashboard?tab=analytics') },
    { key: 'profile', label: t('dashboard.editProfile'), icon: <Pencil className="h-6 w-6" aria-hidden="true" />, onClick: () => navigate('/settings') },
  ];

  return (
    <div>
      {/* Toolbar — page title + circular quick actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">{t('dashboard.agentTitle')}</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quickButtons.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={b.onClick}
              title={b.label}
              aria-label={b.label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-surface text-gray-700 transition-colors hover:bg-gray-100"
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1 — list / manage */}
          <div className="studio-card flex min-h-[230px] flex-col overflow-hidden">
            {properties.length === 0 ? (
              <EmptyState
                illustration="/no_content_illustration_v4.svg"
                title={t('dashboard.cards.listTitle')}
                description={t('dashboard.cards.listDesc')}
                actionLabel={t('dashboard.cards.listCta')}
                onAction={() => setAddOpen(true)}
                compact
              />
            ) : (
              <div className="flex flex-1 flex-col p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-base font-bold text-gray-900">{t('dashboard.myProperties')}</p>
                <p className="mt-1 text-[13px] text-gray-500">
                  {properties.length} {t('dashboard.properties').toLowerCase()} · {published} published
                </p>
                <div className="mt-auto pt-5">
                  <button type="button" onClick={() => navigate('/dashboard?tab=myProperties')} className="btn-outline w-full">
                    {t('dashboard.myProperties')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2 — analytics snapshot */}
          <div className="studio-card flex flex-col p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-base font-bold text-gray-900">{t('dashboard.cards.analyticsTitle')}</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="stat-num">{properties.length ? formatCompact(totals.views) : '—'}</p>
                <p className="mt-1 text-[13px] text-gray-500">{t('analytics.viewsShort')}</p>
              </div>
              <div>
                <p className="stat-num">{properties.length ? formatCompact(totals.inquiries) : '—'}</p>
                <p className="mt-1 text-[13px] text-gray-500">{t('analytics.statLeads')}</p>
              </div>
            </div>
            <div className="mt-auto pt-5">
              <button type="button" onClick={() => navigate('/dashboard?tab=analytics')} className="btn-outline w-full">
                {t('dashboard.cards.analyticsCta')}
              </button>
            </div>
          </div>

          {/* Card 3 — tips */}
          <div className="studio-card flex flex-col p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/30 text-gray-800">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-base font-bold text-gray-900">{t('dashboard.cards.tipsTitle')}</p>
            <div className="mt-4 flex-1">
              <p className="text-[15px] leading-relaxed text-gray-700">{t(TIPS[tip])}</p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 pt-4">
              {TIPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTip(i)}
                  aria-label={`Tip ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === tip ? 'w-6 bg-ink' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <AddPropertyModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => void load()} />
    </div>
  );
}