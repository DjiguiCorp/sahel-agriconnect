import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Mail,
  Globe,
  MessageCircle,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import DownloadAppBanner from '../components/DownloadAppBanner';
import { useTranslation } from 'react-i18next';

const WHATSAPP = 'https://wa.me/12152175381';

const FAQS = [
  {
    qFr: 'Comment créer un compte agriculteur ?',
    qEn: 'How do I create a farmer account?',
    aFr:
      'Téléchargez l\'application, sélectionnez « Agriculteur » et entrez votre email ou numéro de téléphone pour recevoir un lien de connexion.',
    aEn:
      'Download the app, select Farmer, and enter your email or phone number to receive a magic sign-in link.',
  },
  {
    qFr: 'Comment s\'inscrire en tant que coopérative ?',
    qEn: 'How do I register as a cooperative?',
    aFr:
      'Visitez sahelagriconnect.com/cooperative-registration sur ordinateur. Le paiement s\'effectue via le navigateur web.',
    aEn:
      'Visit sahelagriconnect.com/cooperative-registration on your computer. Payment is processed via the web browser.',
  },
  {
    qFr: 'Comment fonctionne AfriYield Exchange ?',
    qEn: 'How does AfriYield Exchange work?',
    aFr:
      'AfriYield Exchange permet aux investisseurs de la diaspora d\'investir dans des coopératives agricoles certifiées avec protection escrow.',
    aEn:
      'AfriYield Exchange lets diaspora investors fund certified agricultural cooperatives with escrow protection.',
  },
  {
    qFr: 'Mes données sont-elles sécurisées ?',
    qEn: 'Is my data secure?',
    aFr:
      'Oui. Toutes les données sont chiffrées en transit et au repos. Nous respectons le RGPD et les normes OHADA.',
    aEn:
      'Yes. All data is encrypted in transit and at rest. We comply with GDPR and OHADA data protection standards.',
  },
  {
    qFr: 'Comment supprimer mon compte ?',
    qEn: 'How do I delete my account?',
    aFr:
      'Visitez sahelagriconnect.com/delete-account ou contactez privacy@sahelagriconnect.com. Les agriculteurs peuvent aussi supprimer depuis l\'app → Compte.',
    aEn:
      'Visit sahelagriconnect.com/delete-account or email privacy@sahelagriconnect.com. Farmers can also delete from the app Account tab.',
  },
];

function GlassPanel({ children, className = '', glow = 'rgba(29,158,117,0.3)' }) {
  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${glow}`,
        boxShadow: `0 0 24px ${glow.replace('0.3', '0.08')}`,
      }}
    >
      {children}
    </div>
  );
}

function ContactCard({ icon: Icon, title, subtitle, button, href, glow, accent }) {
  return (
    <GlassPanel glow={glow} className="group flex flex-col">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: `${accent}22`, color: accent }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition group-hover:brightness-110"
        style={{ background: `${accent}33`, border: `1px solid ${accent}55` }}
      >
        {button}
        <ExternalLink className="h-4 w-4 opacity-70" />
      </a>
    </GlassPanel>
  );
}

export default function HelpCenter() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || 'fr').startsWith('fr');
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) =>
        f.qEn.toLowerCase().includes(q) ||
        f.qFr.toLowerCase().includes(q) ||
        f.aEn.toLowerCase().includes(q) ||
        f.aFr.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: '#0a1f14' }}
    >
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="help-hero-gradient absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #1D9E75 0%, transparent 70%)' }}
        />
        <div
          className="help-hero-gradient absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #B5850A 0%, transparent 70%)',
            animationDelay: '2s',
          }}
        />
        <div
          className="help-hero-gradient absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            animationDelay: '4s',
          }}
        />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="help-particle absolute h-1 w-1 rounded-full bg-white/20"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 10) % 60}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Hero */}
        <section className="help-fade-in mb-14 text-center">
          <h1
            className="text-4xl font-bold md:text-5xl"
            style={{
              background: 'linear-gradient(90deg, #1D9E75, #B5850A, #1D9E75)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'help-gradient-shift 6s ease infinite',
            }}
          >
            Centre d&apos;aide / Help Center
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Assistance pour agriculteurs, coopératives et investisseurs — FR / EN
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(29,158,117,0.3)',
              }}
            >
              <Search className="h-5 w-5 text-[#1D9E75]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher / Search help..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Download */}
        <section className="help-fade-in mb-14">
          <DownloadAppBanner isFr={isFr} />
        </section>

        {/* Contact */}
        <section className="help-fade-in mb-14">
          <h2 className="mb-6 text-center text-xl font-bold">Contact Support</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <ContactCard
              icon={MessageCircle}
              title="WhatsApp Support"
              subtitle="Réponse en moins de 24h / Response within 24h"
              button="Contacter via WhatsApp"
              href={WHATSAPP}
              glow="rgba(37,211,102,0.35)"
              accent="#25D366"
            />
            <ContactCard
              icon={Mail}
              title="Email Support"
              subtitle="support@sahelagriconnect.com"
              button="Envoyer un email"
              href="mailto:support@sahelagriconnect.com"
              glow="rgba(96,165,250,0.35)"
              accent="#60a5fa"
            />
            <ContactCard
              icon={Globe}
              title="Site Web"
              subtitle="sahelagriconnect.com"
              button="Visiter sahelagriconnect.com"
              href="https://sahelagriconnect.com"
              glow="rgba(181,133,10,0.35)"
              accent="#B5850A"
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="help-fade-in mb-14">
          <h2 className="mb-6 text-xl font-bold">FAQ / Questions fréquentes</h2>
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <p className="text-center text-white/50">No results / Aucun résultat</p>
            ) : (
              filteredFaqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <GlassPanel key={faq.qEn} glow="rgba(29,158,117,0.25)">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 text-left"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                    >
                      <div>
                        <p className="font-semibold text-white">{faq.qFr}</p>
                        <p className="mt-1 text-sm text-white/50">{faq.qEn}</p>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#1D9E75] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{ maxHeight: open ? '400px' : '0', opacity: open ? 1 : 0 }}
                    >
                      <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed text-white/80">
                        {faq.aFr}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/50">{faq.aEn}</p>
                    </div>
                  </GlassPanel>
                );
              })
            )}
          </div>
        </section>

        {/* Footer links */}
        <footer className="help-fade-in border-t border-white/10 pt-8 text-center text-sm text-white/50">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/privacy-policy" className="hover:text-[#B5850A]">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-[#B5850A]">
              Terms of Service
            </Link>
            <Link to="/user-agreement" className="hover:text-[#B5850A]">
              User Agreement
            </Link>
            <Link to="/delete-account" className="hover:text-[#B5850A]">
              Delete Account
            </Link>
          </div>
          <p className="mt-4">© {new Date().getFullYear()} Djigui Corporation</p>
        </footer>
      </div>
    </div>
  );
}
