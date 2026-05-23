import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout, Star, Users, Factory, Globe,
  Landmark, Heart, Check, ArrowRight
} from 'lucide-react';

// ── PRICING DATA ─────────────────────────────────────────────
const TIERS = [
  {
    id: 'farmer',
    icon: Sprout,
    color: '#4CAF50',
    bg: 'from-green-900/30 to-green-950/50',
    border: 'border-green-500/20',
    name: { en: 'Farmer Basic', fr: 'Agriculteur de base' },
    price: { monthly: 0, annual: 0 },
    badge: null,
    audience: {
      en: 'The base of the chain. Free forever.',
      fr: 'La base de la chaîne. Gratuit pour toujours.',
    },
    features: {
      en: [
        'Free registration — always',
        'Soil diagnostic & disease detection (AI)',
        'Connect with local cooperatives',
        'Connect to cooperatives and get recruited',
        'Geolocation-based cooperative discovery',
        'Request to join cooperatives near you',
        'Browse training programs',
        'Community support resources',
      ],
      fr: [
        'Inscription gratuite — toujours',
        'Diagnostic sol & détection maladies (IA)',
        'Connexion avec coopératives locales',
        'Connectez-vous aux coopératives et soyez recruté',
        'Découverte de coopératives par géolocalisation',
        'Demande d\'adhésion aux coopératives proches',
        'Accès aux formations',
        'Ressources communautaires',
      ],
    },
    cta: { en: 'Register Free', fr: 'S\'inscrire gratuitement' },
    ctaRoute: '/inscription',
    popular: false,
  },
  {
    id: 'producer_pro',
    icon: Star,
    color: '#B5850A',
    bg: 'from-amber-900/30 to-amber-950/50',
    border: 'border-amber-500/30',
    name: { en: 'Producer Pro', fr: 'Producteur Pro' },
    price: { monthly: 29.99, annual: 299 },
    badge: null,
    audience: { en: 'For serious farmers & exporters', fr: 'Pour agriculteurs & exportateurs' },
    features: {
      en: [
        'Everything in Farmer Basic',
        'Priority irrigation assessments',
        'Production optimization insights',
        'Export readiness checklist',
        'Direct market access & listings',
        'Yield tracking & forecasting',
        'Premium support',
      ],
      fr: [
        'Tout inclus dans Agriculteur de base',
        'Évaluations d\'irrigation prioritaires',
        'Optimisation de la production',
        'Liste de contrôle export',
        'Accès direct aux marchés',
        'Suivi et prévision des rendements',
        'Support premium',
      ],
    },
    cta: { en: 'Start Producer Pro', fr: 'Démarrer Producteur Pro' },
    ctaRoute: '/producer-pro-registration',
    popular: false,
  },
  {
    id: 'cooperative',
    icon: Users,
    color: '#1D9E75',
    bg: 'from-teal-900/30 to-teal-950/50',
    border: 'border-teal-500/20',
    name: { en: 'Cooperative', fr: 'Coopérative' },
    price: { monthly: null, annual: 199 },
    annualOnly: true,
    badge: { en: 'Most Popular', fr: 'Plus populaire' },
    audience: {
      en: 'The engine — recruit farmers, certify, export',
      fr: 'Le moteur — recrute les agriculteurs, certifie, exporte',
    },
    features: {
      en: [
        'Recruit and manage farmer members',
        'Aggregate and certify production',
        'Affiliation with transformation centers',
        'AfriYield Exchange listing — sell to investors',
        'Equipment fund eligibility',
        'Receive farmer join requests',
        'Track A & B investment visibility',
      ],
      fr: [
        'Recruter et gérer les agriculteurs membres',
        'Agréger et certifier la production',
        'Affiliation avec centres de transformation',
        'Référencement AfriYield Exchange — vendre aux investisseurs',
        'Éligibilité au fonds d\'équipement',
        'Recevoir les demandes d\'adhésion des agriculteurs',
        'Visibilité investissements Track A & B',
      ],
    },
    cta: { en: 'Register Cooperative', fr: 'Inscrire la coopérative' },
    ctaRoute: '/cooperative-registration',
    popular: true,
  },
  {
    id: 'transformation',
    icon: Factory,
    color: '#F59E0B',
    bg: 'from-yellow-900/30 to-yellow-950/50',
    border: 'border-yellow-500/20',
    name: { en: 'Transformation Center', fr: 'Centre de transformation' },
    price: { monthly: 109, annual: 1090 },
    badge: null,
    audience: { en: 'For processors & agro-industries', fr: 'Pour transformateurs & agro-industries' },
    features: {
      en: [
        'Center dashboard & inventory tools',
        'Certified cooperative affiliation',
        'Member farmer onboarding',
        'Certification workflow integration',
        'AfriYield Exchange listing support',
        'Finished product marketplace access',
        'Cooperative partner matching',
      ],
      fr: [
        'Tableau de bord & inventaire',
        'Affiliation coopératives certifiées',
        'Intégration des agriculteurs membres',
        'Workflow de certification',
        'Visibilité sur AfriYield Exchange',
        'Accès marché produits finis',
        'Matching partenaires coopératives',
      ],
    },
    cta: { en: 'Register Center', fr: 'Inscrire le centre' },
    ctaRoute: '/transformation-registration',
    popular: false,
  },
  {
    id: 'ngo_industry',
    icon: Heart,
    color: '#2ECC71',
    bg: 'from-emerald-900/30 to-emerald-950/50',
    border: 'border-emerald-500/20',
    name: { en: 'NGO / Industries', fr: 'ONG / Industries' },
    price: { monthly: 499, annual: 4990 },
    badge: null,
    audience: {
      en: 'For NGOs, development orgs & industries. Institutional access — dedicated portal on request',
      fr: 'Pour ONG, organisations de développement & industries. Accès institutionnel — portail dédié sur demande',
    },
    features: {
      en: [
        'Program & beneficiary management',
        'Impact tracking & reporting',
        'Cooperative & farmer network access',
        'PDF report generation',
        'Multi-region operations',
        'Data export & analytics',
        'Dedicated account manager',
      ],
      fr: [
        'Gestion programmes & bénéficiaires',
        'Suivi et rapports d\'impact',
        'Accès réseau coopératives & agriculteurs',
        'Génération rapports PDF',
        'Opérations multi-régions',
        'Export données & analytique',
        'Gestionnaire de compte dédié',
      ],
    },
    cta: { en: 'Get Started', fr: 'Commencer' },
    ctaRoute: '/contact',
    popular: false,
  },
  {
    id: 'government',
    icon: Landmark,
    color: '#185FA5',
    bg: 'from-blue-900/30 to-blue-950/50',
    border: 'border-blue-500/30',
    name: { en: 'Government', fr: 'Gouvernement' },
    price: { monthly: 999, annual: 9990 },
    badge: { en: 'Sovereign', fr: 'Souverain' },
    audience: {
      en: 'For ministries & government agencies. Institutional access — dedicated portal on request',
      fr: 'Pour ministères & agences gouvernementales. Accès institutionnel — portail dédié sur demande',
    },
    features: {
      en: [
        'Country-isolated admin environment',
        'Unlimited farmer & cooperative seats',
        'National agricultural dashboard',
        'Custom governance & policy modules',
        'Global commodity visibility on AfriYield',
        'Sovereign data control',
        'SLA-backed dedicated support',
        'Onboarding & training for your team',
      ],
      fr: [
        'Environnement admin isolé par pays',
        'Sièges agriculteurs & coopératives illimités',
        'Tableau de bord agricole national',
        'Modules de gouvernance & politique personnalisés',
        'Visibilité mondiale sur AfriYield',
        'Contrôle souverain des données',
        'Support dédié avec SLA',
        'Intégration & formation de l\'équipe',
      ],
    },
    cta: { en: 'Contact for Licensing', fr: 'Contacter pour licence' },
    ctaRoute: '/contact',
    popular: false,
  },
  {
    id: 'investor',
    icon: Globe,
    color: '#B5850A',
    bg: 'from-amber-900/20 to-amber-950/40',
    border: 'border-amber-500/20',
    name: { en: 'AfriYield Investor', fr: 'Investisseur AfriYield' },
    price: { monthly: 29.99, annual: 299 },
    badge: null,
    audience: {
      en: 'Buy certified African commodities OR fund the cooperatives that produce them.',
      fr: 'Achetez des matières premières africaines certifiées OU financez les coopératives qui les produisent.',
    },
    features: {
      en: [
        'Browse certified cooperative opportunities',
        'Buy commodities directly (Track B marketplace)',
        'Fund cooperatives and earn projected returns',
        'Track A & B investment access',
        'KYC verification included',
        'Portfolio dashboard & payout schedule',
        '5% facilitation fee on deployed capital only',
      ],
      fr: [
        'Parcourir les opportunités coopératives certifiées',
        'Acheter des matières premières (marketplace Track B)',
        'Financer des coopératives et percevoir des rendements',
        'Accès investissements Track A & B',
        'Vérification KYC incluse',
        'Tableau de bord portefeuille et calendrier de paiements',
        '5% frais de facilitation sur le capital déployé uniquement',
      ],
    },
    cta: { en: 'Register as Investor', fr: 'S\'inscrire comme investisseur' },
    ctaRoute: '/afri-yield/register',
    popular: false,
  },
];

