import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Loader2 } from 'lucide-react';

function apiUrl(path) {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

function fmtMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString()}`;
}

function fmtDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString();
}

function payoutPill(status) {
  const map = {
    paid: 'bg-green-50 text-green-900 border-green-200',
    scheduled: 'bg-[#fff7df] text-[#7a5b10] border-[#e9d7a7]',
    delayed: 'bg-red-50 text-red-900 border-red-200',
  };
  return map[status] || 'bg-gray-50 text-gray-800 border-gray-200';
}

export default function InvestorDashboard() {
  const [params, setParams] = useSearchParams();
  const initialEmail = (params.get('email') || localStorage.getItem('afriyield_investor_email') || '').trim();
  const [email, setEmail] = useState(initialEmail);
  const [identified, setIdentified] = useState(Boolean(initialEmail));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [investments, setInvestments] = useState([]);

  const load = async (e) => {
    const em = String(e || '').trim().toLowerCase();
    if (!em) return;
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(apiUrl(`/api/investments/investor/${encodeURIComponent(em)}`));
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Failed');
      setInvestments(Array.isArray(j?.investments) ? j.investments : []);
      setIdentified(true);
      localStorage.setItem('afriyield_investor_email', em);
      setParams({ email: em });
    } catch (e2) {
      setErr(e2.message || 'Error');
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (identified && email) load(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const totalDeployed = investments.reduce((s, inv) => s + (Number(inv.amountDeployed) || 0), 0);
    const totalReceived = investments.reduce((s, inv) => {
      const paid = (inv.payoutSchedule || []).filter((p) => p.status === 'paid');
      return s + paid.reduce((s2, p) => s2 + (Number(p.amount) || 0), 0);
    }, 0);
    const nextPayout = investments
      .flatMap((inv) => (inv.payoutSchedule || []).filter((p) => p.status === 'scheduled'))
      .map((p) => new Date(p.payoutDate))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return { totalDeployed, totalReceived, nextPayout };
  }, [investments]);

  if (!identified) {
    return (
      <div className="bg-brand-cream min-h-[60vh] py-12">
        <div className="section-container">
          <div className="max-w-lg mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-md text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a3c2e]">Mon Portefeuille AfriYield</h1>
            <p className="mt-2 text-gray-600">Entrez votre email d'investisseur pour consulter votre portefeuille.</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(ev) => {
                ev.preventDefault();
                load(email);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#B5850A]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1a3c2e] text-white font-extrabold py-3 hover:bg-[#143326] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Accéder à mon portefeuille
              </button>
            </form>

            {err ? <p className="mt-4 text-sm text-red-700">{err}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-[60vh]">
      <section className="bg-[#1a3c2e] py-12">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Mon Portefeuille AfriYield</h1>
          <p className="mt-3 text-lg text-white/85 max-w-2xl mx-auto">
            Transparence sur votre capital déployé, vos paiements et votre calendrier de ROI.
          </p>
        </div>
      </section>

      <section className="section-container py-12 space-y-8">
        {/* Summary cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-gray-600">Total capital deployed</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a3c2e]">{fmtMoney(summary.totalDeployed)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-gray-600">Next payout date</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a3c2e]">{summary.nextPayout ? fmtDate(summary.nextPayout) : '—'}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-gray-600">Total received to date</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a3c2e]">{fmtMoney(summary.totalReceived)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#B5850A]" aria-hidden />
          </div>
        ) : investments.length === 0 ? (
          <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
            <p className="text-lg font-extrabold text-[#1a3c2e]">Aucun investissement trouvé pour cet email.</p>
            <p className="mt-2 text-gray-700">
              Vous venez de vous inscrire ? Notre équipe vous contactera dans les 24 heures pour discuter des opportunités disponibles.
            </p>
            <Link
              to="/afri-yield/opportunities"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#B5850A] px-6 py-3 font-extrabold text-white hover:bg-[#9a7109]"
            >
              Voir les opportunités
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {investments.map((inv) => (
              <div key={inv._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-xl font-extrabold text-[#1a3c2e]">{inv.opportunityName || '—'}</p>
                    <p className="text-sm text-gray-600">{inv.commodity || '—'} • {inv.track || '—'}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full border bg-gray-50 text-gray-800 border-gray-200">
                      {String(inv.status || 'active').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Amount deployed</p>
                    <p className="mt-1 font-extrabold text-[#1a3c2e]">{fmtMoney(inv.amountDeployed)}</p>
                    <p className="text-xs text-gray-500 mt-1">Deployed: {fmtDate(inv.deploymentDate)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Expected annual ROI %</p>
                    <p className="mt-1 font-extrabold text-[#1a3c2e]">{Number(inv.expectedROIPercent || 0)}%</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Investor</p>
                    <p className="mt-1 font-extrabold text-[#1a3c2e]">{inv.investorName || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">{inv.investorEmail || '—'}</p>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(inv.payoutSchedule || []).map((p, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">{fmtDate(p.payoutDate)}</td>
                          <td className="px-4 py-3">{fmtMoney(p.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-bold ${payoutPill(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
