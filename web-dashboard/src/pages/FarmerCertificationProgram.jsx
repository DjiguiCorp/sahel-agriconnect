import { useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { regionsByCountry } from '../data/sahelRegions';
import { BadgeCheck, Users, User, Loader2 } from 'lucide-react';

const crops = ['Shea Butter', 'Sesame', 'Other'];

export default function FarmerCertificationProgram() {
  const endpoint = useMemo(() => `${API_BASE_URL}/api/certifications/apply`, []);
  const [type, setType] = useState('Individual Farmer');
  const [form, setForm] = useState({
    name: '',
    country: 'Senegal',
    region: '',
    cropType: 'Shea Butter',
    applicantId: '',
    transformationCenterPartnerName: '',
    email: '',
    phone: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const regionOptions =
    regionsByCountry[form.country]?.length > 0 ? regionsByCountry[form.country] : ['Autre'];

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: '' });
    try {
      const payload = {
        applicantType: type,
        ...form,
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

  const isIndividual = type === 'Individual Farmer';

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-forest via-brand-forest to-brand-sage text-white">
        <div className="section-container py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Get Export Certified — Reach US & European Markets
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            Choose a track for cooperative-wide certification or individual producer certification with transformation
            center partnership.
          </p>
        </div>
      </section>

      {/* Tracks */}
      <section className="section-container">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-brand-iconBg flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-brand-forest">Cooperative Track</h2>
                <p className="text-sm text-gray-600">$499 one-time</p>
              </div>
            </div>
            <p className="text-gray-700">
              Certify your entire cooperative&apos;s production. Higher volume, stronger negotiating power, group training
              sessions.
            </p>
            <div className="mt-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-2">Requirements</p>
              <ul className="space-y-1">
                <li>• Registered cooperative</li>
                <li>• Minimum 10 member farmers</li>
                <li>• Transformation center partnership</li>
              </ul>
            </div>
          </div>

          <div className="card border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-brand-iconBg flex items-center justify-center">
                <User className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-brand-forest">Individual Farmer Track</h2>
                <p className="text-sm text-gray-600">$299 one-time</p>
              </div>
            </div>
            <p className="text-gray-700">
              Certify as an individual producer. Required: active partnership with a registered transformation center.
            </p>
            <div className="mt-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-2">Requirements</p>
              <ul className="space-y-1">
                <li>• Registered farmer profile</li>
                <li>• Transformation center partner confirmed</li>
                <li>• Minimum 1 hectare certified crop</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="section-container pt-0">
        <div className="rounded-2xl border border-brand-amber/40 bg-brand-amber/15 p-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-amber text-brand-forest flex items-center justify-center">
              <BadgeCheck className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <p className="font-extrabold text-brand-forest">Important</p>
              <p className="mt-1 text-brand-forest/90">
                Individual farmers must be paired with a registered transformation center before certification is
                granted. This ensures product quality, proper processing, and fair market value for your harvest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Includes */}
      <section className="section-container pt-0">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-forest mb-6">What certification includes</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            'USDA/EU compliance training',
            'Documentation support',
            'Product listing on AfriYield Exchange',
            'Assigned business developer',
            'Transformation center matching (for individuals who need one)',
          ].map((x) => (
            <div key={x} className="card border border-gray-100">
              <p className="text-gray-800 font-semibold">{x}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application form */}
      <section className="section-container pt-0 pb-20">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-xl p-8">
          <h2 className="text-2xl font-extrabold text-brand-forest">Apply for certification</h2>
          <p className="text-gray-600 mt-2">We’ll review and contact you with next steps and timelines.</p>

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Applicant type</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {['Individual Farmer', 'Cooperative'].map((v) => (
                  <label key={v} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                    <input
                      type="radio"
                      name="applicantType"
                      value={v}
                      checked={type === v}
                      onChange={() => setType(v)}
                      className="text-brand-sage focus:ring-brand-sage"
                    />
                    <span className="text-sm text-gray-700">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                name="name"
                value={form.name}
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
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value, region: '' }))}
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
              <span className="text-sm font-medium text-gray-700">Region</span>
              <select
                name="region"
                value={form.region}
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
              <span className="text-sm font-medium text-gray-700">Crop type</span>
              <select
                name="cropType"
                value={form.cropType}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
              >
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Farmer ID or Cooperative ID</span>
              <input
                name="applicantId"
                value={form.applicantId}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                required
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Transformation center partner name{' '}
                {isIndividual ? <span className="text-red-600">*</span> : null}
              </span>
              <input
                name="transformationCenterPartnerName"
                value={form.transformationCenterPartnerName}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                required={isIndividual}
                placeholder={isIndividual ? "Don't have one? We'll match you." : 'Optional for cooperatives'}
              />
              {isIndividual ? (
                <p className="text-xs text-gray-500 mt-1">Don&apos;t have one? We&apos;ll match you.</p>
              ) : null}
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

            <button
              type="submit"
              disabled={state.loading}
              className="sm:col-span-2 btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
              Submit application
            </button>

            {state.ok ? (
              <p className="sm:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                Application received. We’ll contact you with next steps shortly.
              </p>
            ) : null}
            {state.err ? (
              <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {state.err}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}

