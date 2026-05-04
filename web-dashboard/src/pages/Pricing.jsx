import { Link } from 'react-router-dom';
import { Sprout, Factory, Building2, Landmark, Check } from 'lucide-react';

const tiers = [
  {
    name: 'Farmer Basic',
    price: 'Free',
    period: '',
    Icon: Sprout,
    features: [
      'Soil diagnostic & disease detection tools',
      'Register profile and connect to local centers',
      'Browse trainings and cooperative perks',
      'Community support resources',
    ],
    cta: { label: 'Get started', to: '/enregistrer-agriculteur', variant: 'outline' },
  },
  {
    name: 'Producer Pro',
    price: '$32',
    period: '/month',
    Icon: Factory,
    features: [
      'Everything in Farmer Basic',
      'Priority irrigation assessments',
      'Production optimization insights',
      'Export readiness checklist',
    ],
    cta: { label: 'Choose Producer Pro', to: '/contact', variant: 'gold' },
  },
  {
    name: 'Transformation Center',
    price: '$109',
    period: '/month',
    Icon: Building2,
    features: [
      'Center dashboard & inventory tools',
      'Member farmer onboarding',
      'Certification workflow integration',
      'AfriYield Exchange listing support',
    ],
    cta: { label: 'Talk to sales', to: '/contact', variant: 'gold' },
  },
  {
    name: 'Enterprise / Government',
    price: '$999',
    period: '/month',
    Icon: Landmark,
    features: [
      'Country-isolated admin & data',
      'Unlimited farmer & cooperative seats',
      'Custom governance modules',
      'Global commodity visibility on AfriYield',
    ],
    cta: { label: 'Platform licensing', to: '/platform-licensing', variant: 'gold' },
  },
];

function TierCard({ tier }) {
  const Icon = tier.Icon;
  const isGold = tier.cta.variant === 'gold';
  return (
    <div
      className={`rounded-2xl border p-8 flex flex-col h-full ${
        tier.name === 'Enterprise / Government'
          ? 'border-[#B5850A] bg-gradient-to-b from-[#1a3c2e] to-[#143326] text-white shadow-xl'
          : 'border-gray-200 bg-white shadow-md'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          tier.name === 'Enterprise / Government' ? 'bg-[#B5850A]/20' : 'bg-brand-iconBg'
        }`}
      >
        <Icon
          className={`w-6 h-6 ${tier.name === 'Enterprise / Government' ? 'text-[#B5850A]' : 'text-brand-forest'}`}
          aria-hidden
        />
      </div>
      <h3
        className={`text-xl font-extrabold ${
          tier.name === 'Enterprise / Government' ? 'text-white' : 'text-[#1a3c2e]'
        }`}
      >
        {tier.name}
      </h3>
      <p className="mt-3 flex items-baseline gap-1">
        <span
          className={`text-4xl font-extrabold ${
            tier.name === 'Enterprise / Government' ? 'text-[#B5850A]' : 'text-[#1a3c2e]'
          }`}
        >
          {tier.price}
        </span>
        {tier.period ? (
          <span
            className={`text-sm font-medium ${
              tier.name === 'Enterprise / Government' ? 'text-white/80' : 'text-gray-600'
            }`}
          >
            {tier.period}
          </span>
        ) : null}
      </p>
      <ul className="mt-6 space-y-3 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2 text-sm">
            <Check
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                tier.name === 'Enterprise / Government' ? 'text-[#B5850A]' : 'text-[#B5850A]'
              }`}
              aria-hidden
            />
            <span className={tier.name === 'Enterprise / Government' ? 'text-white/90' : 'text-gray-700'}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        to={tier.cta.to}
        className={`mt-8 block text-center rounded-xl py-3 px-4 font-bold transition ${
          isGold
            ? tier.name === 'Enterprise / Government'
              ? 'bg-[#B5850A] text-[#1a3c2e] hover:bg-[#9a7109]'
              : 'bg-[#B5850A] text-white hover:bg-[#9a7109]'
            : 'border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e]/5'
        }`}
      >
        {tier.cta.label}
      </Link>
    </div>
  );
}

export default function Pricing() {
  return (
    <div className="bg-brand-cream min-h-[60vh]">
      <section className="bg-gradient-to-br from-[#1a3c2e] via-[#1a3c2e] to-[#143326] text-white">
        <div className="section-container py-16 md:py-20 text-center">
          <p className="text-sm font-semibold text-[#B5850A] tracking-wide uppercase">Transparent pricing</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2">Pricing</h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl mx-auto">
            Plans for farmers, producers, transformation centers, and national programs — aligned with AfriYield
            Exchange growth.
          </p>
        </div>
      </section>

      <section className="section-container py-14 md:py-20">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {tiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>
      </section>

      <section className="section-container pt-0 pb-12">
        <div className="rounded-2xl border border-[#B5850A]/30 bg-white p-8 md:p-10 shadow-lg">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3c2e]">Cooperatives</h2>
              <p className="mt-3 text-gray-700">
                Register your cooperative for equipment fund access, certification pathways, investor matching, and
                export programs.
              </p>
              <p className="mt-4 text-2xl font-extrabold text-[#B5850A]">$199/year</p>
              <Link
                to="/cooperative-registration"
                className="mt-6 inline-flex rounded-xl bg-[#1a3c2e] text-white font-bold px-6 py-3 hover:bg-[#143326] transition"
              >
                Cooperative registration
              </Link>
            </div>
            <div className="rounded-xl bg-[#1a3c2e]/5 border border-gray-200 p-6">
              <h3 className="font-bold text-[#1a3c2e]">Includes</h3>
              <ul className="mt-3 space-y-2 text-gray-700 text-sm">
                <li>• Farmer recruitment & member tools</li>
                <li>• Equipment fund eligibility</li>
                <li>• Certification & AfriYield visibility</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pt-0 pb-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3c2e]">Governments & regional organizations</h2>
          <p className="mt-3 text-gray-700 max-w-2xl">
            Deploy Sahel AgriConnect and AfriYield Exchange in your country with sovereign data control and custom admin.
          </p>
          <p className="mt-4 text-2xl font-extrabold text-[#B5850A]">From $999/month</p>
          <Link
            to="/platform-licensing"
            className="mt-6 inline-flex rounded-xl border-2 border-[#B5850A] text-[#1a3c2e] font-bold px-6 py-3 hover:bg-[#B5850A]/10 transition"
          >
            Platform licensing
          </Link>
        </div>
      </section>

      <section className="section-container pt-0 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-[#1a3c2e] to-[#143326] text-white p-8 md:p-10 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold">Diaspora investors</h2>
          <p className="mt-3 text-white/90 max-w-2xl">
            Browsing AfriYield Exchange opportunities is free. When you deploy capital through the platform, a{' '}
            <span className="font-bold text-[#B5850A]">5% facilitation fee</span> applies on capital deployed — covering
            due diligence, documentation, and program administration.
          </p>
          <Link
            to="/afri-yield/register"
            className="mt-6 inline-flex rounded-xl bg-[#B5850A] text-[#1a3c2e] font-bold px-6 py-3 hover:bg-[#9a7109] transition"
          >
            Register as an investor
          </Link>
          <p className="mt-4 text-sm text-white/75">
            See also: <Link to="/afri-yield/opportunities" className="text-[#B5850A] font-semibold underline">Investment opportunities</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
