import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL.replace(/\/$/, '');

export default function InvestmentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFr = localStorage.getItem('i18nextLng') === 'fr';

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/payments/stripe/investment-session/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSession(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0A1628, #1a2744)' }}
    >
      <div className="max-w-md w-full rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {isFr ? 'Investissement confirmé !' : 'Investment Confirmed!'}
        </h1>
        <p className="text-white/60 text-sm mb-6">
          {isFr
            ? 'Votre paiement a été reçu avec succès. Votre investissement sera actif dans votre portail sous 24 heures.'
            : 'Your payment was received successfully. Your investment will be active in your portal within 24 hours.'}
        </p>

        {!loading && session && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6 text-left space-y-2">
            {[
              [
                isFr ? 'Montant investi' : 'Amount invested',
                `$${(session.amountTotal || 0).toLocaleString()} USD`,
              ],
              [
                isFr ? 'Statut' : 'Status',
                session.status === 'paid'
                  ? isFr
                    ? '✅ Paiement reçu'
                    : '✅ Payment received'
                  : session.status,
              ],
              ['Email', session.customerEmail || '—'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-white/40">{l}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-white/40 text-xs mb-6">
          {isFr
            ? "Un email de confirmation avec votre contrat d'investissement vous sera envoyé dans les 24 heures."
            : 'A confirmation email with your investment agreement will be sent within 24 hours.'}
        </p>

        <Link
          to="/afri-yield/portal"
          className="block w-full py-3 rounded-xl font-bold text-black"
          style={{ backgroundColor: '#B5850A' }}
        >
          {isFr ? 'Voir mon portail investisseur' : 'View My Investor Portal'}
        </Link>
      </div>
    </div>
  );
}
