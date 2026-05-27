import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Check, Loader2, ChevronRight } from 'lucide-react';
import LocationSelector from '../components/LocationSelector';
import { ROLE_THEMES, INSTITUTIONAL_PAYMENT } from '../lib/portalThemes';

const ORG_TYPES = [
  {
    key: 'government',
    icon: '🏛️',
    title: 'Government / Ministry',
    titleFr: 'Gouvernement / Ministère',
    desc: 'National or regional ministry, agricultural agency, or government body seeking country-level platform access.',
    descFr:
      'Ministère national ou régional, agence agricole ou organisme gouvernemental cherchant un accès plateforme au niveau pays.',
    requirement: 'Requires official .gov / .gouv email',
    requirementFr: 'Nécessite un email officiel .gov / .gouv',
    color: '#185FA5',
    cardGradient: ROLE_THEMES.government.gradient,
    price: '$999/mo',
    features: [
      'Country-scoped data access',
      'National project broadcasts',
      'All farmers, coops, processors visible',
      'Data isolation by country',
      'Optional national data center',
    ],
  },
  {
    key: 'ngo',
    icon: '🤝',
    title: 'NGO / International Organization',
    titleFr: 'ONG / Organisation internationale',
    desc: 'NGO, UN agency, development organization, or international body supporting African agriculture.',
    descFr:
      "ONG, agence ONU, organisation de développement ou organisme international soutenant l'agriculture africaine.",
    requirement: 'Requires .org / .ngo or institutional email',
    requirementFr: 'Nécessite un email .org / .ngo ou institutionnel',
    color: '#16A34A',
    cardGradient: ROLE_THEMES.ngo.gradient,
    price: '$499/mo',
    features: [
      'Multi-country program access',
      'Training program management',
      'Farmer and cooperative engagement',
      'Impact reporting',
      'Partnership with cooperatives',
    ],
  },
];

