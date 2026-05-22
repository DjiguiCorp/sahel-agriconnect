import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Data We Collect',
    content: `We collect: full name, phone number, email address, 
country and region, crop types and quantities declared, 
investment activity, device locale, and usage analytics.`,
  },
  {
    title: '2. How We Use Your Data',
    content: `Your data is used to: verify your identity, match 
you with relevant cooperatives and investors, display 
market prices, send notifications, and improve the Platform.`,
  },
  {
    title: '3. Data Sharing',
    content: `We share your data only with: cooperatives and 
investors you explicitly engage with, payment processors 
for transactions, and authorities when required by law. 
We NEVER sell your data to third parties.`,
  },
  {
    title: '4. Data Retention',
    content: `We retain your data for as long as your account 
is active. Upon deletion request, data is removed within 
30 days except where legally required to retain it.`,
  },
  {
    title: '5. Your Rights (GDPR)',
    content: `EU and diaspora users have the right to: access 
their data, correct inaccuracies, request deletion, 
object to processing, and data portability. 
Contact: privacy@sahelagriconnect.com`,
  },
  {
    title: '6. Cookies',
    content: `We use cookies for session management and 
authentication only. We do not use advertising or 
tracking cookies. You can disable cookies in your 
browser but this may affect functionality.`,
  },
  {
    title: '7. Security',
    content: `We use industry-standard encryption (HTTPS/TLS) 
for all data transmission. Passwords are hashed and never 
stored in plain text. We conduct regular security audits.`,
  },
  {
    title: "8. Children's Privacy",
    content: `The Platform is not intended for users under 18. 
We do not knowingly collect data from minors. If you 
believe a minor has registered, contact us immediately.`,
  },
  {
    title: '9. Contact',
    content: `Privacy Officer: privacy@sahelagriconnect.com
Data deletion: support@sahelagriconnect.com`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen text-white" style={{ background: 'transparent' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-brand-amber text-sm mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
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
