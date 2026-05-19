import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Smartphone } from 'lucide-react';

const PLAY_URL = import.meta.env.VITE_PLAY_STORE_URL || '';
const IOS_URL = import.meta.env.VITE_APP_STORE_URL || '';

function StoreButton({ href, label, variant }) {
  const base =
    'inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lg sm:max-w-[220px]';
  const styles =
    variant === 'dark'
      ? 'bg-[#1a1a1a] text-white border border-white/10 hover:bg-black'
      : 'bg-white text-brand-forest hover:bg-brand-cream';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${styles}`}>
        {label}
      </a>
    );
  }

  return <span className={`${base} ${styles}`}>{label}</span>;
}

function HeroBackdrop() {
  return (
    <>
      <MotionBackdropGradient />
      <HeroBackdropOrbs />
      <HeroBackdropGrid />
    </>
  );
}

function MotionBackdropGradient() {
  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-brand-forest via-[#1d4f3c] to-brand-sage"
      aria-hidden
    />
  );
}

function HeroBackdropOrbs() {
  return (
    <>
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-amber/20 blur-3xl animate-hero-float"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-hero-float-delayed"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-brand-sage/25 blur-2xl animate-hero-pulse"
        aria-hidden
      />
    </>
  );
}

function HeroBackdropGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
      aria-hidden
    />
  );
}

const Hero = () => {
  const { t } = useTranslation();

  const stats = [
    { value: '54+', label: t('home.hero.statCountries') },
    { value: '→', label: t('home.hero.statChain') },
    { value: 'AY', label: t('home.hero.statInvest') },
  ];

  return (
    <section className="relative overflow-hidden text-white" aria-labelledby="hero-heading">
      <HeroBackdrop />

      <div className="section-container relative z-10 py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-amber animate-hero-pulse" aria-hidden />
            {t('home.hero.badge')}
          </p>

          <HeroIcon />

          <h1
            id="hero-heading"
            className="mb-6 text-4xl font-bold italic leading-tight tracking-wide text-brand-amber md:text-5xl lg:text-6xl animate-fade-up [animation-delay:120ms]"
          >
            {t('home.hero.tagline')}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-white/90 md:text-xl animate-fade-up [animation-delay:180ms]">
            {t('home.hero.lead')}
          </p>

          <HeroCta joinLabel={t('home.hero.joinCooperative')} />

          <div
            id="get-app"
            className="mx-auto mb-12 max-w-lg rounded-2xl border border-white/15 bg-black/15 p-6 backdrop-blur-md animate-fade-up [animation-delay:300ms]"
          >
            <div className="mb-4 flex items-center justify-center gap-2 text-brand-amber">
              <Smartphone className="h-5 w-5" aria-hidden />
              <h2 className="text-sm font-bold uppercase tracking-wide">{t('home.hero.appHeading')}</h2>
            </div>
            <p className="mb-5 text-sm text-white/75">{t('home.hero.appLead')}</p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <StoreButton href={PLAY_URL} label={t('home.hero.downloadAndroid')} variant="dark" />
              <StoreButton href={IOS_URL} label={t('home.hero.downloadIOS')} variant="light" />
            </div>
          </div>

          <ul
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 animate-fade-up [animation-delay:380ms]"
            aria-label={t('home.hero.statsAria')}
          >
            {stats.map(({ value, label }) => (
              <li
                key={label}
                className="min-w-[7.5rem] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center backdrop-blur-sm"
              >
                <span className="block text-lg font-bold text-brand-amber">{value}</span>
                <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-white/70">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

function HeroIcon() {
  return (
    <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md animate-fade-up [animation-delay:80ms]">
      <Sprout className="h-9 w-9 text-brand-cream" aria-hidden />
    </div>
  );
}

function HeroCta({ joinLabel }) {
  return (
    <div className="mb-14 flex justify-center animate-fade-up [animation-delay:240ms]">
      <Link
        to="/cooperative-registration"
        className="inline-flex items-center justify-center rounded-xl bg-brand-cream px-10 py-4 text-base font-semibold text-brand-forest shadow-lg transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl"
      >
        {joinLabel}
      </Link>
    </div>
  );
}

export default Hero;