export default function PlatformLicensing() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [selectedType, setSelectedType] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    orgType: '',
    organizationName: '',
    country: '',
    region: '',
    contactName: '',
    email: '',
    phone: '',
    role: '',
    website: '',
    description: '',
    targetCountries: '',
    primaryGoal: '',
  });
  const [state, setState] = useState({ loading: false, ok: false, err: '' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('type');
    const t = ORG_TYPES.find((o) => o.key === p);
    if (t) {
      setSelectedType(t);
      setForm((f) => ({ ...f, orgType: t.key }));
      setStep(2);
    }
  }, []);

  const selectType = (type) => {
    setSelectedType(type);
    setForm((f) => ({ ...f, orgType: type.key }));
    setStep(2);
  };

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(API_ENDPOINTS.LICENSING.INQUIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'platform_licensing_page' }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || 'Request failed');
      }
      setState({ loading: false, ok: true, err: '' });
      setStep(3);
    } catch (err) {
      setState({ loading: false, ok: false, err: err.message });
    }
  };

  const pageBackground =
    step >= 2 && selectedType
      ? selectedType.key === 'government'
        ? ROLE_THEMES.government.pageBg
        : ROLE_THEMES.ngo.pageBg
      : 'linear-gradient(180deg, #0a1628 0%, #0d2818 40%, #1a3c2e 100%)';

  return (
    <div className="min-h-screen" style={{ background: pageBackground }}>
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(181,133,10,0.15),_transparent_50%)]" />
        <div className="section-container relative py-16 md:py-20 text-center">
          <span className="inline-block backdrop-blur-md bg-white/10 border border-white/20 text-[#B5850A] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            {isFr ? 'Accès institutionnel' : 'Institutional Access'}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isFr ? 'Licences Institutionnelles' : 'Institutional Licenses'}
          </h1>
          <p className="text-white/75 text-lg max-w-2xl mx-auto mb-6">
            {isFr
              ? 'Deux parcours distincts : portail gouvernemental (bleu) et portail ONG (vert). La demande est gratuite — le paiement intervient après approbation.'
              : 'Two separate paths: government portal (blue) and NGO portal (green). Applying is free — payment comes after approval.'}
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B5850A] hover:text-[#d4a017] transition-colors"
          >
            {isFr ? 'Voir tous les tarifs' : 'View full pricing'} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="section-container py-12 pb-20">
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              {isFr ? 'Quelle est votre organisation?' : 'What is your organization?'}
            </h2>
            <p className="text-white/60 text-center mb-10">
              {isFr
                ? "Choisissez le type d'accès qui correspond à votre organisation."
                : 'Choose the access type that matches your organization.'}
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {ORG_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => selectType(type)}
                  type="button"
                  className="rounded-2xl border-2 p-6 text-left transition-all group hover:scale-[1.02] shadow-xl"
                  style={{
                    background: type.cardGradient,
                    borderColor: type.key === 'government' ? 'rgba(59,130,246,0.5)' : 'rgba(46,204,113,0.5)',
                    boxShadow:
                      type.key === 'government'
                        ? '0 16px 48px rgba(24,95,165,0.35)'
                        : '0 16px 48px rgba(46,204,113,0.25)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{type.icon}</span>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full text-white"
                      style={{ background: type.color }}
                    >
                      {type.price}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{isFr ? type.titleFr : type.title}</h3>
                  <p className="text-white/65 text-sm mb-4 leading-relaxed">{isFr ? type.descFr : type.desc}</p>
                  <p className="text-xs font-semibold mb-4" style={{ color: type.color }}>
                    🔒 {isFr ? type.requirementFr : type.requirement}
                  </p>
                  <div className="space-y-1.5">
                    {type.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/70">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: type.color }} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-5 flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
                    style={{ color: type.color }}
                  >
                    {isFr ? 'Faire une demande' : 'Apply now'} <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>

            <div className="max-w-4xl mx-auto mt-8 rounded-2xl border border-[#F59E0B]/30 backdrop-blur-xl bg-gradient-to-r from-[#F59E0B]/10 to-transparent p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white font-bold text-lg mb-1">
                  {isFr ? 'Centre de transformation ?' : 'Transformation center?'}
                </p>
                <p className="text-white/65 text-sm">
                  {isFr
                    ? 'Inscrivez votre centre en ligne — à partir de 109 $/mois. Paiement sur le web.'
                    : 'Register your center online — from $109/month. Payment completed on the web.'}
                </p>
              </div>
              <Link
                to="/transformation-registration"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] text-[#0d2818] font-bold px-6 py-3 text-sm hover:bg-[#d97706] transition-colors shrink-0"
              >
                {isFr ? "S'inscrire (centre)" : 'Register center'} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="text-center mt-10">
              <p className="text-white/50 text-sm mb-2">
                {isFr ? 'Vous avez déjà un accès institutionnel?' : 'Already have institutional access?'}
              </p>
              <p className="text-[#B5850A] font-semibold text-sm">
                {isFr
                  ? 'Après validation, vos identifiants officiels vous donnent accès au portail pays (connexion sécurisée).'
                  : 'After approval, your official credentials unlock the country portal (secure sign-in only).'}
              </p>
            </div>
          </div>
        )}

        {step === 2 && selectedType && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep(1)}
              type="button"
              className="text-[#1a3c2e] text-sm hover:underline mb-6 flex items-center gap-1"
            >
              ← {isFr ? "Changer le type d'organisation" : 'Change organization type'}
            </button>

            <div
              className="rounded-2xl p-6 mb-6 text-white border-2"
              style={{
                background: selectedType.cardGradient,
                borderColor: selectedType.key === 'government' ? 'rgba(59,130,246,0.45)' : 'rgba(46,204,113,0.45)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedType.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{isFr ? selectedType.titleFr : selectedType.title}</h2>
                  <p className="text-white/70 text-sm">{isFr ? selectedType.requirementFr : selectedType.requirement}</p>
                  <p className="text-white/50 text-xs mt-1 font-semibold">
                    {INSTITUTIONAL_PAYMENT[selectedType.key].price}
                    {isFr
                      ? INSTITUTIONAL_PAYMENT[selectedType.key].periodFr
                      : INSTITUTIONAL_PAYMENT[selectedType.key].periodEn}
                    {' · '}
                    {isFr ? 'Facturation après approbation' : 'Billed after approval'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl border p-5 mb-6"
              style={{
                background: selectedType.key === 'government' ? 'rgba(24,95,165,0.12)' : 'rgba(46,204,113,0.1)',
                borderColor: selectedType.key === 'government' ? 'rgba(59,130,246,0.3)' : 'rgba(46,204,113,0.3)',
              }}
            >
              <p className="text-white font-bold text-sm mb-3">
                {isFr ? '💳 Comment le paiement fonctionne' : '💳 How payment works'}
              </p>
              <ol className="space-y-2">
                {(isFr
                  ? INSTITUTIONAL_PAYMENT[selectedType.key].stepsFr
                  : INSTITUTIONAL_PAYMENT[selectedType.key].stepsEn
                ).map((line, i) => (
                  <li key={i} className="flex gap-2 text-xs text-white/75">
                    <span className="font-bold shrink-0" style={{ color: selectedType.color }}>
                      {i + 1}.
                    </span>
                    {line}
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-2xl border shadow-sm p-6"
              style={{
                background: 'rgba(255,255,255,0.96)',
                borderColor: selectedType.key === 'government' ? 'rgba(24,95,165,0.25)' : 'rgba(22,120,80,0.25)',
              }}
            >
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? "Nom de l'organisation" : 'Organization name'} *
                    </label>
                    <input
                      name="organizationName"
                      value={form.organizationName}
                      onChange={onChange}
                      required
                      placeholder={
                        selectedType.key === 'government'
                          ? isFr
                            ? "Ex: Ministère de l'Agriculture du Mali"
                            : 'Ex: Ministry of Agriculture of Mali'
                          : selectedType.key === 'ngo'
                            ? 'Ex: FAO, CARE International...'
                            : 'Ex: AgroTrade Corp Ltd'
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr
                        ? `Email officiel (${selectedType.requirement.split('(')[1]?.replace(')', '') || selectedType.requirement})`
                        : `Official email (${selectedType.requirement})`}{' '}
                      *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      required
                      placeholder={
                        selectedType.key === 'government'
                          ? 'ministre@agriculture.gov.ml'
                          : selectedType.key === 'ngo'
                            ? 'director@organization.org'
                            : 'procurement@company.com'
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedType.key === 'government'
                        ? isFr
                          ? '⚠️ Seuls les emails .gov, .gouv ou équivalents sont acceptés.'
                          : '⚠️ Only .gov, .gouv or equivalent emails are accepted.'
                        : selectedType.key === 'ngo'
                          ? isFr
                            ? '⚠️ Emails personnels (Gmail, Yahoo) non acceptés.'
                            : '⚠️ Personal emails (Gmail, Yahoo) not accepted.'
                          : isFr
                            ? "⚠️ Utilisez l'email de votre entreprise."
                            : '⚠️ Use your company email.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Votre nom' : 'Your name'} *</label>
                    <input
                      name="contactName"
                      value={form.contactName}
                      onChange={onChange}
                      required
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Téléphone' : 'Phone'}</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Votre rôle / titre' : 'Your role / title'} *
                    </label>
                    <input
                      name="role"
                      value={form.role}
                      onChange={onChange}
                      required
                      placeholder={
                        selectedType.key === 'government'
                          ? isFr
                            ? 'Ex: Directeur général, Ministre...'
                            : 'Ex: Director General, Minister...'
                          : 'Ex: Country Director, CEO...'
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Site web (optionnel)' : 'Website (optional)'}
                    </label>
                    <input
                      name="website"
                      value={form.website}
                      onChange={onChange}
                      placeholder="https://"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>

                  <div className="col-span-2">
                    <LocationSelector
                      value={{ country: form.country, region: form.region }}
                      onChange={({ country, region }) => setForm((p) => ({ ...p, country, region }))}
                      required
                      showDetectedBanner={true}
                    />
                  </div>

                  {selectedType.key === 'ngo' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isFr ? "Pays d'intervention (multiples)" : 'Countries of operation (multiple)'}
                      </label>
                      <input
                        name="targetCountries"
                        value={form.targetCountries}
                        onChange={onChange}
                        placeholder={isFr ? 'Ex: Mali, Sénégal, Burkina Faso...' : 'Ex: Mali, Senegal, Burkina Faso...'}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                      />
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? "Objectif principal de votre demande d'accès" : 'Primary goal of your access request'} *
                    </label>
                    <textarea
                      name="primaryGoal"
                      value={form.primaryGoal}
                      onChange={onChange}
                      required
                      rows={3}
                      placeholder={
                        selectedType.key === 'government'
                          ? isFr
                            ? 'Ex: Suivre les producteurs de karité dans notre pays, lancer un programme de certification nationale, réduire les importations alimentaires...'
                            : 'Ex: Track shea producers in our country, launch a national certification program, reduce food imports...'
                          : selectedType.key === 'ngo'
                            ? isFr
                              ? "Ex: Mettre en œuvre un programme de formation pour 500 agriculteurs, connecter les coopératives aux marchés d'exportation..."
                              : 'Ex: Implement training program for 500 farmers, connect cooperatives to export markets...'
                            : isFr
                              ? 'Ex: Sourcer 100 tonnes de karité certifié USDA par trimestre, accéder aux coopératives vérifiées...'
                              : 'Ex: Source 100 tonnes of USDA-certified shea per quarter, access verified cooperatives...'
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                    />
                  </div>
                </div>

                {state.err && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{state.err}</p>
                )}

                <button
                  type="submit"
                  disabled={state.loading}
                  className="w-full py-4 rounded-xl font-bold text-white text-sm disabled:opacity-50 hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                  style={{ background: selectedType.color }}
                >
                  {state.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {state.loading
                    ? isFr
                      ? 'Envoi en cours...'
                      : 'Sending...'
                    : isFr
                      ? "Soumettre ma demande d'accès"
                      : 'Submit access request'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  {isFr
                    ? 'Aucun paiement n\'est collecté sur ce formulaire. Vous recevrez les instructions de facturation par email après approbation.'
                    : 'No payment is collected on this form. You will receive billing instructions by email after approval.'}
                </p>
              </form>
            </div>
          </div>
        )}

        {step === 3 && selectedType && (
          <div className="max-w-xl mx-auto text-center py-10">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: `${selectedType.color}22` }}
            >
              <Check className="w-10 h-10" style={{ color: selectedType.color }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{isFr ? 'Demande reçue !' : 'Request received!'}</h2>
            <p className="text-white/70 mb-6 text-sm">
              {isFr
                ? `Demande pour ${form.organizationName}. Contact à ${form.email} sous 48 h ouvrées.`
                : `Request for ${form.organizationName}. We will contact ${form.email} within 48 business hours.`}
            </p>
            <div
              className="rounded-2xl p-5 text-left mb-6 border text-sm"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: selectedType.key === 'government' ? 'rgba(59,130,246,0.35)' : 'rgba(46,204,113,0.35)',
              }}
            >
              <p className="font-bold text-white mb-3">{isFr ? '💳 Paiement & activation' : '💳 Payment & activation'}</p>
              <ol className="space-y-2">
                {(isFr
                  ? INSTITUTIONAL_PAYMENT[selectedType.key].stepsFr
                  : INSTITUTIONAL_PAYMENT[selectedType.key].stepsEn
                ).map((line, i) => (
                  <li key={i} className="flex gap-2 text-white/75 text-xs">
                    <span className="font-bold shrink-0" style={{ color: selectedType.color }}>
                      {i + 1}.
                    </span>
                    {line}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="px-6 py-2.5 rounded-xl font-bold text-white text-sm border border-white/20"
              >
                {isFr ? "Retour à l'accueil" : 'Back to home'}
              </Link>
              <Link
                to={selectedType.key === 'government' ? '/government-portal' : '/ngo-portal'}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: selectedType.color }}
              >
                {selectedType.key === 'government'
                  ? isFr
                    ? '🏛️ Portail gouvernement (déjà actif)'
                    : '🏛️ Government portal (already active)'
                  : isFr
                    ? '🤝 Portail ONG (déjà actif)'
                    : '🤝 NGO portal (already active)'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
