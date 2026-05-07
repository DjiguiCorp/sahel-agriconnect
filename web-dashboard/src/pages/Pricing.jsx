import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Factory, Building2, Landmark, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const TIER_KEYS = ['farmerBasic', 'producerPro', 'transformationCenter', 'enterprise'];
const TIER_PRICES = ['', '$32', '$109', '$999'];
const TIER_ICONS = [Sprout, Factory, Building2, Landmark];
const TIER_LINKS = ['/dashboard', '/contact', '/contact', '/platform-licensing'];
const TIER_VARIANTS = ['outline', 'gold', 'gold', 'gold'];
const TIER_POPULAR = [false, true, false, false];

export default function Pricing() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">

      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a3c2e] mb-4">
          {t('pricing.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      {/* Main pricing tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {TIER_KEYS.map((key, i) => {
          const Icon = TIER_ICONS[i];
          const isEnterprise = key === 'enterprise';
          const isPopular = TIER_POPULAR[i];
          const isGold = TIER_VARIANTS[i] === 'gold';
          return (
            <div
              key={key}
              className={`relative rounded-2xl border p-7 flex flex-col h-full ${
                isEnterprise
                  ? 'border-[#B5850A] bg-gradient-to-b from-[#1a3c2e] to-[#143326] text-white shadow-xl'
                  : 'border-gray-200 bg-white shadow-md'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B5850A] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {t('pricing.popular')}
                </div>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                isEnterprise ? 'bg-[#B5850A]/20' : 'bg-green-50'
              }`}>
                <Icon className={`w-5 h-5 ${isEnterprise ? 'text-[#B5850A]' : 'text-[#1a3c2e]'}`} />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${isEnterprise ? 'text-white' : 'text-[#1a3c2e]'}`}>
                {t(`pricing.tiers.${key}.name`)}
              </h3>
              <div className="mb-5">
                <span className={`text-3xl font-bold ${isEnterprise ? 'text-[#B5850A]' : 'text-[#1a3c2e]'}`}>
                  {TIER_PRICES[i] || t('pricing.free')}
                </span>
                {TIER_PRICES[i] && (
                  <span className={`text-sm ${isEnterprise ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('pricing.perMonth')}
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {t(`pricing.tiers.${key}.features`, { returnObjects: true }).map((feat, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isEnterprise ? 'text-[#B5850A]' : 'text-[#1a3c2e]'}`} />
                    <span className={isEnterprise ? 'text-gray-200' : 'text-gray-600'}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={TIER_LINKS[i]}
                className={`w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition ${
                  isEnterprise
                    ? 'bg-[#B5850A] text-white hover:bg-[#9a7009]'
                    : isGold
                    ? 'bg-[#1a3c2e] text-white hover:bg-[#143326]'
                    : 'border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e] hover:text-white'
                }`}
              >
                {t(`pricing.tiers.${key}.cta`)}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Bottom three sections */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {/* Cooperative */}
        <div className="rounded-2xl border-2 border-[#1a3c2e] bg-white p-7 flex flex-col">
          <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{t('pricing.cooperative.title')}</h3>
          <p className="text-gray-600 text-sm mb-4 flex-1">{t('pricing.cooperative.description')}</p>
          <p className="text-2xl font-bold text-[#B5850A] mb-5">{t('pricing.cooperative.price')}</p>
          <Link to="/cooperative-registration" className="w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#1a3c2e] text-white hover:bg-[#143326] transition">
            {t('pricing.cooperative.cta')}
          </Link>
        </div>

        {/* Government */}
        <div className="rounded-2xl border-2 border-[#B5850A] bg-white p-7 flex flex-col">
          <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{t('pricing.government.title')}</h3>
          <p className="text-gray-600 text-sm mb-4 flex-1">{t('pricing.government.description')}</p>
          <p className="text-2xl font-bold text-[#B5850A] mb-5">{t('pricing.government.price')}</p>
          <Link to="/platform-licensing" className="w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#B5850A] text-white hover:bg-[#9a7009] transition">
            {t('pricing.government.cta')}
          </Link>
        </div>

        {/* Diaspora Investor */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-7 flex flex-col">
          <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{t('pricing.diaspora.title')}</h3>
          <p className="text-gray-600 text-sm mb-2 flex-1">{t('pricing.diaspora.description')}</p>
          <p className="text-sm text-[#1a3c2e] font-medium mb-5">✓ {t('pricing.diaspora.track')}</p>
          <Link to="/afri-yield/register" className="w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e] hover:text-white transition">
            {t('pricing.diaspora.cta')}
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1a3c2e] text-center mb-8">{t('pricing.faq.title')}</h2>
        <div className="space-y-3">
          {[1,2,3,4].map(n => (
            <div key={n} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === n ? null : n)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-[#1a3c2e] hover:bg-gray-50 transition"
              >
                <span>{t(`pricing.faq.q${n}`)}</span>
                {openFaq === n
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                }
              </button>
              {openFaq === n && (
                <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                  {t(`pricing.faq.a${n}`)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
