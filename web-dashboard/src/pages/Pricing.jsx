import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout, Users, Factory, Globe, Check, ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

// ── PRICING DATA ─────────────────────────────────────────────
const TIERS = [
  {
    id: 'farmer',
    icon: Sprout,
    color: '#4CAF50',
    bg: 'from-green-900/30 to-green-950/50',
    border: 'border-green-500/20',
    name: { en: 'Farmer', fr: 'Agriculteur' },
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
        'Geolocation-based cooperative discovery',
        'Request to join cooperatives near you',
        'Browse training programs',
        'Community support resources',
        'Production insights (upgrade to unlock full access)',
        'Export readiness tools (upgrade to unlock)',
        'Direct market listings (upgrade to unlock)',
      ],
      fr: [
        'Inscription gratuite — toujours',
        'Diagnostic sol & détection maladies (IA)',
        'Connexion avec coopératives locales',
        'Découverte de coopératives par géolocalisation',
        "Demande d'adhésion aux coopératives proches",
        'Accès aux formations',
        'Ressources communautaires',
        'Aperçus de production (mise à niveau pour accès complet)',
        "Outils de préparation à l'export (mise à niveau pour débloquer)",
        'Accès direct aux marchés (mise à niveau pour débloquer)',
      ],
    },
    cta: { en: 'Register Free', fr: "S'inscrire gratuitement" },
    ctaRoute: '/inscription',
    ctaNote: {
      en: 'Upgrade anytime from your dashboard',
      fr: 'Mettez à niveau depuis votre tableau de bord',
    },
    popular: false,
  },
  {
    id: 'cooperative',
    icon: Users,
    color: '#1D9E75',
    bg: 'from-teal-900/30 to-teal-950/50',
    border: 'border-teal-500/20',
    name: { en: 'Cooperative', fr: 'Coopérative' },
    price: { monthly: 0, annual: 199 },
    badge: { en: 'Most Popular', fr: 'Plus populaire' },
    audience: {
      en: 'Free to start (≤50 members). Growth unlocks at 51+ ($199/year).',
      fr: 'Gratuit pour démarrer (≤50 membres). Croissance à 51+ (199$/an).',
    },
    featuresFree: {
      en: [
        'Free registration — always',
        'Member management (up to 50)',
        'Connect with farmers & receive join requests',
        'Access to training programs',
        'Basic cooperative dashboard',
      ],
      fr: [
        'Inscription gratuite — toujours',
        'Gestion des membres (jusqu\'à 50)',
        'Connexion agriculteurs & demandes d\'adhésion',
        'Accès aux formations',
        'Tableau de bord coopérative de base',
      ],
    },
    featuresGrowth: {
      en: [
        'Certification workflow',
        'AfriYield Exchange listing',
        'Export to diaspora markets (USA, Europe)',
        'USDA certification pathway (DSU partnership)',
        'Equipment fund eligibility',
        'Track A & B investment visibility',
      ],
      fr: [
        'Workflow de certification',
        'Référencement AfriYield Exchange',
        'Export vers marchés diaspora (USA, Europe)',
        'Parcours certification USDA (partenariat DSU)',
        'Éligibilité au fonds d\'équipement',
        'Visibilité investissements Track A & B',
      ],
    },
    features: { en: [], fr: [] },
    cta: { en: 'Register Cooperative', fr: 'Inscrire la coopérative' },
    ctaRoute: '/cooperative-registration',
    popular: true,
    registerOnly: true,
  },
  {
    id: 'transformation',
    icon: Factory,
    color: '#F59E0B',
    bg: 'from-yellow-900/30 to-yellow-950/50',
    border: 'border-yellow-500/20',
    name: { en: 'Transformation Center', fr: 'Centre de transformation' },
    price: { monthly: 109, annual: 1090 },
    dualBilling: true,
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
    stripeAmountUsd: { monthly: 109, annual: 1090 },
    tierKey: 'transformation',
  },
  {
    id: 'investor',
    icon: Globe,
    color: '#B5850A',
    bg: 'from-amber-900/20 to-amber-950/40',
    border: 'border-amber-500/20',
    name: { en: 'AfriYield Investor', fr: 'Investisseur AfriYield' },
    price: { monthly: 29.99, annual: 299 },
    dualBilling: true,
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
    cta: { en: 'Register as Investor', fr: "S'inscrire comme investisseur" },
    ctaRoute: '/afri-yield/register',
    popular: false,
    stripeAmountUsd: { monthly: 29.99, annual: 299 },
    tierKey: 'investor',
  },
];

