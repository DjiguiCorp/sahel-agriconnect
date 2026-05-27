/** Distinct visual identity per portal role (sign-in hub, licensing, login pages). */

export const ROLE_THEMES = {
  farmer: {
    accent: '#1D9E75',
    accentSoft: 'rgba(29,158,117,0.25)',
    button: '#1D9E75',
    buttonText: '#0a1f14',
    badge: 'Sahel',
    badgeBg: 'rgba(29,158,117,0.25)',
    gradient:
      'linear-gradient(145deg, rgba(29,158,117,0.35) 0%, rgba(13,40,28,0.92) 55%, rgba(10,31,22,0.95) 100%)',
    border: 'rgba(29,158,117,0.45)',
    glow: 'rgba(29,158,117,0.2)',
  },
  cooperative: {
    accent: '#B5850A',
    accentSoft: 'rgba(181,133,10,0.22)',
    button: '#B5850A',
    buttonText: '#1a1200',
    badge: 'Sahel',
    badgeBg: 'rgba(181,133,10,0.22)',
    gradient:
      'linear-gradient(145deg, rgba(181,133,10,0.32) 0%, rgba(45,32,8,0.9) 50%, rgba(20,28,18,0.95) 100%)',
    border: 'rgba(181,133,10,0.5)',
    glow: 'rgba(181,133,10,0.18)',
  },
  investor: {
    accent: '#D4A017',
    accentSoft: 'rgba(212,160,23,0.2)',
    button: 'linear-gradient(135deg, #D4A017 0%, #B5850A 100%)',
    buttonText: '#1a1200',
    badge: 'AfriYield',
    badgeBg: 'rgba(212,160,23,0.25)',
    gradient:
      'linear-gradient(145deg, rgba(30,80,140,0.45) 0%, rgba(181,133,10,0.28) 45%, rgba(12,24,48,0.95) 100%)',
    border: 'rgba(212,160,23,0.45)',
    glow: 'rgba(30,80,140,0.25)',
  },
  processor: {
    accent: '#F59E0B',
    accentSoft: 'rgba(245,158,11,0.22)',
    button: '#F59E0B',
    buttonText: '#1a1200',
    badge: 'Sahel',
    badgeBg: 'rgba(245,158,11,0.2)',
    gradient:
      'linear-gradient(145deg, rgba(245,158,11,0.3) 0%, rgba(60,40,10,0.85) 50%, rgba(15,31,18,0.95) 100%)',
    border: 'rgba(245,158,11,0.45)',
    glow: 'rgba(245,158,11,0.15)',
  },
  government: {
    accent: '#3B82F6',
    accentSoft: 'rgba(59,130,246,0.22)',
    button: '#185FA5',
    buttonText: '#ffffff',
    badge: 'Gouvernement',
    badgeBg: 'rgba(59,130,246,0.25)',
    gradient:
      'linear-gradient(145deg, rgba(24,95,165,0.5) 0%, rgba(15,40,90,0.9) 50%, rgba(10,25,55,0.95) 100%)',
    border: 'rgba(59,130,246,0.45)',
    glow: 'rgba(24,95,165,0.3)',
    pageBg: `
      radial-gradient(ellipse 120% 80% at 50% -10%, rgba(40,90,180,0.55) 0%, transparent 65%),
      linear-gradient(180deg, #0a1535 0%, #0b1f12 100%)`,
  },
  ngo: {
    accent: '#2ECC71',
    accentSoft: 'rgba(46,204,113,0.22)',
    button: '#16A34A',
    buttonText: '#ffffff',
    badge: 'ONG',
    badgeBg: 'rgba(46,204,113,0.25)',
    gradient:
      'linear-gradient(145deg, rgba(46,204,113,0.35) 0%, rgba(20,80,55,0.88) 50%, rgba(10,35,25,0.95) 100%)',
    border: 'rgba(46,204,113,0.45)',
    glow: 'rgba(46,204,113,0.2)',
    pageBg: `
      radial-gradient(ellipse 100% 70% at 20% 0%, rgba(46,204,113,0.35) 0%, transparent 55%),
      radial-gradient(ellipse 80% 60% at 100% 80%, rgba(123,97,255,0.2) 0%, transparent 50%),
      linear-gradient(180deg, #071a12 0%, #0b1f17 100%)`,
  },
};

export const INSTITUTIONAL_PAYMENT = {
  government: {
    price: '$999',
    periodFr: '/ mois (contrat annuel)',
    periodEn: '/ month (annual contract)',
    stepsFr: [
      'Vous soumettez cette demande — aucun paiement en ligne à cette étape.',
      'Notre équipe vérifie votre email .gov / .gouv et votre mandat (48 h ouvrées).',
      'Après approbation : facture proforma ou lien Stripe sécurisé vous est envoyé par email.',
      'Le portail pays s\'active après réception du paiement (virement, carte ou mandat administratif).',
      'Vos identifiants de connexion sont envoyés à l\'email officiel enregistré.',
    ],
    stepsEn: [
      'You submit this request — no online payment at this step.',
      'Our team verifies your .gov / .gouv email and mandate (within 48 business hours).',
      'After approval: a proforma invoice or secure Stripe link is emailed to you.',
      'The country portal activates once payment is received (wire, card, or administrative order).',
      'Login credentials are sent to your registered official email.',
    ],
  },
  ngo: {
    price: '$499',
    periodFr: '/ mois (contrat annuel)',
    periodEn: '/ month (annual contract)',
    stepsFr: [
      'Vous soumettez cette demande — aucun paiement en ligne à cette étape.',
      'Vérification de votre email institutionnel .org / .ngo (48 h ouvrées).',
      'Après approbation : devis et instructions de paiement (carte Stripe ou virement).',
      'Accès multi-pays activé après confirmation du paiement.',
      'Identifiants envoyés à votre email institutionnel.',
    ],
    stepsEn: [
      'You submit this request — no online payment at this step.',
      'Verification of your .org / .ngo institutional email (within 48 business hours).',
      'After approval: quote and payment instructions (Stripe card or wire transfer).',
      'Multi-country access activates once payment is confirmed.',
      'Credentials sent to your institutional email.',
    ],
  },
};
