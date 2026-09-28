import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, Clock3, Eye, Heart, Radar, Users } from 'lucide-react';
import type { AgentPropertyDTO } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { agentPropertiesApi } from '../../lib/api';
import { formatCompact } from '../../lib/format';
import EmptyState from '../../components/EmptyState';

const NO_DATA = '—';

export default function AnalyticsTab(): JSX.Element {
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState<'overview' | 'properties'>('overview');
  const [properties, setProperties] = useState<AgentPropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);

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

  const statData = [
    { key: 'views', icon: <Eye className="h-5 w-5" aria-hidden="true" />, label: t('analytics.viewsShort'), shown: totals.views, exists: totals.views > 0 },
    { key: 'time', icon: <Clock3 className="h-5 w-5" aria-hidden="true" />, label: t('analytics.avgTime'), shown: NO_DATA, exists: false },
    { key: 'leads', icon: <Users className="h-5 w-5" aria-hidden="true" />, label: t('analytics.statLeads'), shown: totals.inquiries, exists: totals.inquiries > 0 },
  ];

  return (
    <div>
      {/* Sub-tabs + period pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
        <div className="flex items-center gap-5">
          {(
            [
              { id: 'overview', label: t('analytics.tabOverview') },
              { id: 'properties', label: t('analytics.tabProperties') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className="studio-tab"
              aria-selected={subTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="chip chip-active mb-2">
          <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
          {t('analytics.period')}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : subTab === 'overview' ? (
        <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-3">
          {/* Stat tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
            {statData.map((s) => (
              <div key={s.key} className="studio-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">{s.icon}</span>
                <p className={`stat-num mt-4 ${s.exists ? '' : 'text-gray-300'}`}>{s.exists ? formatCompact(Number(s.shown)) : s.shown}</p>
                <p className="mt-1 text-[13px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Realtime card */}
          <div className="studio-card p-5">
            <p className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Radar className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {t('analytics.statRealtime')}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{t('analytics.realtimeDesc')}</p>
            {properties.length === 0 ? (
              <p className="mt-6 text-sm text-gray-400">{NO_DATA}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {properties.slice(0, 4).map((p) => {
                  const views = p.stats?.views ?? p.agentAnalytics?.viewsGenerated ?? 0;
                  return (
                    <li key={p._id} className="flex items-start gap-2.5">
                      {p.media?.[0]?.thumbUrl ? (
                        <img src={p.media[0].thumbUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                          <Building2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-gray-900">{p.title}</p>
                        <p className="text-xs text-gray-400">{views} {t('analytics.viewsShort').toLowerCase()}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Properties view */
        <div className="py-5">
          {properties.length === 0 ? (
            <EmptyState title={t('dashboard.emptyProps')} description={t('dashboard.cards.analyticsDesc')} compact />
          ) : (
            <div className="studio-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-[13px] text-gray-500">
                      <th className="px-4 py-3 font-medium">{t('dashboard.colProperty')}</th>
                      <th className="px-4 py-3 font-medium">{t('analytics.viewsShort')}</th>
                      <th className="px-4 py-3 font-medium">{t('analytics.favoritesShort')}</th>
                      <th className="px-4 py-3 font-medium">{t('analytics.inquiriesShort')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => {
                      return (
                        <tr key={p._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {p.media?.[0]?.thumbUrl ? (
                                <img src={p.media[0].thumbUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                              ) : (
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                  <Building2 className="h-5 w-5" aria-hidden="true" />
                                </span>
                              )}
                              <p className="max-w-[240px] truncate text-body font-medium text-gray-900">{p.title}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-700">{formatCompact(p.stats?.views ?? p.agentAnalytics?.viewsGenerated ?? 0)}</td>
                          <td className="px-4 py-3 text-[13px] text-gray-700">
                            <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />{formatCompact(p.stats?.favorites ?? 0)}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-700">{formatCompact(p.ownerAnalytics?.enquiries ?? p.agentAnalytics?.enquiriesGenerated ?? 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}