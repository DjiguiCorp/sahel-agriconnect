import { useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { regionsByCountry } from '../data/sahelRegions';
import { BriefcaseBusiness, Tractor, BadgeCheck, Users, Globe, Loader2 } from 'lucide-react';

const crops = ['Shea Butter', 'Sesame', 'Cashew', 'Mango', 'Rice', 'Cotton', 'Millet', 'Sorghum', 'Other'];
const certStatuses = ['None', 'Local', 'Regional', 'International'];
const interestOptions = ['Equipment Fund', 'Certification', 'Diaspora Investment', 'Export Program'];

export default function CooperativeRegistration() {
  const endpoint = useMemo(() => `${API_BASE_URL}/api/cooperatives/register-platform`, []);

  const [form, setForm] = useState({
    cooperativeName: '',
    country: 'Senegal',
    regionCity: '',
    currentMembers: '',
    primaryCrops: [],
    certificationStatus: 'None',
    leaderName: '',
    email: '',
    phone: '',
    interests: [],
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const regionOptions =
    regionsByCountry[form.country]?.length > 0 ? regionsByCountry[form.country] : ['Autre'];

  const toggleArrayItem = (key, value) => {
    setForm((p) => {
      const set = new Set(p[key] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
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
      const payload = {
        ...form,
        currentMembers: Number(form.currentMembers || 0),
      };
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      <section className="bg-gradient-to-br from-brand-forest via-brand-forest to-brand-sage text-white">
        <div className="section-container py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Register Your Cooperative — Unlock Funding, Equipment & Export Access
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            Annual membership gives your cooperative the tools to recruit farmers, access equipment funding, and reach
            international markets via AfriYield Exchange visibility.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-container">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-forest mb-6">Member benefits</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              Icon: Users,
              title: 'Farmer Recruitment Tools',
              text: 'Manage and onboard member farmers with structured profiles and eligibility checks.',
            },
            {
              Icon: Tractor,
              title: 'Equipment Fund Access',
              text: 'Buy equipment, rent to member farmers, and unlock asset-backed funding pathways.',
            },
            {
              Icon: BadgeCheck,
              title: 'International Certification Pathway',
              text: 'Apply for local → regional → export certification workflows with admin review.',
            },
            {
              Icon: BriefcaseBusiness,
              title: 'Diaspora Investor Matching',
              text: 'Connect with diaspora buyers and investors for equipment, processing, and growth capital.',
            },
            {
              Icon: Globe,
              title: 'Export Market Access',
              text: 'Visibility on AfriYield Exchange helps international buyers discover your certified commodities.',
            },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="card border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-brand-iconBg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <h3 className="text-xl font-bold text-brand-forest">{title}</h3>
              <p className="mt-2 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing + Form */}
      <section className="section-container">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border border-brand-sage/25 bg-white shadow-xl p-8">
            <p className="text-sm font-semibold text-brand-forest">Cooperative Annual Membership</p>
            <h2 className="text-3xl font-extrabold text-brand-forest mt-2">$199/year</h2>
            <ul className="mt-6 space-y-3 text-gray-700">
              {[
                'Platform listing',
                'Member farmer management',
                'Equipment fund eligibility',
                'Certification application access',
                'AfriYield Exchange visibility',
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-amber" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 p-4 rounded-xl bg-brand-cream/60 border border-brand-sage/20 text-sm text-gray-700">
              After registration, an admin reviews and activates your cooperative account.
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-xl p-8">
            <h2 className="text-2xl font-extrabold text-brand-forest">Cooperative registration</h2>
            <p className="text-gray-600 mt-2">Fill the form to register your cooperative on the platform.</p>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Cooperative name</span>
                <input
                  name="cooperativeName"
                  value={form.cooperativeName}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Country</span>
                <select
                  name="country"
                  value={form.country}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, country: e.target.value, regionCity: '' }));
                  }}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Region / city</span>
                <select
                  name="regionCity"
                  value={form.regionCity}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                >
                  <option value="">— Select —</option>
                  {regionOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Number of current members</span>
                <input
                  type="number"
                  min="0"
                  name="currentMembers"
                  value={form.currentMembers}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Certification status</span>
                <select
                  name="certificationStatus"
                  value={form.certificationStatus}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                >
                  {certStatuses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Primary crops</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {crops.map((c) => {
                    const on = form.primaryCrops.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleArrayItem('primaryCrops', c)}
                        className={`text-sm rounded-lg border px-3 py-2 text-left ${
                          on
                            ? 'bg-brand-iconBg border-brand-sage text-brand-forest'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Cooperative leader name</span>
                <input
                  name="leaderName"
                  value={form.leaderName}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                />
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {interestOptions.map((x) => (
                    <label key={x} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={form.interests.includes(x)}
                        onChange={() => toggleArrayItem('interests', x)}
                        className="rounded border-gray-300 text-brand-sage focus:ring-brand-sage"
                      />
                      <span className="text-sm text-gray-700">{x}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={state.loading}
                className="sm:col-span-2 btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Submit registration
              </button>

              {state.ok ? (
                <p className="sm:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                  Your cooperative is now registered. An admin will review and activate your account within 48 hours.
                </p>
              ) : null}
              {state.err ? (
                <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {state.err}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

