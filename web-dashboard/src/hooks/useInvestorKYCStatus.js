import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export { FAST_TRACK_DIASPORA, getCountryCategory } from '../lib/investorCountryCategory';

const API = API_BASE_URL.replace(/\/$/, '');

export function useInvestorKYCStatus() {
  const email = localStorage.getItem('afriyield_investor_email') || '';
  const name = localStorage.getItem('afriyield_investor_name') || '';
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(!!email);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/kyc/status/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStatus(d.status || 'not_started');
          setCategory(d.category || null);
        }
      })
      .catch(() => setStatus('not_started'))
      .finally(() => setLoading(false));
  }, [email]);

  // Can this investor proceed to payment?
  const canInvest = status === 'approved' || status === 'african_pending_review'; // African paid first

  // Is registered but KYC incomplete?
  const needsKYC = !!email && (status === 'not_started' || status === 'in_progress');

  // Is waiting for review?
  const kycUnderReview = status === 'pending_review' || status === 'pending_kyc';

  return {
    email,
    name,
    loading,
    status,
    category,
    isRegistered: !!email,
    canInvest,
    needsKYC,
    kycUnderReview,
  };
}
