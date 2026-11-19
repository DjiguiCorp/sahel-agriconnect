import { API_BASE_URL } from '../config/api';

const API = (API_BASE_URL || '').replace(/\/$/, '');

export async function fetchInvestorOnboardingStatus() {
  const token = sessionStorage.getItem('afriyield_token');
  if (!token) {
    return {
      success: false,
      step: 'email_verification',
      emailVerified: false,
      diditStatus: null,
      tradingApproved: false,
      subscriptionActive: false,
      currentStep: 1,
      unauthenticated: true,
    };
  }
  const r = await fetch(`${API}/api/investors/onboarding-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.success) {
    throw new Error(d.error || 'Failed to load onboarding status');
  }
  return d;
}

export function onboardingStepLabel(step, isFr) {
  switch (step) {
    case 'email_verification':
      return isFr ? 'Vérifiez votre email' : 'Verify your email';
    case 'kyc':
      return isFr ? 'Complétez la vérification d’identité' : 'Complete identity verification';
    case 'payment':
      return isFr ? 'Activez votre abonnement $99/an' : 'Activate your $99/year subscription';
    case 'complete':
      return isFr ? 'Accès en cours de validation' : 'Access under final review';
    default:
      return isFr ? 'Complétez l’onboarding' : 'Complete onboarding';
  }
}

export function hasFullInvestAccess(onboarding) {
  return onboarding?.step === 'complete' && Boolean(onboarding?.tradingApproved);
}

export function investButtonLabel(onboarding, isFr, { registered = true } = {}) {
  if (!registered) return isFr ? "S'inscrire pour investir" : 'Register to Invest';
  const step = onboarding?.step || 'email_verification';
  if (step === 'email_verification') {
    return isFr ? 'Vérifier l’email' : 'Verify email';
  }
  if (step === 'kyc') {
    if (onboarding?.diditStatus === 'pending') {
      return isFr ? 'Vérification en cours…' : 'Verification in progress…';
    }
    return isFr ? 'Vérification d’identité' : 'Identity verification';
  }
  if (step === 'payment') {
    return isFr ? 'Abonnement requis' : 'Subscription required';
  }
  if (step === 'complete' && !onboarding?.tradingApproved) {
    return isFr ? 'Validation en cours…' : 'Under review…';
  }
  return isFr ? 'Investir maintenant' : 'Invest Now';
}
