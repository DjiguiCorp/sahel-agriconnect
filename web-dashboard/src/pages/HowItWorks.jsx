import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a3c2e] mb-4">{t('trust.howItWorks.title')}</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">{t('trust.howItWorks.subtitle')}</p>
      </div>

      {/* Simple version */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-[#1a3c2e] mb-6">{t('trust.howItWorks.simple.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {['step1', 'step2', 'step3'].map((s, i) => (
            <div
              key={s}
              className="rounded-2xl p-6 text-center"
              style={{ background: i === 1 ? '#1a3c2e' : '#F5F0E8' }}
            >
              <div className="text-4xl mb-3">{['🌾', '💰', '📈'][i]}</div>
              <h3 className={`font-bold text-lg mb-2 ${i === 1 ? 'text-white' : 'text-[#1a3c2e]'}`}>
                {t(`trust.howItWorks.simple.${s}title`)}
              </h3>
              <p className={`text-sm leading-relaxed ${i === 1 ? 'text-white/70' : 'text-gray-600'}`}>
                {t(`trust.howItWorks.simple.${s}body`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed FAQ */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-[#1a3c2e] mb-6">{t('trust.howItWorks.detailed.title')}</h2>
        <div className="space-y-3">
          {faqs.map((q) => (
            <div key={q} className="rounded-2xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === q ? null : q)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-[#1a3c2e]">{t(`trust.howItWorks.detailed.${q}`)}</span>
                {open === q ? (
                  <ChevronUp className="w-5 h-5 text-[#B5850A] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {open === q && (
                <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                  {t(`trust.howItWorks.detailed.a${q.replace('q', '')}`)}
                  {q === 'q5' && (
                    <div className="flex gap-3 mt-3">
                      <a
                        href="https://djiguicorporation.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#B5850A] hover:underline"
                      >
                        djiguicorporation.org →
                      </a>
                      <a
                        href="https://isacoultess.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#B5850A] hover:underline"
                      >
                        isacoultess.com →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fee table */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-[#1a3c2e] mb-6">{t('trust.howItWorks.fees.title')}</h2>
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#1a3c2e' }}>
                {['col1', 'col2', 'col3'].map((c) => (
                  <th key={c} className="text-white text-left px-4 py-3 text-sm font-semibold">
                    {t(`trust.howItWorks.fees.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-[#1a3c2e] font-semibold">✓ {t('trust.howItWorks.fees.note')}</p>
          </div>
        </div>
      </div>

      {/* Agreement */}
      <div className="mb-14 rounded-2xl p-6" style={{ background: '#F5F0E8', borderLeft: '4px solid #1a3c2e' }}>
        <h3 className="font-bold text-[#1a3c2e] text-lg mb-2">{t('trust.howItWorks.agreement.title')}</h3>
        <p className="text-gray-600 mb-4">{t('trust.howItWorks.agreement.body')}</p>
        <a
          href="mailto:info@djiguicorporation.org?subject=Investment Agreement Sample Request"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: '#1a3c2e' }}
        >
          {t('trust.howItWorks.agreement.cta')} →
        </a>
      </div>

      {/* Regulatory */}
      <div className="rounded-2xl p-5 bg-gray-100 border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-1">{t('trust.howItWorks.regulatory.title')}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{t('trust.howItWorks.regulatory.body')}</p>
      </div>
    </div>
  );
}

