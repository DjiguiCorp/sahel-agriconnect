import { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Users, Tractor, BadgeCheck, BriefcaseBusiness, Globe, Loader2 } from 'lucide-react';

const COUNTRIES = [
  'Sénégal',
  'Mali',
  "Côte d'Ivoire",
  'Ghana',
  'Nigeria',
  'Burkina Faso',
  'Niger',
  'Guinée',
  'Togo',
  'Bénin',
  'Cameroun',
  'Kenya',
  'Éthiopie',
  'Tanzanie',
  'Autre',
];

const crops = ['Shea Butter', 'Sesame', 'Cashew', 'Mango', 'Rice', 'Cotton', 'Millet', 'Sorghum', 'Other'];
const certStatuses = ['None', 'Local', 'Regional', 'International'];
const interestOptions = ['Equipment Fund', 'Certification', 'Diaspora Investment', 'Export Program'];

export default function CooperativeRegistration() {
  const [form, setForm] = useState({
    cooperativeName: '',
    country: 'Sénégal',
    regionCity: '',
    memberCount: '',
    primaryCrops: [],
    certificationStatus: 'None',
    leaderName: '',
    email: '',
    phone: '',
    interests: [],
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

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
        memberCount: Number(form.memberCount || 0),
      };
      const r = await fetch(API_ENDPOINTS.COOPERATIVES.REGISTER_PLATFORM, {
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
      <section className="bg-gradient-to-br from-[#1a3c2e] via-[#1a3c2e] to-[#143326] text-white">
        <div className="section-container py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Register Your Cooperative</h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            $199/year — unlock tools for recruitment, equipment funding, certification, investor matching, and export
            access.
          </p>
        </div>
      </section>

      <section className="section-container py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { Icon: Users, title: 'Farmer Recruitment', text: 'Structured onboarding and member profiles for your cooperative.' },
            { Icon: Tractor, title: 'Equipment Fund', text: 'Eligible cooperatives can access asset-backed equipment programs.' },
            { Icon: BadgeCheck, title: 'Certification Pathway', text: 'Local to export certification workflows with admin review.' },
            { Icon: BriefcaseBusiness, title: 'Investor Matching', text: 'Connect with diaspora capital via AfriYield Exchange.' },
            { Icon: Globe, title: 'Export Access', text: 'List certified commodities for international buyers on AfriYield.' },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
              </div>
              <h3 className="text-xl font-bold text-[#1a3c2e]">{title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-container pt-0 pb-20">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border border-[#B5850A]/35 bg-white shadow-xl p-8">
            <p className="text-sm font-semibold text-[#B5850A]">Cooperative platform</p>
            <h2 className="text-3xl font-extrabold text-[#1a3c2e] mt-2">$199/year</h2>
            <ul className="mt-6 space-y-3 text-gray-700">
              {[
                'Member farmer management',
                'Equipment fund eligibility',
                'Certification applications',
                'AfriYield Exchange visibility',
                'Admin activation within 48 hours of review',
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#B5850A] shrink-0" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-xl p-8">
            <h2 className="text-2xl font-extrabold text-[#1a3c2e]">Registration</h2>
            <p className="text-gray-600 mt-2 text-sm">Complete the form — an admin will activate your account after review.</p>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Cooperative name</span>
                <input
                  name="cooperativeName"
                  value={form.cooperativeName}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Country</span>
                <select
                  name="country"
                  value={form.country}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Region / city</span>
                <input
                  name="regionCity"
                  value={form.regionCity}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                  placeholder="e.g. Sikasso"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Member count</span>
                <input
                  type="number"
                  min="0"
                  name="memberCount"
                  value={form.memberCount}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Certification status</span>
                <select
                  name="certificationStatus"
                  value={form.certificationStatus}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
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
                          on ? 'bg-[#B5850A]/15 border-[#B5850A] text-[#1a3c2e]' : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Leader name</span>
                <input
                  name="leaderName"
                  value={form.leaderName}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
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
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
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
                        className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                      />
                      <span className="text-sm text-gray-700">{x}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={state.loading}
                className="sm:col-span-2 w-full rounded-xl bg-[#1a3c2e] text-white font-bold py-3 hover:bg-[#143326] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Submit registration
              </button>

              {state.ok ? (
                <p className="sm:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-4">
                  Registration received. An admin will activate your account within 48 hours.
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
