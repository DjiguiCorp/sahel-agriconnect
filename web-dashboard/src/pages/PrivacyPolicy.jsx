import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

const SECTIONS = [
  {
    titleEn: '1. Introduction & legal framework',
    titleFr: '1. Introduction et cadre juridique',
    en: `Sahel AgriConnect and AfriYield Exchange ("we", "us", "the Platform") are operated by Djigui Corporation. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our website and mobile applications (Android and iOS).

We process personal data in accordance with the EU General Data Protection Regulation (GDPR) where it applies to you, and with OHADA (Organisation for the Harmonisation of Business Law in Africa) principles and applicable national data-protection laws in West Africa. By using the Platform, you acknowledge this policy.`,
    fr: `Sahel AgriConnect et AfriYield Exchange (« nous », « la Plateforme ») sont exploités par Djigui Corporation. La présente Politique de confidentialité explique comment nous collectons, utilisons, conservons et protégeons vos données personnelles lorsque vous utilisez notre site web et nos applications mobiles (Android et iOS).

Nous traitons les données personnelles conformément au Règlement général sur la protection des données (RGPD) lorsqu'il vous est applicable, et aux principes de l'OHADA (Organisation pour l'harmonisation en Afrique du droit des affaires) ainsi qu'aux lois nationales applicables en Afrique de l'Ouest. En utilisant la Plateforme, vous reconnaissez cette politique.`,
  },
  {
    titleEn: '2. Data we collect',
    titleFr: '2. Données collectées',
    en: `Depending on your role (farmer, cooperative, investor, government, NGO, processor), we may collect:

• Identity & contact: full name, email address, phone number, country and region
• Location: GPS coordinates or region/village when you provide them for farm mapping or logistics
• Agricultural & business data: crop types, production volumes, cooperative membership, certifications, equipment needs
• Financial data: investment amounts, payment status, escrow references, and billing-related metadata (payment card data is processed by Stripe — we do not store full card numbers)
• KYC documents: government ID, proof of address, or other verification documents submitted for investor or high-value account vetting
• Technical data: device type, app version, language preference, push notification tokens (Firebase), and limited usage analytics to improve the service`,
    fr: `Selon votre profil (agriculteur, coopérative, investisseur, gouvernement, ONG, transformateur), nous pouvons collecter :

• Identité et contact : nom complet, adresse e-mail, numéro de téléphone, pays et région
• Localisation : coordonnées GPS ou région/village pour la cartographie agricole ou la logistique
• Données agricoles et commerciales : cultures, volumes, adhésion coopérative, certifications, besoins en équipement
• Données financières : montants d'investissement, statut des paiements, références séquestre (les données de carte sont traitées par Stripe — nous ne stockons pas les numéros complets)
• Documents KYC : pièce d'identité, justificatif de domicile ou autres documents pour la vérification investisseur ou comptes à fort enjeu
• Données techniques : type d'appareil, version de l'application, langue, jetons de notification (Firebase) et analyses d'usage limitées`,
  },
  {
    titleEn: '3. How we use your data',
    titleFr: '3. Utilisation des données',
    en: `We use your data to:

• Provide and operate Platform services (registration, dashboards, market tools, AfriYield investments, traceability)
• Verify identity and comply with KYC / anti-fraud obligations
• Communicate with you: OTP codes, magic links, service updates, cooperative or investment notifications
• Match farmers with cooperatives, investors, and logistics where you have consented or engaged
• Process payments and subscriptions through our payment partners
• Improve security, fix errors, and develop new features
• Meet legal, tax, and regulatory obligations in applicable jurisdictions`,
    fr: `Nous utilisons vos données pour :

• Fournir et exploiter les services de la Plateforme (inscription, tableaux de bord, outils marché, investissements AfriYield, traçabilité)
• Vérifier l'identité et respecter les obligations KYC / anti-fraude
• Vous contacter : codes OTP, liens magiques, mises à jour, notifications coopérative ou investissement
• Mettre en relation agriculteurs, coopératives, investisseurs et logistique selon votre engagement
• Traiter paiements et abonnements via nos partenaires
• Améliorer la sécurité, corriger les erreurs et développer de nouvelles fonctionnalités
• Respecter les obligations légales, fiscales et réglementaires applicables`,
  },
  {
    titleEn: '4. Data sharing & processors',
    titleFr: '4. Partage des données et sous-traitants',
    en: `We do not sell your personal data. We share data only as needed with:

• Stripe — payment processing for subscriptions and investments (PCI-DSS compliant)
• Firebase (Google) — push notifications to mobile apps
• Resend — transactional emails (OTP, magic links, account notices)
• Cooperatives, investors, or partners you explicitly interact with on the Platform
• Cloud hosting and database providers that store data under contract and security standards
• Courts, regulators, or authorities when required by law

Each processor is bound by contractual data-protection obligations. International transfers, where applicable, rely on appropriate safeguards (e.g. standard contractual clauses).`,
    fr: `Nous ne vendons pas vos données personnelles. Nous les partageons uniquement lorsque nécessaire avec :

• Stripe — traitement des paiements pour abonnements et investissements (conforme PCI-DSS)
• Firebase (Google) — notifications push sur les applications mobiles
• Resend — e-mails transactionnels (OTP, liens magiques, avis de compte)
• Coopératives, investisseurs ou partenaires avec lesquels vous interagissez sur la Plateforme
• Hébergeurs cloud et bases de données sous contrat et normes de sécurité
• Tribunaux, régulateurs ou autorités lorsque la loi l'exige

Chaque sous-traitant est lié par des obligations contractuelles. Les transferts internationaux, le cas échéant, s'appuient sur des garanties appropriées (clauses contractuelles types, etc.).`,
  },
  {
    titleEn: '5. Data retention',
    titleFr: '5. Conservation des données',
    en: `• Active accounts: data is retained while your account is active and as needed to provide services.
• Deleted accounts: after a confirmed deletion request, personal profile and platform data are removed or anonymized within 30 days, except where law requires longer retention.
• Financial records: transaction and investment records required for accounting, tax, and anti-money-laundering compliance are retained for 7 years.
• KYC documents: retained for the period required by applicable financial regulations, then securely deleted or archived.`,
    fr: `• Comptes actifs : les données sont conservées tant que votre compte est actif et nécessaires au service.
• Comptes supprimés : après une demande confirmée, les données personnelles sont supprimées ou anonymisées sous 30 jours, sauf obligation légale contraire.
• Données financières : les registres de transactions et d'investissement sont conservés 7 ans (comptabilité, fiscalité, LBC/FT).
• Documents KYC : conservés pendant la durée exigée par la réglementation financière applicable, puis supprimés ou archivés de manière sécurisée.`,
  },
  {
    titleEn: '6. Your rights',
    titleFr: '6. Vos droits',
    en: `Subject to applicable law (GDPR, OHADA, and local rules), you may:

• Access — request a copy of personal data we hold about you
• Correction — ask us to fix inaccurate or incomplete data
• Deletion — request account and data deletion (see our delete-account page or email privacy@sahelagriconnect.com; farmers may also delete in the mobile app under Account settings)
• Restriction or objection — where legally applicable, limit certain processing
• Portability — receive your data in a structured, commonly used format where GDPR applies
• Withdraw consent — where processing is based on consent (e.g. optional marketing)

We will respond within 30 days. You may lodge a complaint with your local data protection authority.`,
    fr: `Selon le droit applicable (RGPD, OHADA, lois locales), vous pouvez :

• Accès — obtenir une copie des données personnelles que nous détenons
• Rectification — corriger des données inexactes ou incomplètes
• Suppression — demander la suppression du compte et des données (page /delete-account, e-mail privacy@sahelagriconnect.com ; les agriculteurs peuvent aussi supprimer dans l'application → Compte)
• Limitation ou opposition — lorsque la loi le permet
• Portabilité — recevoir vos données dans un format structuré si le RGPD s'applique
• Retrait du consentement — pour les traitements fondés sur le consentement

Nous répondons sous 30 jours. Vous pouvez saisir votre autorité de protection des données.`,
  },
  {
    titleEn: '7. Security',
    titleFr: '7. Sécurité',
    en: `We use HTTPS/TLS for data in transit, secure authentication (including OTP and optional biometrics on mobile), hashed credentials, access controls for staff systems, and regular review of our security practices. No method of transmission over the Internet is 100% secure; we encourage strong device security on your side.`,
    fr: `Nous utilisons HTTPS/TLS pour les données en transit, une authentification sécurisée (OTP, biométrie optionnelle sur mobile), des identifiants hachés, des contrôles d'accès et des revues régulières de nos pratiques. Aucune transmission sur Internet n'est totalement sans risque ; nous vous encourageons à sécuriser vos appareils.`,
  },
  {
    titleEn: '8. Cookies',
    titleFr: '8. Cookies',
    en: `We use essential cookies and local storage for session management, language preference, and authentication. We do not use advertising or third-party tracking cookies for profiling.`,
    fr: `Nous utilisons des cookies et stockage local essentiels pour la session, la langue et l'authentification. Nous n'utilisons pas de cookies publicitaires ou de profilage tiers.`,
  },
  {
    titleEn: "9. Children's privacy",
    titleFr: '9. Protection des mineurs',
    en: `The Platform is not intended for users under 18. We do not knowingly collect data from minors. Contact privacy@sahelagriconnect.com if you believe a minor has registered.`,
    fr: `La Plateforme n'est pas destinée aux moins de 18 ans. Nous ne collectons pas sciemment de données de mineurs. Contactez privacy@sahelagriconnect.com en cas de doute.`,
  },
  {
    titleEn: '10. Contact & updates',
    titleFr: '10. Contact et mises à jour',
    en: `Data Protection / Privacy: privacy@sahelagriconnect.com
Account deletion: https://sahelagriconnect.com/delete-account or privacy@sahelagriconnect.com

We may update this policy; material changes will be posted on this page with a revised date.`,
    fr: `Protection des données : privacy@sahelagriconnect.com
Suppression de compte : https://sahelagriconnect.com/delete-account ou privacy@sahelagriconnect.com

Nous pouvons mettre à jour cette politique ; les changements importants seront publiés sur cette page avec une nouvelle date.`,
  },
];

