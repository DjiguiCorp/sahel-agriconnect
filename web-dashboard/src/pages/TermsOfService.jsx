import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SECTIONS = [
  {
    title: '1. Introduction',
    content: `Sahel AgriConnect ("Platform") is an agricultural commerce platform connecting farmers, cooperatives, investors, and processors across West Africa and the global diaspora. By accessing or using our Platform, you agree to be bound by these Terms of Service.`,
  },
  {
    title: '2. Eligibility',
    content: `You must be at least 18 years of age to use this Platform. By registering, you confirm that all information provided is accurate, current, and complete. Accounts found to contain false information will be permanently suspended.`,
  },
  {
    title: '3. Account Registration & Vetting',
    content: `All accounts are subject to a vetting process before full access is granted. This process ensures the security and quality of our platform community. Vetting typically takes 24–48 hours. We reserve the right to deny access to any applicant without explanation.`,
  },
  {
    title: '4. Acceptable Use',
    content: `You agree not to misuse the Platform. Prohibited activities include: manipulating market prices, submitting false produce declarations, impersonating other users, engaging in fraudulent transactions, or using the Platform for any unlawful purpose.`,
  },
  {
    title: '5. Agricultural Declarations',
    content: `Farmers and cooperatives agree to declare produce quantities and qualities accurately. False declarations may result in immediate account suspension and potential legal action under applicable local law.`,
  },
  {
    title: '6. AfriYield Exchange & Investments',
    content: `Investment features are subject to additional terms. Returns are not guaranteed. The Platform acts as a marketplace and is not a licensed financial institution. Users invest at their own risk and should seek independent financial advice.`,
  },
  {
    title: '7. Intellectual Property',
    content: `All content, branding, and technology on the Platform is the property of Sahel AgriConnect / DjiguiCorp. You may not reproduce, distribute, or create derivative works without explicit written permission.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `The Platform is not liable for losses arising from commercial transactions between users, market price fluctuations, system downtime, or data breaches caused by third parties. Our maximum liability is limited to fees paid in the preceding 3 months.`,
  },
  {
    title: '9. Termination',
    content: `We reserve the right to suspend or terminate any account that violates these Terms, without prior notice. Users may request account deletion by contacting support@sahelagriconnect.com.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms are governed by the laws of Mali for users in West Africa. EU/diaspora users are additionally protected by applicable GDPR provisions. Disputes shall be resolved through good-faith negotiation before any legal proceedings.`,
  },
  {
    title: '11. Contact',
    content: `For legal inquiries: legal@sahelagriconnect.com
For support: support@sahelagriconnect.com
Website: https://sahelagriconnect.com`,
  },
];

