import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import { useGeolocation } from '../hooks/useGeolocation';

const RESIDENCE = ['USA', 'France', 'UK', 'Canada', 'UAE', 'Sénégal', "Côte d'Ivoire", 'Ghana', 'Nigeria', 'Other'];
const RANGES = ['$1,000–$5,000', '$5,000–$25,000', '$25,000–$100,000', '$100,000+'];
const HEARD = ['Diaspora community', 'Social media', 'Friend or family', 'Event or conference', 'Other'];

export default function InvestorRegistration() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registerUser } = useRegisteredUser();
  const { country: detectedCountry, detected } = useGeolocation();
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
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!detected || !detectedCountry) return;
    if (!RESIDENCE.includes(detectedCountry)) return;
    setForm((p) => {
      if (p.countryOfResidence && p.countryOfResidence !== 'USA') return p;
      return { ...p, countryOfResidence: detectedCountry };
    });
  }, [detected, detectedCountry]);

  const trackOptions = useMemo(
    () => [
      {
        value: 'Track A — Operations',
        label: t('afriYield.registration.trackAOption'),
        hint: t('afriYield.registration.trackAHint'),
      },
      {
        value: 'Track B — Brand & Market',
        label: t('afriYield.registration.trackBOption'),
        hint: t('afriYield.registration.trackBHint'),
      },
      {
        value: 'Both Tracks',
        label: t('afriYield.registration.bothTracksOption'),
        hint: t('afriYield.registration.bothTracksHint'),
      },
    ],
    [t]
  );

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
    setError(null);
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
      const r = await fetch(API_ENDPOINTS.INVESTORS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || data.message || t('afriYield.registration.errorGeneric'));
        return;
      }
      localStorage.setItem('afriyield_investor_email', form.email);
      localStorage.setItem('afriyield_investor_name', form.fullName);
      setSuccess(true);
      registerUser(form.email, form.fullName);
      setTimeout(() => navigate('/afri-yield/portal'), 2000);
    } catch (err) {
      setError(err.message || t('afriYield.registration.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const residenceLabel = (c) => (c === 'Other' ? t('afriYield.registration.otherRegion') : c);
  const heardLabel = (h) => {
    const map = {
      'Diaspora community': 'heardDiaspora',
      'Social media': 'heardSocial',
      'Friend or family': 'heardFriend',
      'Event or conference': 'heardEvent',
      Other: 'heardOther',
    };
    const k = map[h];
    return k ? t(`afriYield.registration.${k}`) : h;
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-brand-cream to-white">
      <section className="bg-[#1a3c2e] py-14">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">{t('afriYield.registration.pageTitle')}</h1>
          <p className="mt-3 text-lg text-[#B5850A] font-medium">{t('afriYield.registration.subtitle')}</p>
        </div>
      </section>

      <section className="section-container pb-20">
        <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          {success ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-900 flex gap-3">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" aria-hidden />
              <div>
                <p className="font-semibold">{t('afriYield.registration.successMessage')}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  {error}
                </div>
              ) : null}

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('afriYield.registration.fullName')} *</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] focus:border-transparent outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('afriYield.registration.email')} *</span>
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
                <span className="text-sm font-medium text-gray-700">{t('afriYield.registration.phone')}</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] focus:border-transparent outline-none"
                  placeholder={t('afriYield.registration.phonePlaceholder')}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('afriYield.registration.countryOfResidence')}</span>
                <select
                  name="countryOfResidence"
                  value={form.countryOfResidence}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
                >
                  {RESIDENCE.map((c) => (
                    <option key={c} value={c}>
                      {residenceLabel(c)}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-gray-700">{t('afriYield.registration.investmentTrack')}</legend>
                {trackOptions.map((opt) => (
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
                <p className="text-sm font-medium text-gray-700 mb-2">{t('afriYield.registration.commodityInterest')}</p>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="commodityShea"
                      checked={form.commodityShea}
                      onChange={onChange}
                      className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span className="text-gray-800">{t('afriYield.sheaButter')}</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="commoditySesame"
                      checked={form.commoditySesame}
                      onChange={onChange}
                      className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span className="text-gray-800">{t('afriYield.sesame')}</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="commodityBoth"
                      checked={form.commodityBoth}
                      onChange={onChange}
                      className="rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                    />
                    <span className="text-gray-800">{t('afriYield.registration.bothCommodities')}</span>
                  </label>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('afriYield.registration.investmentRange')}</span>
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
                <span className="text-sm font-medium text-gray-700">{t('afriYield.registration.heardAbout')}</span>
                <select
                  name="heardAbout"
                  value={form.heardAbout}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#B5850A] outline-none bg-white"
                >
                  {HEARD.map((h) => (
                    <option key={h} value={h}>
                      {heardLabel(h)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('afriYield.registration.messageOptional')}</span>
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
                {t('afriYield.registration.submit')}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
