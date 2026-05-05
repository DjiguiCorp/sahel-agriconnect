import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function InvestorDashboard() {
  const { t } = useTranslation();

  return (
    <div className="bg-brand-cream min-h-[50vh]">
      <section className="bg-[#1a3c2e] py-12">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">{t('afriYield.investorDashboard.title')}</h1>
          <p className="mt-3 text-lg text-white/85 max-w-xl mx-auto">{t('afriYield.investorDashboard.subtitle')}</p>
        </div>
      </section>
      <section className="section-container py-12">
        <div className="max-w-lg mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-md text-center">
          <p className="text-gray-700">{t('afriYield.investorDashboard.body')}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/afri-yield/opportunities"
              className="rounded-lg bg-[#B5850A] px-5 py-3 text-sm font-bold text-white hover:bg-[#9a7109] transition"
            >
              {t('afriYield.investorDashboard.viewOpportunities')}
            </Link>
            <Link
              to="/afri-yield/register"
              className="rounded-lg border-2 border-[#1a3c2e] px-5 py-3 text-sm font-bold text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition"
            >
              {t('afriYield.investorDashboard.register')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
