import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';

const API = API_BASE_URL.replace(/\/$/, '');

// Primary diaspora markets (fast-track 24h KYC)
export const FAST_TRACK_DIASPORA = [
  'United States',
  'United Kingdom',
  'France',
  'Canada',
];

/** @returns {'african'|'diaspora'|'other'} */
export function getCountryCategory(country) {
  if (!country) return 'other';
  const normalized = String(country).trim().toLowerCase();
  if (
    AFRICAN_COUNTRIES.some((c) => c.toLowerCase() === normalized)
  ) {
    return 'african';
  }
  if (
    FAST_TRACK_DIASPORA.some((c) => c.toLowerCase() === normalized)
    || normalized === 'usa'
    || normalized === 'us'
    || normalized === 'uk'
  ) {
    return 'diaspora';
  }
  return 'other';
}

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
