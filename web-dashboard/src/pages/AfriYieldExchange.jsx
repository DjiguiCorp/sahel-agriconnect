import { Link, useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Globe } from 'lucide-react';

export default function AfriYieldExchange() {
  const navigate = useNavigate();

  return (
    <div className="bg-brand-cream">
      {/* Hero */}
      <section className="bg-[#1a3c2e]">
        <div className="section-container py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">AfriYield Exchange</h1>
          <p className="mt-5 text-xl md:text-2xl font-semibold text-[#B5850A]">
            Africa&apos;s Premier Agricultural Investment Platform
          </p>
          <p className="mt-4 text-sm text-gray-400">Powered by Sahel AgriConnect</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/afri-yield/register')}
              className="inline-flex w-full sm:w-auto justify-center rounded-lg bg-[#B5850A] px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#9a7109]"
            >
              Register as Investor
            </button>
            <button
              type="button"
              onClick={() => navigate('/afri-yield/opportunities')}
              className="inline-flex w-full sm:w-auto justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-bold text-white transition hover:bg-white/10"
            >
              View Opportunities
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#152e24] border-y border-[#1a3c2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center">
            {[
              { title: '2 Focus Commodities', sub: 'Shea Butter & Sesame' },
              { title: 'Bi-Annual Payouts', sub: 'Every 6 Months' },
              { title: 'USDA/EU Certified', sub: 'Supply Chain Verified' },
              { title: 'Pan-African', sub: 'Open to All African Markets' },
            ].map(({ title, sub }) => (
              <div key={title} className="px-2">
                <p className="text-white font-bold text-base md:text-lg">{title}</p>
                <p className="mt-1 text-sm text-white/80">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-container">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: 1,
              title: 'Register as Investor',
              text: 'Create your free investor profile',
            },
            {
              step: 2,
              title: 'Browse Opportunities',
              text: 'Filter by commodity, track, and region',
            },
            {
              step: 3,
              title: 'Schedule a Meeting',
              text: 'One-on-one with transformation center operators',
            },
            {
              step: 4,
              title: 'Invest & Earn',
              text: 'Deploy capital, receive bi-annual ROI payouts',
            },
          ].map(({ step, title, text }) => (
            <div key={step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#B5850A] text-brand-forest font-extrabold text-xl shadow-md">
                {step}
              </div>
              <h3 className="mt-4 text-lg font-bold text-brand-forest">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Investment Tracks */}
      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">Investment Tracks</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="bg-[#1a3c2e] px-6 py-4">
              <h3 className="text-xl font-extrabold text-white">Track A — Operations Investment</h3>
            </div>
            <div className="p-6 space-y-4 text-gray-700">
              <p>
                Fund the purchase of agro-processing equipment, packaging lines, cold storage, and irrigation
                infrastructure for verified transformation centers
              </p>
              <div>
                <p className="font-semibold text-brand-forest mb-2">Key features</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Asset-backed investment</li>
                  <li>Tied to physical equipment</li>
                  <li>Rental income from farmer usage</li>
                  <li>Bi-annual ROI payouts</li>
                  <li>Milestone-based disbursements</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-brand-forest mb-1">Ideal for</p>
                <p className="text-sm">
                  First-time African agri-investors, diaspora members, risk-conscious investors
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/afri-yield/register')}
                className="inline-flex w-full justify-center rounded-lg bg-[#1a3c2e] px-5 py-3 font-bold text-white transition hover:bg-[#152e24]"
              >
                Invest in Track A
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="bg-[#B5850A] px-6 py-4">
              <h3 className="text-xl font-extrabold text-white">Track B — Brand &amp; Market Investment</h3>
            </div>
            <div className="p-6 space-y-4 text-gray-700">
              <p>
                Fund the export branding, packaging design, international distribution, and market entry for certified
                African agricultural products
              </p>
              <div>
                <p className="font-semibold text-brand-forest mb-2">Key features</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Long-term brand equity</li>
                  <li>Revenue-sharing on product sales</li>
                  <li>AfriYield Exchange marketplace listing</li>
                  <li>Buyer introductions included</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-brand-forest mb-1">Ideal for</p>
                <p className="text-sm">Experienced investors, brand builders, consumer goods professionals</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/afri-yield/register')}
                className="inline-flex w-full justify-center rounded-lg bg-[#B5850A] px-5 py-3 font-bold text-white transition hover:bg-[#9a7109]"
              >
                Invest in Track B
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Commodities */}
      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">Featured Commodities</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#1a3c2e]/20 bg-white p-8 shadow-lg">
            <span className="inline-block rounded-full bg-[#B5850A]/15 px-3 py-1 text-xs font-bold text-[#9a7109]">
              High Demand Export Crop
            </span>
            <h3 className="mt-4 text-2xl font-extrabold text-brand-forest">Shea Butter</h3>
            <p className="mt-3 text-gray-700">
              West African shea butter is one of the most sought-after natural fats globally, used in cosmetics, food
              manufacturing, and pharmaceuticals. AfriYield Exchange connects investors directly to certified shea
              cooperatives and transformation centers.
            </p>
            <div className="mt-4 rounded-xl bg-brand-cream/80 p-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-brand-forest">Key stats:</span> Global market size $2.7B+, Primary
                buyers: EU, USA, Japan, Certification: USDA/EU Organic available
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/afri-yield/opportunities')}
              className="mt-6 inline-flex rounded-lg bg-[#1a3c2e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#152e24]"
            >
              View Shea Opportunities
            </button>
          </div>

          <div className="rounded-2xl border-2 border-[#1a3c2e]/20 bg-white p-8 shadow-lg">
            <span className="inline-block rounded-full bg-[#B5850A]/15 px-3 py-1 text-xs font-bold text-[#9a7109]">
              Premium Oilseed
            </span>
            <h3 className="mt-4 text-2xl font-extrabold text-brand-forest">Sesame</h3>
            <p className="mt-3 text-gray-700">
              African sesame is prized for its high oil content and clean flavor profile. Major importers include Japan,
              China, and the EU. AfriYield Exchange provides a certified, traceable supply chain from West African
              producers to global buyers.
            </p>
            <div className="mt-4 rounded-xl bg-brand-cream/80 p-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-brand-forest">Key stats:</span> Global market size $7B+, Primary
                buyers: Japan, China, EU, Certification: USDA/EU standards available
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/afri-yield/opportunities')}
              className="mt-6 inline-flex rounded-lg bg-[#1a3c2e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#152e24]"
            >
              View Sesame Opportunities
            </button>
          </div>
        </div>
      </section>

      {/* Why AfriYield Exchange */}
      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">Why AfriYield Exchange</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="card border border-gray-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-iconBg">
              <Shield className="h-7 w-7 text-brand-forest" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-brand-forest">Verified Supply Chain</h3>
            <p className="mt-2 text-gray-600">
              Every transformation center and cooperative is registered and verified through Sahel AgriConnect before
              appearing on AfriYield Exchange
            </p>
          </div>
          <div className="card border border-gray-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-iconBg">
              <TrendingUp className="h-7 w-7 text-brand-forest" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-brand-forest">Structured Returns</h3>
            <p className="mt-2 text-gray-600">
              Bi-annual ROI payouts with transparent reporting. Track A is asset-backed. Track B is revenue-share.
            </p>
          </div>
          <div className="card border border-gray-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-iconBg">
              <Globe className="h-7 w-7 text-brand-forest" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-brand-forest">Pan-African Reach</h3>
            <p className="mt-2 text-gray-600">
              Producers from across West Africa and beyond. One platform, one investment process, continental scale.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">Investor Stories</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              quote:
                "Investing in Track A gave me direct connection to the shea supply chain I'd been looking for. The verification process gave me confidence.",
              name: 'Aminata D.',
              place: 'Paris, France',
            },
            {
              quote:
                'AfriYield Exchange is the bridge I needed between my capital and African agriculture. Simple, transparent, impactful.',
              name: 'Kwame A.',
              place: 'London, UK',
            },
            {
              quote:
                'As a second-generation Malian in the US, this platform lets me invest in the communities my family came from.',
              name: 'Ibrahim C.',
              place: 'Atlanta, USA',
            },
          ].map((t) => (
            <blockquote key={t.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <p className="text-gray-700 italic">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-semibold text-brand-forest">
                — {t.name}
                <span className="block font-normal text-gray-500">{t.place}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#1a3c2e] py-16">
        <div className="section-container text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Ready to Invest in Africa&apos;s Agricultural Future?</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/85">
            Join hundreds of diaspora investors building generational wealth through African agriculture.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/afri-yield/register')}
              className="inline-flex w-full sm:w-auto justify-center rounded-lg bg-[#B5850A] px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#9a7109]"
            >
              Register as Investor
            </button>
            <Link
              to="/contact"
              className="inline-flex w-full sm:w-auto justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-bold text-white transition hover:bg-white/10"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
