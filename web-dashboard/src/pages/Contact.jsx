import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

const API = API_BASE_URL.replace(/\/$/, '');

export default function Contact() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const subjects = [
    { value: 'general', fr: 'Question générale', en: 'General inquiry' },
    { value: 'partnership', fr: 'Partenariat & coopération', en: 'Partnership & cooperation' },
    { value: 'investment', fr: 'Investissement AfriYield', en: 'AfriYield investment' },
    { value: 'technical', fr: 'Support technique', en: 'Technical support' },
    { value: 'press', fr: 'Presse & médias', en: 'Press & media' },
    { value: 'government', fr: 'Portail gouvernemental', en: 'Government portal' },
    { value: 'compliance', fr: 'Conformité & KYC', en: 'Compliance & KYC' },
  ];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError(
        isFr ? 'Nom, email et message sont requis' : 'Name, email and message are required'
      );
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Request failed');
      setSent(true);
    } catch {
      setError(
        isFr
          ? "Erreur lors de l'envoi. Réessayez ou envoyez un email directement."
          : 'Error sending. Please retry or email us directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
  };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <section
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% 0%,
              rgba(40,100,60,0.55) 0%,
              rgba(20,50,35,0.3) 45%,
              transparent 70%)
          `,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
        className="py-16"
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'rgba(29,158,117,0.1)',
              color: '#1D9E75',
              borderColor: 'rgba(29,158,117,0.3)',
            }}
          >
            ✉️ Contact
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? "Contactez l'équipe Sahel AgriConnect" : 'Contact the Sahel AgriConnect Team'}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {isFr
              ? 'Nous sommes là pour répondre à toutes vos questions — partenariats, investissements, support technique ou tout autre sujet.'
              : "We're here to answer all your questions — partnerships, investments, technical support or anything else."}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-white font-bold text-lg mb-4">
                {isFr ? 'Nos coordonnées' : 'Our Contact Info'}
              </h2>
              {[
                {
                  icon: Mail,
                  label: 'Email',
                  value: 'info@djiguicorporation.org',
                  href: 'mailto:info@djiguicorporation.org',
                  color: '#B5850A',
                },
                {
                  icon: Mail,
                  label: isFr ? 'Conformité / KYC' : 'Compliance / KYC',
                  value: 'compliance@sahelagriconnect.com',
                  href: 'mailto:compliance@sahelagriconnect.com',
                  color: '#3b82f6',
                },
                {
                  icon: MapPin,
                  label: isFr ? 'Siège social' : 'Headquarters',
                  value: 'Djigui Corporation',
                  href: null,
                  color: '#1D9E75',
                },
                {
                  icon: Clock,
                  label: isFr ? 'Temps de réponse' : 'Response time',
                  value: isFr ? '24-48 heures ouvrables' : '24-48 business hours',
                  href: null,
                  color: '#a78bfa',
                },
              ].map(({ icon: Icon, label, value, href, color }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-4 rounded-xl border mb-3"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.14)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {label}
                    </p>
                    {href ? (
                      <a href={href} className="text-sm font-medium hover:underline" style={{ color }}>
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-white/70">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3
                className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3"
              >
                {isFr ? 'Liens rapides' : 'Quick Links'}
              </h3>
              {[
                {
                  label: isFr ? "S'inscrire comme agriculteur" : 'Register as farmer',
                  to: '/inscription',
                },
                {
                  label: isFr ? 'Inscrire une coopérative' : 'Register cooperative',
                  to: '/cooperative-registration',
                },
                { label: 'AfriYield Exchange', to: '/afri-yield' },
                {
                  label: isFr ? 'Portail gouvernemental' : 'Government portal',
                  to: '/government-portal',
                },
              ].map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 text-sm py-2 transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  <span style={{ color: '#1D9E75' }}>→</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <div
              className="rounded-2xl border p-6 md:p-8"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.14)',
              }}
            >
              {sent ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
                  <h3 className="text-white font-bold text-xl mb-2">
                    {isFr ? 'Message envoyé !' : 'Message Sent!'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {isFr
                      ? 'Nous avons bien reçu votre message. Vous recevrez une réponse dans les 24-48 heures ouvrables.'
                      : 'We received your message. You will receive a reply within 24-48 business hours.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setForm({ name: '', email: '', subject: 'general', message: '' });
                    }}
                    className="mt-6 px-6 py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    {isFr ? 'Nouveau message' : 'New message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <h2 className="text-white font-bold text-xl mb-6">
                    {isFr ? '✉️ Envoyer un message' : '✉️ Send a Message'}
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      ['name', isFr ? 'Nom complet *' : 'Full Name *', isFr ? 'Votre nom' : 'Your name', 'text'],
                      ['email', 'Email *', 'votre@email.com', 'email'],
                    ].map(([field, label, placeholder, type]) => (
                      <div key={field}>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                          {label}
                        </label>
                        <input
                          type={type}
                          required={field === 'name' || field === 'email'}
                          value={form[field]}
                          onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-xl text-white text-sm px-4 py-3 focus:outline-none focus:border-green-500/50 placeholder:text-white/30"
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {isFr ? 'Sujet' : 'Subject'}
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                      className="w-full rounded-xl text-white text-sm px-4 py-3 focus:outline-none focus:border-green-500/50"
                      style={inputStyle}
                    >
                      {subjects.map((s) => (
                        <option key={s.value} value={s.value} className="bg-brand-midGreen">
                          {isFr ? s.fr : s.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {isFr ? 'Message *' : 'Message *'}
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder={
                        isFr ? 'Décrivez votre demande en détail...' : 'Describe your request in detail...'
                      }
                      className="w-full rounded-xl text-white text-sm px-4 py-3 focus:outline-none resize-none focus:border-green-500/50 placeholder:text-white/30"
                      style={inputStyle}
                    />
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90"
                    style={{ background: '#1D9E75', color: 'black' }}
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin">⟳</span>
                        {isFr ? 'Envoi...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {isFr ? 'Envoyer le message' : 'Send Message'}
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    🔒 {isFr ? 'Vos informations sont protégées.' : 'Your information is protected.'}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