export default function TermsOfService() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  return (
    <div className="min-h-screen text-white" style={{ background: 'transparent' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-brand-amber text-sm mb-8 inline-block">
          ← {isFr ? "Retour à l'accueil" : 'Back to Home'}
        </Link>
        <h1 className="text-3xl font-bold mb-2">
          {isFr ? "Conditions d'utilisation" : 'Terms of Service'}
        </h1>
        <p className="text-white/50 text-sm mb-10">
          {isFr ? 'Dernière mise à jour : mai 2026' : 'Last updated: May 2026'}
        </p>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-lg font-semibold text-brand-amber mb-3">
              {section.title}
            </h2>
            <p className="text-white/80 leading-relaxed text-sm whitespace-pre-line">
              {section.content}
            </p>
          </div>
        ))}

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-brand-amber mb-3">
            {isFr ? 'Traitement des paiements' : 'Payment Processing'}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm mb-3">
            {isFr
              ? "Tous les paiements liés aux investissements sur AfriYield Exchange sont traités exclusivement via le portail web sécurisé à l'adresse afriyieldexchange.com. L'application mobile Sahel AgriConnect ne collecte, ne traite ni ne stocke aucune information de paiement. Cette séparation garantit la conformité réglementaire et la sécurité maximale de vos fonds."
              : 'All investment-related payments on AfriYield Exchange are processed exclusively through the secure web portal at afriyieldexchange.com. The Sahel AgriConnect mobile application does not collect, process, or store any payment information. This separation ensures regulatory compliance and maximum security of your funds.'}
          </p>
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm font-medium">
              💳{' '}
              {isFr
                ? "Méthodes de paiement acceptées: Virement bancaire international, WISE, Zelle (US uniquement), Mobile Money (Afrique de l'Ouest)"
                : 'Accepted payment methods: International wire transfer, WISE, Zelle (US only), Mobile Money (West Africa)'}
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-brand-amber mb-3">
            {isFr ? 'Avertissements sur les investissements' : 'Investment Disclaimers'}
          </h2>
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4 mb-4">
            <p className="text-amber-200 font-bold text-sm mb-2">⚠️ NOTICE</p>
            <ul className="text-amber-100/90 text-sm space-y-2 list-none">
              <li>
                •{' '}
                {isFr
                  ? "AfriYield Exchange n'est pas une institution financière agréée ou un courtier-négociant enregistré."
                  : 'AfriYield Exchange is not a licensed financial institution or registered broker-dealer.'}
              </li>
              <li>
                •{' '}
                {isFr
                  ? 'Les rendements projetés sont basés sur les performances historiques et ne constituent PAS une garantie.'
                  : 'Projected returns are based on historical performance and do NOT constitute a guarantee.'}
              </li>
              <li>
                •{' '}
                {isFr
                  ? 'Les investissements comportent des risques incluant la perte totale ou partielle du capital.'
                  : 'Investments carry risks including total or partial loss of capital.'}
              </li>
              <li>
                •{' '}
                {isFr
                  ? "Nous recommandons de consulter un conseiller financier qualifié avant d'investir."
                  : 'We recommend consulting a qualified financial advisor before investing.'}
              </li>
              <li>
                •{' '}
                {isFr
                  ? 'Les performances passées ne présagent pas des performances futures.'
                  : 'Past performance does not predict future results.'}
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-brand-amber mb-3">
            {isFr ? 'Conformité réglementaire' : 'Regulatory Compliance'}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm mb-3">
            {isFr
              ? "Sahel AgriConnect et AfriYield Exchange opèrent en consultation avec les directives de la BCEAO et poursuivent l'approbation du sandbox CREPMF. Les investisseurs domiciliés aux États-Unis, au Royaume-Uni, en France ou au Canada sont soumis aux réglementations de leurs juridictions respectives et doivent s'assurer de leur conformité avant d'investir."
              : "Sahel AgriConnect and AfriYield Exchange operate in consultation with BCEAO guidelines and are pursuing CREPMF sandbox approval. Investors domiciled in the United States, United Kingdom, France, or Canada are subject to their respective jurisdiction's regulations and must ensure their compliance before investing."}
          </p>
          <p className="text-white/80 leading-relaxed text-sm">
            {isFr
              ? 'Pour toute question de conformité: compliance@sahelagriconnect.com'
              : 'For compliance inquiries: compliance@sahelagriconnect.com'}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-brand-amber mb-3">7. Investment Risk Disclosure</h2>
          <p className="text-white/70 leading-relaxed text-sm mb-3">
            AfriYield Exchange is an investment facilitation platform, NOT a licensed broker-dealer,
            investment adviser, or financial institution. All investment opportunities are presented
            for informational purposes only.
          </p>
          <ul className="text-white/70 text-sm space-y-2 list-disc pl-5">
            <li>
              Agricultural investments carry substantial risk including potential total loss of
              invested capital.
            </li>
            <li>
              Projected returns are estimates based on historical cooperative performance and are NOT
              guaranteed.
            </li>
            <li>Past performance does not predict future results.</li>
            <li>
              A 5% facilitation fee applies to all capital successfully deployed through AfriYield
              Exchange.
            </li>
            <li>
              Investors are solely responsible for their own due diligence before committing capital.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-brand-amber mb-3">
            8. Regulatory Compliance by Jurisdiction
          </h2>
          <ul className="text-white/70 text-sm space-y-2 list-disc pl-5">
            <li>
              <strong className="text-white">United States:</strong> Investment opportunities are
              available only to Accredited Investors as defined under SEC Rule 501 of Regulation D.
              Non-accredited US investors may not participate.
            </li>
            <li>
              <strong className="text-white">United Kingdom:</strong> Investors must self-certify as
              High Net Worth, Sophisticated, or Restricted investors per FCA regulations before
              accessing investment opportunities.
            </li>
            <li>
              <strong className="text-white">France:</strong> Investors acknowledge receipt of risk
              disclosures required by the Autorité des marchés financiers (AMF).
            </li>
            <li>
              <strong className="text-white">Canada:</strong> Investors must qualify as Accredited
              Investors under NI 45-106 or as Eligible Investors per applicable provincial securities
              law.
            </li>
            <li>
              <strong className="text-white">African countries:</strong> Investors are subject to
              applicable national securities regulations and KYC/AML requirements.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-brand-amber mb-3">9. KYC / AML Compliance</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            All investors must complete identity verification (KYC) before investing. Sahel
            AgriConnect complies with anti-money laundering (AML) regulations applicable in all
            operating jurisdictions. Investor identity documents are retained securely for regulatory
            compliance and are never shared with third parties except as required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-brand-amber mb-3">10. Escrow and Payment</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            Investment funds are processed through Stripe (card payments) or wire transfer to AfriYield
            Exchange accounts held by Djigui Corporation. Funds are held in escrow and released to
            cooperative partners in verified milestones. Stripe is a licensed payment processor. Djigui
            Corporation is not a licensed bank or financial institution.
          </p>
        </section>
      </div>
    </div>
  );
}
