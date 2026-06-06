import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function resolveLang(i18n) {
  const code = i18n.resolvedLanguage || i18n.language || 'fr';
  return code.startsWith('fr') ? 'fr' : 'en';
}

function toSentence(text) {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Render plain paragraph blocks. */
function ProseBlocks({ items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <p key={i} className="text-[#333]">
          {toSentence(item)}
        </p>
      ))}
    </div>
  );
}

/** Merge list fragments into flowing prose (no bullet UI). */
function ListAsProse({ items }) {
  if (!items?.length) return null;
  const prose = items.map(toSentence).join(' ');
  return <p className="text-[#333]">{prose}</p>;
}

/**
 * Enterprise legal page shell: dark hero, sticky TOC (desktop), white readable body.
 * Language follows site i18n (FR default) with per-page override toggle.
 */
export function LegalPageLayout({
  titleEn,
  titleFr,
  lastUpdated = 'June 2026',
  sections,
  contactEmail = 'privacy@sahelagriconnect.com',
}) {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(() => resolveLang(i18n));
  const isFr = lang === 'fr';

  useEffect(() => {
    const onChange = () => setLang(resolveLang(i18n));
    i18n.on('languageChanged', onChange);
    setLang(resolveLang(i18n));
    return () => i18n.off('languageChanged', onChange);
  }, [i18n]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            document.querySelectorAll('[data-toc]').forEach((el) => {
              el.classList.toggle('text-[#B5850A]', el.dataset.toc === e.target.id);
              el.classList.toggle('font-semibold', el.dataset.toc === e.target.id);
            });
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <header
        className="relative overflow-hidden text-white print:bg-[#0a1f14]"
        style={{ background: 'linear-gradient(180deg, #0a1f14 0%, #1a3c2e 100%)' }}
      >
        <div className="absolute inset-0 opacity-30 print:hidden" aria-hidden>
          <div
            className="absolute -left-20 top-10 h-64 w-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, #1D9E75 0%, transparent 70%)' }}
          />
          <div
            className="absolute -right-10 bottom-0 h-72 w-72 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, #B5850A 0%, transparent 70%)' }}
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <Link to="/" className="text-sm text-white/60 hover:text-white">
              ← Sahel AgriConnect
            </Link>
            <div className="flex rounded-full border border-white/20 bg-white/5 p-1 backdrop-blur">
              {['fr', 'en'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLang(l);
                    if (l !== resolveLang(i18n)) i18n.changeLanguage(l);
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    lang === l ? 'bg-[#B5850A] text-[#0a1f14]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{isFr ? titleFr : titleEn}</h1>
          <p className="mt-2 text-sm text-white/50">
            {isFr ? 'Dernière mise à jour' : 'Last updated'}: {lastUpdated}
          </p>
          <div className="mt-6 h-1 w-24 rounded-full bg-[#B5850A]" />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
        <nav className="hidden shrink-0 lg:block lg:w-56 print:hidden" aria-label="Table of contents">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1a3c2e]">
              {isFr ? 'Sommaire' : 'Contents'}
            </p>
            <ul className="space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-toc={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="text-left text-[#555] transition hover:text-[#1a3c2e]"
                  >
                    {isFr ? s.titleFr : s.titleEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <article className="min-w-0 flex-1 text-[#333]">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="mb-10 scroll-mt-24 border-b border-gray-100 pb-10 last:border-0"
            >
              <h2 className="mb-4 text-xl font-bold text-[#1a3c2e]">
                {isFr ? section.titleFr : section.titleEn}
              </h2>
              <div className="space-y-4 text-base leading-[1.8]">
                <ProseBlocks items={isFr ? section.paragraphsFr : section.paragraphsEn} />
                {(section.listFr || section.listEn) && (
                  <ListAsProse items={isFr ? section.listFr : section.listEn} />
                )}
                {section.subsections?.map((sub) => (
                  <div key={sub.titleFr || sub.titleEn} className="mt-4">
                    <h3 className="mb-3 font-semibold text-[#1a3c2e]">
                      {isFr ? sub.titleFr : sub.titleEn}
                    </h3>
                    <ProseBlocks items={isFr ? sub.paragraphsFr : sub.paragraphsEn} />
                    {(sub.listFr || sub.listEn) && (
                      <ListAsProse items={isFr ? sub.listFr : sub.listEn} />
                    )}
                  </div>
                ))}
                {section.noticeFr && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {isFr ? section.noticeFr : section.noticeEn}
                  </div>
                )}
              </div>
            </section>
          ))}

          <footer className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm print:border-0">
            <p className="font-semibold text-[#1a3c2e]">Djigui Corporation</p>
            <p className="mt-2">
              {isFr ? 'Courriel' : 'Email'}:{' '}
              <a href={`mailto:${contactEmail}`} className="text-[#B5850A] hover:underline">
                {contactEmail}
              </a>
            </p>
            <p className="mt-1">
              WhatsApp:{' '}
              <a
                href="https://wa.me/12152175381"
                className="text-[#B5850A] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                +1 (215) 217-5381
              </a>
            </p>
            <p className="mt-3 text-gray-500">
              <Link to="/help-center" className="hover:underline">
                {isFr ? 'Centre d\'aide' : 'Help Center'}
              </Link>
              {' · '}
              <Link to="/delete-account" className="hover:underline">
                {isFr ? 'Supprimer mon compte' : 'Delete account'}
              </Link>
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
