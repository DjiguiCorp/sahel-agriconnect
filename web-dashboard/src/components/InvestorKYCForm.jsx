import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { INVESTOR_RESIDENCE_COUNTRIES } from '../data/investorResidenceCountries';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const API = API_BASE_URL.replace(/\/$/, '');

const AFRICAN_COUNTRIES = [
  'Mali', 'Senegal', 'Burkina Faso', 'Ghana', 'Nigeria',
  "Côte d'Ivoire", 'Ivory Coast', 'Cameroon', 'Kenya',
  'Tanzania', 'Uganda', 'Rwanda', 'Ethiopia', 'Togo',
  'Benin', 'Niger', 'Guinea', 'Sierra Leone', 'Liberia',
  'Gambia', 'Guinea-Bissau', 'Mauritania', 'Cape Verde',
  'South Africa', 'Egypt', 'Morocco', 'Other African',
];
const DIASPORA_COUNTRIES = [
  'USA', 'UK', 'France', 'Canada',
  'United States', 'United Kingdom',
];

function getCategory(country) {
  if (!country) return 'other';
  if (AFRICAN_COUNTRIES.some(
    (c) => c.toLowerCase() === country.toLowerCase())) return 'african';
  if (DIASPORA_COUNTRIES.some(
    (c) => c.toLowerCase() === country.toLowerCase())) return 'diaspora';
  return 'other';
}

const ALL_COUNTRIES = [
  ...new Set([
    ...AFRICAN_COUNTRIES,
    ...INVESTOR_RESIDENCE_COUNTRIES,
    ...DIASPORA_COUNTRIES.filter((c) => !['USA', 'UK'].includes(c)),
  ]),
].sort();

const inputCls =
  'w-full rounded-xl px-3 py-3 text-sm bg-white/5 border border-white/10 outline-none focus:border-[#B5850A] text-[#F5F0E8]';

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

      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full ${step >= n ? 'bg-[#B5850A]' : 'bg-white/10'}`}
          />
        ))}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
          {error}
        </div>
      ) : null}

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">
            {isFr ? '1. Identité personnelle' : '1. Personal identity'}
          </h3>
          <label className="block text-xs text-white/60">
            {isFr ? 'Pays de résidence' : 'Country of residence'}
          </label>
          <select
            value={countryOfResidence}
            onChange={(e) => setCountryOfResidence(e.target.value)}
            className={inputCls}
          >
            {ALL_COUNTRIES.map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Email"
            type="email"
            value={form.investorEmail}
            onChange={(e) => set('investorEmail', e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={isFr ? 'Nom complet' : 'Full name'}
            value={form.investorName}
            onChange={(e) => set('investorName', e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={isFr ? 'Date de naissance' : 'Date of birth'}
            value={form.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={isFr ? 'Nationalité' : 'Nationality'}
            value={form.nationality}
            onChange={(e) => set('nationality', e.target.value)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">
            {isFr ? '2. Document d\'identité' : '2. Identity document'}
          </h3>
          <select
            className={inputCls}
            value={form.idType}
            onChange={(e) => set('idType', e.target.value)}
          >
            <option value="passport" className="text-black">Passport</option>
            <option value="national_id" className="text-black">National ID</option>
            <option value="drivers_license" className="text-black">Driver&apos;s license</option>
          </select>
          <input
            className={inputCls}
            placeholder={isFr ? 'Numéro du document' : 'Document number'}
            value={form.idNumber}
            onChange={(e) => set('idNumber', e.target.value)}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">
            {isFr ? '3. Adresse' : '3. Address'}
          </h3>
          <input
            className={inputCls}
            placeholder={isFr ? 'Adresse ligne 1' : 'Address line 1'}
            value={form.addressLine1}
            onChange={(e) => set('addressLine1', e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={isFr ? 'Ville' : 'City'}
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={isFr ? 'Code postal' : 'Postal code'}
            value={form.postalCode}
            onChange={(e) => set('postalCode', e.target.value)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">
            {isFr ? '4. Profil financier' : '4. Financial profile'}
          </h3>
          <input
            className={inputCls}
            placeholder={isFr ? 'Source des fonds' : 'Source of funds'}
            value={form.sourceOfFunds}
            onChange={(e) => set('sourceOfFunds', e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={isFr ? 'Expérience d\'investissement' : 'Investment experience'}
            value={form.investmentExperience}
            onChange={(e) => set('investmentExperience', e.target.value)}
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">
            {isFr ? '5. Déclarations et signature' : '5. Declarations & signature'}
          </h3>
          {['acceptedTerms', 'acceptedRiskDisclosure', 'acceptedPrivacyPolicy'].map((key) => (
            <label key={key} className="flex items-start gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="mt-1"
              />
              <span>
                {key === 'acceptedTerms'
                  ? isFr ? "J'accepte les conditions" : 'I accept the terms'
                  : key === 'acceptedRiskDisclosure'
                    ? isFr ? "J'accepte la divulgation des risques" : 'I accept the risk disclosure'
                    : isFr ? "J'accepte la politique de confidentialité" : 'I accept the privacy policy'}
              </span>
            </label>
          ))}
          <input
            className={inputCls}
            placeholder={isFr ? 'Signature numérique (nom complet)' : 'Digital signature (full name)'}
            value={form.digitalSignature}
            onChange={(e) => set('digitalSignature', e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-between mt-8 gap-3">
        <button
          type="button"
          disabled={step <= 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-white/10 text-white/70 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          {isFr ? 'Retour' : 'Back'}
        </button>
        {step < 5 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1 px-5 py-2 rounded-xl font-bold text-[#0d1f17] disabled:opacity-50"
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-[#0d1f17] disabled:opacity-50"
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
