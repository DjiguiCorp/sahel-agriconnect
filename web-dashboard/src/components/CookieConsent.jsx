import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-forest border-t border-white/10 px-6 py-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/80 text-sm text-center sm:text-left">
          🍪 We use cookies for session management only.{' '}
          <Link to="/privacy-policy" className="text-brand-amber underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('cookie_consent', 'declined');
              setVisible(false);
            }}
            className="px-4 py-2 text-sm border border-white/30 rounded-lg text-white/70 hover:border-white/60 transition"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('cookie_consent', 'accepted');
              setVisible(false);
            }}
            className="px-4 py-2 text-sm bg-brand-amber text-brand-forest font-semibold rounded-lg hover:bg-brand-amberDeep transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
