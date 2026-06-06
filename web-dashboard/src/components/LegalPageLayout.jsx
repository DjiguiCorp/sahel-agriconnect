import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Enterprise legal page shell: dark hero, sticky TOC (desktop), white readable body.
 */
export function LegalPageLayout({
  titleEn,
  titleFr,
  lastUpdated = 'June 2026',
  sections,
  contactEmail = 'privacy@sahelagriconnect.com',
}) {
  const [lang, setLang] = useState('en');
  const isFr = lang === 'fr';

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
      {/* Hero */}
      <header
        className="relative overflow-hidden text-white print:bg-[#0a1f14]"
        style={{
          background: 'linear-gradient(180deg, #0a1f14 0%, #1a3c2e 100%)',
        }}
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
              {['en', 'fr'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
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
        {/* TOC sidebar */}
        <nav
          className="hidden shrink-0 lg:block lg:w-56 print:hidden"
          aria-label="Table of contents"
        >
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

        {/* Body */}
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
                {(isFr ? section.paragraphsFr : section.paragraphsEn)?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {section.listEn && (
                  <ul className="list-disc space-y-2 pl-6">
                    {(isFr ? section.listFr : section.listEn).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.subsections?.map((sub) => (
                  <div key={sub.titleEn} className="mt-4">
                    <h3 className="mb-2 font-semibold text-[#1a3c2e]">
                      {isFr ? sub.titleFr : sub.titleEn}
                    </h3>
                    {(isFr ? sub.paragraphsFr : sub.paragraphsEn)?.map((p, i) => (
                      <p key={i} className="mb-2">
                        {p}
                      </p>
                    ))}
                    {sub.listEn && (
                      <ul className="list-disc space-y-1 pl-6">
                        {(isFr ? sub.listFr : sub.listEn).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {section.noticeEn && (
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
              Email:{' '}
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
                Help Center
              </Link>
              {' · '}
              <Link to="/delete-account" className="hover:underline">
                Delete account
              </Link>
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
