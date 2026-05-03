import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initPosthog() {
  if (!POSTHOG_KEY || initialized) return;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
    });
    initialized = true;
  } catch {
    /* clé invalide ou réseau */
  }
}

/** Événements analytics (PostHog) — alignés sur la feuille de route produit */
export const AnalyticsEvents = {
  PAGE_VIEW: 'page_view',
  FARMER_REGISTRATION_STARTED: 'farmer_registration_started',
  FARMER_REGISTRATION_COMPLETED: 'farmer_registration_completed',
  DIAGNOSTIC_SOL_USED: 'diagnostic_sol_used',
  DISEASE_DETECTION_USED: 'disease_detection_used',
  DISEASE_DETECTION_COMPLETED: 'disease_detection_completed',
  DIASPORA_INQUIRY_SENT: 'diaspora_inquiry_sent',
};

/**
 * @param {string} event
 * @param {Record<string, unknown>} [props]
 */
export function captureEvent(event, props = {}) {
  if (!POSTHOG_KEY || !initialized) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}

export { posthog };
