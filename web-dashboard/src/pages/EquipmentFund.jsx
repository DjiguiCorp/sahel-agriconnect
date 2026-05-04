import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { Tractor, HandCoins, ShieldCheck, Loader2 } from 'lucide-react';

const categories = [
  'Tractors',
  'Irrigation',
  'Harvesting',
  'Drying & Storage',
  'Processing Machinery',
  'Transport',
];

const steps = [
  'Cooperative applies',
  'Diaspora investors fund via AfriYield Track A',
  'Cooperative rents to member farmers',
  'Rental income repays investors with ROI',
];

export default function EquipmentFund() {
  const [form, setForm] = useState({
    cooperativeName: '',
    country: 'Senegal',
    equipmentNeeded: [],
    estimatedValue: '',
    farmersBenefiting: '',
    email: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

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
        cooperativeName: form.cooperativeName,
        country: form.country,
        equipmentNeeded: form.equipmentNeeded,
        estimatedValue: Number(form.estimatedValue || 0),
        farmersBenefiting: Number(form.farmersBenefiting || 0),
        email: form.email,
      };
      const r = await fetch(API_ENDPOINTS.EQUIPMENT_FUND.APPLY, {
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
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Equipment Fund — Cooperatives Buy, Farmers Rent
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            Asset-backed equipment owned by the cooperative, rented affordably to members, with diaspora capital
            repaid from rental cash flows.
          </p>
        </div>
      </section>

      <section className="section-container py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3c2e] mb-8">How it works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((text, i) => (
            <div key={text} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <p className="text-sm font-bold text-[#B5850A]">Step {i + 1}</p>
              <p className="mt-3 text-gray-800 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-container pt-0 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center">
                <Tractor className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a3c2e]">Equipment categories</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {categories.map((c) => (
                <div key={c} className="rounded-lg border border-gray-200 px-4 py-3 text-gray-800 text-sm font-medium">
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a3c2e]">Eligibility</h2>
            </div>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Registered cooperative on the platform</li>
              <li>• Minimum member farmer threshold (program review)</li>
              <li>• Certification pathway in progress or completed (Local+)</li>
              <li>• Sound governance and rental plan for equipment</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-container pt-0 pb-20">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-xl p-8">
            <h2 className="text-2xl font-extrabold text-[#1a3c2e]">Interest form</h2>
            <p className="text-gray-600 mt-2 text-sm">
              Submit your cooperative&apos;s needs. Our team will contact you with documentation requirements.
            </p>

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

              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Country</span>
                <select
                  name="country"
                  value={form.country}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
                  required
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
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
                        className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                      />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Estimated value (USD)</span>
                <input
                  type="number"
                  min="0"
                  name="estimatedValue"
                  value={form.estimatedValue}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Number of farmers who benefit</span>
                <input
                  type="number"
                  min="0"
                  name="farmersBenefiting"
                  value={form.farmersBenefiting}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
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
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={state.loading}
                className="sm:col-span-2 w-full rounded-xl bg-[#1a3c2e] text-white font-bold py-3 hover:bg-[#143326] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                Submit application
              </button>

              {state.ok ? (
                <p className="sm:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
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

          <div className="rounded-2xl border-2 border-[#B5850A]/40 bg-[#1a3c2e] text-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A]/20 flex items-center justify-center">
                <HandCoins className="w-6 h-6 text-[#B5850A]" aria-hidden />
              </div>
              <h2 className="text-xl font-extrabold">Investors</h2>
            </div>
            <p className="text-white/85 text-sm">
              Fund equipment through AfriYield Exchange Track A. Returns are tied to cooperative rental performance and
              program rules.
            </p>
            <Link
              to="/afri-yield/register"
              className="mt-6 inline-flex rounded-xl bg-[#B5850A] text-[#1a3c2e] font-bold px-6 py-3 hover:bg-[#9a7109] transition"
            >
              Register as an investor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
