import { Sprout } from 'lucide-react';

const stats = [
  { value: '500+', label: 'Agriculteurs pilotes' },
  { value: '54', label: 'Pays (Afrique)' },
  { value: '2026', label: 'Lancement' },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-forest via-primary-lightgreen to-brand-sage text-white py-16 md:py-24">
      <div className="section-container py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Sprout className="h-8 w-8 text-brand-cream" aria-hidden />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Sahel AgriConnect
          </h1>
          <p className="text-xl md:text-2xl mb-3 text-brand-cream/95 font-medium">
            Digitalisation souveraine de l&apos;agriculture
          </p>
          <p className="text-lg mb-10 text-white/90 max-w-2xl mx-auto">
            Plateforme innovante pour les petits producteurs en Afrique de l&apos;Ouest et au-delà
          </p>

          <div
            className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 max-w-3xl mx-auto border-y sm:border-y-0 border-white/20 py-6 sm:py-0"
            role="region"
            aria-label="Indicateurs clés du projet"
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                style={{ animationDelay: `${i * 0.12}s` }}
                className={`animate-fade-up flex flex-col items-center justify-center px-4 ${
                  i < stats.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-white/20 pb-6 sm:pb-0' : ''
                }`}
              >
                <span className="text-3xl md:text-4xl font-bold text-white tabular-nums">{stat.value}</span>
                <span className="text-sm text-white/75 mt-1">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#rejoindre"
              className="inline-flex items-center justify-center rounded-lg bg-brand-cream px-6 py-3 font-semibold text-brand-forest shadow-lg transition hover:bg-white"
            >
              Rejoindre le projet
            </a>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-brand-amber px-6 py-3 font-semibold text-brand-forest shadow-lg transition hover:bg-brand-amberDeep"
              onClick={() => {
                window.alert("Application mobile bientôt disponible !");
              }}
            >
              Télécharger l&apos;app
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
