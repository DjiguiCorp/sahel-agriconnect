import { Link } from 'react-router-dom';

export default function AfriYieldExchange() {
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
        </div>
      </section>

      {/* Stats */}
      <section className="section-container">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            '2 Focus Commodities',
            'Bi-Annual ROI Payouts',
            'USDA/EU Certified Supply Chain',
          ].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-md"
            >
              <p className="text-lg font-bold text-brand-forest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Investment tracks */}
      <section className="section-container pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-brand-forest">Track A — Operations Investment</h2>
            <p className="mt-3 text-gray-600">
              Asset-backed equipment and operations financing with structured returns tied to rental income and
              production milestones.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-brand-forest">Track B — Brand &amp; Market Investment</h2>
            <p className="mt-3 text-gray-600">
              Growth capital for branding, certification uplift, and buyer-facing marketplace acceleration on AfriYield
              Exchange.
            </p>
          </div>
        </div>
      </section>

      {/* Commodities */}
      <section className="section-container pt-0 pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border-2 border-[#1a3c2e]/20 bg-white p-8 shadow-md">
            <h3 className="text-2xl font-bold text-brand-forest">Shea Butter</h3>
            <p className="mt-2 text-gray-600">High-value forest crop with strong export demand and traceable supply.</p>
            <Link
              to="/afri-yield/opportunities"
              className="mt-6 inline-flex rounded-lg bg-[#1a3c2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#152e24]"
            >
              View Opportunities
            </Link>
          </div>
          <div className="rounded-xl border-2 border-[#1a3c2e]/20 bg-white p-8 shadow-md">
            <h3 className="text-2xl font-bold text-brand-forest">Sesame</h3>
            <p className="mt-2 text-gray-600">
              Premium oilseed with international buyers and standardized grading for marketplace listings.
            </p>
            <Link
              to="/afri-yield/opportunities"
              className="mt-6 inline-flex rounded-lg bg-[#1a3c2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#152e24]"
            >
              View Opportunities
            </Link>
          </div>
        </div>
      </section>

      {/* Register CTA */}
      <section className="section-container pb-20 pt-0 text-center">
        <Link
          to="/afri-yield/register"
          className="inline-flex rounded-lg bg-[#B5850A] px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#9a7109]"
        >
          Register as Investor
        </Link>
      </section>
    </div>
  );
}
