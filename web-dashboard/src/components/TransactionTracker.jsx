import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

export default function TransactionTracker({ investorEmail }) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!investorEmail) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/escrow/investor/${encodeURIComponent(investorEmail)}`)
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [investorEmail]);

  const statusIcon = (status) => {
    if (status === 'released' || status === 'verified')
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === 'missed' || status === 'disputed')
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (status === 'under_review')
      return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />;
    return <Clock className="w-5 h-5 text-white/20" />;
  };

  const statusLabel = (s) =>
    ({
      pending: isFr ? 'En attente' : 'Pending',
      under_review: isFr ? 'En révision' : 'Under review',
      verified: isFr ? 'Vérifié' : 'Verified',
      released: isFr ? 'Libéré' : 'Released',
      missed: isFr ? 'Manqué' : 'Missed',
      disputed: isFr ? 'En litige' : 'Disputed',
    }[s] || s);

  const overallProgress = (tx) => {
    const released = tx.milestones?.filter((m) => m.status === 'released').length || 0;
    return Math.round((released / (tx.milestones?.length || 3)) * 100);
  };

  if (loading)
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-white/30 mx-auto" />
      </div>
    );

  if (transactions.length === 0)
    return (
      <div
        className="text-center py-10 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-3xl mb-3">🔒</p>
        <p className="text-white/40 text-sm">
          {isFr ? 'Aucune transaction escrow active.' : 'No active escrow transactions.'}
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      {transactions.map((tx) => {
        const progress = overallProgress(tx);
        const isExpanded = expanded === tx._id;
        return (
          <div
            key={tx._id}
            className="rounded-2xl overflow-hidden cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => setExpanded(isExpanded ? null : tx._id)}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{tx.supplierName}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {tx.track} · ${tx.totalAmountUSD?.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: progress === 100 ? '#4ade80' : '#B5850A' }}>
                    {progress}%
                  </p>
                  <p className="text-xs text-white/30">{isFr ? 'complété' : 'complete'}</p>
                </div>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: progress === 100 ? '#4ade80' : 'linear-gradient(90deg, #B5850A, #d4a017)',
                  }}
                />
              </div>
            </div>

            {isExpanded && (
              <div className="px-5 pb-5 pt-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-white/30 uppercase tracking-widest mt-4 mb-3">
                  {isFr ? 'Jalons escrow' : 'Escrow milestones'}
                </p>
                <div className="space-y-3">
                  {(tx.milestones || []).map((m, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      {statusIcon(m.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-white">{m.label}</p>
                          <span className="text-xs text-white/40">{statusLabel(m.status)}</span>
                        </div>
                        {m.amountUSD > 0 && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: m.status === 'released' ? '#4ade80' : '#B5850A' }}
                          >
                            ${m.amountUSD?.toLocaleString()} ({m.percentOfTotal}%)
                          </p>
                        )}
                        {m.inspectorNotes && (
                          <p className="text-xs text-white/30 mt-1 italic">{m.inspectorNotes}</p>
                        )}
                        {m.verifiedDate && (
                          <p className="text-xs text-white/20 mt-1">
                            {new Date(m.verifiedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-white/30 mb-1">{isFr ? 'Frais AfriYield (7.5%)' : 'AfriYield fee (7.5%)'}</p>
                    <p className="font-bold text-white">${tx.afriyieldFeeUSD?.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-white/30 mb-1">{isFr ? 'Agent escrow' : 'Escrow agent'}</p>
                    <p className="font-bold text-white">{tx.escrowAgent}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
