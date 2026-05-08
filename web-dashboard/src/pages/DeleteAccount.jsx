import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Shield, Trash2, ArrowLeft, Check } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const API = (import.meta.env.VITE_API_BASE_URL || API_BASE_URL || '').replace(/\/$/, '');

export default function DeleteAccount() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'investor';

  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);

  const isFr = i18n.language === 'fr';
  const confirmWord = isFr ? 'SUPPRIMER' : 'DELETE';

  // Get user info from localStorage
  const investorEmail = localStorage.getItem('afriyield_investor_email');
  const investorName = localStorage.getItem('afriyield_investor_name');
  const farmerEmail = localStorage.getItem('sac_user_email');
  const farmerName = localStorage.getItem('sac_user_name');

  const userEmail = userType === 'investor' ? investorEmail : farmerEmail;
  const userName = userType === 'investor' ? investorName : farmerName;

  // Check for active investments
  const [hasActiveInvestment, setHasActiveInvestment] = useState(false);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    if (userType === 'investor' && investorEmail) {
      fetch(`${API}/api/investments/investor/${encodeURIComponent(investorEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          const active = Array.isArray(data) ? data.filter((i) => i.status === 'active') : [];
          setInvestments(active);
          setHasActiveInvestment(active.length > 0);
        })
        .catch(() => {});
    }
  }, [userType, investorEmail]);

  const submit = async () => {
    if (confirmText !== confirmWord) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/deletion-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          userName: userName || 'Unknown',
          userEmail: userEmail || 'Unknown',
          hasActiveInvestment,
          activeInvestmentIds: investments.map((i) => i._id),
          reason,
        }),
      });
      const data = await res.json();
      setResult(data);
      setDone(true);

      // Clear localStorage if no active investment
      if (!hasActiveInvestment) {
        if (userType === 'investor') {
          localStorage.removeItem('afriyield_investor_email');
          localStorage.removeItem('afriyield_investor_name');
        } else {
          localStorage.removeItem('sac_user_email');
          localStorage.removeItem('sac_user_name');
        }
        window.dispatchEvent(new Event('sac_user_updated'));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const reasons = t('accountDeletion.reasons', { returnObjects: true });
  const dataItems = t('accountDeletion.dataItems', { returnObjects: true });
  const dataKeptItems = t('accountDeletion.dataKeptItems', { returnObjects: true });
  const steps = t('accountDeletion.steps', { returnObjects: true });

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('accountDeletion.success.title')}</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {hasActiveInvestment
                ? t('accountDeletion.success.withInvestment')
                : t('accountDeletion.success.withoutInvestment')}
            </p>
            {result?.scheduledDeletionDate && (
              <div
                className="rounded-xl p-4 mb-4"
                style={{
                  background: hasActiveInvestment ? '#fee2e2' : '#f0f9f4',
                  border: `1px solid ${hasActiveInvestment ? '#fca5a5' : '#86efac'}`,
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: hasActiveInvestment ? '#991b1b' : '#166534' }}
                >
                  {hasActiveInvestment
                    ? isFr
                      ? 'Période de préavis: 6 mois'
                      : 'Notice period: 6 months'
                    : isFr
                      ? 'Suppression prévue dans 30 jours'
                      : 'Deletion scheduled in 30 days'}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: hasActiveInvestment ? '#b91c1c' : '#15803d' }}
                >
                  {isFr ? 'Date prévue:' : 'Scheduled date:'}{' '}
                  {new Date(result.scheduledDeletionDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <p className="text-gray-400 text-xs mb-6">{t('accountDeletion.success.email')}</p>
            <p className="text-gray-500 text-xs mb-4">
              {t('accountDeletion.contact')}{' '}
              <a
                href="mailto:info@djiguicorporation.org"
                className="text-[#B5850A] hover:underline"
              >
                info@djiguicorporation.org
              </a>
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: '#1a3c2e' }}
            >
              <ArrowLeft className="w-4 h-4" />
              {isFr ? "Retour à l'accueil" : 'Back to home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          to={userType === 'investor' ? '/afri-yield/portal' : '/my-dashboard'}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('accountDeletion.backToPortal')}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {userType === 'cooperative'
              ? t('accountDeletion.cooperativeTitle')
              : userType === 'farmer'
                ? t('accountDeletion.farmerTitle')
                : t('accountDeletion.title')}
          </h1>
          <p className="text-gray-500">{t('accountDeletion.subtitle')}</p>
        </div>

        {/* Active investment warning */}
        {hasActiveInvestment && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: '#fee2e2', border: '2px solid #dc2626' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 text-lg mb-2">{t('accountDeletion.investorNotice.title')}</p>
                <p className="text-red-700 text-sm leading-relaxed mb-3">{t('accountDeletion.investorNotice.body')}</p>
                <div className="rounded-xl p-3 bg-red-100 space-y-1">
                  <p className="text-red-800 text-xs font-semibold">📅 {t('accountDeletion.investorNotice.notice')}</p>
                  <p className="text-red-700 text-xs">💰 {t('accountDeletion.investorNotice.payoutNote')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No active investment notice */}
        {!hasActiveInvestment && userType === 'investor' && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: '#f0f9f4', border: '1px solid #86efac' }}>
            <p className="font-semibold text-green-800 mb-1">{t('accountDeletion.noInvestmentNotice.title')}</p>
            <p className="text-green-700 text-sm">{t('accountDeletion.noInvestmentNotice.body')}</p>
          </div>
        )}

        {/* Farmer/Cooperative notice */}
        {userType === 'farmer' && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: '#fff9e6', border: '1px solid #B5850A' }}>
            <p className="text-[#1a3c2e] text-sm">{t('accountDeletion.farmerBody')}</p>
          </div>
        )}
        {userType === 'cooperative' && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: '#fff9e6', border: '1px solid #B5850A' }}>
            <p className="text-[#1a3c2e] text-sm">{t('accountDeletion.cooperativeBody')}</p>
          </div>
        )}

        {/* What happens */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h3 className="font-bold text-gray-900 mb-4">{t('accountDeletion.whatHappens')}</h3>
          <div className="space-y-3">
            {Object.values(steps).map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: '#1a3c2e' }}
                >
                  {i + 1}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data removed and kept */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h4 className="font-bold text-red-600 text-sm mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              {t('accountDeletion.dataRemoved')}
            </h4>
            <ul className="space-y-2">
              {Array.isArray(dataItems) &&
                dataItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-red-400 flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('accountDeletion.dataKept')}
            </h4>
            <ul className="space-y-2">
              {Array.isArray(dataKeptItems) &&
                dataKeptItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Deletion form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('accountDeletion.reason')}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300"
            >
              <option value="">{isFr ? 'Sélectionnez une raison' : 'Select a reason'}</option>
              {Array.isArray(reasons) &&
                reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </select>
          </div>

          {/* Confirm input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('accountDeletion.confirmText')}</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('accountDeletion.confirmPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-300"
            />
            {confirmText && confirmText !== confirmWord && (
              <p className="text-red-500 text-xs mt-1">
                {isFr ? `Tapez exactement "${confirmWord}" pour continuer` : `Type exactly "${confirmWord}" to continue`}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="rounded-xl p-3 mb-4 flex items-center gap-2" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-xs font-semibold">{t('accountDeletion.warning')}</p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={submit}
              disabled={confirmText !== confirmWord || loading}
              className="flex-1 rounded-xl py-3 font-bold text-sm text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: confirmText === confirmWord ? '#dc2626' : '#9ca3af' }}
            >
              {loading ? (isFr ? 'Traitement...' : 'Processing...') : t('accountDeletion.submit')}
            </button>
            <Link
              to={userType === 'investor' ? '/afri-yield/portal' : '/my-dashboard'}
              className="flex-1 rounded-xl py-3 font-semibold text-sm text-center text-[#1a3c2e] border-2 border-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition"
            >
              {t('accountDeletion.cancel')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

