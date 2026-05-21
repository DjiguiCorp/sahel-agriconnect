export function GradientSection({
  children,
  variant = 'primary',
  className = '',
  id,
}) {
  const backgrounds = {
    primary: `
      radial-gradient(ellipse 100% 60% at 50% 0%,
        rgba(26,92,53,0.5) 0%, transparent 70%)`,
    features: `
      radial-gradient(ellipse 80% 50% at 0% 50%,
        rgba(26,60,30,0.4) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 100% 50%,
        rgba(181,133,10,0.08) 0%, transparent 50%)`,
    investment: `
      radial-gradient(ellipse 100% 70% at 50% 0%,
        rgba(13,32,64,0.8) 0%, rgba(8,13,26,0.95) 60%),
      radial-gradient(ellipse 60% 40% at 80% 30%,
        rgba(181,133,10,0.1) 0%, transparent 50%)`,
    tools: `
      radial-gradient(ellipse 80% 50% at 30% 0%,
        rgba(10,42,37,0.6) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 70% 30%,
        rgba(59,130,246,0.06) 0%, transparent 50%)`,
    government: `
      radial-gradient(ellipse 100% 60% at 50% 0%,
        rgba(10,21,53,0.8) 0%, rgba(6,10,20,0.95) 60%)`,
    cta: `
      radial-gradient(ellipse 100% 80% at 50% 100%,
        rgba(26,92,53,0.5) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 50%,
        rgba(181,133,10,0.1) 0%, transparent 50%)`,
  };

  return (
    <section
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={{ background: backgrounds[variant] || backgrounds.primary }}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
