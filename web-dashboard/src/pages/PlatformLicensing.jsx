import { useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { Shield, Settings, Globe, Loader2 } from 'lucide-react';

const roles = [
  'Ministry of Agriculture',
  'Regional Organization',
  'NGO/Development Agency',
  'Private Cooperative Network',
  'Other',
];

export default function PlatformLicensing() {
  const endpoint = useMemo(() => `${API_BASE_URL}/api/licensing/inquire`, []);
  const [form, setForm] = useState({
    organizationName: '',
    country: '',
    contactName: '',
    email: '',
    phone: '',
    role: roles[0],
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
      const r = await fetch(endpoint, {
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

  return (
    <div className="bg-brand-forest text-white">
      {/* Hero */}
      <section className="section-container py-16 md:py-20">
        <div className="max-w-5xl">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-cream/90 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full mb-4">
            B2G / B2B Licensing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Deploy AfriYield Exchange in Your Country
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-3xl">
            Full platform control for government agencies, ministries of agriculture, and regional organizations
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="section-container pt-0 pb-14">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              Icon: Shield,
              title: 'Sovereign Data Control',
              text: "Your country's farmer and cooperative data is fully isolated and private.",
            },
            {
              Icon: Settings,
              title: 'Custom Admin Dashboard',
              text: 'Your organization controls registration, certification, and cooperative management.',
            },
            {
              Icon: Globe,
              title: 'Global Commodity Visibility',
              text: 'Your certified products appear on the AfriYield Exchange marketplace — visible to international buyers worldwide.',
            },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white/10 border border-white/10 p-6">
              <div className="w-12 h-12 rounded-xl bg-brand-amber/90 text-brand-forest flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-2 text-white/85">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing + Demo */}
      <section className="section-container pt-0 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl bg-white text-gray-900 p-8 border border-gray-100 shadow-xl">
            <p className="text-sm font-semibold text-brand-forest">Country License</p>
            <h2 className="text-3xl font-extrabold text-brand-forest mt-2">Starting at $999/month</h2>
            <ul className="mt-6 space-y-3 text-gray-700">
              {[
                'Isolated admin environment',
                'Unlimited farmer registrations',
                'Cooperative management tools',
                'Certification workflow',
                'Commodity listings on AfriYield Exchange marketplace',
                'Dedicated onboarding support',
                'Data export at any time',
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-amber" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 p-4 rounded-xl bg-brand-cream/60 border border-brand-sage/20 text-sm text-gray-700">
              A license includes a private country admin and a shared marketplace listing layer (commodities only).
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white">Request a Demo</h2>
            <p className="text-white/80 mt-2">
              Tell us about your organization and we’ll schedule a guided demo with a country-isolated environment.
            </p>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm text-white/90">Organization name</span>
                <input
                  name="organizationName"
                  value={form.organizationName}
                  onChange={onChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-brand-amber outline-none"
                  placeholder="e.g., Ministry of Agriculture"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-white/90">Country</span>
                <input
                  name="country"
                  value={form.country}
                  onChange={onChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-brand-amber outline-none"
                  placeholder="e.g., Ghana"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-white/90">Contact name</span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={onChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-brand-amber outline-none"
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-white/90">Role</span>
                <select
                  name="role"
                  value={form.role}
                  onChange={onChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:ring-2 focus:ring-brand-amber outline-none"
                >
                  {roles.map((r) => (
                    <option key={r} value={r} className="text-gray-900">
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm text-white/90">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-brand-amber outline-none"
                  placeholder="you@org.gov"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-white/90">Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-brand-amber outline-none"
                  placeholder="+233..."
                />
              </label>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={state.loading}
                  className="w-full rounded-lg bg-brand-amber hover:bg-brand-amberDeep text-brand-forest font-extrabold py-3 px-6 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                  Request a Demo
                </button>
              </div>

              {state.ok ? (
                <p className="sm:col-span-2 text-sm text-brand-cream bg-white/10 border border-white/10 rounded-lg p-3">
                  Request sent. We’ll contact you within 1–2 business days.
                </p>
              ) : null}
              {state.err ? (
                <p className="sm:col-span-2 text-sm text-red-100 bg-red-500/20 border border-red-200/20 rounded-lg p-3">
                  {state.err}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      {/* Isolation diagram */}
      <section className="section-container pt-0 pb-20">
        <h2 className="text-2xl md:text-3xl font-extrabold">How Country Isolation Works</h2>
        <p className="mt-2 text-white/85 max-w-3xl">
          Each country gets a private admin environment and private datasets. Only commodity listings are shared to power
          global buyer visibility.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-4 items-stretch">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-6">
            <p className="text-sm text-white/80">Country A Admin</p>
            <p className="text-xl font-bold mt-1">Private Data</p>
            <p className="text-white/80 mt-2">Farmers · Cooperatives · Certifications · Admin users</p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/10 p-6">
            <p className="text-sm text-white/80">Country B Admin</p>
            <p className="text-xl font-bold mt-1">Private Data</p>
            <p className="text-white/80 mt-2">Farmers · Cooperatives · Certifications · Admin users</p>
          </div>
          <div className="rounded-2xl bg-brand-amber/90 text-brand-forest p-6 shadow-xl">
            <p className="text-sm font-semibold">AfriYield Exchange Marketplace</p>
            <p className="text-xl font-extrabold mt-1">Shared Commodity Listings Only</p>
            <p className="mt-2 text-brand-forest/90">
              Certified products appear globally while private country datasets remain isolated.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

