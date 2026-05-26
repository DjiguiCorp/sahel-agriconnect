import { memo } from 'react';
import { CROP_EMOJIS } from './constants';
import { coopSupplyStatus } from './utils';

function ListingCard({ listing: l, isFr }) {
  const st = coopSupplyStatus(l, isFr);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{CROP_EMOJIS[l.commodity] || '🌾'}</span>
          <div className="min-w-0">
            <p className="font-bold text-[#1a3c2e]">{l.commodity}</p>
            <p className="text-xs text-gray-400">
              {l.qualityGrade} Grade · {l.certificationLevel}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.cls}`}>
          {st.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center bg-gray-50 rounded-lg p-2">
          <p className="font-bold font-mono text-[#1a3c2e]">{l.quantityKg?.toLocaleString()}</p>
          <p className="text-xs text-gray-400">kg</p>
        </div>
        <div className="text-center bg-gray-50 rounded-lg p-2">
          <p className="font-bold font-mono text-[#B5850A]">${l.pricePerKgUSD}</p>
          <p className="text-xs text-gray-400">/kg</p>
        </div>
        <div className="text-center bg-gray-50 rounded-lg p-2">
          <p className="font-bold font-mono text-green-600">
            ${((l.pricePerKgUSD || 0) * (l.quantityKg || 0)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">{isFr ? 'valeur' : 'value'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-1">
        <span>
          👁 {l.viewCount || 0} {isFr ? 'vues' : 'views'}
        </span>
        <span>
          💬 {l.inquiryCount || 0} {isFr ? 'demandes' : 'inquiries'}
        </span>
        <span>{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}</span>
      </div>
    </div>
  );
}

export default memo(ListingCard);
