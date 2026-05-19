export default function GovernmentOfficialKycFields({ kyc, setKyc, isFr }) {
  const set = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setKyc((p) => ({ ...p, [field]: v }));
  };

  const fields = [
    {
      key: 'fullLegalName',
      label: isFr ? 'Nom légal complet (pièce d’identité)' : 'Full legal name (as on ID)',
    },
    {
      key: 'officialTitle',
      label: isFr ? 'Titre / fonction officielle' : 'Official title / role',
      placeholder: isFr ? 'Directeur, Inspecteur régional…' : 'Director, Regional inspector…',
    },
    {
      key: 'ministryDepartment',
      label: isFr ? 'Ministère / direction / agence' : 'Ministry / department / agency',
    },
    {
      key: 'governmentIdNumber',
      label: isFr ? 'N° pièce d’identité ou matricule de service' : 'National ID or civil service number',
    },
    {
      key: 'authorizationReference',
      label: isFr ? 'Référence acte / note de service / décret' : 'Authorization memo / decree reference',
      placeholder: isFr ? 'N° note, date, signataire' : 'Memo no., date, signatory',
      wide: true,
    },
    {
      key: 'officialPhone',
      label: isFr ? 'Téléphone officiel' : 'Official phone',
      type: 'tel',
    },
    {
      key: 'officialEmail',
      label: isFr ? 'Email officiel' : 'Official email',
      type: 'email',
    },
  ];

  return (
    <div className="rounded-xl border border-[#1a3c2e]/20 bg-[#1a3c2e]/5 p-4 space-y-3">
      <p className="text-sm font-bold text-[#1a3c2e]">
        🔐 {isFr ? 'Vérification officielle (obligatoire)' : 'Official verification (required)'}
      </p>
      <p className="text-xs text-gray-600 leading-relaxed">
        {isFr
          ? 'Chaque action gouvernementale est journalisée avec votre identité de signataire autorisé.'
          : 'Every government action is audit-logged with your authorized signatory identity.'}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.key} className={f.wide ? 'sm:col-span-2 block' : 'block'}>
            <span className="text-xs font-semibold text-gray-700">{f.label} *</span>
            <input
              type={f.type || 'text'}
              required
              value={kyc[f.key] || ''}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            />
          </label>
        ))}
      </div>
      <label className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/40 bg-amber-50 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={Boolean(kyc.digitalSignatureAck)}
          onChange={set('digitalSignatureAck')}
          className="mt-1 accent-[#1a3c2e]"
        />
        <span className="text-xs text-gray-800 leading-relaxed">
          {isFr
            ? 'Je certifie être un signataire autorisé et j’accepte la traçabilité juridique de cette transmission.'
            : 'I certify I am an authorized signatory and accept legal traceability of this transmission.'}
        </span>
      </label>
    </div>
  );
}
