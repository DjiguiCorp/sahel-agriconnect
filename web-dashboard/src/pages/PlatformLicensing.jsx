import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Shield, Settings, Globe, Loader2, Check } from 'lucide-react';
import LocationSelector from '../components/LocationSelector';

export default function PlatformLicensing() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    organizationName: '',
    country: '',
    contactName: '',
    email: '',
    phone: '',
    role: t('platformLicensing.form.roles.ministry'),
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(API_ENDPOINTS.LICENSING.INQUIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || 'Request failed');
      }
      setState({ loading: false, ok: true, err: '' });
    } catch (err) {
      setState({ loading: false, ok: false, err: err.message || 'Error' });
    }
  };

  const pillars = [
    { Icon: Shield, key: 'sovereign' },
    { Icon: Settings, key: 'custom' },
    { Icon: Globe, key: 'global' },
  ];

  const roleKeys = ['ministry', 'regional', 'ngo', 'cooperative', 'other'];

  return (
    <div className="bg-[#1a3c2e] text-white min-h-[60vh]">
      {/* Hero */}
      <section className="section-container py-16 md:py-20">
        <div className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            {t('platformLicensing.hero.title')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-3xl">
            {t('platformLicensing.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="section-container pt-0 pb-14">
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map(({ Icon, key }) => (
            <div key={key} className="rounded-2xl bg-white/10 border border-white/15 p-6">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A] text-[#1a3c2e] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-xl font-bold text-white">
                {t(`platformLicensing.pillars.${key}.title`)}
              </h3>
              <p className="mt-2 text-white/85">
                {t(`platformLicensing.pillars.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing card */}
      <section className="section-container pt-0 pb-14">
        <div className="rounded-2xl bg-white text-[#1a3c2e] p-8 md:p-10 border border-[#B5850A]/40 shadow-xl max-w-3xl">
          <p className="text-sm font-semibold text-[#B5850A] uppercase tracking-wide">
            {t('platformLicensing.license.badge')}
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-2">
            {t('platformLicensing.license.price')}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('platformLicensing.license.description')}
          </p>
          <ul className="mt-8 space-y-3 text-gray-800">
            {t('platformLicensing.license.features', { returnObjects: true }).map((feature) => (
              <li key={feature} className="flex gap-3 items-start">
                <Check className="w-5 h-5 text-[#B5850A] shrink-0 mt-0.5" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Data isolation diagram */}
      <section className="section-container pt-0 pb-14">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">
          {t('platformLicensing.isolation.title')}
        </h2>
        <p className="mt-2 text-white/85 max-w-3xl">
          {t('platformLicensing.isolation.subtitle')}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-2">
          <div className="rounded-2xl bg-white/10 border border-white/15 p-6 text-center">
            <p className="text-sm font-semibold text-[#B5850A]">{t('platformLicensing.isolation.countryA')}</p>
            <p className="text-sm text-white/80 mt-2">{t('platformLicensing.isolation.countryADesc')}</p>
          </div>
          <div className="hidden md:flex justify-center text-[#B5850A] text-2xl font-black" aria-hidden>
            →
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-6 text-center">
            <p className="text-sm font-semibold text-[#B5850A]">{t('platformLicensing.isolation.countryB')}</p>
            <p className="text-sm text-white/80 mt-2">{t('platformLicensing.isolation.countryBDesc')}</p>
          </div>
          <div className="hidden md:flex justify-center text-[#B5850A] text-2xl font-black" aria-hidden>
            →
          </div>
          <div className="rounded-2xl bg-[#B5850A] text-[#1a3c2e] p-6 text-center shadow-xl border border-[#B5850A]">
            <p className="text-sm font-bold">{t('platformLicensing.isolation.marketplace')}</p>
            <p className="text-sm text-[#1a3c2e]/90 mt-2">{t('platformLicensing.isolation.marketplaceDesc')}</p>
          </div>
        </div>
      </section>

      {/* Demo request form */}
      <section className="section-container pt-0 pb-20">
        <div className="rounded-2xl bg-white/10 border border-white/15 p-8 md:p-10 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white">{t('platformLicensing.form.title')}</h2>
          <p className="text-white/80 mt-2">{t('platformLicensing.form.subtitle')}</p>
          <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-white/90">{t('platformLicensing.form.orgName')}</span>
              <input
                name="organizationName"
                value={form.organizationName}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-white/90">{t('platformLicensing.form.country')}</span>
              <div className="rounded-lg border border-white/20 bg-white/10 p-0.5">
                <LocationSelector
                  value={{ country: form.country, region: '' }}
                  onChange={({ country }) => setForm((p) => ({ ...p, country }))}
                  required
                  showDetectedBanner={true}
                  className="[&_*]:!text-white [&_label]:hidden"
                />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-sm text-white/90">{t('platformLicensing.form.contactName')}</span>
              <input
                name="contactName"
                value={form.contactName}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-white/90">{t('platformLicensing.form.role')}</span>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-[#B5850A] outline-none"
              >
                {roleKeys.map((rk) => (
                  <option key={rk} value={t(`platformLicensing.form.roles.${rk}`)} className="text-gray-900">
                    {t(`platformLicensing.form.roles.${rk}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-white/90">{t('platformLicensing.form.email')}</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-white/90">{t('platformLicensing.form.phone')}</span>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={state.loading}
                className="w-full rounded-xl bg-[#B5850A] hover:bg-[#9a7109] text-[#1a3c2e] font-extrabold py-3 px-6 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                {t('platformLicensing.form.submit')}
              </button>
            </div>
            {state.ok && (
              <p className="sm:col-span-2 text-sm text-[#1a3c2e] bg-[#B5850A] border border-[#B5850A] rounded-lg p-3 font-medium">
                {t('platformLicensing.form.success')}
              </p>
            )}
            {state.err && (
              <p className="sm:col-span-2 text-sm text-red-100 bg-red-500/25 border border-red-300/30 rounded-lg p-3">
                {t('platformLicensing.form.error')}
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
