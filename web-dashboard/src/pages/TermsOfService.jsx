import { Link } from 'react-router-dom';

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
  return (
    <div className="min-h-screen bg-brand-forest text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-brand-amber text-sm mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/50 text-sm mb-10">Last updated: May 2026</p>

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
      </div>
    </div>
  );
}