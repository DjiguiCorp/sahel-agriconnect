import { Link } from 'react-router-dom';

const SECTION_BACKGROUNDS = {
  meshLight:
    'bg-brand-cream relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_90%_60%_at_0%_0%,rgba(82,183,136,0.14),transparent),radial-gradient(ellipse_70%_50%_at_100%_10%,rgba(233,196,106,0.12),transparent),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(27,67,50,0.06),transparent)]',
  meshWhite:
    'bg-white relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_55%_at_100%_0%,rgba(82,183,136,0.1),transparent),radial-gradient(ellipse_60%_45%_at_0%_100%,rgba(233,196,106,0.08),transparent)]',
  meshWarm:
    'bg-[#f3efe4] relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_75%_50%_at_20%_0%,rgba(181,133,10,0.1),transparent),radial-gradient(ellipse_60%_40%_at_90%_80%,rgba(27,67,50,0.08),transparent)]',
  forest:
    'bg-gradient-to-br from-[#143326] via-brand-forest to-[#1d5240] relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_60%_50%_at_80%_0%,rgba(233,196,106,0.12),transparent)]',
};

const ICON_GRADIENTS = [
  'from-emerald-500/90 to-brand-forest',
  'from-teal-500/90 to-brand-forest',
  'from-sky-500/80 to-brand-forest',
  'from-amber-400/90 to-brand-amberDeep',
  'from-lime-500/80 to-brand-forest',
  'from-violet-500/70 to-brand-forest',
];

export function HomeSection({
  variant = 'meshLight',
  id,
  className = '',
  children,
  eyebrow,
  title,
  subtitle,
  titleClassName = 'text-brand-forest',
  subtitleClassName = 'text-gray-600',
  align = 'center',
}) {
  const bg = SECTION_BACKGROUNDS[variant] || SECTION_BACKGROUNDS.meshLight;
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <section id={id} className={`py-16 md:py-24 lg:py-28 ${bg} ${className}`}>
      <div className="section-container relative z-10">
        {(eyebrow || title || subtitle) && (
          <header className={`mb-12 md:mb-16 max-w-3xl ${alignClass}`}>
            {eyebrow ? (
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-forest/10 bg-white/50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-forest/80 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" aria-hidden />
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className={`text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-tight ${titleClassName}`}
              >
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className={`mt-4 text-base md:text-lg leading-relaxed ${subtitleClassName}`}>{subtitle}</p>
            ) : null}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  padding = 'p-6 md:p-8',
  as: Tag = 'div',
  ...rest
}) {
  return (
    <Tag
      className={`group relative overflow-hidden rounded-2xl border border-white/70 bg-white/40 shadow-[0_8px_40px_rgba(27,67,50,0.07)] backdrop-blur-xl ${padding} ${
        hover
          ? 'transition duration-300 hover:-translate-y-1 hover:border-white/90 hover:bg-white/55 hover:shadow-[0_16px_48px_rgba(27,67,50,0.12)]'
          : ''
      } ${className}`}
      {...rest}
    >
      <GlassSheen />
      <div className="relative z-[1]">{children}</div>
    </Tag>
  );
}

function GlassSheen() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-brand-sage/5 opacity-80"
      aria-hidden
    />
  );
}

export function GlassFeatureCard({ icon: Icon, title, description, index = 0, className = '' }) {
  const gradient = ICON_GRADIENTS[index % ICON_GRADIENTS.length];

  return (
    <GlassCard className={className}>
      <div className="mb-5 flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-brand-forest/15`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="min-w-0 pt-2 text-lg font-semibold text-brand-forest">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-gray-600 md:text-[0.95rem]">{description}</p>
    </GlassCard>
  );
}

export function GlassEmojiFeature({ icon, title, description, className = '' }) {
  return (
    <GlassCard className={`flex gap-4 !p-5 md:!p-6 ${className}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/60 text-xl backdrop-blur-sm">
        {icon}
      </span>
      <div>
        <h3 className="mb-1 text-sm font-bold text-brand-forest">{title}</h3>
        <p className="text-xs leading-relaxed text-gray-600 md:text-sm">{description}</p>
      </div>
    </GlassCard>
  );
}

export function GlassPartnerCard({ monogram, title, description, badge, accent = 'forest' }) {
  const monogramBg =
    accent === 'amber'
      ? 'bg-gradient-to-br from-brand-amber to-brand-amberDeep'
      : 'bg-gradient-to-br from-brand-forest to-[#2d5a45]';

  return (
    <GlassCard className="flex flex-col items-center text-center !p-8">
      <span
        className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${monogramBg} text-xl font-bold text-white shadow-lg`}
      >
        {monogram}
      </span>
      <h3 className="text-lg font-bold text-brand-forest">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
      {badge ? (
        <span className="mt-5 inline-flex rounded-full border border-brand-amber/30 bg-brand-amber/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-forest">
          {badge}
        </span>
      ) : null}
    </GlassCard>
  );
}

export function GlassRoleCard({ emoji, title, description, to }) {
  return (
    <GlassCard as={Link} to={to} className="flex flex-col items-center text-center !p-6 md:!p-7">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br from-white/80 to-brand-iconBg/80 text-3xl shadow-inner">
        {emoji}
      </span>
      <h3 className="font-bold text-brand-forest">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-gray-600">{description}</p>
    </GlassCard>
  );
}

export function GlassStat({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/15 bg-white/10 px-4 py-6 text-center backdrop-blur-md">
      <span className="mb-2 text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="text-3xl font-bold text-brand-amber">{value}</span>
      <span className="mt-2 text-xs leading-snug text-gray-300">{label}</span>
    </div>
  );
}

export function GlassDarkCard({ icon, title, description }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl transition duration-300 hover:border-brand-amber/40 hover:bg-white/15">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-amber/10 blur-2xl transition group-hover:bg-brand-amber/20"
        aria-hidden
      />
      <span className="relative mb-3 block text-2xl">{icon}</span>
      <h3 className="relative text-lg font-bold text-white">{title}</h3>
      <p className="relative mt-2 text-xs leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

export function GlassCtaPanel({ variant, eyebrow, title, description, children }) {
  const isForest = variant === 'forest';
  const shell = isForest
    ? 'bg-gradient-to-br from-brand-forest/95 to-[#143326] text-white'
    : 'bg-gradient-to-br from-brand-amber/95 to-brand-amberDeep text-brand-forest';

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/20 p-8 md:p-10 backdrop-blur-sm ${shell}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="relative">
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isForest ? 'text-brand-amber' : 'text-brand-forest/70'}`}
        >
          {eyebrow}
        </span>
        <h3 className="mt-3 text-2xl font-bold">{title}</h3>
        <p className={`mt-3 text-sm leading-relaxed ${isForest ? 'text-gray-300' : 'text-brand-forest/80'}`}>
          {description}
        </p>
      </div>
      <div className="relative mt-8 flex flex-col gap-3">{children}</div>
    </div>
  );
}
