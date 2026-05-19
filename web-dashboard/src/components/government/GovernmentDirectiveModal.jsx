import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import GovernmentOfficialKycFields from './GovernmentOfficialKycFields';
import { DIRECTIVE_TYPES, emptyOfficialKyc } from './governmentConstants';
import { regionsByCountry } from '../../data/sahelRegions';

export default function GovernmentDirectiveModal({
  open,
  onClose,
  isFr,
  admin,
  cooperatives,
  initialType = 'policy_directive',
  headers,
  apiBase,
  onCreated,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState(() => emptyOfficialKyc(admin));
  const [form, setForm] = useState({
    directiveType: initialType,
    title: '',
    titleFr: '',
    body: '',
    bodyFr: '',
    targetAudience: ['farmers', 'cooperatives'],
    targetRegions: [],
    assignedCooperativeIds: [],
    priority: 'high',
    broadcastNow: true,
  });

  if (!open) return null;

  const regionOptions = regionsByCountry[admin?.country] || regionsByCountry.Mali || ['Autre'];
  const dt = DIRECTIVE_TYPES.find((t) => t.key === form.directiveType);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch(`${apiBase}/api/government/directives`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...form, officialKyc: kyc }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      onCreated?.(d.directive);
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1a3c2e] text-lg">
            {dt?.emoji} {isFr ? dt?.fr : dt?.en}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">{isFr ? 'Type d’action' : 'Action type'}</span>
            <select
              value={form.directiveType}
              onChange={(e) => setForm((p) => ({ ...p, directiveType: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {DIRECTIVE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.emoji} {isFr ? t.fr : t.en}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-700">{isFr ? 'Titre' : 'Title'} *</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Titre (FR)</span>
            <input
              value={form.titleFr}
              onChange={(e) => setForm((p) => ({ ...p, titleFr: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-700">{isFr ? 'Contenu de la directive' : 'Directive content'} *</span>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-700">
              {isFr ? 'Régions ciblées (vide = national)' : 'Target regions (empty = national)'}
            </span>
            <select
              multiple
              value={form.targetRegions}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  targetRegions: Array.from(e.target.selectedOptions, (o) => o.value),
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white min-h-[88px]"
            >
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          {(form.directiveType === 'export_opportunity' ||
            form.directiveType === 'project_delegation' ||
            form.directiveType === 'coop_registration_drive') && (
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">
                {isFr ? 'Coopératives désignées' : 'Assigned cooperatives'}
              </span>
              <select
                multiple
                value={form.assignedCooperativeIds}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    assignedCooperativeIds: Array.from(e.target.selectedOptions, (o) => o.value),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white min-h-[88px]"
              >
                {cooperatives.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.cooperativeName || c.nomCooperative}
                  </option>
                ))}
              </select>
            </label>
          )}

          <GovernmentOfficialKycFields kyc={kyc} setKyc={setKyc} isFr={isFr} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.broadcastNow}
              onChange={(e) => setForm((p) => ({ ...p, broadcastNow: e.target.checked }))}
            />
            {isFr ? 'Diffuser immédiatement aux acteurs ciblés' : 'Broadcast immediately to targeted actors'}
          </label>

          {error ? <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-[#1a3c2e] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isFr ? 'Signer et envoyer' : 'Sign & submit'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 rounded-xl border border-gray-200 text-sm">
              {isFr ? 'Annuler' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
