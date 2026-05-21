import { Link } from 'react-router-dom';

const SECTION_BACKGROUNDS = {
  roles:
    'relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_100%_60%_at_50%_100%,rgba(40,120,70,0.2)_0%,transparent_60%)]',
  features: 'py-16 section-gradient-features relative overflow-hidden',
  platform:
    'py-16 relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_60%_at_0%_50%,rgba(40,80,50,0.4)_0%,transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(181,133,10,0.06)_0%,transparent_50%)]',
  meshWarm:
    'relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_75%_50%_at_20%_0%,rgba(181,133,10,0.08)_0%,transparent_50%),radial-gradient(ellipse_60%_40%_at_90%_80%,rgba(27,67,50,0.15)_0%,transparent_50%)]',
  forest:
    'relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(20,48,96,0.75)_0%,rgba(14,22,45,0.85)_50%),radial-gradient(ellipse_60%_40%_at_80%_50%,rgba(181,133,10,0.08)_0%,transparent_50%)]',
  cta:
    'relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_100%_80%_at_50%_100%,rgba(40,120,70,0.45)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_80%_50%,rgba(181,133,10,0.1)_0%,transparent_50%)]',
};

const DARK_VARIANTS = new Set(['roles', 'features', 'platform', 'meshWarm', 'forest', 'cta']);

export function HomeSection({
  variant = 'features',
  id,
  className = '',
  children,
  eyebrow,
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  align = 'center',
}) {
  const bg = SECTION_BACKGROUNDS[variant] || SECTION_BACKGROUNDS.features;
  const isDark = DARK_VARIANTS.has(variant);
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  const titleCls = titleClassName ?? (isDark ? 'text-white' : 'text-white');
  const subtitleCls = subtitleClassName ?? (isDark ? 'text-white/60' : 'text-white/60');

  return (
    <section id={id} className={`${variant === 'features' ? '' : 'py-10 md:py-14 lg:py-16'} ${bg} ${className}`}>
      {variant === 'features' ? (
        <div className="absolute inset-0 section-gradient-features pointer-events-none" aria-hidden />
      ) : null}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 md:py-14 lg:py-16">
        {(eyebrow || title || subtitle) && (
          <header className={`mb-8 md:mb-10 max-w-3xl ${alignClass}`}>
            {eyebrow ? (
              <p
                className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-md"
                style={{
                  background: 'rgba(76,175,80,0.1)',
                  border: '1px solid rgba(76,175,80,0.25)',
                  color: '#4ade80',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-soft" aria-hidden />
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className={`text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-tight ${titleCls}`}>
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className={`mt-3 text-base leading-relaxed ${subtitleCls}`}>{subtitle}</p> : null}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function GlassFeatureCard({ icon: Icon, title, description, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center text-center p-6 glass-card hover:border-green-500/30 transition-all duration-300 hover:scale-105 group cursor-default ${className}`}
    >
      <div
        className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
        style={{ background: 'rgba(76,175,80,0.12)' }}
      >
        <Icon className="h-7 w-7" style={{ color: '#4CAF50' }} strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}

export function GlassEmojiFeature({ icon, title, description, className = '' }) {
  return (
    <div className={`glass-card p-6 flex gap-4 items-start ${className}`}>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm leading-relaxed text-white/60">{description}</p>
      </div>
    </div>
  );
}

export function GlassPartnerCard({ monogram, title, description, badge, accent = 'forest' }) {
  const cardClass = accent === 'amber' ? 'glass-card-gold' : 'glass-card';

  return (
    <div className={`${cardClass} flex flex-col items-center text-center p-6`}>
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg"
        style={{
          background:
            accent === 'amber'
              ? 'linear-gradient(135deg, #B5850A, #9a7109)'
              : 'linear-gradient(135deg, #1D9E75, #143326)',
        }}
      >
        {monogram}
      </span>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
      {badge ? (
        <span
          className="mt-4 inline-flex rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide"
          style={{
            background: 'rgba(181,133,10,0.15)',
            border: '1px solid rgba(181,133,10,0.3)',
            color: '#B5850A',
          }}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function GlassRoleCard({ emoji, title, description, to }) {
  return (
    <Link
      to={to}
      className="glass-card flex flex-col items-center text-center p-5 md:p-6 hover:border-green-500/30 transition-all duration-300 hover:scale-105 group"
    >
      <span
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-3xl"
        style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {emoji}
      </span>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-white/60">{description}</p>
      <span
        className="mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: '#4CAF50', color: '#0f2218' }}
      >
        →
      </span>
    </Link>
  );
}

export function GlassStat({ icon, value, label }) {
  return (
    <div className="glass-card flex flex-col items-center p-4 md:p-5 text-center">
      <span className="mb-2 text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="text-3xl font-bold text-gradient">{value}</span>
      <span className="mt-2 text-xs leading-snug text-white/50">{label}</span>
    </div>
  );
}

export function GlassDarkCard({ icon, title, description }) {
  return (
    <div className="glass-card p-5 transition duration-300 hover:border-amber-500/30">
      <span className="mb-3 block text-2xl">{icon}</span>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-white/60">{description}</p>
    </div>
  );
}

export function GlassCtaPanel({ variant, eyebrow, title, description, children }) {
  const isForest = variant === 'forest';

  return (
    <div
      className="glass-card-strong relative flex flex-col justify-between overflow-hidden p-6 md:p-8"
      style={
        isForest
          ? {
              background:
                'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(20,48,96,0.6) 0%, rgba(14,22,45,0.4) 100%)',
              borderColor: 'rgba(59,130,246,0.2)',
            }
          : {
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(181,133,10,0.15) 0%, transparent 70%)',
              borderColor: 'rgba(181,133,10,0.25)',
            }
      }
    >
      <div className="relative">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: isForest ? '#60a5fa' : '#B5850A' }}
        >
          {eyebrow}
        </span>
        <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
      </div>
      <div className="relative mt-6 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}
