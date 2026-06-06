import { Smartphone } from 'lucide-react';

const PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.sahelagriconnect.app';
const APP_STORE = 'https://apps.apple.com/us/search?term=Sahel%20AgriConnect';

/**
 * Glassmorphism app download card — homepage hero & help center.
 */
export default function DownloadAppBanner({ isFr = false, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-5 md:p-6 transition-all duration-300 hover:shadow-[0_0_40px_rgba(181,133,10,0.15)] ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(181,133,10,0.45)',
        boxShadow: '0 0 32px rgba(181,133,10,0.08)',
      }}
    >
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
        <div className="text-center lg:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B5850A]">
            Mobile
          </p>
          <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">
            {isFr ? 'Téléchargez Sahel AgriConnect' : 'Download Sahel AgriConnect'}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {isFr
              ? 'Disponible sur Google Play et l\'App Store'
              : 'Available on Google Play & App Store'}
          </p>
        </div>
        <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 lg:flex">
          <Smartphone className="h-10 w-10 text-[#B5850A]/60" aria-hidden />
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <StoreButton
            href={PLAY_STORE}
            type="play"
            label={isFr ? 'Google Play' : 'Google Play'}
          />
          <StoreButton
            href={APP_STORE}
            type="apple"
            label={isFr ? 'App Store' : 'App Store'}
          />
        </div>
      </div>
    </div>
  );
}

function StoreButton({ href, type, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-[190px] items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 font-semibold text-gray-900 shadow-lg transition hover:shadow-[0_0_24px_rgba(29,158,117,0.35)]"
    >
      {type === 'play' ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
          <path fill="#4285F4" d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" />
          <path fill="#34A853" d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" />
          <path fill="#FBBC04" d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L16.81 15.12L14.54 12.85L16.81 10.58L20.16 10.81Z" />
          <path fill="#EA4335" d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-current" aria-hidden>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      )}
      <span className="text-left text-xs leading-tight">
        {type === 'play' ? 'GET IT ON' : 'Download on the'}
        <br />
        <span className="text-sm font-bold">{label}</span>
      </span>
    </a>
  );
}
