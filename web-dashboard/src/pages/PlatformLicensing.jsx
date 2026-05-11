import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { Check, Loader2, ChevronRight } from 'lucide-react';
import LocationSelector from '../components/LocationSelector';

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
    color: '#1a3c2e',
    price: '$999/month',
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
    color: '#3b82f6',
    price: '$499/month',
    features: [
      'Multi-country program access',
      'Training program management',
      'Farmer and cooperative engagement',
      'Impact reporting',
      'Partnership with cooperatives',
    ],
  },
  {
    key: 'enterprise',
    icon: '🏢',
    title: 'Enterprise / Corporate',
    titleFr: 'Entreprise / Corporatif',
    desc: 'Large buyer, processor group, commodities trader, or corporate sourcing team seeking verified supply chain access.',
    descFr:
      "Grand acheteur, groupe de transformation, négociant en matières premières ou équipe d'approvisionnement d'entreprise.",
    requirement: 'Requires professional business email',
    requirementFr: "Nécessite un email professionnel d'entreprise",
    color: '#B5850A',
    price: '$1,499/month',
    features: [
      'Verified supply chain access',
      'Direct cooperative sourcing',
      'AfriYield Exchange priority access',
      'Bulk commodity intelligence',
      'Dedicated account manager',
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

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }} className="text-white">
        <div className="section-container py-16 md:py-20 text-center">
          <span className="inline-block bg-[#B5850A]/20 text-[#B5850A] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {isFr ? 'Accès institutionnel' : 'Institutional Access'}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isFr ? 'Licences Institutionnelles' : 'Institutional Licenses'}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {isFr
              ? 'Gouvernements, ONG et entreprises — accédez aux données agricoles de votre territoire avec isolation complète des données et portail dédié.'
              : 'Governments, NGOs, and enterprises — access agricultural data for your territory with complete data isolation and dedicated portal.'}
          </p>
        </div>
      </section>

      <div className="section-container py-12 pb-20">
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-[#1a3c2e] text-center mb-3">
              {isFr ? 'Quelle est votre organisation?' : 'What is your organization?'}
            </h2>
            <p className="text-gray-500 text-center mb-10">
              {isFr
                ? "Choisissez le type d'accès qui correspond à votre organisation."
                : 'Choose the access type that matches your organization.'}
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {ORG_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => selectType(type)}
                  type="button"
                  className="rounded-2xl border-2 border-gray-200 p-6 text-left hover:border-[#1a3c2e] hover:shadow-lg transition-all bg-white group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{type.icon}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: type.color }}>
                      {type.price}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{isFr ? type.titleFr : type.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{isFr ? type.descFr : type.desc}</p>
                  <p className="text-xs font-semibold mb-4" style={{ color: type.color }}>
                    🔒 {isFr ? type.requirementFr : type.requirement}
                  </p>
                  <div className="space-y-1.5">
                    {type.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
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

            <div className="text-center mt-10">
              <p className="text-gray-500 text-sm mb-2">
                {isFr ? 'Vous avez déjà un accès institutionnel?' : 'Already have institutional access?'}
              </p>
              <Link to="/government-portal" className="text-[#1a3c2e] font-semibold text-sm hover:underline">
                {isFr ? 'Accéder au portail →' : 'Access the portal →'}
              </Link>
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
              className="rounded-2xl p-6 mb-6 text-white"
              style={{ background: `linear-gradient(135deg, ${selectedType.color}, ${selectedType.color}cc)` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedType.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{isFr ? selectedType.titleFr : selectedType.title}</h2>
                  <p className="text-white/70 text-sm">{isFr ? selectedType.requirementFr : selectedType.requirement}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
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

                <p className="text-xs text-gray-400 text-center">
                  {isFr
                    ? 'Notre équipe examinera votre demande sous 48 heures et vous contactera par email pour configurer votre accès.'
                    : 'Our team will review your request within 48 hours and contact you by email to set up your access.'}
                </p>
              </form>
            </div>
          </div>
        )}

        {step === 3 && selectedType && (
          <div className="max-w-lg mx-auto text-center py-10">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a3c2e] mb-3">{isFr ? 'Demande reçue !' : 'Request received!'}</h2>
            <p className="text-gray-600 mb-6">
              {isFr
                ? `Nous avons reçu votre demande d'accès pour ${form.organizationName}. Notre équipe vous contactera à ${form.email} dans les 48 heures pour finaliser votre accès et vous envoyer vos identifiants de connexion.`
                : `We received your access request for ${form.organizationName}. Our team will contact you at ${form.email} within 48 hours to finalize your access and send your login credentials.`}
            </p>
            <div className="bg-[#F5F0E8] rounded-2xl p-5 text-left mb-6 border border-[#B5850A]/20">
              <p className="font-bold text-[#1a3c2e] mb-3 text-sm">{isFr ? '📋 Prochaines étapes :' : '📋 Next steps:'}</p>
              {[
                isFr
                  ? 'Vérification de votre email institutionnel par notre équipe'
                  : 'Verification of your institutional email by our team',
                isFr
                  ? 'Validation de votre organisation et de votre rôle'
                  : 'Validation of your organization and role',
                isFr
                  ? 'Configuration de votre compte portail avec accès pays'
                  : 'Configuration of your portal account with country access',
                isFr
                  ? 'Envoi de vos identifiants sécurisés par email'
                  : 'Sending of your secure credentials by email',
                isFr
                  ? 'Appel de présentation de 30 minutes avec notre équipe'
                  : '30-minute onboarding call with our team',
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-sm text-gray-600">
                  <span className="font-bold text-[#B5850A] flex-shrink-0">{i + 1}.</span>
                  {s}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Link
                to="/"
                className="px-6 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#1a3c2e' }}
              >
                {isFr ? "Retour à l'accueil" : 'Back to home'}
              </Link>
              <Link to="/government-portal" className="px-6 py-2.5 rounded-xl font-bold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e]">
                {isFr ? 'Accéder au portail' : 'Access portal'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