export default function Pricing() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [cardBilling, setCardBilling] = useState({});
  const [openFaq, setOpenFaq] = useState(null);
  const [searchParams] = useSearchParams();
  const [loadingTier, setLoadingTier] = useState(null);

  const getBilling = (tierId) => cardBilling[tierId] || 'monthly';

  const handlePricingCheckout = async (tier) => {
    setLoadingTier(tier.id);
    try {
      const billing = getBilling(tier.id);
      let amountUsd =
        billing === 'annual' && tier.stripeAmountUsd?.annual
          ? tier.stripeAmountUsd.annual
          : tier.stripeAmountUsd?.monthly;

      if (!amountUsd && tier.stripeAmountUsd?.annual) {
        amountUsd = tier.stripeAmountUsd.annual;
      }

      if (!amountUsd) {
        alert(isFr ? 'Erreur de paiement. Veuillez réessayer.' : 'Payment error. Please try again.');
        return;
      }

      const tierRouteMap = {
        cooperative: '/cooperative-registration',
        transformation: '/transformation-registration',
        investor: '/afri-yield/register',
      };
      const returnBase = tierRouteMap[tier.id] || '/pricing';

      const res = await fetch(`${API_BASE_URL}/api/payments/stripe/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
          tierKey: tier.id,
          tierName: tier.name[isFr ? 'fr' : 'en'],
          amountUsd,
          billingInterval: billing === 'annual' || tier.annualOnly ? 'year' : 'month',
          successUrl: `${window.location.origin}${returnBase}?payment=success&tier=${tier.id}`,
          cancelUrl: `${window.location.origin}/pricing?cancelled=${tier.id}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(isFr ? 'Erreur de paiement. Veuillez réessayer.' : 'Payment error. Please try again.');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      alert(isFr ? 'Erreur de connexion. Veuillez réessayer.' : 'Connection error. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

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
        ? 'Les agriculteurs s\'inscrivent gratuitement. Les centres de transformation incluent un essai de 30 jours. Aucune carte de crédit requise pour démarrer.'
        : 'Farmers sign up free. Transformation Centers include a 30-day trial. No credit card required to start.',
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
  ];

  const getPrice = (tier) => {
    const billing = getBilling(tier.id);
    if (tier.id === 'cooperative') {
      return isFr ? 'Gratuit → 199$/an' : 'Free → $199/yr';
    }
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
            ? 'Rejoignez la révolution agricole — Gratuit pour démarrer'
            : 'Join the Agricultural Revolution — Free to Start'}
        </h1>
        <p className="text-white/60 text-base max-w-2xl mx-auto mb-8">
          {isFr
            ? "Chaque agriculteur s'inscrit gratuitement. Les coopératives, centres de transformation et investisseurs débloquent toute la puissance de la plateforme."
            : 'Every farmer signs up free. Cooperatives, transformation centers, and investors unlock the full power of the platform.'}
        </p>
        {searchParams?.get?.('cancelled') && (
          <p className="text-red-400 text-sm mt-2">
            {isFr ? 'Paiement annulé. Vous pouvez réessayer.' : 'Payment cancelled. You can try again.'}
          </p>
        )}
      </section>

      {/* Tiers grid */}
      <section className="px-4 pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {TIERS.map((tier) => {
            const billing = getBilling(tier.id);
            const savings = getSavings(tier);
            const TierIcon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border bg-gradient-to-b
                  ${tier.bg} ${tier.border} p-6 flex flex-col min-h-[32rem]
                  ${tier.popular
                    ? 'ring-2 ring-amber-500/50 lg:scale-[1.02]' : ''}`}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2
                    -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs
                      font-bold bg-amber-500 text-black whitespace-nowrap">
                      {tier.badge[isFr ? 'fr' : 'en']}
                    </span>
                  </div>
                )}

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

                {tier.dualBilling && (
                  <div className="inline-flex self-start items-center gap-1 bg-white/5
                    border border-white/10 rounded-lg p-0.5 mb-3">
                    {['monthly', 'annual'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setCardBilling((prev) => ({ ...prev, [tier.id]: b }))}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          billing === b
                            ? 'bg-amber-500 text-black'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {b === 'monthly'
                          ? (isFr ? 'Mensuel' : 'Monthly')
                          : (isFr ? 'Annuel' : 'Annual')}
                      </button>
                    ))}
                  </div>
                )}

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

                <ul className="space-y-2 mb-6 flex-1">
                  {tier.featuresFree ? (
                    <>
                      <p className="text-green-400 text-xs font-semibold mb-1">
                        {isFr ? '✅ GRATUIT — Démarrage (≤50 membres)' : '✅ FREE — Starter (≤50 members)'}
                      </p>
                      {tier.featuresFree[isFr ? 'fr' : 'en'].map((f, i) => (
                        <li key={`free-${i}`} className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 flex-shrink-0"
                            style={{ color: tier.color }} />
                          <span className="text-white/70 text-xs leading-relaxed">{f}</span>
                        </li>
                      ))}
                      <div className="border-t border-white/10 my-3 pt-3">
                        <p className="text-amber-400 text-xs font-semibold mb-2">
                          {isFr ? '🔒 Plan Croissance — 51+ membres' : '🔒 Growth Plan — 51+ members'}
                        </p>
                      </div>
                      {tier.featuresGrowth[isFr ? 'fr' : 'en'].map((f, i) => (
                        <li key={`growth-${i}`} className="flex items-start gap-2">
                          <span className="text-xs mt-0.5 flex-shrink-0">🔒</span>
                          <span className="text-white/35 text-xs leading-relaxed">{f}</span>
                        </li>
                      ))}
                    </>
                  ) : (
                    tier.features[isFr ? 'fr' : 'en'].map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="mt-0.5 flex-shrink-0"
                          style={{ color: tier.color }} />
                        <span className="text-white/70 text-xs leading-relaxed">{f}</span>
                      </li>
                    ))
                  )}
                </ul>

                {tier.id === 'farmer' || tier.registerOnly ? (
                  <div>
                    <Link to={tier.ctaRoute}>
                      <button type="button" className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: tier.popular ? tier.color : `${tier.color}20`,
                          color: tier.popular ? 'black' : tier.color,
                          border: `1px solid ${tier.color}40`,
                        }}>
                        {tier.cta[isFr ? 'fr' : 'en']}
                        <ArrowRight size={14} />
                      </button>
                    </Link>
                    {tier.ctaNote && (
                      <p className="text-white/40 text-[11px] text-center mt-2">
                        {tier.ctaNote[isFr ? 'fr' : 'en']}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={loadingTier === tier.id}
                    onClick={() => handlePricingCheckout(tier)}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: tier.popular ? tier.color : `${tier.color}20`, color: tier.popular ? 'black' : tier.color, border: `1px solid ${tier.color}40` }}>
                    {loadingTier === tier.id
                      ? (isFr ? 'Redirection...' : 'Redirecting...')
                      : tier.cta[isFr ? 'fr' : 'en']}
                    <ArrowRight size={14} />
                  </button>
                )}
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
