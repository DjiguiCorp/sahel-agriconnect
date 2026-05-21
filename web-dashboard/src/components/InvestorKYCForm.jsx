import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const API = API_BASE_URL.replace(/\/$/, '');

const KYC_COUNTRIES = [
  ...AFRICAN_COUNTRIES,
  'France',
  'United Kingdom',
  'United States',
  'Canada',
];

const DIASPORA_COUNTRIES = [
  'France',
  'United Kingdom',
  'United States',
  'Canada',
  'UK',
  'USA',
];

const STEP_LABELS_EN = ['Identity', 'Documents', 'Address', 'Finances', 'Legal'];
const STEP_LABELS_FR = ['Identité', 'Documents', 'Adresse', 'Finances', 'Légal'];

const STEP_INTROS = {
  1: {
    en: 'Basic information — takes about 1 minute',
    fr: 'Informations de base — environ 1 minute',
  },
  2: {
    en: 'Almost there — just your ID details',
    fr: "Presque terminé — juste les détails de votre pièce d'identité",
  },
  3: {
    en: 'Quick address check — 1 minute',
    fr: "Vérification d'adresse rapide — 1 minute",
  },
  4: {
    en: 'Financial profile — helps us serve you better',
    fr: 'Profil financier — nous aide à mieux vous servir',
  },
  5: {
    en: 'Final step — legal declarations',
    fr: 'Dernière étape — déclarations légales',
  },
};

function getCategory(country) {
  if (!country) return 'other';
  if (AFRICAN_COUNTRIES.some(
    (c) => c.toLowerCase() === country.toLowerCase())) return 'african';
  if (DIASPORA_COUNTRIES.some(
    (c) => c.toLowerCase() === country.toLowerCase())) return 'diaspora';
  return 'other';
}

const inputCls =
  'w-full rounded-xl px-3 py-3 text-sm bg-white/5 border border-white/10 outline-none focus:border-[#B5850A] text-[#F5F0E8]';