function BilingualBlock({ en, fr }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-white/85">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">English</p>
        <p className="whitespace-pre-line">{en}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">Français</p>
        <p className="whitespace-pre-line text-white/75">{fr}</p>
      </div>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div
      className="relative min-h-screen overflow-hidden py-10 px-4"
      style={{
        background:
          'linear-gradient(165deg, #060f0a 0%, #0d1f17 28%, #1a3c2e 52%, #0a1610 78%, #060f0a 100%)',
      }}
    >
      <div
        className="glow-orb-green pointer-events-none absolute -left-32 top-16 h-72 w-72 opacity-70"
        aria-hidden
      />
      <div
        className="glow-orb-gold pointer-events-none absolute -right-20 top-1/4 h-80 w-80 opacity-60"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex text-sm text-white/60 transition hover:text-white"
        >
          ← Sahel AgriConnect
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Shield className="h-7 w-7 text-emerald-400" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Privacy Policy</h1>
          <p className="mt-1 text-lg font-medium text-[#d4af37]">Politique de confidentialité</p>
          <p className="mt-2 text-xs text-white/50">
            Last updated / Dernière mise à jour : June 2026 · GDPR &amp; OHADA aligned
          </p>
        </div>

        <div className="space-y-5">
          {SECTIONS.map((section) => (
            <GlassCard key={section.titleEn} variant="strong" hover={false} className="p-6">
              <h2 className="mb-4 text-base font-bold text-white">{section.titleEn}</h2>
              <p className="mb-3 text-sm font-medium text-[#d4af37]/90">{section.titleFr}</p>
              <BilingualBlock en={section.en} fr={section.fr} />
            </GlassCard>
          ))}
        </div>

        <GlassCard variant="gold" hover={false} className="mt-6 p-5 text-center">
          <p className="text-sm text-white/90">
            <a
              href="mailto:privacy@sahelagriconnect.com"
              className="font-semibold text-[#d4af37] hover:underline"
            >
              privacy@sahelagriconnect.com
            </a>
          </p>
          <p className="mt-2 text-xs text-white/60">
            <Link to="/delete-account" className="text-[#d4af37] hover:underline">
              Delete my account / Supprimer mon compte
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
