/**
 * Icône centrée dans un cercle 48×48 (palette marque).
 */
const IconCircle = ({ children, className = '', ariaHidden = true }) => (
  <span
    className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#52B788]/25 bg-[#EAF3DE] text-brand-forest [&_svg]:h-6 [&_svg]:w-6 ${className}`}
    aria-hidden={ariaHidden ? 'true' : undefined}
  >
    {children}
  </span>
);

export default IconCircle;
