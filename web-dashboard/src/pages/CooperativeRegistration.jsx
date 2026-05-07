import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Users, Tractor, BadgeCheck, BriefcaseBusiness, Globe, Loader2, Check } from 'lucide-react';

const COUNTRIES = [
  'Sénégal','Mali',"Côte d'Ivoire",'Ghana','Nigeria',
  'Burkina Faso','Niger','Guinée','Togo','Bénin',
  'Cameroun','Kenya','Éthiopie','Tanzanie','Autre',
];

const BENEFIT_KEYS = ['recruitment','equipment','certification','investor','export'];
const BENEFIT_ICONS = [Users, Tractor, BadgeCheck, BriefcaseBusiness, Globe];
const CERT_KEYS = ['none','local','regional','international'];
const CERT_VALUES = ['None','Local','Regional','International'];
const CROP_KEYS = ['shea','sesame','cashew','mango','rice','cotton','millet','sorghum','other'];
const CROP_VALUES = ['Shea Butter','Sesame','Cashew','Mango','Rice','Cotton','Millet','Sorghum','Other'];
const INTEREST_KEYS = ['equipment','certification','diaspora','export'];
const INTEREST_VALUES = ['Equipment Fund','Certification','Diaspora Investment','Export Program'];

export default function CooperativeRegistration() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    cooperativeName: '', country: 'Sénégal', regionCity: '',
    memberCount: '', primaryCrops: [], certificationStatus: 'None',
    leaderName: '', email: '', phone: '', interests: [],
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const toggleArrayItem = (key, value) => {
    setForm((p) => {
      const set = new Set(p[key] || []);
      if (set.has(value)) set.delete(value); else set.add(value);
      return { ...p, [key]: Array.from(set) };
    });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(API_ENDPOINTS.COOPERATIVES.REGISTER_PLATFORM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, memberCount: Number(form.memberCount || 0) }),
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

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a3c2e] via-[#1a3c2e] to-[#143326] text-white">
        <div className="section-container py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {t('cooperativeReg.hero.title')}
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            {t('cooperativeReg.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-container py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFIT_KEYS.map((key, i) => {
            const Icon = BENEFIT_ICONS[i];
            return (
              <div key={key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
                </div>
                <h3 className="text-xl font-bold text-[#1a3c2e]">
                  {t(`cooperativeReg.benefits.${key}.title`)}
                </h3>
                <p className="mt-2 text-gray-600 text-sm">
                  {t(`cooperativeReg.benefits.${key}.text`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plan + Form */}
      <section className="section-container pt-0 pb-20">
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* Pricing card */}
          <div className="rounded-2xl border border-[#B5850A]/35 bg-white shadow-xl p-8">
            <p className="text-sm font-semibold text-[#B5850A]">
              {t('cooperativeReg.plan.badge')}
            </p>
            <h2 className="text-3xl font-extrabold text-[#1a3c2e] mt-2">
              {t('cooperativeReg.plan.price')}
            </h2>
            <ul className="mt-6 space-y-3 text-gray-700">
              {t('cooperativeReg.plan.features', { returnObjects: true }).map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-[#B5850A] shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-xl p-8">
            <h2 className="text-2xl font-extrabold text-[#1a3c2e]">
              {t('cooperativeReg.form.title')}
            </h2>
            <p className="text-gray-600 mt-2 text-sm">
              {t('cooperativeReg.form.subtitle')}
            </p>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.cooperativeName')}</span>
                <input name="cooperativeName" value={form.cooperativeName} onChange={onChange} required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none" />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.country')}</span>
                <select name="country" value={form.country} onChange={onChange} required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white">
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.regionCity')}</span>
                <input name="regionCity" value={form.regionCity} onChange={onChange} required
                  placeholder={t('cooperativeReg.form.regionPlaceholder')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none" />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.memberCount')}</span>
                <input type="number" min="0" name="memberCount" value={form.memberCount} onChange={onChange} required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none" />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.certificationStatus')}</span>
                <select name="certificationStatus" value={form.certificationStatus} onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white">
                  {CERT_KEYS.map((k, i) => (
                    <option key={k} value={CERT_VALUES[i]}>
                      {t(`cooperativeReg.form.certStatuses.${k}`)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('cooperativeReg.form.primaryCrops')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CROP_KEYS.map((k, i) => {
                    const on = form.primaryCrops.includes(CROP_VALUES[i]);
                    return (
                      <button key={k} type="button" onClick={() => toggleArrayItem('primaryCrops', CROP_VALUES[i])}
                        className={`text-sm rounded-lg border px-3 py-2 text-left transition ${
                          on ? 'bg-[#B5850A]/15 border-[#B5850A] text-[#1a3c2e]' : 'bg-white border-gray-200 text-gray-700'
                        }`}>
                        {t(`cooperativeReg.form.crops.${k}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.leaderName')}</span>
                <input name="leaderName" value={form.leaderName} onChange={onChange} required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none" />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.email')}</span>
                <input type="email" name="email" value={form.email} onChange={onChange} required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none" />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('cooperativeReg.form.phone')}</span>
                <input name="phone" value={form.phone} onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none" />
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('cooperativeReg.form.interests')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTEREST_KEYS.map((k, i) => (
                    <label key={k} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={form.interests.includes(INTEREST_VALUES[i])}
                        onChange={() => toggleArrayItem('interests', INTEREST_VALUES[i])}
                        className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]" />
                      <span className="text-sm text-gray-700">{t(`cooperativeReg.form.interestOptions.${k}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={state.loading}
                className="sm:col-span-2 w-full rounded-xl bg-[#1a3c2e] text-white font-bold py-3 hover:bg-[#143326] transition disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                {t('cooperativeReg.form.submit')}
              </button>

              {state.ok && (
                <p className="sm:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-4">
                  {t('cooperativeReg.form.success')}
                </p>
              )}
              {state.err && (
                <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {t('cooperativeReg.form.error')}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
