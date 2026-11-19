/**
 * Bilingual (FR/EN) copy for AfriYield investor in-app notifications.
 * Prefer investor.preferredLanguage when available.
 */

export function normalizeInvestorLang(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (s.startsWith('en')) return 'en';
  if (s.startsWith('fr')) return 'fr';
  return null;
}

/** Resolve language: explicit → stored preference → France residence → default fr */
export function resolveInvestorLang({ lang, preferredLanguage, countryOfResidence } = {}) {
  return (
    normalizeInvestorLang(lang) ||
    normalizeInvestorLang(preferredLanguage) ||
    (String(countryOfResidence || '').toLowerCase().includes('france') ? 'fr' : null) ||
    'fr'
  );
}

const COPY = {
  welcome: {
    en: {
      title: 'Welcome to AfriYield Exchange',
      message:
        'Your investor account is active. Browse opportunities and build your African agricultural portfolio.',
    },
    fr: {
      title: 'Bienvenue sur AfriYield Exchange',
      message:
        'Votre compte investisseur est actif. Parcourez les opportunités et constituez votre portefeuille agricole africain.',
    },
  },
  kyc_submitted: {
    en: {
      title: 'KYC submitted',
      message: 'Your identity verification has been received. We will notify you of the outcome.',
    },
    fr: {
      title: 'KYC soumis',
      message:
        'Votre vérification d\'identité a été reçue. Nous vous informerons du résultat.',
    },
  },
  kyc_approved: {
    en: {
      title: 'KYC approved',
      message: 'Your KYC has been approved. You can now invest on AfriYield Exchange.',
    },
    fr: {
      title: 'KYC approuvé',
      message:
        'Votre KYC a été approuvé. Vous pouvez maintenant investir sur AfriYield Exchange.',
    },
  },
  kyc_rejected: {
    en: {
      title: 'KYC action required',
      message: (reason) =>
        `KYC could not be completed${reason ? `: ${reason}` : ''}. Please contact support.`,
    },
    fr: {
      title: 'KYC — action requise',
      message: (reason) =>
        `Le KYC n'a pas pu être complété${reason ? ` : ${reason}` : ''}. Veuillez contacter le support.`,
    },
  },
  kyc_additional_docs: {
    en: {
      title: 'Additional documents required',
      message: (docs) =>
        `Please provide the following documents: ${docs || 'see email for details'}.`,
    },
    fr: {
      title: 'Documents supplémentaires requis',
      message: (docs) =>
        `Veuillez fournir les documents suivants : ${docs || 'voir l\'e-mail pour les détails'}.`,
    },
  },
  payment_verified: {
    en: {
      title: 'Payment confirmed',
      message: 'Payment confirmed. Full access granted.',
    },
    fr: {
      title: 'Paiement confirmé',
      message: 'Paiement confirmé. Accès complet accordé.',
    },
  },
  investment_confirmed: {
    en: {
      title: 'Investment confirmed',
      message: (opp, amt) =>
        `Your investment${opp ? ` in ${opp}` : ''}${amt ? ` ($${Number(amt).toLocaleString()} USD)` : ''} is confirmed on AfriYield Exchange.`,
    },
    fr: {
      title: 'Investissement confirmé',
      message: (opp, amt) =>
        `Votre investissement${opp ? ` dans ${opp}` : ''}${amt ? ` (${Number(amt).toLocaleString()} $ USD)` : ''} est confirmé sur AfriYield Exchange.`,
    },
  },
  escrow_milestone: {
    en: {
      title: 'Escrow milestone verified',
      message: (n, supplier) =>
        `Milestone ${n} verified for your AfriYield investment in ${supplier}. Funds released.`,
    },
    fr: {
      title: 'Jalon escrow vérifié',
      message: (n, supplier) =>
        `Jalon ${n} vérifié pour votre investissement AfriYield chez ${supplier}. Fonds libérés.`,
    },
  },
};

export function investorNotificationCopy(type, lang, params = {}) {
  const L = normalizeInvestorLang(lang) || 'fr';
  const entry = COPY[type]?.[L] || COPY[type]?.en;
  if (!entry) {
    return { title: type, message: '' };
  }
  const message =
    typeof entry.message === 'function' ? entry.message(...(params.args || [])) : entry.message;
  return { title: entry.title, message };
}
