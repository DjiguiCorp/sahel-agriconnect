export default function PrivacyPolicy() {
  return (
    <div className="bg-brand-cream min-h-[60vh]">
      <section className="section-container py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a3c2e] mb-3">Politique de confidentialité</h1>
          <p className="text-gray-600 mb-10">Last updated: May 2026</p>

          <div className="space-y-10 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">1. Data We Collect</h2>
              <p>
                Registration data (name, email, phone, location, crop information). Usage data (AI tool queries, page
                visits). Investment data (amounts, preferences, transaction history).
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">2. How We Use Your Data</h2>
              <p>
                To operate the platform and connect you with relevant partners. To send notifications about your
                registration, certifications, and matches. To generate anonymized aggregate statistics for platform
                improvement. We never sell personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">3. Data Storage</h2>
              <p>
                Data is stored on MongoDB Atlas cloud infrastructure. Country-licensed data is isolated per country
                environment. All data is encrypted in transit (HTTPS) and at rest.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">4. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You may request a copy of your data at any time.</li>
                <li>You may request deletion of your account and data.</li>
                <li>You may opt out of notifications while retaining your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">5. Cookies</h2>
              <p>
                We use minimal session cookies for authentication only. No advertising or tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">6. Third-Party Services</h2>
              <p>
                We use Resend for email delivery, Google Gemini for AI features, and Twilio for WhatsApp notifications.
                Each service has its own privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">7. Data Retention</h2>
              <p>
                Active account data is retained while your account is active. Deleted account data is purged within 30
                days.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">8. Children</h2>
              <p>
                The platform is not intended for users under 18.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1a3c2e] mb-3">9. Contact</h2>
              <p>
                Privacy questions: <span className="font-semibold">info@djiguicorporation.org</span>
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

