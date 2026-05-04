import { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { regionsByCountry } from '../data/sahelRegions';
import { Users, User, Loader2 } from 'lucide-react';

const crops = ['Shea Butter', 'Sesame', 'Other'];

export default function FarmerCertificationProgram() {
  const [applicantType, setApplicantType] = useState('Individual');
  const [form, setForm] = useState({
    name: '',
    country: 'Senegal',
    region: '',
    crop: 'Shea Butter',
    farmerOrCooperativeId: '',
    transformationCenterName: '',
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
      const r = await fetch(API_ENDPOINTS.CERTIFICATIONS.APPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantType,
          name: form.name,
          country: form.country,
          region: form.region,
          crop: form.crop,
          farmerOrCooperativeId: form.farmerOrCooperativeId,
          transformationCenterName: form.transformationCenterName,
          email: form.email,
          phone: form.phone,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Request failed');
      setState({ loading: false, ok: true, err: '' });
    } catch (err) {
      setState({ loading: false, ok: false, err: err.message || 'Error' });
    }
  };

  const isIndividual = applicantType === 'Individual';

  return (
    <div>
      <section className="bg-gradient-to-br from-[#1a3c2e] via-[#1a3c2e] to-[#143326] text-white">
        <div className="section-container py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Get Export Certified</h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl">
            USDA/EU-aligned training, documentation support, and AfriYield listing — with a business developer on your
            side.
          </p>
        </div>
      </section>

      <section className="section-container py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1a3c2e]">Cooperative Track</h2>
                <p className="text-sm font-bold text-[#B5850A]">$499</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm">Requires 10+ farmers and a transformation center partnership.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center">
                <User className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1a3c2e]">Individual Farmer Track</h2>
                <p className="text-sm font-bold text-[#B5850A]">$299</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm">Requires a transformation center partnership.</p>
          </div>
        </div>
      </section>

      <section className="section-container pt-0 pb-10">
        <div className="rounded-2xl border-2 border-[#B5850A] bg-[#B5850A]/15 p-6 md:p-8">
          <p className="font-extrabold text-[#1a3c2e]">Important</p>
          <p className="mt-2 text-[#1a3c2e] text-sm md:text-base">
            Individual farmers must partner with a transformation center before certification is granted.
          </p>
        </div>
      </section>

      <section className="section-container pt-0 pb-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3c2e] mb-6">Certification includes</h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {[
            'USDA/EU training',
            'Documentation support',
            'AfriYield listing',
            'Business developer assigned',
            'Transformation center matching',
          ].map((x) => (
            <li key={x} className="rounded-xl border border-gray-200 bg-white p-4 text-gray-800 font-medium shadow-sm">
              {x}
            </li>
          ))}
        </ul>
      </section>

      <section className="section-container pt-0 pb-20">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-xl p-8">
          <h2 className="text-2xl font-extrabold text-[#1a3c2e]">Application</h2>
          <p className="text-gray-600 mt-2 text-sm">We will review your submission and follow up with next steps.</p>

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Applicant type</p>
              <div className="flex flex-wrap gap-4">
                {['Individual', 'Cooperative'].map((v) => (
                  <label key={v} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicantType"
                      value={v}
                      checked={applicantType === v}
                      onChange={() => setApplicantType(v)}
                      className="text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span className="text-gray-800">{v}</span>
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
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Country</span>
              <select
                name="country"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value, region: '' }))}
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

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Region</span>
              <select
                name="region"
                value={form.region}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
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
              <span className="text-sm font-medium text-gray-700">Crop</span>
              <select
                name="crop"
                value={form.crop}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
              >
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Farmer or cooperative ID</span>
              <input
                name="farmerOrCooperativeId"
                value={form.farmerOrCooperativeId}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                required
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Transformation center name {isIndividual ? <span className="text-red-600">*</span> : null}
              </span>
              <input
                name="transformationCenterName"
                value={form.transformationCenterName}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                required={isIndividual}
                placeholder="Don't have one? We'll match you."
              />
              {isIndividual ? (
                <span className="text-xs text-gray-500 mt-1 block">Don&apos;t have one? We&apos;ll match you.</span>
              ) : null}
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
                Application received. We will contact you with next steps.
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
