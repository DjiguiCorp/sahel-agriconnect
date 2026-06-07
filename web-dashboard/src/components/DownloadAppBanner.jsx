import { Smartphone } from 'lucide-react';

const PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.sahelagriconnect.app';
const APP_STORE = 'https://apps.apple.com/us/search?term=Sahel%20AgriConnect';

/**
 * Compact glass download strip for the homepage hero.
 */
export default function DownloadAppBanner({ isFr = false, className = '' }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 transition-all duration-300 hover:shadow-[0_0_28px_rgba(181,133,10,0.12)] sm:px-5 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(181,133,10,0.38)',
        boxShadow: '0 0 20px rgba(181,133,10,0.06)',
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: 'rgba(181,133,10,0.1)',
              border: '1px solid rgba(181,133,10,0.25)',
            }}
          >
            <Smartphone className="h-4 w-4 text-[#B5850A]" aria-hidden />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#B5850A]">
              {isFr ? 'Application mobile' : 'Mobile app'}
            </p>
            <p className="text-sm font-semibold leading-tight text-white">
              {isFr ? 'Téléchargez Sahel AgriConnect' : 'Download Sahel AgriConnect'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <StoreButton href={PLAY_STORE} type="play" isFr={isFr} />
          <StoreButton href={APP_STORE} type="apple" isFr={isFr} />
        </div>
      </div>
    </div>
  );
}

function StoreButton({ href, type, isFr }) {
  const playTop = isFr ? 'DISPONIBLE SUR' : 'GET IT ON';
  const appleTop = isFr ? "Télécharger sur l'" : 'Download on the';
  const storeName = type === 'play' ? 'Google Play' : 'App Store';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-[148px] items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-gray-900 shadow-md transition hover:bg-white hover:shadow-[0_0_16px_rgba(29,158,117,0.3)]"
    >
      {type === 'play' ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
          <path fill="#4285F4" d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" />
          <path fill="#34A853" d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" />
          <path fill="#FBBC04" d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L16.81 15.12L14.54 12.85L16.81 10.58L20.16 10.81Z" />
          <path fill="#EA4335" d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      )}
      <span className="text-left leading-none">
        <span className="block text-[9px] font-medium uppercase tracking-wide opacity-80">
          {type === 'play' ? playTop : appleTop}
        </span>
        <span className="block text-xs font-bold">{storeName}</span>
      </span>
    </a>
  );
}
