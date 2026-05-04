import { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Shield, Settings, Globe, Loader2 } from 'lucide-react';

const roles = [
  'Ministry of Agriculture',
  'Regional Organization',
  'NGO',
  'Private Cooperative Network',
  'Other',
];

export default function PlatformLicensing() {
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

  return (
    <div className="bg-[#1a3c2e] text-white min-h-[60vh]">
      <section className="section-container py-16 md:py-20">
        <div className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Deploy AfriYield Exchange in Your Country
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-3xl">
            Sovereign deployment for ministries, regional bodies, and cooperative networks — private operations data
            with global commodity reach.
          </p>
        </div>
      </section>

      <section className="section-container pt-0 pb-14">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              Icon: Shield,
              title: 'Sovereign Data Control',
              text: 'Your country’s farmer, cooperative, and certification data stays isolated in a dedicated environment.',
            },
            {
              Icon: Settings,
              title: 'Custom Admin Dashboard',
              text: 'Configure registrations, approvals, and programs to match national policy and reporting needs.',
            },
            {
              Icon: Globe,
              title: 'Global Commodity Visibility',
              text: 'Certified commodities surface on the AfriYield marketplace for diaspora and international buyers.',
            },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white/10 border border-white/15 p-6">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A] text-[#1a3c2e] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-white/85">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-container pt-0 pb-14">
        <div className="rounded-2xl bg-white text-[#1a3c2e] p-8 md:p-10 border border-[#B5850A]/40 shadow-xl max-w-3xl">
          <p className="text-sm font-semibold text-[#B5850A] uppercase tracking-wide">Platform license</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-2">$999/month</h2>
          <p className="mt-2 text-gray-600">Full country deployment with marketplace listing layer.</p>
          <ul className="mt-8 space-y-3 text-gray-800">
            {[
              'Dedicated country admin environment',
              'Unlimited farmer registrations',
              'Cooperative management & governance tools',
              'Certification workflow & audit trail',
              'Commodity listings on AfriYield Exchange (buyers see products, not private PII)',
              'Onboarding & training for your admin team',
              'Data export and portability',
              'SLA-backed support channel',
            ].map((x) => (
              <li key={x} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#B5850A]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-container pt-0 pb-14">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">Data isolation</h2>
        <p className="mt-2 text-white/85 max-w-3xl">
          Country operations remain private; only approved commodity listings flow to the shared AfriYield marketplace.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-2">
          <div className="rounded-2xl bg-white/10 border border-white/15 p-6 text-center">
            <p className="text-sm font-semibold text-[#B5850A]">Country A — Private</p>
            <p className="text-sm text-white/80 mt-2">National admin, farmers, cooperatives</p>
          </div>
          <div className="hidden md:flex justify-center text-[#B5850A] text-2xl font-black" aria-hidden>
            →
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-6 text-center">
            <p className="text-sm font-semibold text-[#B5850A]">Country B — Private</p>
            <p className="text-sm text-white/80 mt-2">National admin, farmers, cooperatives</p>
          </div>
          <div className="hidden md:flex justify-center text-[#B5850A] text-2xl font-black" aria-hidden>
            →
          </div>
          <div className="rounded-2xl bg-[#B5850A] text-[#1a3c2e] p-6 text-center shadow-xl border border-[#B5850A] md:col-span-1">
            <p className="text-sm font-bold">AfriYield Marketplace — Commodities Only</p>
            <p className="text-sm text-[#1a3c2e]/90 mt-2">Shared layer for verified product visibility</p>
          </div>
        </div>
      </section>

      <section className="section-container pt-0 pb-20">
        <div className="rounded-2xl bg-white/10 border border-white/15 p-8 md:p-10 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white">Request Demo</h2>
          <p className="text-white/80 mt-2">
            Tell us about your organization. We will follow up with a tailored walkthrough.
          </p>
          <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-white/90">Organization name</span>
              <input
                name="organizationName"
                value={form.organizationName}
                onChange={onChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-white/90">Country</span>
              <input
                name="country"
                value={form.country}
                onChange={onChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-white/90">Contact name</span>
              <input
                name="contactName"
                value={form.contactName}
                onChange={onChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-white/90">Role</span>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-[#B5850A] outline-none"
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
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:ring-2 focus:ring-[#B5850A] outline-none"
                required
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-white/90">Phone</span>
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
                Request Demo
              </button>
            </div>
            {state.ok ? (
              <p className="sm:col-span-2 text-sm text-[#1a3c2e] bg-[#B5850A] border border-[#B5850A] rounded-lg p-3 font-medium">
                Thank you — we received your request and will respond shortly.
              </p>
            ) : null}
            {state.err ? (
              <p className="sm:col-span-2 text-sm text-red-100 bg-red-500/25 border border-red-300/30 rounded-lg p-3">
                {state.err}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
