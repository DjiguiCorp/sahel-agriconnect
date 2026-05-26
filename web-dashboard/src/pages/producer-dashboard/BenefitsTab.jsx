import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, DollarSign, Droplets, Thermometer, Tractor } from 'lucide-react';
import { mapFarmerQualityToCert } from './utils';

function BenefitsTab({ isFr, profile, cooperative }) {
  const certLevel = mapFarmerQualityToCert(profile?.qualityLevel || profile?.certification);

  const benefits = useMemo(
    () => [
      {
        key: 'tractor',
        icon: <Tractor className="w-5 h-5" />,
        label: isFr ? 'Accès tracteur' : 'Tractor Access',
        progress: cooperative ? 60 : 20,
        status: cooperative
          ? isFr
            ? 'Via coopérative'
            : 'Via cooperative'
          : isFr
            ? 'Rejoindre une coop.'
            : 'Join a cooperative',
        color: '#1a3c2e',
        action: cooperative ? '/farmer-needs' : '/cooperatives',
        actionLabel: cooperative ? (isFr ? 'Réserver' : 'Book') : isFr ? 'Rejoindre' : 'Join',
      },
      {
        key: 'cold_storage',
        icon: <Thermometer className="w-5 h-5" />,
        label: isFr ? 'Stockage frigorifique' : 'Cold Storage',
        progress: certLevel !== 'None' ? 70 : cooperative ? 40 : 10,
        status:
          certLevel !== 'None'
            ? isFr
              ? 'Certifié — éligible'
              : 'Certified — eligible'
            : isFr
              ? 'Certification requise'
              : 'Certification needed',
        color: '#3b82f6',
        action: '/farmer-certification',
        actionLabel: isFr ? 'Certifier' : 'Get Certified',
      },
      {
        key: 'training',
        icon: <BookOpen className="w-5 h-5" />,
        label: isFr ? 'Formations' : 'Training',
        progress: cooperative ? 50 : 25,
        status: cooperative
          ? isFr
            ? 'Disponible via coop.'
            : 'Available via coop.'
          : isFr
            ? 'Rejoindre une coop.'
            : 'Join a cooperative',
        color: '#8b5cf6',
        action: '/farmer-needs',
        actionLabel: isFr ? 'Demander' : 'Request',
      },
      {
        key: 'irrigation',
        icon: <Droplets className="w-5 h-5" />,
        label: isFr ? 'Irrigation' : 'Irrigation',
        progress: cooperative ? 45 : 15,
        status: isFr ? 'Demande possible' : 'Request available',
        color: '#0ea5e9',
        action: '/farmer-needs',
        actionLabel: isFr ? 'Demander' : 'Request',
      },
      {
        key: 'micro_loan',
        icon: <DollarSign className="w-5 h-5" />,
        label: isFr ? 'Micro-financement' : 'Micro-loan',
        progress: cooperative && certLevel !== 'None' ? 80 : cooperative ? 35 : 5,
        status:
          cooperative && certLevel !== 'None'
            ? isFr
              ? 'Éligible via AfriYield'
              : 'Eligible via AfriYield'
            : isFr
              ? 'Certification + coop. requises'
              : 'Cert. + coop. needed',
        color: '#B5850A',
        action: '/afri-yield',
        actionLabel: 'AfriYield',
      },
    ],
    [isFr, cooperative, certLevel]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-[#1a3c2e]">
          {isFr ? 'Mes avantages coopératifs' : 'My Cooperative Benefits'}
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          {isFr
            ? 'Votre progression vers chaque avantage. Rejoignez une coopérative et obtenez une certification pour débloquer plus.'
            : 'Your progress toward each benefit. Join a cooperative and get certified to unlock more.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {benefits.map((b) => (
          <div key={b.key} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: b.color }}
              >
                {b.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1a3c2e] text-sm">{b.label}</p>
                <p className="text-xs text-gray-400">{b.status}</p>
              </div>
              <span className="text-lg font-bold font-mono shrink-0" style={{ color: b.color }}>
                {b.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${b.progress}%`, background: b.color }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400 flex-1 min-w-0">
                {b.progress < 30
                  ? isFr
                    ? '💡 Rejoignez une coopérative pour avancer'
                    : '💡 Join a cooperative to progress'
                  : b.progress < 70
                    ? isFr
                      ? '✓ Bonne progression'
                      : '✓ Good progress'
                    : isFr
                      ? '🎉 Presque éligible !'
                      : '🎉 Almost eligible!'}
              </p>
              <Link to={b.action} className="text-xs font-semibold shrink-0 hover:underline" style={{ color: b.color }}>
                {b.actionLabel} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h4 className="font-bold text-[#1a3c2e] mb-4">
          ⭐ {isFr ? 'Parcours de certification' : 'Certification Pathway'}
        </h4>
        <div className="flex items-center gap-2 mb-3">
          {['None', 'Local', 'Regional', 'International'].map((level, idx) => {
            const levels = ['None', 'Local', 'Regional', 'International'];
            const currentIndex = levels.indexOf(certLevel);
            const done = currentIndex > idx;
            const active = currentIndex === idx;
            return (
              <div key={level} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex-1 h-3 rounded-full ${done || active ? '' : 'bg-gray-200'}`}
                  style={{
                    background: done ? '#1a3c2e' : active ? '#B5850A' : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-3">
          {['None', 'Local', 'Regional', 'International'].map((lev) => (
            <span key={lev} className={certLevel === lev ? 'text-[#B5850A] font-bold' : ''}>
              {lev}
            </span>
          ))}
        </div>
        {certLevel === 'None' && (
          <Link
            to="/farmer-certification"
            className="block w-full text-center py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: '#B5850A' }}
          >
            {isFr ? '⭐ Commencer la certification' : '⭐ Start Certification'}
          </Link>
        )}
      </div>
    </div>
  );
}

export default memo(BenefitsTab);
