import { useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { regionsByCountry } from '../data/sahelRegions';
import { Tractor, HandCoins, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  'Tractors & Tillage',
  'Irrigation Systems',
  'Harvesting Equipment',
  'Drying & Storage',
  'Processing Machinery',
  'Transport Vehicles',
];

export default function EquipmentFund() {
  const endpoint = useMemo(() => `${API_BASE_URL}/api/equipment-fund/apply`, []);
  const [form, setForm] = useState({
    cooperativeName: '',
    country: 'Senegal',
    region: '',
    equipmentNeeded: [],
    estimatedValue: '',
    farmersBenefiting: '',
    email: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  const regionOptions =
    regionsByCountry[form.country]?.length > 0 ? regionsByCountry[form.country] : ['Autre'];

  const toggleEquipment = (c) => {
    setForm((p) => {
      const set = new Set(p.equipmentNeeded);
      if (set.has(c)) set.delete(c);
      else set.add(c);
      return { ...p, equipmentNeeded: Array.from(set) };
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
        estimatedValue: Number(form.estimatedValue || 0),
        farmersBenefiting: Number(form.farmersBenefiting || 0),
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
            Equipment Fund — Cooperatives Buy, Farmers Rent
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            A structured, asset-backed program where cooperatives own equipment and rent it to registered farmers at
            affordable rates — while investors earn returns via AfriYield Exchange Track A.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="section-container">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-forest mb-6">How it works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            'Cooperative applies for equipment fund',
            'Diaspora investors fund the equipment purchase via AfriYield Exchange Track A',
            'Cooperative owns the equipment and rents it to registered member farmers at affordable rates',
            'Rental income repays investors with ROI, cooperative retains a margin',
          ].map((x, i) => (
            <div key={x} className="card border border-gray-100">
              <p className="text-sm font-semibold text-brand-forest">Step {i + 1}</p>
              <p className="mt-2 text-gray-700">{x}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories + eligibility */}
      <section className="section-container">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="card border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-iconBg flex items-center justify-center">
                <Tractor className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <h2 className="text-xl font-extrabold text-brand-forest">Equipment categories available</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {categories.map((c) => (
                <div key={c} className="rounded-lg border border-gray-200 px-4 py-3 text-gray-700 bg-white">
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="card border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-amber/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <h2 className="text-xl font-extrabold text-brand-forest">Cooperative eligibility</h2>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li>• Registered on platform</li>
              <li>• Minimum 20 member farmers</li>
              <li>• At least Local certification status</li>
              <li>• 6+ months operating history</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Interest form + investors */}
      <section className="section-container pb-20">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-xl p-8">
            <h2 className="text-2xl font-extrabold text-brand-forest">Apply for the equipment fund</h2>
            <p className="text-gray-600 mt-2">
              Share your needs. A program admin will contact you with next steps and documentation.
            </p>

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
                <span className="text-sm font-medium text-gray-700">Region / city</span>
                <select
                  name="region"
                  value={form.region}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                >
                  <option value="">— Select —</option>
                  {regionOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Equipment needed</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((c) => (
                    <label key={c} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={form.equipmentNeeded.includes(c)}
                        onChange={() => toggleEquipment(c)}
                        className="rounded border-gray-300 text-brand-sage focus:ring-brand-sage"
                      />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Estimated value needed ($)</span>
                <input
                  type="number"
                  min="0"
                  name="estimatedValue"
                  value={form.estimatedValue}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Farmers who would benefit</span>
                <input
                  type="number"
                  min="0"
                  name="farmersBenefiting"
                  value={form.farmersBenefiting}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-brand-sage outline-none"
                  required
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
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

              <button
                type="submit"
                disabled={state.loading}
                className="sm:col-span-2 btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Submit interest
              </button>

              {state.ok ? (
                <p className="sm:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                  Application received. An admin will review and contact you shortly.
                </p>
              ) : null}
              {state.err ? (
                <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {state.err}
                </p>
              ) : null}
            </form>
          </div>

          <div className="card border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-amber/20 flex items-center justify-center">
                <HandCoins className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <h2 className="text-xl font-extrabold text-brand-forest">For Investors</h2>
            </div>
            <p className="text-gray-700">
              Fund equipment, earn returns. Equipment fund investments fall under AfriYield Exchange Track A — asset-backed,
              bi-annual ROI payouts.
            </p>
            <Link to="/afri-yield/register" className="mt-5 inline-flex btn-secondary">
              Go to investor registration
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

