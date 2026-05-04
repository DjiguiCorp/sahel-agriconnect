import { useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { Loader2 } from 'lucide-react';

const RESIDENCE = ['USA', 'France', 'UK', 'Canada', 'UAE', 'Sénégal', "Côte d'Ivoire", 'Ghana', 'Nigeria', 'Other'];
const RANGES = ['$1,000–$5,000', '$5,000–$25,000', '$25,000–$100,000', '$100,000+'];
const HEARD = ['Diaspora community', 'Social media', 'Friend or family', 'Event or conference', 'Other'];

export default function InvestorRegistration() {
  const endpoint = useMemo(() => `${API_BASE_URL}/api/investors/register`, []);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryOfResidence: 'USA',
    investmentTrack: 'Track A — Operations',
    commodityShea: false,
    commoditySesame: false,
    commodityBoth: false,
    investmentRange: RANGES[0],
    heardAbout: HEARD[0],
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'commodityBoth' && checked) {
        setForm((p) => ({ ...p, commodityBoth: true, commodityShea: false, commoditySesame: false }));
        return;
      }
      if ((name === 'commodityShea' || name === 'commoditySesame') && checked) {
        setForm((p) => ({ ...p, [name]: checked, commodityBoth: false }));
        return;
      }
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const commodityInterest = () => {
    if (form.commodityBoth) return ['Both'];
    const out = [];
    if (form.commodityShea) out.push('Shea Butter');
    if (form.commoditySesame) out.push('Sesame');
    return out.length ? out : [];
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      countryOfResidence: form.countryOfResidence,
      investmentTrack: form.investmentTrack,
      commodityInterest: commodityInterest(),
      investmentRange: form.investmentRange,
      heardAbout: form.heardAbout,
      message: form.message || '',
    };

    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        console.error('Investor registration API error:', r.status, await r.text());
      }
    } catch (err) {
      console.error('Investor registration request failed:', err);
    } finally {
      setSubmitting(false);
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-brand-cream to-white">
      <section className="bg-[#1a3c2e] py-14">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Register as an AfriYield Exchange Investor</h1>
          <p className="mt-3 text-lg text-[#B5850A] font-medium">
            Join our network of diaspora and international investors
          </p>
        </div>
      </section>

      <section className="section-container pb-20">
        <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          {success ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-900">
              <p className="font-semibold">Thank you!</p>
              <p className="mt-2 text-sm">
                Your investor profile has been received. Our team will contact you within 48 hours to discuss
                opportunities.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Full Name *</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] focus:border-transparent outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Email *</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] focus:border-transparent outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Phone (with country code)</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] focus:border-transparent outline-none"
                  placeholder="+1 ..."
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Country of Residence</span>
                <select
                  name="countryOfResidence"
                  value={form.countryOfResidence}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
                >
                  {RESIDENCE.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-gray-700">Investment Track</legend>
                {[
                  {
                    value: 'Track A — Operations',
                    label: 'Track A — Operations',
                    hint: 'Equipment, infrastructure, asset-backed payouts.',
                  },
                  {
                    value: 'Track B — Brand & Market',
                    label: 'Track B — Brand & Market',
                    hint: 'Branding, distribution, revenue-share and marketplace acceleration.',
                  },
                  {
                    value: 'Both Tracks',
                    label: 'Both Tracks',
                    hint: 'Explore both pathways with our team.',
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex gap-3 rounded-lg border p-4 cursor-pointer ${
                      form.investmentTrack === opt.value ? 'border-[#B5850A] bg-[#B5850A]/5' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="investmentTrack"
                      value={opt.value}
                      checked={form.investmentTrack === opt.value}
                      onChange={onChange}
                      className="mt-1 text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span>
                      <span className="font-semibold text-brand-forest">{opt.label}</span>
                      <span className="block text-sm text-gray-600">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Commodity Interest</p>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="commodityShea"
                      checked={form.commodityShea}
                      onChange={onChange}
                      className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span className="text-gray-800">Shea Butter</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="commoditySesame"
                      checked={form.commoditySesame}
                      onChange={onChange}
                      className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span className="text-gray-800">Sesame</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="commodityBoth"
                      checked={form.commodityBoth}
                      onChange={onChange}
                      className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span className="text-gray-800">Both</span>
                  </label>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Investment Range</span>
                <select
                  name="investmentRange"
                  value={form.investmentRange}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
                >
                  {RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">How did you hear about us?</span>
                <select
                  name="heardAbout"
                  value={form.heardAbout}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
                >
                  {HEARD.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Message or questions (optional)</span>
                <textarea
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#B5850A] py-4 font-bold text-white hover:bg-[#9a7109] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                Submit registration
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
