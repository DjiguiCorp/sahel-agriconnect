import mongoose from 'mongoose';

// ── Country classification ───────────────────────────────────
export const AFRICAN_COUNTRIES = [
  'Mali', 'Senegal', 'Burkina Faso', 'Ghana', 'Nigeria',
  "Côte d'Ivoire", 'Ivory Coast', 'Cameroon', 'Kenya',
  'Tanzania', 'Uganda', 'Rwanda', 'Ethiopia', 'Togo',
  'Benin', 'Niger', 'Guinea', 'Sierra Leone', 'Liberia',
  'Gambia', 'Guinea-Bissau', 'Mauritania', 'Cape Verde',
  'South Africa', 'Egypt', 'Morocco', 'Tunisia', 'Algeria',
  'Libya', 'Sudan', 'Somalia', 'Mozambique', 'Zimbabwe',
  'Zambia', 'Malawi', 'Botswana', 'Namibia', 'Angola',
  'Congo', 'DRC', 'Gabon', 'Equatorial Guinea', 'Chad',
  'Central African Republic', 'South Sudan', 'Eritrea',
  'Djibouti', 'Comoros', 'Madagascar', 'Mauritius',
  'Seychelles', 'Reunion', 'Other African',
];

// Fast-track diaspora: full KYC required before payment
export const FAST_TRACK_DIASPORA = [
  'United States',
  'United Kingdom',
  'France',
  'Canada',
];

export function getCountryCategory(country) {
  if (!country) return 'other';
  if (AFRICAN_COUNTRIES.some(
    c => c.toLowerCase() === country.toLowerCase())) {
    return 'african';
  }
  const normalized = country.trim().toLowerCase();
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

// ── KYC Status descriptions ──────────────────────────────────
// african_pending_review: African investor paid, KYC in background
// pending_review:         Diaspora submitted, 24h auto review
// pending_kyc:            Other country, 48-72h manual review
// approved:               KYC cleared, full access
// rejected:               KYC failed, access suspended
// additional_docs:        More documents requested

const investorKYCSchema = new mongoose.Schema({
  investorEmail: {
    type: String, required: true, unique: true,
    trim: true, lowercase: true,
  },
  investorName: { type: String, trim: true },
  countryOfResidence: { type: String, required: true },
  countryCategory: {
    type: String,
    enum: ['african', 'diaspora', 'other'],
    required: true,
  },

  // ── Core status ───────────────────────────────────────────
  status: {
    type: String,
    enum: [
      'not_started',
      'in_progress',
      'african_pending_review', // paid + background KYC review
      'pending_review',         // diaspora 24h review
      'pending_kyc',            // other country 48-72h review
      'additional_docs',        // more documents requested
      'approved',
      'rejected',
      'suspended',              // payment issue or fraud flag
    ],
    default: 'not_started',
  },

  // Has the investor paid? (African = pay first)
  paymentVerified: { type: Boolean, default: false },
  paymentVerifiedAt: { type: Date },
  stripeSessionId: { type: String },

  // Photo ID — required for all diaspora + other countries
  photoIdUploaded: { type: Boolean, default: false },
  photoIdUrl: { type: String },
  photoIdType: {
    type: String,
    enum: ['passport', 'national_id', 'drivers_license',
           'residence_permit'],
  },

  // ── Step 1: Personal Identity ─────────────────────────────
  dateOfBirth: { type: String },
  nationality: { type: String },
  placeOfBirth: { type: String },
  occupation: { type: String },
  employerName: { type: String },

  // ── Step 2: Identity Document ─────────────────────────────
  idType: { type: String },
  idNumber: { type: String },
  idIssuingCountry: { type: String },
  idExpiryDate: { type: String },

  // ── Step 3: Proof of Address ──────────────────────────────
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  stateProvince: { type: String },
  postalCode: { type: String },
  addressDocumentType: { type: String },

  // ── Step 4: Financial Profile ─────────────────────────────
  sourceOfFunds: { type: String },
  sourceOfFundsDetail: { type: String },
  estimatedNetWorthUSD: { type: String },
  annualIncomeUSD: { type: String },
  investmentExperience: { type: String },

  // ── Step 5: Country-specific declarations ─────────────────

  // US — SEC Reg D
  isAccreditedInvestorUS: { type: Boolean },
  accreditedBasisUS: { type: String },

  // UK — FCA
  ukInvestorCategory: { type: String },
  ukSelfCertificationSigned: { type: Boolean },

  // France — AMF
  frenchInvestorCategory: { type: String },
  amfRiskAcknowledgement: { type: Boolean },

  // Canada — CSA
  canadianInvestorCategory: { type: String },
  canadianProvinceOfResidence: { type: String },

  // ── Universal AML/PEP ─────────────────────────────────────
  isPEP: { type: Boolean },
  pepDetails: { type: String },
  hasCriminalRecord: { type: Boolean },
  isUSPerson_FATCA: { type: Boolean },

  // ── Legal agreements ──────────────────────────────────────
  acceptedTerms: { type: Boolean },
  acceptedRiskDisclosure: { type: Boolean },
  acceptedPrivacyPolicy: { type: Boolean },
  digitalSignature: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },

  // ── Review tracking ───────────────────────────────────────
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
  rejectionReason: { type: String },
  reviewNotes: { type: String },
  additionalDocsRequested: { type: String },

  // ── Notification history ──────────────────────────────────
  // Each entry: { type, sentAt, message }
  notifications: [{
    type: { type: String },
    sentAt: { type: Date, default: Date.now },
    message: { type: String },
    channel: {
      type: String,
      enum: ['email', 'sms', 'in_app'],
      default: 'email',
    },
  }],

}, { timestamps: true });

investorKYCSchema.index({ status: 1 });
investorKYCSchema.index({ countryCategory: 1, status: 1 });
investorKYCSchema.index({ submittedAt: -1 });

const InvestorKYC = mongoose.model('InvestorKYC', investorKYCSchema);
export default InvestorKYC;