export default function Pricing() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: isFr ? 'Puis-je changer de plan?' : 'Can I switch plans?',
      a: isFr
        ? 'Oui — mettez à niveau ou réduisez à tout moment. Contactez notre équipe.'
        : 'Yes — upgrade or downgrade at any time. Contact our team.',
    },
    {
      q: isFr ? 'Y a-t-il un essai gratuit?' : 'Is there a free trial?',
      a: isFr
        ? 'Producer Pro et Centre de transformation incluent un essai de 30 jours. Aucune carte de crédit requise.'
        : 'Producer Pro and Transformation Center include a 30-day trial. No credit card required.',
    },
    {
      q: isFr ? 'Comment fonctionne l\'adhésion coopérative?'
        : 'How does cooperative membership work?',
      a: isFr
        ? 'Les coopératives paient 199$/an. Cela débloque la gestion des membres, l\'éligibilité au fonds d\'équipement et la visibilité AfriYield Exchange.'
        : 'Cooperatives pay $199/year. This unlocks member management, equipment fund eligibility, and AfriYield Exchange visibility.',
    },
    {
      q: isFr ? 'Quels modes de paiement sont acceptés?'
        : 'What payment methods are accepted?',
      a: isFr
        ? 'Paiement sécurisé par carte via Stripe (Visa, Mastercard, Amex).'
        : 'Secure card payment via Stripe (Visa, Mastercard, Amex).',
    },
    {
      q: isFr ? 'Le gouvernement a-t-il son propre portail?'
        : 'Does government have its own portal?',
      a: isFr
        ? 'Oui. L\'abonnement gouvernemental déploie un environnement entièrement isolé avec contrôle souverain des données nationales.'
        : 'Yes. The government subscription deploys a fully isolated environment with sovereign control of national data.',
    },
  ];

  const getPrice = (tier) => {
    if (tier.price.monthly === 0) return isFr ? 'Gratuit' : 'Free';
    if (tier.annualOnly) return `$${tier.price.annual}${isFr ? '/an' : '/year'}`;
    if (billing === 'annual' && tier.price.annual) {
      return `$${tier.price.annual}${isFr ? '/an' : '/year'}`;
    }
    return `$${tier.price.monthly}${isFr ? '/mois' : '/mo'}`;
  };

  const getSavings = (tier) => {
    if (!tier.price.monthly || !tier.price.annual || tier.annualOnly) return null;
    const yearlyCost = tier.price.monthly * 12;
    const saved = yearlyCost - tier.price.annual;
    return saved > 0 ? Math.round(saved) : null;
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'transparent' }}>
      {/* Hero */}
      <section
        className="pt-20 pb-10 px-4 text-center"
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% 0%,
              rgba(40,100,60,0.55) 0%,
              rgba(20,50,35,0.3) 45%,
              transparent 70%)
          `,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span className="inline-block px-4 py-1.5 rounded-full
          text-xs font-semibold bg-amber-500/15 text-amber-400
          border border-amber-500/30 mb-4">
          {isFr ? 'Tarification transparente' : 'Transparent Pricing'}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          {isFr
            ? 'Choisissez votre rôle dans la chaîne agricole'
            : 'Choose Your Role in the Agricultural Chain'}
        </h1>
        <p className="text-white/60 text-base max-w-2xl mx-auto mb-8">
          {isFr
            ? 'Des plans conçus pour chaque acteur — des agriculteurs aux gouvernements. Commencez gratuitement, évoluez avec vos besoins.'
            : 'Plans designed for every stakeholder — from farmers to governments. Start free, scale with your needs.'}
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-white/5
          border border-white/10 rounded-xl p-1 mb-8">
          {['monthly', 'annual'].map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-medium
                transition-all ${billing === b
                  ? 'bg-amber-500 text-black'
                  : 'text-white/60 hover:text-white'}`}>
              {b === 'monthly'
                ? (isFr ? 'Mensuel' : 'Monthly')
                : (isFr ? 'Annuel (économisez ~15%)' : 'Annual (save ~15%)')}
            </button>
          ))}
        </div>
      </section>

      {/* Tiers grid */}
      <section className="px-4 pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
          xl:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const savings = getSavings(tier);
            const TierIcon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border bg-gradient-to-b
                  ${tier.bg} ${tier.border} p-6 flex flex-col
                  ${tier.popular
                    ? 'ring-2 ring-amber-500/50 scale-105' : ''}`}>
                {/* Popular badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2
                    -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs
                      font-bold bg-amber-500 text-black whitespace-nowrap">
                      {tier.badge[isFr ? 'fr' : 'en']}
                    </span>
                  </div>
                )}

                {/* Icon & name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex
                    items-center justify-center"
                    style={{ backgroundColor: `${tier.color}20` }}>
                    <TierIcon size={20}
                      style={{ color: tier.color }} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      {tier.name[isFr ? 'fr' : 'en']}
                    </p>
                    <p className="text-white/40 text-xs">
                      {tier.audience[isFr ? 'fr' : 'en']}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold"
                      style={{ color: tier.color }}>
                      {getPrice(tier)}
                    </span>
                  </div>
                  {billing === 'annual' && savings && (
                    <p className="text-green-400 text-xs mt-0.5">
                      {isFr ? `Économisez $${savings}/an` : `Save $${savings}/year`}
                    </p>
                  )}
                  {tier.annualOnly && (
                    <p className="text-white/40 text-xs mt-0.5">
                      {isFr ? 'Facturation annuelle uniquement' : 'Annual billing only'}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features[isFr ? 'fr' : 'en'].map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 flex-shrink-0"
                        style={{ color: tier.color }} />
                      <span className="text-white/70 text-xs
                        leading-relaxed">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={tier.ctaRoute}>
                  <button
                    type="button"
                    className="w-full py-3 rounded-xl font-semibold
                      text-sm transition-all flex items-center
                      justify-center gap-2"
                    style={{
                      backgroundColor: tier.popular
                        ? tier.color : `${tier.color}20`,
                      color: tier.popular ? 'black' : tier.color,
                      border: `1px solid ${tier.color}40`,
                    }}>
                    {tier.cta[isFr ? 'fr' : 'en']}
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          {isFr ? 'Questions fréquentes' : 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-5 py-4 text-left flex
                  items-center justify-between">
                <span className="text-white font-medium text-sm">
                  {faq.q}
                </span>
                <span className="text-white/40 text-lg ml-4">
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-white/60 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
