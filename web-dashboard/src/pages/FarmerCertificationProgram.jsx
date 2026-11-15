import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { Users, User, Loader2, CheckCircle2 } from 'lucide-react';
import LocationSelector from '../components/LocationSelector';

const FALLBACK_CROPS = [
  'Shea Butter',
  'Sesame',
  'Millet',
  'Sorghum',
  'Maize/Corn',
  'Rice',
  'Cowpea',
  'Groundnut/Peanut',
  'Cashew',
  'Mango',
  'Cotton',
  'Moringa',
  'Hibiscus/Bissap',
  'Fonio',
  'Yam',
  'Cassava',
  'Sweet Potato',
  'Onion',
  'Tomato',
  'Pepper',
  'Watermelon',
  'Cowpea Leaves',
  'Baobab',
  'Gum Arabic',
  'Karité',
];

export default function FarmerCertificationProgram() {
  const { i18n } = useTranslation();
  const isFr = String(i18n.language || '').toLowerCase().startsWith('fr');

  const [applicantType, setApplicantType] = useState('Individual');
  const [crops, setCrops] = useState(FALLBACK_CROPS);
  const [confirmHa, setConfirmHa] = useState(false);
  const [form, setForm] = useState({
    name: '',
    country: 'Senegal',
    region: '',
    crop: 'Shea Butter',
    farmerOrCooperativeId: '',
    transformationCenterName: '',
    email: '',
    phone: '',
    totalHectares: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/crops`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.crops) && d.crops.length) {
          setCrops(d.crops);
          setForm((p) => ({ ...p, crop: d.crops.includes(p.crop) ? p.crop : d.crops[0] }));
        }
      })
      .catch(() => {});
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: '' });

    if (!confirmHa) {
      setState({
        loading: false,
        ok: false,
        err: isFr
          ? 'Veuillez confirmer que vous avez au moins 10 hectares.'
          : 'Please confirm you have at least 10 hectares.',
      });
      return;
    }

    const ha = Number(form.totalHectares);
    if (!Number.isFinite(ha) || ha < 10) {
      setState({
        loading: false,
        ok: false,
        err: isFr
          ? 'Le minimum requis est de 10 hectares'
          : 'Minimum 10 hectares required',
      });
      return;
    }

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
          totalHectares: ha,
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
  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#B5850A] outline-none';
  const labelCls = 'text-sm font-medium text-gray-800';

  return (
    <div className="bg-[#f8f4e3] min-h-screen">
      <section className="bg-gradient-to-br from-[#1a3c2e] via-[#1a3c2e] to-[#143326] text-white">
        <div className="section-container py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            {isFr ? 'Certification export' : 'Get Export Certified'}
          </h1>
          <p className="mt-4 text-lg text-gray-100 max-w-3xl">
            {isFr
              ? 'Formation alignée USDA/UE, accompagnement documentaire et listing AfriYield — avec un business developer à vos côtés.'
              : 'USDA/EU-aligned training, documentation support, and AfriYield listing — with a business developer on your side.'}
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
                <h2 className="text-xl font-extrabold text-[#1a3c2e]">
                  {isFr ? 'Parcours Coopérative' : 'Cooperative Track'}
                </h2>
                <p className="text-sm font-bold text-[#B5850A]">
                  {isFr ? 'Sur devis / Contactez-nous' : 'Quote-based / Contact us'}
                </p>
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              {isFr
                ? 'Nécessite 10+ agriculteurs et un partenariat centre de transformation.'
                : 'Requires 10+ farmers and a transformation center partnership.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#B5850A]/15 flex items-center justify-center">
                <User className="w-6 h-6 text-[#1a3c2e]" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1a3c2e]">
                  {isFr ? 'Parcours Agriculteur individuel' : 'Individual Farmer Track'}
                </h2>
                <p className="text-sm font-bold text-[#B5850A]">
                  {isFr ? 'Sur devis / Contactez-nous' : 'Quote-based / Contact us'}
                </p>
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              {isFr
                ? 'Nécessite un partenariat avec un centre de transformation.'
                : 'Requires a transformation center partnership.'}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3">
          {isFr
            ? 'Les frais de certification sont déterminés après évaluation.'
            : 'Certification fees are determined after assessment.'}
        </p>
      </section>

      <section className="section-container pt-0 pb-10">
        <div className="rounded-2xl border-2 border-[#B5850A] bg-[#fff8e7] p-6 md:p-8">
          <p className="font-extrabold text-[#1a3c2e] text-lg">
            {isFr ? 'Important' : 'Important'}
          </p>
          <p className="mt-2 text-[#1a3c2e] text-sm md:text-base leading-relaxed">
            {isFr
              ? 'Les agriculteurs individuels doivent s\'associer à un centre de transformation avant l\'octroi de la certification.'
              : 'Individual farmers must partner with a transformation center before certification is granted.'}
          </p>
        </div>
      </section>

      <section className="section-container pt-0 pb-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#1a3c2e] mb-3">
            {isFr ? 'Critères d\'éligibilité' : 'Eligibility Requirements'}
          </h2>
          <ul className="space-y-2 text-gray-800 text-sm">
            <li>• {isFr ? 'Minimum 10 hectares de terres agricoles' : 'Minimum 10 hectares of farmland'}</li>
            <li>
              •{' '}
              {isFr
                ? 'Accès à un centre de transformation (ou nous vous mettons en relation)'
                : 'Access to a transformation center (or we will match you)'}
            </li>
            <li>• {isFr ? 'Au moins 1 culture éligible à l\'export' : 'At least 1 export-eligible crop'}</li>
            <li>• {isFr ? 'Profil Sahel AgriConnect actif' : 'Active Sahel AgriConnect profile'}</li>
          </ul>
        </div>
      </section>

      <section className="section-container pt-0 pb-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3c2e] mb-6">
          {isFr ? 'La certification inclut' : 'Certification includes'}
        </h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {(isFr
            ? [
                'Formation USDA/UE',
                'Support documentaire',
                'Listing AfriYield',
                'Business developer assigné',
                'Mise en relation centre de transformation',
              ]
            : [
                'USDA/EU training',
                'Documentation support',
                'AfriYield listing',
                'Business developer assigned',
                'Transformation center matching',
              ]
          ).map((x) => (
            <li
              key={x}
              className="rounded-xl border border-gray-200 bg-white p-4 text-gray-800 font-medium shadow-sm"
            >
              {x}
            </li>
          ))}
        </ul>
      </section>

      <section className="section-container pt-0 pb-20">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-xl p-8">
          <h2 className="text-2xl font-extrabold text-[#1a3c2e]">
            {isFr ? 'Candidature' : 'Application'}
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            {isFr
              ? 'Nous examinerons votre dossier et vous contacterons pour les prochaines étapes. Aucun paiement en ligne pour le moment.'
              : 'We will review your submission and follow up with next steps. No online payment for now.'}
          </p>

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <label className="inline-flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmHa}
                  onChange={(e) => setConfirmHa(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-[#B5850A] focus:ring-[#B5850A]"
                  required
                />
                <span className="text-sm text-gray-900 font-medium">
                  {isFr
                    ? 'Je confirme avoir au moins 10 hectares'
                    : 'I confirm I have at least 10 hectares'}
                </span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <p className={`${labelCls} mb-2`}>
                {isFr ? 'Type de candidat' : 'Applicant type'}
              </p>
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
                    <span className="text-gray-900">
                      {v === 'Individual'
                        ? isFr
                          ? 'Individuel'
                          : 'Individual'
                        : isFr
                          ? 'Coopérative'
                          : 'Cooperative'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-1 sm:col-span-2">
              <span className={labelCls}>{isFr ? 'Nom' : 'Name'}</span>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className={inputCls}
                required
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <LocationSelector
                value={{ country: form.country, region: form.region }}
                onChange={({ country, region }) => setForm((p) => ({ ...p, country, region }))}
                required
                showDetectedBanner={true}
              />
            </label>

            <label className="space-y-1">
              <span className={labelCls}>{isFr ? 'Culture' : 'Crop'}</span>
              <select
                name="crop"
                value={form.crop}
                onChange={onChange}
                className={`${inputCls} text-gray-900`}
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              >
                {crops.map((c) => (
                  <option key={c} value={c} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className={labelCls}>
                {isFr ? 'Superficie totale (hectares)' : 'Total farm size (hectares)'}
              </span>
              <input
                type="number"
                name="totalHectares"
                min={10}
                step="0.1"
                value={form.totalHectares}
                onChange={onChange}
                className={inputCls}
                required
                placeholder="10"
              />
              <span className="text-xs text-gray-600">
                {isFr
                  ? 'Le minimum requis est de 10 hectares'
                  : 'Minimum 10 hectares required'}
              </span>
            </label>

            <label className="space-y-1">
              <span className={labelCls}>
                {isFr ? 'ID agriculteur ou coopérative' : 'Farmer or cooperative ID'}
              </span>
              <input
                name="farmerOrCooperativeId"
                value={form.farmerOrCooperativeId}
                onChange={onChange}
                className={inputCls}
                required
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className={labelCls}>
                {isFr ? 'Nom du centre de transformation' : 'Transformation center name'}{' '}
                {isIndividual ? <span className="text-red-600">*</span> : null}
              </span>
              <input
                name="transformationCenterName"
                value={form.transformationCenterName}
                onChange={onChange}
                className={inputCls}
                required={isIndividual}
                placeholder={
                  isFr
                    ? "Vous n'en avez pas ? Nous vous mettrons en relation."
                    : "Don't have one? We'll match you."
                }
              />
            </label>

            <label className="space-y-1">
              <span className={labelCls}>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className={inputCls}
                required
              />
            </label>

            <label className="space-y-1">
              <span className={labelCls}>{isFr ? 'Téléphone' : 'Phone'}</span>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                className={inputCls}
              />
            </label>

            <button
              type="submit"
              disabled={state.loading}
              className="sm:col-span-2 w-full rounded-xl bg-[#1a3c2e] text-white font-bold py-3 hover:bg-[#143326] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {state.loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
              {isFr ? 'Envoyer la candidature' : 'Submit application'}
            </button>

            {state.ok ? (
              <p className="sm:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {isFr
                  ? 'Candidature reçue. Nous vous contacterons pour les prochaines étapes.'
                  : 'Application received. We will contact you with next steps.'}
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
