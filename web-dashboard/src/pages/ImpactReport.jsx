import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { ArrowRight, Download, Loader2 } from 'lucide-react';

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
  const [metrics, setMetrics] = useState({
    farmers: { loading: true, value: '—' },
    cooperatives: { loading: true, value: '—' },
    investors: { loading: true, value: '0' },
    opportunities: { loading: true, value: '—' },
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
          next.farmers = { loading: false, value: Number.isFinite(Number(total)) ? String(total) : '—' };
        } else {
          next.farmers = { loading: false, value: '—' };
        }
      } catch {
        next.farmers = { loading: false, value: '—' };
      }

      // Cooperatives
      try {
        const r = settled[1].status === 'fulfilled' ? settled[1].value : null;
        if (r && r.ok) {
          const j = await r.json().catch(() => ({}));
          const arr = Array.isArray(j?.cooperatives) ? j.cooperatives : [];
          next.cooperatives = { loading: false, value: String(arr.length) };
        } else {
          next.cooperatives = { loading: false, value: '—' };
        }
      } catch {
        next.cooperatives = { loading: false, value: '—' };
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
            next.investors = { loading: false, value: '—' };
          }
        } catch {
          next.investors = { loading: false, value: '—' };
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
          next.opportunities = { loading: false, value: '—' };
        }
      } catch {
        next.opportunities = { loading: false, value: '—' };
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
      {
        n: 1,
        name: 'No Poverty',
        text:
          'Connecting smallholder farmers to international markets increases household income and reduces dependency on subsistence agriculture.',
        color: 'bg-red-600',
      },
      {
        n: 2,
        name: 'Zero Hunger',
        text:
          'Soil diagnosis, disease detection, and production optimization tools help farmers increase yields and food security.',
        color: 'bg-yellow-500',
      },
      {
        n: 8,
        name: 'Decent Work',
        text:
          'Cooperative membership, certification, and export access create formal economic opportunities for rural producers.',
        color: 'bg-purple-600',
      },
      {
        n: 17,
        name: 'Partnerships',
        text:
          'Multi-stakeholder platform connecting governments, NGOs, diaspora investors, and international buyers.',
        color: 'bg-blue-600',
      },
    ],
    []
  );

  const tocStages = useMemo(
    () => [
      { title: 'INPUTS', text: 'Farmer registration, AI tools, cooperative membership', border: 'border-t-green-600' },
      {
        title: 'ACTIVITIES',
        text: 'Certification, training, equipment funding, transformation center matching',
        border: 'border-t-[#B5850A]',
      },
      {
        title: 'OUTPUTS',
        text: 'Certified producers, active cooperatives, funded opportunities, export transactions',
        border: 'border-t-purple-600',
      },
      {
        title: 'OUTCOMES',
        text: 'Increased farm income, reduced post-harvest loss, export market access',
        border: 'border-t-blue-600',
      },
      {
        title: 'IMPACT',
        text: 'Food sovereignty, economic empowerment, generational wealth',
        border: 'border-t-[#1a3c2e]',
      },
    ],
    []
  );

  const progress = useMemo(
    () => [
      { state: 'done', label: 'Platform launched' },
      { state: 'done', label: 'First producers registered' },
      { state: 'done', label: 'AfriYield Exchange live' },
      { state: 'doing', label: 'First opportunity verified (in progress)' },
      { state: 'todo', label: 'First investor matched' },
      { state: 'todo', label: 'First deal closed' },
      { state: 'todo', label: 'First ROI distributed' },
    ],
    []
  );

  return (
    <div className="bg-brand-cream">
      {/* Hero */}
      <section className="bg-[#1a3c2e] text-white py-16">
        <div className="section-container text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Notre Impact — Données Réelles</h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-4xl mx-auto">
            Transparence totale sur la croissance de la plateforme et l'impact sur les communautés agricoles africaines
          </p>
          <div className="mt-8 max-w-3xl mx-auto rounded-xl border border-[#B5850A]/40 bg-[#B5850A]/10 px-4 py-3 text-[#fff7df]">
            <p className="text-sm font-semibold">Ces données sont mises à jour en temps réel depuis notre base de données.</p>
          </div>
        </div>
      </section>

      {/* Section 1 — Live Platform Metrics */}
      <section className="section-container py-14">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-10">Live Platform Metrics</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Agriculteurs enregistrés"
            color="green"
            loading={metrics.farmers.loading}
            value={metrics.farmers.value}
          />
          <StatCard
            title="Coopératives actives"
            color="gold"
            loading={metrics.cooperatives.loading}
            value={metrics.cooperatives.value}
          />
          <StatCard
            title="Investisseurs inscrits"
            color="purple"
            loading={metrics.investors.loading}
            value={metrics.investors.value}
          />
          <StatCard
            title="Opportunités AfriYield actives"
            color="forest"
            loading={metrics.opportunities.loading}
            value={metrics.opportunities.value}
          />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Note: certains métriques nécessitent un accès admin (token) et peuvent afficher "—" si indisponibles.
        </p>
      </section>

      {/* Section 2 — SDG Alignment */}
      <section className="section-container py-14 pt-0">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-10">SDG Alignment</h2>
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
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-10">Theory of Change</h2>
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
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-10">First Transaction Progress</h2>
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
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-10">Ressources</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#1a3c2e]">Platform Overview</h3>
            <p className="mt-2 text-gray-700 text-sm">
              One-page summary of Sahel AgriConnect and AfriYield Exchange
            </p>
            <Link
              to="/contact"
              state={{ subject: 'Platform Overview PDF' }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a3c2e] text-white font-extrabold py-2.5 hover:bg-[#143326]"
            >
              <Download className="w-4 h-4" aria-hidden />
              Télécharger (PDF)
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#1a3c2e]">Investment Prospectus</h3>
            <p className="mt-2 text-gray-700 text-sm">
              AfriYield Exchange investment framework and ROI structure
            </p>
            <Link
              to="/afri-yield/register"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#B5850A] text-white font-extrabold py-2.5 hover:bg-[#9a7109]"
            >
              Demander le prospectus
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#1a3c2e]">Data Governance Policy</h3>
            <p className="mt-2 text-gray-700 text-sm">
              Our data sovereignty and privacy framework
            </p>
            <Link
              to="/governance"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1a3c2e] text-[#1a3c2e] font-extrabold py-2.5 hover:bg-[#1a3c2e] hover:text-white transition"
            >
              Voir la politique
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

