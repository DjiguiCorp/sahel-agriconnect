import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';

export default function InvestorRelations() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', org: '', range: '$5K–$25K', source: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/licensing/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          organizationName: form.org || 'Individual',
          contactName: form.name,
          role: 'Investor in Djigui Corporation',
          source: 'investor_relations',
        }),
      });
    } catch {}
    setSent(true);
    setLoading(false);
  };

  const traction = t('trust.investorRelations.traction.items', { returnObjects: true });
  const ranges = t('trust.investorRelations.form.ranges', { returnObjects: true });

  const supplyRows = [
    ['Cooperative memberships', '$199/year', '$19,900'],
    ['Export certifications', '$299–$499', '$14,950'],
    ['Country licenses', '$999/month', '$11,988'],
    ['Training programs', '$99–$299', '$4,950'],
  ];
  const investRows = [
    ['Facilitation fees', '5% of AUM', '$25,000'],
    ['Premium subscriptions', '$299/year', '$14,950'],
    ['Advisory sessions', '$99/call', '$4,950'],
    ['Buyer marketplace', '2–3% fee', 'TBD'],
  ];

  function RevenueTable({ rows }) {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 text-gray-500 font-medium">Stream</th>
            <th className="text-left py-2 text-gray-500 font-medium">Price</th>
            <th className="text-right py-2 text-[#1a3c2e] font-semibold">{t('trust.investorRelations.model.year1')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([s, p, y], i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 text-gray-700">{s}</td>
              <td className="py-2 text-gray-500">{p}</td>
              <td className="py-2 text-right font-mono font-semibold text-[#1a3c2e]">{y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1a3c2e] text-white py-20 px-4 text-center">
        <p className="text-[#B5850A] font-bold text-xs tracking-widest mb-4">{t('trust.investorRelations.label')}</p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 max-w-3xl mx-auto">{t('trust.investorRelations.title')}</h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">{t('trust.investorRelations.subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@woneapp.com?subject=Pitch Deck Request — AfriYield Exchange"
            className="rounded-xl px-7 py-3.5 font-bold text-[#1a3c2e]"
            style={{ background: '#B5850A' }}
          >
            {t('trust.investorRelations.requestDeck')}
          </a>
          <a
            href="mailto:support@woneapp.com?subject=Investor Call Request — AfriYield Exchange"
            className="rounded-xl px-7 py-3.5 font-bold text-white border-2 border-white/30 hover:border-white/60 transition"
          >
            {t('trust.investorRelations.scheduleCall')}
          </a>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        {/* Opportunity stats */}
        <section>
          <h2 className="text-2xl font-bold text-[#1a3c2e] mb-8">{t('trust.investorRelations.opportunity.title')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {['stat1', 'stat2', 'stat3'].map((s) => (
              <div key={s} className="rounded-2xl p-6 text-center" style={{ background: '#F5F0E8' }}>
                <p className="font-mono font-bold text-4xl text-[#1a3c2e] mb-2">
                  {t(`trust.investorRelations.opportunity.${s}value`)}
                </p>
                <p className="text-gray-600 text-sm">{t(`trust.investorRelations.opportunity.${s}label`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Business model */}
        <section>
          <h2 className="text-2xl font-bold text-[#1a3c2e] mb-8">{t('trust.investorRelations.model.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-[#1a3c2e] mb-4">{t('trust.investorRelations.model.supply')}</h3>
              <RevenueTable rows={supplyRows} />
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-[#1a3c2e] mb-4">{t('trust.investorRelations.model.investment')}</h3>
              <RevenueTable rows={investRows} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {['total1', 'total2'].map((k) => (
              <div
                key={k}
                className="rounded-xl p-4 text-center font-bold text-lg"
                style={{ background: k === 'total1' ? '#1a3c2e' : '#B5850A', color: 'white' }}
              >
                {t(`trust.investorRelations.model.${k}`)}
              </div>
            ))}
          </div>
        </section>

        {/* Traction */}
        <section>
          <h2 className="text-2xl font-bold text-[#1a3c2e] mb-8">{t('trust.investorRelations.traction.title')}</h2>
          <div className="space-y-3">
            {Array.isArray(traction) &&
              traction.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: item.status === 'done' ? '#f0f9f4' : item.status === 'current' ? '#fff9e6' : '#f9f9f9',
                  }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.status === 'done' ? '✅' : item.status === 'current' ? '🔄' : '⬜'}</span>
                  <p
                    className={`text-sm ${
                      item.status === 'done'
                        ? 'text-green-800'
                        : item.status === 'current'
                          ? 'text-yellow-800 font-semibold'
                          : 'text-gray-400'
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
          </div>
        </section>

        {/* Why now */}
        <section>
          <h2 className="text-2xl font-bold text-[#1a3c2e] mb-8">{t('trust.investorRelations.whyNow.title')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {['r1', 'r2', 'r3'].map((r, i) => (
              <div key={r} className="rounded-2xl p-6" style={{ background: '#F5F0E8' }}>
                <div className="text-3xl mb-3">{['🌍', '💰', '📱'][i]}</div>
                <h3 className="font-bold text-[#1a3c2e] mb-2">{t(`trust.investorRelations.whyNow.${r}title`)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(`trust.investorRelations.whyNow.${r}body`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-2xl font-bold text-[#1a3c2e] mb-8">{t('trust.investorRelations.team.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="w-16 h-16 rounded-full bg-[#B5850A]/20 flex items-center justify-center text-[#B5850A] font-bold text-xl mb-4">
                IC
              </div>
              <p className="text-xs font-semibold text-[#B5850A] uppercase tracking-wide mb-1">
                {t('trust.investorRelations.team.founderTitle')}
              </p>
              <h3 className="font-bold text-[#1a3c2e] text-xl mb-3">{t('trust.founder.name')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{t('trust.investorRelations.team.founderBio')}</p>
              <div className="flex gap-3">
                <a href="https://isacoultess.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#B5850A] hover:underline">
                  {t('trust.founder.visitSite')} →
                </a>
                <a
                  href="https://djiguicorporation.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#B5850A] hover:underline"
                >
                  {t('trust.founder.visitOrg')} →
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col justify-center items-center text-center">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-bold text-[#1a3c2e] mb-2">{t('trust.investorRelations.team.joinTitle')}</h3>
              <p className="text-gray-600 text-sm mb-4">{t('trust.investorRelations.team.joinBody')}</p>
              <a
                href="mailto:support@woneapp.com?subject=Join the Team — AfriYield Exchange"
                className="rounded-xl px-5 py-2.5 font-semibold text-sm text-white"
                style={{ background: '#1a3c2e' }}
              >
                {t('trust.investorRelations.team.joinCta')} →
              </a>
            </div>
          </div>
        </section>

        {/* Terms */}
        <section>
          <div className="rounded-2xl p-8" style={{ border: '2px solid #B5850A', background: '#fff9e6' }}>
            <h2 className="text-2xl font-bold text-[#1a3c2e] mb-2">{t('trust.investorRelations.terms.title')}</h2>
            <p className="text-[#B5850A] font-semibold mb-6">{t('trust.investorRelations.terms.raising')}</p>
            <h3 className="font-bold text-[#1a3c2e] mb-4">{t('trust.investorRelations.terms.fundsTitle')}</h3>
            <div className="space-y-3 mb-6">
              {['fund1', 'fund2', 'fund3', 'fund4'].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: t(`trust.investorRelations.terms.${f}pct`), background: '#1a3c2e' }} />
                  </div>
                  <span className="text-sm font-bold text-[#1a3c2e] w-10">{t(`trust.investorRelations.terms.${f}pct`)}</span>
                  <span className="text-sm text-gray-700 flex-1">{t(`trust.investorRelations.terms.${f}`)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <p>• {t('trust.investorRelations.terms.minimum')}</p>
              <p>• {t('trust.investorRelations.terms.structure')}</p>
            </div>
          </div>
        </section>

        {/* Request form */}
        <section>
          <div className="rounded-2xl border border-gray-200 p-8 bg-white shadow-sm">
            <h2 className="text-2xl font-bold text-[#1a3c2e] mb-2">{t('trust.investorRelations.form.title')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('trust.investorRelations.terms.deckNote')}</p>
            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📬</div>
                <p className="font-bold text-[#1a3c2e] text-xl">{t('trust.investorRelations.form.success')}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
                {[
                  ['name', 'text'],
                  ['email', 'email'],
                  ['org', 'text'],
                ].map(([field, type]) => (
                  <label key={field} className="space-y-1 sm:col-span-1">
                    <span className="text-sm font-medium text-gray-700">{t(`trust.investorRelations.form.${field}`)}</span>
                    <input
                      type={type}
                      name={field}
                      value={form[field]}
                      onChange={onChange}
                      required={field !== 'org'}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                    />
                  </label>
                ))}
                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">{t('trust.investorRelations.form.range')}</span>
                  <select
                    name="range"
                    value={form.range}
                    onChange={onChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] bg-white"
                  >
                    {Array.isArray(ranges) && ranges.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-sm font-medium text-gray-700">{t('trust.investorRelations.form.message')}</span>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] resize-none"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-60"
                    style={{ background: '#1a3c2e' }}
                  >
                    {loading ? '...' : t('trust.investorRelations.form.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