function FieldWithWhy({ label, why, isFr, children }) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/70 font-medium">{label}</span>
        {why ? (
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="text-[10px] text-amber-400/90 hover:text-amber-300 whitespace-nowrap"
          >
            {showWhy
              ? isFr ? 'Masquer' : 'Hide'
              : isFr ? 'Pourquoi ?' : 'Why?'}
          </button>
        ) : null}
      </div>
      {showWhy && why ? (
        <p className="text-[11px] text-white/50 leading-relaxed rounded-lg bg-white/5 border border-white/10 px-3 py-2">
          {why}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function KYCSuccessScreen({ isFr, countryOfResidence, category, reviewHours }) {
  const isAfrican = category === 'african';
  const isDiaspora = category === 'diaspora';

  return (
    <div className="text-center py-8">
      <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">
        {isFr ? 'KYC soumis avec succès' : 'KYC Submitted Successfully'}
      </h2>
      <p className="text-white/60 text-sm max-w-md mx-auto mb-2">
        {countryOfResidence}
        {' · '}
        {reviewHours}h
      </p>
      <p className="text-white/50 text-xs max-w-md mx-auto">
        {isFr
          ? 'Un email de confirmation a été envoyé à votre adresse.'
          : 'A confirmation email has been sent to your address.'}
      </p>

      {isAfrican ? (
        <Link
          to="/afri-yield/opportunities"
          className="inline-block px-6 py-3 rounded-xl font-bold text-black text-sm mt-4"
          style={{ backgroundColor: '#B5850A' }}
        >
          {isFr ? '→ Explorer les opportunités maintenant'
            : '→ Browse Opportunities Now'}
        </Link>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mt-4 text-left max-w-md mx-auto">
          <p className="text-amber-400 text-xs leading-relaxed">
            {isFr
              ? '📧 Vous recevrez un email de confirmation une fois votre KYC approuvé. Vous pourrez alors investir via notre portail sécurisé.'
              : '📧 You will receive a confirmation email once your KYC is approved. You can then invest via our secure portal.'}
          </p>
        </div>
      )}

      {!isAfrican && isDiaspora && (
        <p className="text-white/40 text-xs mt-4">
          {isFr ? 'Délai de révision: 24 heures' : 'Review timeline: 24 hours'}
        </p>
      )}
    </div>
  );
}

export default function InvestorKYCForm({
  investorEmail: initialEmail = '',
  investorName: initialName = '',
  countryOfResidence: initialCountry = '',
}) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [countryOfResidence, setCountryOfResidence] = useState(
    initialCountry ||
      localStorage.getItem('afriyield_investor_country') ||
      'United States'
  );

  const [form, setForm] = useState({
    investorEmail: initialEmail || localStorage.getItem('afriyield_investor_email') || '',
    investorName: initialName || localStorage.getItem('afriyield_investor_name') || '',
    dateOfBirth: '',
    nationality: '',
    placeOfBirth: '',
    occupation: '',
    employerName: '',
    idType: 'passport',
    idNumber: '',
    idIssuingCountry: '',
    idExpiryDate: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    addressDocumentType: 'utility_bill',
    sourceOfFunds: '',
    sourceOfFundsDetail: '',
    estimatedNetWorthUSD: '',
    annualIncomeUSD: '',
    investmentExperience: '',
    isAccreditedInvestorUS: false,
    accreditedBasisUS: '',
    ukInvestorCategory: '',
    ukSelfCertificationSigned: false,
    frenchInvestorCategory: '',
    amfRiskAcknowledgement: false,
    canadianInvestorCategory: '',
    canadianProvinceOfResidence: '',
    isPEP: false,
    pepDetails: '',
    hasCriminalRecord: false,
    isUSPerson_FATCA: false,
    acceptedTerms: false,
    acceptedRiskDisclosure: false,
    acceptedPrivacyPolicy: false,
    digitalSignature: '',
  });

  const category = getCategory(countryOfResidence);
  const isAfrican = category === 'african';
  const isDiaspora = category === 'diaspora';

  const badgeConfig = {
    african: {
      color: 'bg-green-500/15 text-green-400 border-green-500/30',
      icon: '🌍',
      label: isFr
        ? 'Investisseur Africain — Accès immédiat après paiement'
        : 'African Investor — Immediate access after payment',
      desc: isFr
        ? 'Votre KYC sera vérifié en arrière-plan. Votre accès reste actif.'
        : 'Your KYC is verified in the background. Your access stays active.',
      time: isFr ? 'Vérification: 48-72h' : 'Review: 48-72h',
    },
    diaspora: {
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      icon: '⚡',
      label: isFr
        ? `${countryOfResidence} — Vérification KYC requise avant investissement`
        : `${countryOfResidence} — KYC verification required before investing`,
      desc: isFr
        ? "Soumettez votre KYC et votre pièce d'identité. Approuvé en 24h. Investissez ensuite."
        : 'Submit KYC + photo ID. Approved in 24h. Then invest.',
      time: isFr ? 'Délai: 24 heures' : 'Timeline: 24 hours',
    },
    other: {
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: '📋',
      label: isFr
        ? `${countryOfResidence} — Vérification manuelle requise`
        : `${countryOfResidence} — Manual verification required`,
      desc: isFr
        ? 'Notre équipe de conformité examinera votre dossier. Vous recevrez une notification par email.'
        : 'Our compliance team will review your file. You will be notified by email.',
      time: isFr ? 'Délai: 48-72 heures' : 'Timeline: 48-72 hours',
    },
  };
  const badge = badgeConfig[category];

  const reviewHours = useMemo(() => {
    if (category === 'diaspora') return '24';
    return '48-72';
  }, [category]);

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const canAdvance = () => {
    if (step === 1) {
      return form.investorEmail && form.investorName && countryOfResidence && form.dateOfBirth;
    }
    if (step === 2) return form.idType && form.idNumber;
    if (step === 3) return form.addressLine1 && form.city && form.postalCode;
    if (step === 4) return form.sourceOfFunds && form.investmentExperience;
    if (step === 5) {
      return (
        form.acceptedTerms &&
        form.acceptedRiskDisclosure &&
        form.acceptedPrivacyPolicy &&
        form.digitalSignature.trim()
      );
    }
    return true;
  };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          investorEmail: form.investorEmail.trim().toLowerCase(),
          countryOfResidence,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }
      setSubmitResult(data);
      setSubmitted(true);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <KYCSuccessScreen
        isFr={isFr}
        countryOfResidence={countryOfResidence}
        category={submitResult?.category || category}
        reviewHours={submitResult?.reviewHours || reviewHours}
      />
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto" style={{ color: '#F5F0E8' }}>
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl">
            🔐
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              {isFr ? "Vérification d'identité" : 'Identity Verification'}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto">
              {isFr
                ? 'Cette étape est requise pour protéger tous les investisseurs sur la plateforme. Le processus prend environ 5-7 minutes.'
                : 'This step is required to protect all investors on the platform. The process takes about 5-7 minutes.'}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left max-w-sm mx-auto">
            <p className="text-white font-semibold text-sm mb-3">
              {isFr ? '📋 Ce dont vous aurez besoin:' : "📋 What you'll need:"}
            </p>
            <div className="space-y-2">
              {[
                ['🪪', isFr ? "Pièce d'identité (passeport ou carte nationale)" : 'ID document (passport or national ID)'],
                ['📍', isFr ? 'Votre adresse actuelle' : 'Your current address'],
                ['💼', isFr ? 'Informations sur votre activité professionnelle' : 'Your professional activity information'],
                ['✍️', isFr ? '5-7 minutes de votre temps' : '5-7 minutes of your time'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2 text-xs text-white/60">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 max-w-sm mx-auto text-left text-xs leading-relaxed ${
              isAfrican
                ? 'border-green-500/20 bg-green-500/5 text-green-400'
                : isDiaspora
                  ? 'border-blue-500/20 bg-blue-500/5 text-blue-400'
                  : 'border-amber-500/20 bg-amber-500/5 text-amber-400'
            }`}
          >
            {isAfrican
              ? isFr
                ? "🌍 En tant qu'investisseur africain, votre accès est accordé après paiement. Cette vérification s'effectue en arrière-plan sans interrompre votre activité."
                : '🌍 As an African investor, your access is granted after payment. This verification runs in the background without interrupting your activity.'
              : isDiaspora
                ? isFr
                  ? '⚡ Résidents USA/UK/France/Canada: votre vérification sera traitée en priorité dans les 24 heures.'
                  : '⚡ USA/UK/France/Canada residents: your verification will be processed as priority within 24 hours.'
                : isFr
                  ? '📋 La vérification manuelle prend 48-72 heures. Vous serez notifié par email.'
                  : '📋 Manual verification takes 48-72 hours. You will be notified by email.'}
          </div>

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="w-full max-w-sm mx-auto py-4 rounded-xl font-bold text-black text-base flex items-center justify-center gap-2"
            style={{ backgroundColor: '#B5850A' }}
          >
            {isFr ? 'Commencer la vérification →' : 'Start Verification →'}
          </button>

          <p className="text-white/30 text-xs">
            🔒{' '}
            {isFr
              ? 'Vos données sont chiffrées et sécurisées. Conformité AML/KYC.'
              : 'Your data is encrypted and secure. AML/KYC compliant.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" style={{ color: '#F5F0E8' }}>
      <div className="mb-6">
        <div
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold mb-4 border ${badge.color}`}
        >
          <span>{badge.icon}</span>
          <span>{badge.label}</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 mb-4">
          <p className="text-white font-semibold text-sm">
            {isFr ? 'Comment ça fonctionne:' : 'How it works:'}
          </p>
          {isAfrican && (
            <div className="space-y-2 text-xs text-white/60">
              <p>
                ✅ 1.{' '}
                {isFr
                  ? 'Investissez via Stripe — accès accordé immédiatement'
                  : 'Invest via Stripe — access granted immediately'}
              </p>
              <p>
                📋 2.{' '}
                {isFr
                  ? 'Soumettez ce formulaire KYC (en arrière-plan)'
                  : 'Submit this KYC form (background check)'}
              </p>
              <p>
                📧 3.{' '}
                {isFr
                  ? 'Recevez une notification de confirmation sous 48-72h'
                  : 'Receive confirmation notification within 48-72h'}
              </p>
              <p>
                🔒 4.{' '}
                {isFr
                  ? 'Votre accès reste actif tout au long du processus'
                  : 'Your access remains active throughout the process'}
              </p>
            </div>
          )}
          {isDiaspora && (
            <div className="space-y-2 text-xs text-white/60">
              <p>
                📋 1.{' '}
                {isFr
                  ? 'Complétez ce formulaire KYC (5 étapes)'
                  : 'Complete this KYC form (5 steps)'}
              </p>
              <p>
                🪪 2.{' '}
                {isFr
                  ? "Soumettez une photo de votre pièce d'identité"
                  : 'Submit a photo of your government ID'}
              </p>
              <p>
                ⏳ 3.{' '}
                {isFr
                  ? "Attendez l'approbation (24 heures)"
                  : 'Wait for approval (24 hours)'}
              </p>
              <p>
                💳 4.{' '}
                {isFr
                  ? 'Investissez via Stripe — accès complet accordé'
                  : 'Invest via Stripe — full access granted'}
              </p>
            </div>
          )}
          {!isAfrican && !isDiaspora && (
            <div className="space-y-2 text-xs text-white/60">
              <p>
                📋 1. {isFr ? 'Complétez ce formulaire KYC' : 'Complete this KYC form'}
              </p>
              <p>
                🪪 2.{' '}
                {isFr
                  ? "Soumettez votre pièce d'identité"
                  : 'Submit your government ID'}
              </p>
              <p>
                ⏳ 3.{' '}
                {isFr
                  ? 'Vérification manuelle (48-72h)'
                  : 'Manual review (48-72 hours)'}
              </p>
              <p>
                💳 4. {isFr ? 'Investissez une fois approuvé' : 'Invest once approved'}
              </p>
            </div>
          )}
          <div className="pt-1 border-t border-white/10">
            <p className="text-amber-400 text-xs font-medium">⏱ {badge.time}</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex-1 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > n
                  ? 'bg-green-500/80 text-white'
                  : step === n
                    ? 'bg-[#B5850A] text-black'
                    : 'bg-white/10 text-white/40'
              }`}
            >
              {step > n ? '✓' : n}
            </div>
            <div className="text-center mt-1 w-full">
              <p
                className="text-[10px] sm:text-xs leading-tight"
                style={{ color: step === n ? '#B5850A' : 'rgba(255,255,255,0.3)' }}
              >
                {isFr ? STEP_LABELS_FR[n - 1] : STEP_LABELS_EN[n - 1]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-white/40 text-xs text-center mb-6 mt-2">
        {STEP_INTROS[step][isFr ? 'fr' : 'en']}
      </p>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="font-bold text-lg text-white">
              {isFr ? '1. Identité personnelle' : '1. Personal identity'}
            </h3>

            <FieldWithWhy
              label={isFr ? 'Pays de résidence' : 'Country of residence'}
              why={
                isFr
                  ? 'Requis par la réglementation anti-blanchiment pour déterminer vos obligations légales.'
                  : 'Required by anti-money laundering rules to determine your legal obligations.'
              }
              isFr={isFr}
            >
              <select
                value={countryOfResidence}
                onChange={(e) => setCountryOfResidence(e.target.value)}
                className={inputCls}
              >
                {KYC_COUNTRIES.map((c) => (
                  <option key={c} value={c} className="text-black">
                    {c}
                  </option>
                ))}
              </select>
            </FieldWithWhy>

            <FieldWithWhy
              label="Email"
              why={
                isFr
                  ? 'Pour vous envoyer les confirmations KYC et les mises à jour de votre compte investisseur.'
                  : 'To send KYC confirmations and updates about your investor account.'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder="your@email.com"
                type="email"
                value={form.investorEmail}
                onChange={(e) => set('investorEmail', e.target.value)}
              />
            </FieldWithWhy>

            <FieldWithWhy
              label={isFr ? 'Nom complet' : 'Full name'}
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Comme sur votre pièce d\'identité' : 'As shown on your ID'}
                value={form.investorName}
                onChange={(e) => set('investorName', e.target.value)}
              />
            </FieldWithWhy>

            <FieldWithWhy
              label={isFr ? 'Date de naissance' : 'Date of birth'}
              why={
                isFr
                  ? 'Obligation légale pour vérifier que vous êtes majeur et pour la lutte contre la fraude.'
                  : 'Legally required to confirm you are of legal age and to prevent fraud.'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder="YYYY-MM-DD"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set('dateOfBirth', e.target.value)}
              />
            </FieldWithWhy>

            <FieldWithWhy
              label={isFr ? 'Nationalité' : 'Nationality'}
              why={
                isFr
                  ? 'Utilisée pour les déclarations réglementaires transfrontalières (FATCA, etc.).'
                  : 'Used for cross-border regulatory reporting (FATCA, etc.).'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Ex: Malienne, Française' : 'e.g. Malian, French'}
                value={form.nationality}
                onChange={(e) => set('nationality', e.target.value)}
              />
            </FieldWithWhy>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-bold text-lg text-white">
              {isFr ? "2. Document d'identité" : '2. Identity document'}
            </h3>

            <FieldWithWhy
              label={isFr ? 'Type de document' : 'Document type'}
              isFr={isFr}
            >
              <select
                className={inputCls}
                value={form.idType}
                onChange={(e) => set('idType', e.target.value)}
              >
                <option value="passport" className="text-black">Passport</option>
                <option value="national_id" className="text-black">National ID</option>
                <option value="drivers_license" className="text-black">Driver&apos;s license</option>
              </select>
            </FieldWithWhy>

            <FieldWithWhy
              label={isFr ? 'Numéro du document' : 'Document number'}
              why={
                isFr
                  ? 'Vérifié contre votre pièce d\'identité pour confirmer votre identité — jamais partagé publiquement.'
                  : 'Verified against your ID to confirm identity — never shared publicly.'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Numéro tel qu\'indiqué sur le document' : 'Number as shown on document'}
                value={form.idNumber}
                onChange={(e) => set('idNumber', e.target.value)}
              />
            </FieldWithWhy>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="font-bold text-lg text-white">
              {isFr ? '3. Adresse' : '3. Address'}
            </h3>

            <FieldWithWhy
              label={isFr ? 'Adresse ligne 1' : 'Address line 1'}
              why={
                isFr
                  ? 'Preuve de résidence exigée par les régulateurs financiers internationaux.'
                  : 'Proof of residence required by international financial regulators.'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Rue et numéro' : 'Street and number'}
                value={form.addressLine1}
                onChange={(e) => set('addressLine1', e.target.value)}
              />
            </FieldWithWhy>

            <FieldWithWhy
              label={isFr ? 'Ville' : 'City'}
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Ville' : 'City'}
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </FieldWithWhy>

            <FieldWithWhy
              label={isFr ? 'Code postal' : 'Postal code'}
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Code postal' : 'Postal / ZIP code'}
                value={form.postalCode}
                onChange={(e) => set('postalCode', e.target.value)}
              />
            </FieldWithWhy>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h3 className="font-bold text-lg text-white">
              {isFr ? '4. Profil financier' : '4. Financial profile'}
            </h3>

            <FieldWithWhy
              label={isFr ? 'Source des fonds' : 'Source of funds'}
              why={
                isFr
                  ? 'Exigence AML : nous devons comprendre d\'où provient le capital que vous investissez.'
                  : 'AML requirement: we must understand where the capital you invest comes from.'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Ex: Épargne, salaire, entreprise' : 'e.g. Savings, salary, business'}
                value={form.sourceOfFunds}
                onChange={(e) => set('sourceOfFunds', e.target.value)}
              />
            </FieldWithWhy>

            <FieldWithWhy
              label={isFr ? 'Expérience d\'investissement' : 'Investment experience'}
              why={
                isFr
                  ? 'Nous adaptons les informations sur les risques à votre niveau d\'expérience.'
                  : 'We tailor risk information to your experience level.'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Ex: Débutant, intermédiaire, expérimenté' : 'e.g. Beginner, intermediate, experienced'}
                value={form.investmentExperience}
                onChange={(e) => set('investmentExperience', e.target.value)}
              />
            </FieldWithWhy>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h3 className="font-bold text-lg text-white">
              {isFr ? '5. Déclarations et signature' : '5. Declarations & signature'}
            </h3>

            <p className="text-white/50 text-xs leading-relaxed">
              {isFr
                ? 'Dernière étape — cochez chaque case pour confirmer que vous comprenez les conditions d\'investissement.'
                : 'Last step — check each box to confirm you understand the investment terms.'}
            </p>

            {['acceptedTerms', 'acceptedRiskDisclosure', 'acceptedPrivacyPolicy'].map((key) => (
              <label
                key={key}
                className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/[0.07] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="mt-0.5 accent-amber-500 w-4 h-4"
                />
                <span className="text-sm text-white/80 leading-relaxed">
                  {key === 'acceptedTerms'
                    ? isFr ? "J'accepte les conditions d'utilisation" : 'I accept the terms of service'
                    : key === 'acceptedRiskDisclosure'
                      ? isFr ? "J'accepte la divulgation des risques d'investissement" : 'I accept the investment risk disclosure'
                      : isFr ? "J'accepte la politique de confidentialité" : 'I accept the privacy policy'}
                </span>
              </label>
            ))}

            <FieldWithWhy
              label={isFr ? 'Signature numérique' : 'Digital signature'}
              why={
                isFr
                  ? 'Votre nom complet fait office de signature électronique légale pour ce dossier KYC.'
                  : 'Your full name serves as your legal electronic signature for this KYC file.'
              }
              isFr={isFr}
            >
              <input
                className={inputCls}
                placeholder={isFr ? 'Tapez votre nom complet' : 'Type your full name'}
                value={form.digitalSignature}
                onChange={(e) => set('digitalSignature', e.target.value)}
              />
            </FieldWithWhy>
          </div>
        )}
      </div>

      {step < 5 && (
        <p className="text-center text-white/30 text-[11px] mt-4">
          {isFr
            ? `Étape ${step} sur 5 — vous progressez bien !`
            : `Step ${step} of 5 — you're doing great!`}
        </p>
      )}

      <div className="flex justify-between mt-6 gap-3">
        <button
          type="button"
          disabled={step <= 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/70 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          {isFr ? 'Retour' : 'Back'}
        </button>
        {step < 5 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-[#0d1f17] disabled:opacity-50"
            style={{ background: '#B5850A' }}
          >
            {isFr ? 'Suivant' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance() || loading}
            onClick={submit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#0d1f17] disabled:opacity-50"
            style={{ background: '#B5850A' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isFr ? 'Soumettre KYC' : 'Submit KYC'}
          </button>
        )}
      </div>
    </div>
  );
}
