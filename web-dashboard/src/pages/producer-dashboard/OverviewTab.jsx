import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CROP_EMOJIS } from './constants';
import { coopSupplyStatus, mapFarmerQualityToCert } from './utils';

function OverviewTab({
  isFr,
  profile,
  cooperative,
  listings,
  onOpenListings,
  onDeclareProduction,
}) {
  const certLevel = mapFarmerQualityToCert(profile?.qualityLevel || profile?.certification);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-[#1a3c2e] mb-4">{isFr ? '📋 Statut du profil' : '📋 Profile Status'}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: isFr ? 'Profil' : 'Profile',
              value: profile ? (isFr ? 'Vérifié' : 'Verified') : isFr ? 'En attente' : 'Pending',
              color: profile ? 'text-green-600' : 'text-yellow-600',
              bg: profile ? 'bg-green-50' : 'bg-yellow-50',
              icon: profile ? '✅' : '⏳',
            },
            {
              label: isFr ? 'Coopérative' : 'Cooperative',
              value: cooperative || (isFr ? 'Non membre' : 'Not a member'),
              color: cooperative ? 'text-[#1a3c2e]' : 'text-gray-400',
              bg: cooperative ? 'bg-[#1a3c2e]/5' : 'bg-gray-50',
              icon: cooperative ? '🤝' : '➕',
            },
            {
              label: isFr ? 'Certification' : 'Certification',
              value: certLevel !== 'None' ? certLevel : isFr ? 'Aucune' : 'None',
              color: certLevel !== 'None' ? 'text-amber-600' : 'text-gray-400',
              bg: certLevel !== 'None' ? 'bg-amber-50' : 'bg-gray-50',
              icon: '⭐',
            },
            {
              label: isFr ? 'Annonces' : 'Listings',
              value: `${listings.length} ${isFr ? 'produits' : 'products'}`,
              color: listings.length > 0 ? 'text-[#1a3c2e]' : 'text-gray-400',
              bg: listings.length > 0 ? 'bg-[#1a3c2e]/5' : 'bg-gray-50',
              icon: '📦',
            },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className={`rounded-xl p-3 text-center ${bg}`}>
              <span className="text-2xl">{icon}</span>
              <p className={`font-bold text-sm mt-1 ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onDeclareProduction}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-dashed border-[#1a3c2e]/30 hover:border-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition text-left"
        >
          <Plus className="w-8 h-8 text-[#1a3c2e] shrink-0" />
          <div>
            <p className="font-semibold text-[#1a3c2e] text-sm">
              {isFr ? 'Déclarer ma production' : 'Declare production'}
            </p>
            <p className="text-xs text-gray-400">{isFr ? 'Pour ma coopérative' : 'For my cooperative'}</p>
          </div>
        </button>
        <Link
          to="/farmer-needs"
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#B5850A]/40 hover:bg-[#B5850A]/5 transition"
        >
          <span className="text-3xl shrink-0">🌾</span>
          <div>
            <p className="font-semibold text-[#1a3c2e] text-sm">
              {isFr ? 'Soumettre un besoin' : 'Submit a need'}
            </p>
            <p className="text-xs text-gray-400">{isFr ? 'Équipement, formation...' : 'Equipment, training...'}</p>
          </div>
        </Link>
        <Link
          to="/cooperatives"
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#B5850A]/40 hover:bg-[#B5850A]/5 transition"
        >
          <span className="text-3xl shrink-0">🤝</span>
          <div>
            <p className="font-semibold text-[#1a3c2e] text-sm">
              {isFr ? 'Rejoindre une coopérative' : 'Join a cooperative'}
            </p>
            <p className="text-xs text-gray-400">{isFr ? 'Voir les services' : 'View services'}</p>
          </div>
        </Link>
      </div>

      {listings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1a3c2e]">{isFr ? '📦 Dernières annonces' : '📦 Recent Listings'}</h3>
            <button type="button" onClick={onOpenListings} className="text-xs text-[#B5850A] hover:underline">
              {isFr ? 'Voir tout →' : 'View all →'}
            </button>
          </div>
          <div className="space-y-2">
            {listings.slice(0, 3).map((l) => {
              const st = coopSupplyStatus(l, isFr);
              return (
                <div key={l._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CROP_EMOJIS[l.commodity] || '🌾'}</span>
                    <div>
                      <p className="font-medium text-sm text-[#1a3c2e]">{l.commodity}</p>
                      <p className="text-xs text-gray-400">
                        {l.quantityKg?.toLocaleString()} kg · ${l.pricePerKgUSD}/kg
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(OverviewTab);
