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
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [photoIdUploaded, setPhotoIdUploaded] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [additionalDocsRequested, setAdditionalDocsRequested] = useState('');

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
          setPaymentVerified(!!d.paymentVerified);
          setPhotoIdUploaded(!!d.photoIdUploaded);
          setRejectionReason(d.rejectionReason || '');
          setAdditionalDocsRequested(d.additionalDocsRequested || '');
        }
      })
      .catch(() => setStatus('not_started'))
      .finally(() => setLoading(false));
  }, [email]);

  const canInvest = status === 'approved' || status === 'african_pending_review';
  const needsKYC = !!email && (status === 'not_started' || status === 'in_progress');
  const kycUnderReview =
    status === 'pending_review'
    || status === 'pending_kyc'
    || status === 'african_pending_review';
  const kycApproved = status === 'approved';
  const portalReady = kycApproved && paymentVerified;

  return {
    email,
    name,
    loading,
    status,
    category,
    paymentVerified,
    photoIdUploaded,
    rejectionReason,
    additionalDocsRequested,
    isRegistered: !!email,
    canInvest,
    needsKYC,
    kycUnderReview,
    kycApproved,
    portalReady,
    kycSnapshot: {
      status,
      paymentVerified,
      rejectionReason,
      additionalDocsRequested,
    },
  };
}
