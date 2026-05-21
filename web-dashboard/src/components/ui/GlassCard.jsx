export function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  style = {},
  onClick,
}) {
  const variants = {
    default: 'glass-card',
    strong: 'glass-card-strong',
    gold: 'glass-card-gold',
    green: 'glass-card-green',
  };

  return (
    <div
      className={`${variants[variant]} ${hover ? 'hover:scale-[1.02] transition-transform duration-200' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
