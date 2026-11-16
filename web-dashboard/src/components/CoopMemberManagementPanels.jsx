import { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Download } from 'lucide-react';
import { CROP_CATALOG, cropLabel } from '../lib/crops';

const INPUT =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

export const DUES_METHOD_OPTIONS = [
  { value: 'orange_money', fr: 'Orange Money', en: 'Orange Money' },
  { value: 'wave', fr: 'Wave', en: 'Wave' },
  { value: 'mtn', fr: 'MTN', en: 'MTN' },
  { value: 'cash', fr: 'Espèces', en: 'Cash' },
  { value: 'bank_transfer', fr: 'Virement', en: 'Bank transfer' },
  { value: 'other', fr: 'Autre', en: 'Other' },
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function methodLabel(value, isFr) {
  const opt = DUES_METHOD_OPTIONS.find((o) => o.value === value);
  return opt ? (isFr ? opt.fr : opt.en) : value || '—';
}

function emptyManualForm() {
  return {
    fullName: '',
    phone: '',
    village: '',
    region: '',
    cropTypes: [],
    hectares: '',
    notes: '',
  };
}

function emptyDuesForm(defaults = {}) {
  const now = new Date();
  return {
    memberKey: '',
    memberType: 'platform',
    memberId: '',
    memberName: '',
    amount: defaults.amount ?? '',
    currency: 'XOF',
    paymentMethod: 'orange_money',
    paymentReference: '',
    periodMonth: now.getMonth() + 1,
    periodYear: now.getFullYear(),
    notes: '',
  };
}

export function ManualMembersPanel({ API, headers, isFr, onChanged }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | member
  const [form, setForm] = useState(emptyManualForm());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/cooperatives/my-portal/manual-members`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMembers(d.members || []);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyManualForm());
    setErr('');
    setModal('create');
  };

  const openEdit = (m) => {
    setForm({
      fullName: m.fullName || '',
      phone: m.phone || '',
      village: m.village || '',
      region: m.region || '',
      cropTypes: Array.isArray(m.cropTypes) ? [...m.cropTypes] : [],
      hectares: m.hectares != null ? String(m.hectares) : '',
      notes: m.notes || '',
    });
    setErr('');
    setModal(m);
  };

  const toggleCrop = (en) => {
    setForm((f) => ({
      ...f,
      cropTypes: f.cropTypes.includes(en)
        ? f.cropTypes.filter((c) => c !== en)
        : [...f.cropTypes, en],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setErr(isFr ? 'Le nom est obligatoire.' : 'Full name is required.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const body = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        village: form.village.trim(),
        region: form.region.trim(),
        cropTypes: form.cropTypes,
        hectares: form.hectares === '' ? null : Number(form.hectares),
        notes: form.notes.trim(),
      };
      const isEdit = modal && modal !== 'create';
      const url = isEdit
        ? `${API}/api/cooperatives/my-portal/manual-members/${modal._id}`
        : `${API}/api/cooperatives/my-portal/manual-members`;
      const r = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setModal(null);
      load();
      onChanged?.();
    } catch (ex) {
      setErr(ex.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m) => {
    if (
      !window.confirm(
        isFr
          ? `Supprimer ${m.fullName} ?`
          : `Delete ${m.fullName}?`
      )
    ) {
      return;
    }
    try {
      const r = await fetch(`${API}/api/cooperatives/my-portal/manual-members/${m._id}`, {
        method: 'DELETE',
        headers,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      load();
      onChanged?.();
    } catch (ex) {
      alert(ex.message || 'Error');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {members.length}{' '}
          {isFr
            ? 'membres hors-plateforme enregistrés'
            : 'offline members registered'}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-3 py-2 rounded-xl"
          style={{ background: '#1a3c2e' }}
        >
          <Plus className="w-4 h-4" />
          {isFr ? 'Ajouter manuellement' : 'Add manually'}
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#1a3c2e] mx-auto" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">
          {isFr
            ? 'Aucun membre hors-plateforme. Ajoutez ceux qui ne sont pas encore inscrits.'
            : 'No offline members yet. Add members who are not on the platform.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  isFr ? 'Nom' : 'Name',
                  isFr ? 'Village' : 'Village',
                  isFr ? 'Téléphone' : 'Phone',
                  isFr ? 'Cultures' : 'Crops',
                  '',
                ].map((h) => (
                  <th
                    key={h || 'actions'}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-medium text-[#1a3c2e]">
                    {m.fullName}
                    {m.platformLinked ? (
                      <span className="ml-2 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                        {isFr ? 'Lié' : 'Linked'}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{m.village || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{m.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {(m.cropTypes || []).map((c) => cropLabel(c, isFr)).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                      aria-label="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(m)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1a3c2e] text-lg">
                {modal === 'create'
                  ? isFr
                    ? 'Ajouter un membre'
                    : 'Add member'
                  : isFr
                    ? 'Modifier le membre'
                    : 'Edit member'}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Nom complet *' : 'Full name *'}
                </label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className={INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Téléphone' : 'Phone'}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Hectares' : 'Hectares'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.hectares}
                    onChange={(e) => setForm((f) => ({ ...f, hectares: e.target.value }))}
                    className={INPUT}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Village' : 'Village'}
                  </label>
                  <input
                    value={form.village}
                    onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Région' : 'Region'}
                  </label>
                  <input
                    value={form.region}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Cultures' : 'Crops'}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto border border-gray-200 rounded-xl p-2">
                  {CROP_CATALOG.map((c) => {
                    const on = form.cropTypes.includes(c.en);
                    return (
                      <button
                        key={c.en}
                        type="button"
                        onClick={() => toggleCrop(c.en)}
                        className={`text-xs px-2 py-1 rounded-lg border ${
                          on
                            ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {isFr ? c.fr : c.en}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Notes' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className={`${INPUT} resize-none`}
                />
              </div>
              {err ? <p className="text-red-500 text-xs">{err}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: '#1a3c2e' }}
              >
                {busy ? '...' : isFr ? 'Enregistrer' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function DuesPaymentsPanel({
  API,
  headers,
  isFr,
  platformMembers = [],
  suggestedAmount = '',
  prefillMember = null,
  onPrefillConsumed,
  onStatusChange,
}) {
  const now = new Date();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [manualMembers, setManualMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMethod, setFilterMethod] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => emptyDuesForm({ amount: suggestedAmount }));
  const [memberSearch, setMemberSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const months = isFr ? MONTHS_FR : MONTHS_EN;
  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y, y - 1, y - 2, y - 3];
  }, [now]);

  const memberOptions = useMemo(() => {
    const platform = (platformMembers || []).map((f) => ({
      key: `platform:${f._id}`,
      memberType: 'platform',
      memberId: String(f._id),
      memberName: f.nom || '—',
      label: `${f.nom || '—'} (${isFr ? 'plateforme' : 'platform'})`,
    }));
    const manual = (manualMembers || []).map((m) => ({
      key: `manual:${m._id}`,
      memberType: 'manual',
      memberId: String(m._id),
      memberName: m.fullName || '—',
      label: `${m.fullName || '—'} (${isFr ? 'hors-plateforme' : 'offline'})`,
    }));
    return [...platform, ...manual];
  }, [platformMembers, manualMembers, isFr]);

  const filteredOptions = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return memberOptions.slice(0, 40);
    return memberOptions.filter((m) => m.memberName.toLowerCase().includes(q)).slice(0, 40);
  }, [memberOptions, memberSearch]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterMonth) qs.set('month', String(filterMonth));
      if (filterYear) qs.set('year', String(filterYear));
      if (filterMethod) qs.set('method', filterMethod);

      const [payRes, sumRes, manRes] = await Promise.all([
        fetch(`${API}/api/cooperatives/my-portal/dues-payments?${qs}`, { headers }),
        fetch(
          `${API}/api/cooperatives/my-portal/dues-summary?month=${filterMonth}&year=${filterYear}`,
          { headers }
        ),
        fetch(`${API}/api/cooperatives/my-portal/manual-members`, { headers }),
      ]);
      const payD = await payRes.json().catch(() => ({}));
      const sumD = await sumRes.json().catch(() => ({}));
      const manD = await manRes.json().catch(() => ({}));
      if (payD.success) setPayments(payD.payments || []);
      if (sumD.success) {
        setSummary(sumD);
        onStatusChange?.(sumD.statusByMember || {});
      }
      if (manD.success) setManualMembers(manD.members || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear, filterMethod]);

  useEffect(() => {
    if (!prefillMember) return;
    setForm(
      emptyDuesForm({
        amount: suggestedAmount,
      })
    );
    setForm((f) => ({
      ...f,
      memberKey: `${prefillMember.memberType}:${prefillMember.memberId}`,
      memberType: prefillMember.memberType,
      memberId: prefillMember.memberId,
      memberName: prefillMember.memberName,
      amount: suggestedAmount || f.amount,
    }));
    setMemberSearch(prefillMember.memberName || '');
    setErr('');
    setModalOpen(true);
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillMember]);

  const openModal = () => {
    setForm(emptyDuesForm({ amount: suggestedAmount }));
    setMemberSearch('');
    setErr('');
    setModalOpen(true);
  };

  const selectMember = (opt) => {
    setForm((f) => ({
      ...f,
      memberKey: opt.key,
      memberType: opt.memberType,
      memberId: opt.memberId,
      memberName: opt.memberName,
    }));
    setMemberSearch(opt.memberName);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.memberId || !form.memberName) {
      setErr(isFr ? 'Sélectionnez un membre.' : 'Select a member.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const r = await fetch(`${API}/api/cooperatives/my-portal/dues-payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          memberType: form.memberType,
          memberId: form.memberId,
          memberName: form.memberName,
          amount: Number(form.amount),
          currency: form.currency || 'XOF',
          paymentMethod: form.paymentMethod,
          paymentReference: form.paymentReference,
          periodMonth: Number(form.periodMonth),
          periodYear: Number(form.periodYear),
          notes: form.notes,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setModalOpen(false);
      loadAll();
    } catch (ex) {
      setErr(ex.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const removePayment = async (p) => {
    if (
      !window.confirm(
        isFr
          ? `Supprimer le paiement de ${p.memberName} ?`
          : `Delete payment for ${p.memberName}?`
      )
    ) {
      return;
    }
    try {
      const r = await fetch(`${API}/api/cooperatives/my-portal/dues-payments/${p._id}`, {
        method: 'DELETE',
        headers,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      loadAll();
    } catch (ex) {
      alert(ex.message || 'Error');
    }
  };

  const exportCsv = () => {
    const rows = [
      [
        'Membre',
        'Montant',
        'Devise',
        'Méthode',
        'Référence',
        'Période',
        'Date',
        'Notes',
      ].join(','),
      ...payments.map((p) =>
        [
          `"${(p.memberName || '').replace(/"/g, '""')}"`,
          p.amount,
          p.currency || 'XOF',
          p.paymentMethod,
          `"${(p.paymentReference || '').replace(/"/g, '""')}"`,
          `${p.periodMonth}/${p.periodYear}`,
          p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '',
          `"${(p.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dues-${filterYear}-${String(filterMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-3 text-sm bg-[#1a3c2e]/5 rounded-xl px-4 py-3 border border-[#1a3c2e]/10">
        <span>
          {isFr ? 'Total collecté ce mois' : 'Collected this month'}:{' '}
          <strong className="font-mono">
            {Number(summary?.totalCollected || 0).toLocaleString()} XOF
          </strong>
        </span>
        <span className="text-gray-300">|</span>
        <span>
          {isFr ? 'Membres à jour' : 'Members up to date'}:{' '}
          <strong>{summary?.paidThisMonth ?? '—'}</strong>
        </span>
        <span className="text-gray-300">|</span>
        <span>
          {isFr ? 'En attente' : 'Pending'}:{' '}
          <strong>{summary?.unpaidThisMonth ?? '—'}</strong>
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            {isFr ? 'Mois' : 'Month'}
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className={INPUT}
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            {isFr ? 'Année' : 'Year'}
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className={INPUT}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            {isFr ? 'Méthode' : 'Method'}
          </label>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className={INPUT}
          >
            <option value="">{isFr ? 'Toutes' : 'All'}</option>
            {DUES_METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {isFr ? o.fr : o.en}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-3 py-2.5 rounded-xl ml-auto"
          style={{ background: '#1a3c2e' }}
        >
          <Plus className="w-4 h-4" />
          {isFr ? 'Enregistrer un paiement' : 'Record payment'}
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#1a3c2e] mx-auto" />
        </div>
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">
          {isFr ? 'Aucun paiement enregistré.' : 'No payments recorded.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  isFr ? 'Membre' : 'Member',
                  isFr ? 'Montant' : 'Amount',
                  isFr ? 'Méthode' : 'Method',
                  isFr ? 'Référence' : 'Reference',
                  isFr ? 'Période' : 'Period',
                  isFr ? 'Date' : 'Date',
                  '',
                ].map((h) => (
                  <th
                    key={h || 'actions'}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-medium text-[#1a3c2e]">{p.memberName}</td>
                  <td className="px-4 py-3 font-mono">
                    {Number(p.amount).toLocaleString()} {p.currency || 'XOF'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {methodLabel(p.paymentMethod, isFr)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.paymentReference || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.periodMonth}/{p.periodYear}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removePayment(p)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1a3c2e] text-lg">
                💰 {isFr ? 'Enregistrer un paiement' : 'Record payment'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Membre' : 'Member'}
                </label>
                <input
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setForm((f) => ({
                      ...f,
                      memberKey: '',
                      memberId: '',
                      memberName: '',
                    }));
                  }}
                  placeholder={isFr ? 'Rechercher par nom…' : 'Search by name…'}
                  className={INPUT}
                />
                {memberSearch && !form.memberId ? (
                  <div className="mt-1 max-h-36 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                    {filteredOptions.length === 0 ? (
                      <p className="text-xs text-gray-400 px-3 py-2">
                        {isFr ? 'Aucun résultat' : 'No results'}
                      </p>
                    ) : (
                      filteredOptions.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => selectMember(opt)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        >
                          {opt.label}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
                {form.memberId ? (
                  <p className="text-xs text-green-700 mt-1 font-medium">✓ {form.memberName}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Montant' : 'Amount'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Devise' : 'Currency'}
                  </label>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Méthode' : 'Method'}
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  className={INPUT}
                >
                  {DUES_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {isFr ? o.fr : o.en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Référence / reçu' : 'Reference / receipt'}
                </label>
                <input
                  value={form.paymentReference}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentReference: e.target.value }))
                  }
                  className={INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Mois' : 'Month'}
                  </label>
                  <select
                    value={form.periodMonth}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodMonth: Number(e.target.value) }))
                    }
                    className={INPUT}
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Année' : 'Year'}
                  </label>
                  <select
                    value={form.periodYear}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodYear: Number(e.target.value) }))
                    }
                    className={INPUT}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Notes' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className={`${INPUT} resize-none`}
                />
              </div>
              {err ? <p className="text-red-500 text-xs">{err}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: '#1a3c2e' }}
              >
                {busy ? '...' : isFr ? 'Enregistrer' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentStatusDot({ status, onClick, title }) {
  const color =
    status === 'paid'
      ? 'bg-green-500'
      : status === 'late'
        ? 'bg-amber-400'
        : 'bg-gray-300';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-block w-3 h-3 rounded-full ${color} ring-2 ring-white shadow-sm hover:scale-125 transition`}
      aria-label={title}
    />
  );
}
