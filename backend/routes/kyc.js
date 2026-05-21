import express from 'express';
import InvestorKYC, { getCountryCategory } from '../models/InvestorKYC.js';
import Investor from '../models/Investor.js';
import {
  sendKYCSubmissionConfirmation,
  sendKYCApproved,
  sendKYCRejected,
  sendKYCAdditionalDocs,
  notifyAdminKYCSubmission,
} from '../services/kycEmailService.js';

const router = express.Router();

// ── POST /api/kyc/submit ─────────────────────────────────────
// Submit KYC — behavior differs by country category
router.post('/submit', async (req, res) => {
  try {
    const {
      investorEmail, investorName, countryOfResidence,
      dateOfBirth, nationality, placeOfBirth,
      occupation, employerName,
      idType, idNumber, idIssuingCountry, idExpiryDate,
      addressLine1, addressLine2, city,
      stateProvince, postalCode, addressDocumentType,
      sourceOfFunds, sourceOfFundsDetail,
      estimatedNetWorthUSD, annualIncomeUSD,
      investmentExperience,
      isAccreditedInvestorUS, accreditedBasisUS,
      ukInvestorCategory, ukSelfCertificationSigned,
      frenchInvestorCategory, amfRiskAcknowledgement,
      canadianInvestorCategory, canadianProvinceOfResidence,
      isPEP, pepDetails, hasCriminalRecord,
      isUSPerson_FATCA, acceptedTerms,
      acceptedRiskDisclosure, acceptedPrivacyPolicy,
      digitalSignature,
    } = req.body;

    if (!investorEmail || !countryOfResidence) {
      return res.status(400).json({
        success: false,
        error: 'investorEmail and countryOfResidence are required',
      });
    }

    const category = getCountryCategory(countryOfResidence);

    // Determine KYC status based on country category
    let status;
    let accessGranted = false;
    let reviewHours;

    if (category === 'african') {
      // African: KYC submitted, reviewed in background
      // Access already granted when they paid
      status = 'african_pending_review';
      accessGranted = true;
      reviewHours = '48-72';
    } else if (category === 'diaspora') {
      // US/UK/France/Canada: must wait for approval
      status = 'pending_review';
      accessGranted = false;
      reviewHours = '24';
    } else {
      // All others: full manual review
      status = 'pending_kyc';
      accessGranted = false;
      reviewHours = '48-72';
    }

    const kyc = await InvestorKYC.findOneAndUpdate(
      { investorEmail: investorEmail.toLowerCase() },
      {
        investorEmail: investorEmail.toLowerCase(),
        investorName,
        countryOfResidence,
        countryCategory: category,
        status,
        dateOfBirth, nationality, placeOfBirth,
        occupation, employerName,
        idType, idNumber, idIssuingCountry, idExpiryDate,
        addressLine1, addressLine2, city,
        stateProvince, postalCode, addressDocumentType,
        sourceOfFunds, sourceOfFundsDetail,
        estimatedNetWorthUSD, annualIncomeUSD,
        investmentExperience,
        isAccreditedInvestorUS, accreditedBasisUS,
        ukInvestorCategory, ukSelfCertificationSigned,
        frenchInvestorCategory, amfRiskAcknowledgement,
        canadianInvestorCategory, canadianProvinceOfResidence,
        isPEP, pepDetails, hasCriminalRecord,
        isUSPerson_FATCA, acceptedTerms,
        acceptedRiskDisclosure, acceptedPrivacyPolicy,
        digitalSignature,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        submittedAt: new Date(),
        $push: {
          notifications: {
            type: 'kyc_submitted',
            message: `KYC submitted. Status: ${status}.`,
            sentAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    // Update main Investor record
    await Investor.findOneAndUpdate(
      { email: investorEmail.toLowerCase() },
      {
        kycStatus: status,
        kycSubmittedAt: new Date(),
      }
    );

    // Send emails
    try {
      // Confirmation to investor
      await sendKYCSubmissionConfirmation({
        email: investorEmail,
        name: investorName,
        country: countryOfResidence,
        category,
        reviewHours,
        status,
      });

      // Notify admin team
      await notifyAdminKYCSubmission({
        email: investorEmail,
        name: investorName,
        country: countryOfResidence,
        category,
        status,
        isPEP,
        hasCriminalRecord,
        accreditedBasisUS,
      });
    } catch (emailErr) {
      console.error('KYC email error:', emailErr.message);
      // Don't fail the request if email fails
    }

    return res.json({
      success: true,
      status,
      category,
      accessGranted,
      reviewHours,
      message: category === 'african'
        ? 'KYC received. Your access continues uninterrupted. You will be notified of your verification outcome.'
        : `KYC submitted. Please allow ${reviewHours} hours for review. You will be notified by email.`,
    });
  } catch (e) {
    console.error('KYC submit error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── GET /api/kyc/status/:email ───────────────────────────────
router.get('/status/:email', async (req, res) => {
  try {
    const kyc = await InvestorKYC.findOne({
      investorEmail: req.params.email.toLowerCase(),
    }).select('status countryCategory paymentVerified ' +
      'submittedAt reviewedAt rejectionReason ' +
      'countryOfResidence photoIdUploaded ' +
      'additionalDocsRequested notifications');

    if (!kyc) {
      return res.json({
        success: true,
        status: 'not_started',
        category: null,
      });
    }

    return res.json({
      success: true,
      status: kyc.status,
      category: kyc.countryCategory,
      paymentVerified: kyc.paymentVerified,
      photoIdUploaded: kyc.photoIdUploaded,
      submittedAt: kyc.submittedAt,
      reviewedAt: kyc.reviewedAt,
      rejectionReason: kyc.rejectionReason,
      additionalDocsRequested: kyc.additionalDocsRequested,
      country: kyc.countryOfResidence,
      notifications: kyc.notifications?.slice(-5), // last 5
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── GET /api/kyc/admin/pending ───────────────────────────────
router.get('/admin/pending', async (req, res) => {
  try {
    const filter = req.query.category
      ? { status: { $in: ['african_pending_review',
          'pending_review', 'pending_kyc', 'additional_docs'] },
          countryCategory: req.query.category }
      : { status: { $in: ['african_pending_review',
          'pending_review', 'pending_kyc', 'additional_docs'] } };

    const pending = await InvestorKYC.find(filter)
      .sort({ submittedAt: 1 })
      .select('investorEmail investorName countryOfResidence ' +
        'countryCategory status submittedAt idType ' +
        'isPEP hasCriminalRecord photoIdUploaded ' +
        'accreditedBasisUS paymentVerified');

    // Group by category for admin clarity
    const grouped = {
      african: pending.filter(k => k.countryCategory === 'african'),
      diaspora: pending.filter(k => k.countryCategory === 'diaspora'),
      other: pending.filter(k => k.countryCategory === 'other'),
      total: pending.length,
    };

    return res.json({ success: true, kycs: pending, grouped });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── POST /api/kyc/admin/review ───────────────────────────────
router.post('/admin/review', async (req, res) => {
  try {
    const {
      investorEmail, decision, reviewNotes,
      rejectionReason, additionalDocsRequested, reviewedBy,
    } = req.body;

    if (!['approved', 'rejected', 'additional_docs']
        .includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'decision must be approved, rejected, or additional_docs',
      });
    }

    const kyc = await InvestorKYC.findOneAndUpdate(
      { investorEmail: investorEmail.toLowerCase() },
      {
        status: decision,
        reviewedAt: new Date(),
        reviewedBy,
        reviewNotes,
        rejectionReason: decision === 'rejected'
          ? rejectionReason : undefined,
        additionalDocsRequested: decision === 'additional_docs'
          ? additionalDocsRequested : undefined,
        $push: {
          notifications: {
            type: `kyc_${decision}`,
            message: decision === 'approved'
              ? 'Your KYC has been approved.'
              : decision === 'rejected'
                ? `KYC rejected: ${rejectionReason}`
                : `Additional documents required: ${additionalDocsRequested}`,
            sentAt: new Date(),
          },
        },
      },
      { new: true }
    );

    // Update investor record
    await Investor.findOneAndUpdate(
      { email: investorEmail.toLowerCase() },
      { kycStatus: decision, kycReviewedAt: new Date() }
    );

    // Send notification to investor
    try {
      if (decision === 'approved') {
        await sendKYCApproved({
          email: investorEmail,
          name: kyc.investorName,
          category: kyc.countryCategory,
        });
      } else if (decision === 'rejected') {
        await sendKYCRejected({
          email: investorEmail,
          name: kyc.investorName,
          reason: rejectionReason,
        });
      } else if (decision === 'additional_docs') {
        await sendKYCAdditionalDocs({
          email: investorEmail,
          name: kyc.investorName,
          docsRequired: additionalDocsRequested,
        });
      }
    } catch (emailErr) {
      console.error('KYC review email error:', emailErr.message);
    }

    return res.json({ success: true, kyc });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── POST /api/kyc/mark-payment-verified ─────────────────────
// Called by Stripe webhook when African investor pays
router.post('/mark-payment-verified', async (req, res) => {
  try {
    const { investorEmail, stripeSessionId } = req.body;
    await InvestorKYC.findOneAndUpdate(
      { investorEmail: investorEmail.toLowerCase() },
      {
        paymentVerified: true,
        paymentVerifiedAt: new Date(),
        stripeSessionId,
        $push: {
          notifications: {
            type: 'payment_verified',
            message: 'Payment confirmed. Full access granted.',
            sentAt: new Date(),
          },
        },
      },
      { upsert: true }
    );
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
