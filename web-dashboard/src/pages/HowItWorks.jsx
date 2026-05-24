import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

const STEP_ICONS = ['🌾', '💰', '📈'];
const STEP_VARIANTS = ['default', 'gold', 'green'];

export default function HowItWorks() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);

  const feeRows = t('trust.howItWorks.fees.row1', { returnObjects: true })
    ? [
        t('trust.howItWorks.fees.row1', { returnObjects: true }),
        t('trust.howItWorks.fees.row2', { returnObjects: true }),
        t('trust.howItWorks.fees.row3', { returnObjects: true }),
        t('trust.howItWorks.fees.row4', { returnObjects: true }),
        t('trust.howItWorks.fees.row5', { returnObjects: true }),
        t('trust.howItWorks.fees.row6', { returnObjects: true }),
      ]
    : [];

  const faqs = ['q1', 'q2', 'q3', 'q4', 'q5'];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(165deg, #060f0a 0%, #0d1f17 28%, #1a3c2e 52%, #0a1610 78%, #060f0a 100%)',
      }}
    >
      {/* Ambient orbs */}
      <div
        className="glow-orb-green pointer-events-none absolute -left-32 top-20 h-80 w-80 opacity-80"
        aria-hidden
      />
      <div
        className="glow-orb-gold pointer-events-none absolute -right-24 top-1/3 h-96 w-96 opacity-70"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[120%] -translate-x-1/2 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(181,133,10,0.15) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-14 md:py-20">
        {/* Hero */}
        <header className="mb-16 text-center">
          <p
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: 'rgba(181,133,10,0.12)',
              borderColor: 'rgba(181,133,10,0.35)',
              color: '#e8c96a',
            }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B5850A]" />
            AfriYield Exchange
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
            <span className="text-gradient-gold">{t('trust.howItWorks.title')}</span>
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed md:text-xl"
            style={{ color: 'rgba(245, 240, 232, 0.78)' }}
          >
            {t('trust.howItWorks.subtitle')}
          </p>
        </header>

        {/* Simple version */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold text-white md:text-3xl">
            {t('trust.howItWorks.simple.title')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {['step1', 'step2', 'step3'].map((s, i) => (
              <GlassCard
                key={s}
                variant={STEP_VARIANTS[i]}
                hover
                className="p-6 text-center"
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  {STEP_ICONS[i]}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[#F5F0E8]">
                  {t(`trust.howItWorks.simple.${s}title`)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245, 240, 232, 0.65)' }}>
                  {t(`trust.howItWorks.simple.${s}body`)}
                </p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Detailed FAQ */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold text-white md:text-3xl">
            {t('trust.howItWorks.detailed.title')}
          </h2>
          <div className="space-y-3">
            {faqs.map((q) => {
              const isOpen = open === q;
              return (
                <GlassCard key={q} variant="default" hover={false} className="overflow-hidden p-0">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : q)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="font-semibold text-[#F5F0E8]">
                      {t(`trust.howItWorks.detailed.${q}`)}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-[#B5850A]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-white/40" />
                    )}
                  </button>
                  {isOpen && (
                    <div
                      className="border-t px-5 pb-5 pt-4 leading-relaxed"
                      style={{
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: 'rgba(245, 240, 232, 0.72)',
                      }}
                    >
                      {t(`trust.howItWorks.detailed.a${q.replace('q', '')}`)}
                      {q === 'q5' && (
                        <div className="mt-4 flex flex-wrap gap-4">
                          <a
                            href="https://djiguicorporation.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-[#e8c96a] hover:text-[#f5e6a8] hover:underline"
                          >
                            djiguicorporation.org →
                          </a>
                          <a
                            href="https://isacoultess.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-[#e8c96a] hover:text-[#f5e6a8] hover:underline"
                          >
                            isacoultess.com →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Fee table */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold text-white md:text-3xl">
            {t('trust.howItWorks.fees.title')}
          </h2>
          <GlassCard variant="strong" hover={false} className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(26,60,46,0.95) 0%, rgba(45,90,61,0.9) 50%, rgba(26,60,46,0.95) 100%)',
                    }}
                  >
                    {['col1', 'col2', 'col3'].map((c) => (
                      <th
                        key={c}
                        className="px-4 py-3.5 text-left text-sm font-semibold text-[#F5F0E8]"
                      >
                        {t(`trust.howItWorks.fees.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t transition-colors"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="px-4 py-3.5 text-sm"
                          style={{ color: 'rgba(245, 240, 232, 0.85)' }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="border-t px-4 py-4"
              style={{
                borderColor: 'rgba(181,133,10,0.2)',
                background: 'rgba(181,133,10,0.08)',
              }}
            >
              <p className="text-sm font-semibold text-[#e8c96a]">
                ✓ {t('trust.howItWorks.fees.note')}
              </p>
            </div>
          </GlassCard>
        </section>

        {/* Agreement */}
        <section className="mb-12">
          <GlassCard variant="gold" hover className="p-6 md:p-8">
            <h3 className="mb-3 text-xl font-bold text-[#F5F0E8]">
              {t('trust.howItWorks.agreement.title')}
            </h3>
            <p className="mb-5 leading-relaxed" style={{ color: 'rgba(245, 240, 232, 0.72)' }}>
              {t('trust.howItWorks.agreement.body')}
            </p>
            <a
              href="mailto:info@djiguicorporation.org?subject=Investment Agreement Sample Request"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #B5850A 0%, #d4a017 50%, #8a6410 100%)',
                color: '#0d1f17',
                boxShadow: '0 4px 20px rgba(181,133,10,0.35)',
              }}
            >
              {t('trust.howItWorks.agreement.cta')} →
            </a>
          </GlassCard>
        </section>

        {/* Regulatory */}
        <GlassCard variant="default" hover={false} className="p-5 md:p-6">
          <p className="mb-2 text-sm font-semibold text-[#F5F0E8]">
            {t('trust.howItWorks.regulatory.title')}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(245, 240, 232, 0.55)' }}>
            {t('trust.howItWorks.regulatory.body')}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
