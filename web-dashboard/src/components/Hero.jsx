import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react';

const Hero = () => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistDone, setWaitlistDone] = useState(false);

  const scrollToWaitlist = () => {
    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-forest via-primary-lightgreen to-brand-sage text-white py-20 md:py-32">
      <div className="section-container py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">

          {/* Brand icon */}
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Sprout className="h-9 w-9 text-brand-cream" aria-hidden />
          </div>

          {/* LINE 1 — Primary headline: the tagline IS the brand */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold italic tracking-wide text-brand-amber mb-6">
            {t('home.hero.tagline')}
          </h1>

          {/* LINE 2 — Single inclusive supporting statement */}
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            {t('home.hero.lead')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              to="/cooperative-registration"
              className="inline-flex items-center justify-center rounded-lg bg-brand-cream px-8 py-3.5 font-semibold text-brand-forest shadow-lg transition hover:bg-white text-base"
            >
              {t('home.hero.joinCooperative')}
            </Link>
            <button
              type="button"
              onClick={scrollToWaitlist}
              className="inline-flex items-center justify-center rounded-lg bg-brand-amber px-8 py-3.5 font-semibold text-brand-forest shadow-lg transition hover:bg-brand-amberDeep text-base"
            >
              {t('home.hero.downloadAppSoon')}
            </button>
          </div>

          {/* Waitlist form */}
          <div id="waitlist-form" className="max-w-md mx-auto">
            <p className="text-white/70 text-sm text-center mb-3">
              {isFr
                ? "📱 Soyez notifié au lancement de l'application mobile"
                : '📱 Get notified when the mobile app launches'}
            </p>
            {waitlistDone ? (
              <p className="text-green-300 font-semibold text-center">
                ✓{' '}
                {isFr
                  ? 'Merci\u00a0! Vous serez notifié au lancement.'
                  : 'Thank you! You will be notified at launch.'}
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: waitlistEmail, source: 'hero_waitlist' }),
                    });
                  } catch {}
                  setWaitlistDone(true);
                  setWaitlistEmail('');
                }}
                className="flex gap-2"
              >
                <input
                  name="email"
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
                  className="flex-1 rounded-lg px-4 py-2.5 text-brand-forest text-sm outline-none"
                />
                <button
                  type="submit"
                  className="bg-brand-amber text-brand-forest font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-brand-amberDeep transition"
                >
                  {isFr ? "S'inscrire" : 'Notify me'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
