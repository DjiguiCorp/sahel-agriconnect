import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { ArrowRight, Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function apiUrl(path) {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

function getAdminToken() {
  return localStorage.getItem('adminToken');
}

function authHeadersMaybe() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function StatCard({ title, color, value, loading }) {
  const colorMap = {
    green: 'border-green-200 bg-green-50 text-green-900',
    gold: 'border-[#e9d7a7] bg-[#fff7df] text-[#7a5b10]',
    purple: 'border-purple-200 bg-purple-50 text-purple-900',
    forest: 'border-[#1a3c2e]/20 bg-white text-[#1a3c2e]',
  };
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${colorMap[color] || colorMap.forest}`}>
      <p className="text-sm font-bold opacity-80">{title}</p>
      <div className="mt-3 flex items-center gap-3">
        {loading ? <Loader2 className="w-6 h-6 animate-spin opacity-70" aria-hidden /> : null}
        <p className="text-4xl font-extrabold tabular-nums">{loading ? '' : value}</p>
      </div>
    </div>
  );
}

export default function ImpactReport() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState({
    farmers: { loading: true, value: t('impact.metrics.unavailable') },
    cooperatives: { loading: true, value: t('impact.metrics.unavailable') },
    investors: { loading: true, value: '0' },
    opportunities: { loading: true, value: t('impact.metrics.unavailable') },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = getAdminToken();
      const headersAuth = { ...authHeadersMaybe() };

      const requests = {
        farmers: fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=1`, { headers: headersAuth }),
        cooperatives: fetch(`${apiUrl('/api/cooperatives/admin')}`, { headers: headersAuth }),
        investors: token ? fetch(`${apiUrl('/api/investors')}`, { headers: headersAuth }) : null,
        opportunities: fetch(`${apiUrl('/api/opportunities')}`),
      };

      const settled = await Promise.allSettled([
        requests.farmers,
        requests.cooperatives,
        requests.investors,
        requests.opportunities,
      ]);

      const next = { ...metrics };

      // Farmers
      try {
        const r = settled[0].status === 'fulfilled' ? settled[0].value : null;
        if (r && r.ok) {
          const j = await r.json().catch(() => ({}));
          const total = j?.pagination?.total;
          next.farmers = {
            loading: false,
            value: Number.isFinite(Number(total)) ? String(total) : t('impact.metrics.unavailable'),
          };
        } else {
          next.farmers = { loading: false, value: t('impact.metrics.unavailable') };
        }
      } catch {
        next.farmers = { loading: false, value: t('impact.metrics.unavailable') };
      }

      // Cooperatives
      try {
        const r = settled[1].status === 'fulfilled' ? settled[1].value : null;
        if (r && r.ok) {
          const j = await r.json().catch(() => ({}));
          const arr = Array.isArray(j?.cooperatives) ? j.cooperatives : [];
          next.cooperatives = { loading: false, value: String(arr.length) };
        } else {
          next.cooperatives = { loading: false, value: t('impact.metrics.unavailable') };
        }
      } catch {
        next.cooperatives = { loading: false, value: t('impact.metrics.unavailable') };
      }

      // Investors (spec: use token if available, else show 0)
      if (!token) {
        next.investors = { loading: false, value: '0' };
      } else {
        try {
          const r = settled[2].status === 'fulfilled' ? settled[2].value : null;
          if (r && r.ok) {
            const j = await r.json().catch(() => ({}));
            const arr = Array.isArray(j?.investors) ? j.investors : [];
            next.investors = { loading: false, value: String(arr.length) };
          } else {
            next.investors = { loading: false, value: t('impact.metrics.unavailable') };
          }
        } catch {
          next.investors = { loading: false, value: t('impact.metrics.unavailable') };
        }
      }

      // Opportunities (active)
      try {
        const r = settled[3].status === 'fulfilled' ? settled[3].value : null;
        if (r && r.ok) {
          const j = await r.json().catch(() => ({}));
          const arr = Array.isArray(j?.opportunities) ? j.opportunities : [];
          next.opportunities = { loading: false, value: String(arr.length) };
        } else {
          next.opportunities = { loading: false, value: t('impact.metrics.unavailable') };
        }
      } catch {
        next.opportunities = { loading: false, value: t('impact.metrics.unavailable') };
      }

      if (!cancelled) setMetrics(next);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sdgCards = useMemo(
    () => [
      { n: 1, name: t('impact.sdg.sdg1.label'), text: t('impact.sdg.sdg1.text'), color: 'bg-red-600' },
      { n: 2, name: t('impact.sdg.sdg2.label'), text: t('impact.sdg.sdg2.text'), color: 'bg-yellow-500' },
      { n: 8, name: t('impact.sdg.sdg8.label'), text: t('impact.sdg.sdg8.text'), color: 'bg-purple-600' },
      { n: 17, name: t('impact.sdg.sdg17.label'), text: t('impact.sdg.sdg17.text'), color: 'bg-blue-600' },
    ],
    [t]
  );

  const tocStages = useMemo(
    () => [
      { title: t('impact.theoryOfChange.inputs.label'), text: t('impact.theoryOfChange.inputs.text'), border: 'border-t-green-600' },
      { title: t('impact.theoryOfChange.activities.label'), text: t('impact.theoryOfChange.activities.text'), border: 'border-t-[#B5850A]' },
      { title: t('impact.theoryOfChange.outputs.label'), text: t('impact.theoryOfChange.outputs.text'), border: 'border-t-purple-600' },
      { title: t('impact.theoryOfChange.outcomes.label'), text: t('impact.theoryOfChange.outcomes.text'), border: 'border-t-blue-600' },
      { title: t('impact.theoryOfChange.impact.label'), text: t('impact.theoryOfChange.impact.text'), border: 'border-t-[#1a3c2e]' },
    ],
    [t]
  );

  const progress = useMemo(
    () => [
      { state: 'done', label: t('impact.firstDeal.steps.launched') },
      { state: 'done', label: t('impact.firstDeal.steps.producers') },
      { state: 'done', label: t('impact.firstDeal.steps.exchange') },
      { state: 'doing', label: t('impact.firstDeal.steps.verified') },
      { state: 'todo', label: t('impact.firstDeal.steps.matched') },
      { state: 'todo', label: t('impact.firstDeal.steps.closed') },
      { state: 'todo', label: t('impact.firstDeal.steps.roi') },
    ],
    [t]
  );

  return (
    <div className="bg-brand-cream">
      {/* Hero */}
      <section className="bg-[#1a3c2e] text-white py-16">
        <div className="section-container text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t('impact.title')}</h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-4xl mx-auto">
            {t('impact.subtitle')}
          </p>
          <div className="mt-8 max-w-3xl mx-auto rounded-xl border border-[#B5850A]/40 bg-[#B5850A]/10 px-4 py-3 text-[#fff7df]">
            <p className="text-sm font-semibold">{t('impact.liveNotice')}</p>
          </div>
        </div>
      </section>

      {/* Section 1 — Live Platform Metrics */}
      <section className="section-container py-14">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-10">{t('impact.metrics.title')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('impact.metrics.farmers')}
            color="green"
            loading={metrics.farmers.loading}
            value={metrics.farmers.value}
          />
          <StatCard
            title={t('impact.metrics.cooperatives')}
            color="gold"
            loading={metrics.cooperatives.loading}
            value={metrics.cooperatives.value}
          />
          <StatCard
            title={t('impact.metrics.investors')}
            color="purple"
            loading={metrics.investors.loading}
            value={metrics.investors.value}
          />
          <StatCard
            title={t('impact.metrics.opportunities')}
            color="forest"
            loading={metrics.opportunities.loading}
            value={metrics.opportunities.value}
          />
        </div>
      </section>

      {/* Section 2 — SDG Alignment */}
      <section className="section-container py-14 pt-0">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-2">{t('impact.sdg.title')}</h2>
        <p className="text-center text-gray-700 mb-10">{t('impact.sdg.subtitle')}</p>
        <div className="grid md:grid-cols-2 gap-6">
          {sdgCards.map((c) => (
            <div key={c.n} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full ${c.color} text-white font-extrabold flex items-center justify-center`}>
                  {c.n}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#1a3c2e]">SDG {c.n} — {c.name}</h3>
                  <p className="mt-2 text-gray-700">{c.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Theory of Change */}
      <section className="section-container py-14 pt-0">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-2">{t('impact.theoryOfChange.title')}</h2>
        <p className="text-center text-gray-700 mb-10">{t('impact.theoryOfChange.subtitle')}</p>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch">
          {tocStages.map((s, i) => (
            <div key={s.title} className="contents md:block">
              <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-t-4 ${s.border}`}>
                <p className="text-xs font-extrabold tracking-widest text-gray-500">{s.title}</p>
                <p className="mt-3 text-gray-700">{s.text}</p>
              </div>
              {i < tocStages.length - 1 ? (
                <div className="hidden md:flex items-center justify-center px-2 text-[#B5850A]" aria-hidden>
                  <ArrowRight className="w-6 h-6" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — First Transaction Progress */}
      <section className="section-container py-14 pt-0">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-2">{t('impact.firstDeal.title')}</h2>
        <p className="text-center text-gray-700 mb-10">{t('impact.firstDeal.subtitle')}</p>
        <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {progress.map((p) => (
              <div key={p.label} className="flex items-start gap-4">
                <div className="mt-0.5">
                  {p.state === 'done' ? (
                    <span className="inline-flex w-6 h-6 rounded-full bg-green-600 text-white items-center justify-center text-sm font-extrabold">✓</span>
                  ) : p.state === 'doing' ? (
                    <span className="inline-flex w-6 h-6 rounded-full bg-[#B5850A] text-white items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    </span>
                  ) : (
                    <span className="inline-flex w-6 h-6 rounded-full bg-gray-200 text-gray-600 items-center justify-center text-sm font-extrabold">•</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{p.state === 'done' ? `✅ ${p.label}` : p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Download Resources */}
      <section className="section-container py-14 pt-0 pb-20">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-10">{t('impact.resources.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#1a3c2e]">{t('impact.resources.overview.title')}</h3>
            <p className="mt-2 text-gray-700 text-sm">{t('impact.resources.overview.desc')}</p>
            <Link
              to="/contact"
              state={{ subject: 'Platform Overview PDF' }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a3c2e] text-white font-extrabold py-2.5 hover:bg-[#143326]"
            >
              <Download className="w-4 h-4" aria-hidden />
              {t('impact.resources.overview.cta')}
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#1a3c2e]">{t('impact.resources.prospectus.title')}</h3>
            <p className="mt-2 text-gray-700 text-sm">{t('impact.resources.prospectus.desc')}</p>
            <Link
              to="/afri-yield/register"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#B5850A] text-white font-extrabold py-2.5 hover:bg-[#9a7109]"
            >
              {t('impact.resources.prospectus.cta')}
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#1a3c2e]">{t('impact.resources.governance.title')}</h3>
            <p className="mt-2 text-gray-700 text-sm">{t('impact.resources.governance.desc')}</p>
            <Link
              to="/governance"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1a3c2e] text-[#1a3c2e] font-extrabold py-2.5 hover:bg-[#1a3c2e] hover:text-white transition"
            >
              {t('impact.resources.governance.cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

