import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, TrendingUp, Globe } from 'lucide-react';

export default function AfriYieldExchange() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const stats = useMemo(
    () => [
      { title: t('afriYield.statsLabel1'), sub: t('afriYield.statsSub1') },
      { title: t('afriYield.statsLabel2'), sub: t('afriYield.statsSub2') },
      { title: t('afriYield.statsLabel3'), sub: t('afriYield.statsSub3') },
      { title: t('afriYield.statsLabel4'), sub: t('afriYield.statsSub4') },
    ],
    [t]
  );

  const steps = useMemo(
    () => [
      { step: 1, title: t('afriYield.step1Title'), text: t('afriYield.step1Text') },
      { step: 2, title: t('afriYield.step2Title'), text: t('afriYield.step2Text') },
      { step: 3, title: t('afriYield.step3Title'), text: t('afriYield.step3Text') },
      { step: 4, title: t('afriYield.step4Title'), text: t('afriYield.step4Text') },
    ],
    [t]
  );

  const testimonials = useMemo(
    () => [
      { quote: t('afriYield.quote1'), name: 'Aminata D.', place: 'Paris, France' },
      { quote: t('afriYield.quote2'), name: 'Kwame A.', place: 'London, UK' },
      { quote: t('afriYield.quote3'), name: 'Ibrahim C.', place: 'Atlanta, USA' },
    ],
    [t]
  );

  return (
    <div className="bg-brand-cream">
      <section className="bg-[#1a3c2e]">
        <div className="section-container py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">{t('afriYield.title')}</h1>
          <p className="mt-5 text-xl md:text-2xl font-semibold text-[#B5850A]">{t('afriYield.subtitle')}</p>
          <p className="mt-4 text-sm text-gray-400">{t('afriYield.tagline')}</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/afri-yield/register')}
              className="inline-flex w-full sm:w-auto justify-center rounded-lg bg-[#B5850A] px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#9a7109]"
            >
              {t('afriYield.registerAsInvestor')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/afri-yield/opportunities')}
              className="inline-flex w-full sm:w-auto justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-bold text-white transition hover:bg-white/10"
            >
              {t('afriYield.viewOpportunities')}
            </button>
          </div>
          <div className="mt-5">
            <Link
              to="/how-it-works"
              className="text-white/60 hover:text-white text-sm underline underline-offset-2 transition"
            >
              {i18n.language === 'fr' ? 'Comment ça fonctionne →' : 'How it works →'}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#152e24] border-y border-[#1a3c2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center">
            {stats.map(({ title, sub }) => (
              <div key={title} className="px-2">
                <p className="text-white font-bold text-base md:text-lg">{title}</p>
                <p className="mt-1 text-sm text-white/80">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">{t('afriYield.howItWorksTitle')}</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ step, title, text }) => (
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

      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">{t('afriYield.investmentTracksTitle')}</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="bg-[#1a3c2e] px-6 py-4">
              <h3 className="text-xl font-extrabold text-white">{t('afriYield.trackA')}</h3>
            </div>
            <div className="p-6 space-y-4 text-gray-700">
              <p>{t('afriYield.trackABody')}</p>
              <div>
                <p className="font-semibold text-brand-forest mb-2">{t('afriYield.keyFeatures')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>{t('afriYield.trackAFeature1')}</li>
                  <li>{t('afriYield.trackAFeature2')}</li>
                  <li>{t('afriYield.trackAFeature3')}</li>
                  <li>{t('afriYield.trackAFeature4')}</li>
                  <li>{t('afriYield.trackAFeature5')}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-brand-forest mb-1">{t('afriYield.idealFor')}</p>
                <p className="text-sm">{t('afriYield.trackAIdeal')}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/afri-yield/register')}
                className="inline-flex w-full justify-center rounded-lg bg-[#1a3c2e] px-5 py-3 font-bold text-white transition hover:bg-[#152e24]"
              >
                {t('afriYield.investTrackA')}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="bg-[#B5850A] px-6 py-4">
              <h3 className="text-xl font-extrabold text-white">{t('afriYield.trackB')}</h3>
            </div>
            <div className="p-6 space-y-4 text-gray-700">
              <p>{t('afriYield.trackBBody')}</p>
              <div>
                <p className="font-semibold text-brand-forest mb-2">{t('afriYield.keyFeatures')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>{t('afriYield.trackBFeature1')}</li>
                  <li>{t('afriYield.trackBFeature2')}</li>
                  <li>{t('afriYield.trackBFeature3')}</li>
                  <li>{t('afriYield.trackBFeature4')}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-brand-forest mb-1">{t('afriYield.idealFor')}</p>
                <p className="text-sm">{t('afriYield.trackBIdeal')}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/afri-yield/register')}
                className="inline-flex w-full justify-center rounded-lg bg-[#B5850A] px-5 py-3 font-bold text-white transition hover:bg-[#9a7109]"
              >
                {t('afriYield.investTrackB')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">{t('afriYield.featuredCommoditiesTitle')}</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#1a3c2e]/20 bg-white p-8 shadow-lg">
            <span className="inline-block rounded-full bg-[#B5850A]/15 px-3 py-1 text-xs font-bold text-[#9a7109]">
              {t('afriYield.sheaBadge')}
            </span>
            <h3 className="mt-4 text-2xl font-extrabold text-brand-forest">{t('afriYield.sheaButter')}</h3>
            <p className="mt-3 text-gray-700">{t('afriYield.sheaBody')}</p>
            <div className="mt-4 rounded-xl bg-brand-cream/80 p-4 text-sm text-gray-700">
              <p>{t('afriYield.sheaStats')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/afri-yield/opportunities')}
              className="mt-6 inline-flex rounded-lg bg-[#1a3c2e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#152e24]"
            >
              {t('afriYield.viewSheaOpportunities')}
            </button>
          </div>

          <div className="rounded-2xl border-2 border-[#1a3c2e]/20 bg-white p-8 shadow-lg">
            <span className="inline-block rounded-full bg-[#B5850A]/15 px-3 py-1 text-xs font-bold text-[#9a7109]">
              {t('afriYield.sesameBadge')}
            </span>
            <h3 className="mt-4 text-2xl font-extrabold text-brand-forest">{t('afriYield.sesame')}</h3>
            <p className="mt-3 text-gray-700">{t('afriYield.sesameBody')}</p>
            <div className="mt-4 rounded-xl bg-brand-cream/80 p-4 text-sm text-gray-700">
              <p>{t('afriYield.sesameStats')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/afri-yield/opportunities')}
              className="mt-6 inline-flex rounded-lg bg-[#1a3c2e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#152e24]"
            >
              {t('afriYield.viewSesameOpportunities')}
            </button>
          </div>
        </div>
      </section>

      <section className="section-container pt-0">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest">Acheteurs &amp; Importateurs</h2>
          <p className="mt-3 text-gray-700 max-w-2xl mx-auto">Vous cherchez à vous approvisionner, pas à investir? Visitez notre marketplace.</p>
        </div>
        <div className="rounded-2xl border-2 border-[#B5850A] bg-white p-8 shadow-lg max-w-4xl mx-auto">
          <h3 className="text-2xl font-extrabold text-brand-forest">Marketplace Commodités</h3>
          <p className="mt-3 text-gray-700">
            Parcourez les producteurs certifiés, demandez des devis, et approvisionnez votre entreprise directement.
          </p>
          <div className="mt-6">
            <Link
              to="/afri-yield/marketplace"
              className="inline-flex items-center justify-center rounded-lg bg-[#B5850A] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#9a7109] transition"
            >
              Accéder à la Marketplace →
            </Link>
          </div>
        </div>
      </section>

      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">{t('afriYield.whyTitle')}</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="card border border-gray-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-iconBg">
              <Shield className="h-7 w-7 text-brand-forest" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-brand-forest">{t('afriYield.whyVerifiedTitle')}</h3>
            <p className="mt-2 text-gray-600">{t('afriYield.whyVerifiedBody')}</p>
          </div>
          <div className="card border border-gray-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-iconBg">
              <TrendingUp className="h-7 w-7 text-brand-forest" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-brand-forest">{t('afriYield.whyReturnsTitle')}</h3>
            <p className="mt-2 text-gray-600">{t('afriYield.whyReturnsBody')}</p>
          </div>
          <div className="card border border-gray-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-iconBg">
              <Globe className="h-7 w-7 text-brand-forest" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-brand-forest">{t('afriYield.whyReachTitle')}</h3>
            <p className="mt-2 text-gray-600">{t('afriYield.whyReachBody')}</p>
          </div>
        </div>
      </section>

      <section className="section-container pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest text-center mb-10">{t('afriYield.storiesTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((story) => (
            <blockquote key={story.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <p className="text-gray-700 italic">&ldquo;{story.quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-semibold text-brand-forest">
                — {story.name}
                <span className="block font-normal text-gray-500">{story.place}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="bg-[#1a3c2e] py-16">
        <div className="section-container text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">{t('afriYield.ctaTitle')}</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/85">{t('afriYield.ctaSubtitle')}</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {localStorage.getItem('afriyield_investor_email') ? (
              <Link
                to="/afri-yield/portal"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl px-8 py-4 font-bold text-[#0d1f17] text-lg shadow-lg"
                style={{ background: '#B5850A' }}
              >
                🌾 Access My Portfolio →
              </Link>
            ) : (
              <Link
                to="/afri-yield/register"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl px-8 py-4 font-bold text-[#0d1f17] text-lg shadow-lg"
                style={{ background: '#B5850A' }}
              >
                Register as Investor →
              </Link>
            )}
            <Link
              to="/contact"
              className="inline-flex w-full sm:w-auto justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-bold text-white transition hover:bg-white/10"
            >
              {t('afriYield.scheduleDemo')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
