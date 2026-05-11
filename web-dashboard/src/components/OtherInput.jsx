import { useTranslation } from 'react-i18next';

/**
 * Shows a text input when "Autres" or "Other" is selected.
 * Use whenever a selection list includes an "Other" option.
 */
export default function OtherInput({ value, onChange, placeholder, className = '' }) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  return (
    <div className={`mt-2 ${className}`}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || (isFr ? 'Précisez...' : 'Please specify...')}
        className="w-full rounded-xl border border-[#B5850A]/50 bg-[#B5850A]/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] focus:border-[#B5850A] placeholder-gray-400"
        autoFocus
      />
      <p className="text-xs text-gray-400 mt-1">
        {isFr
          ? "✏️ Votre réponse sera enregistrée et visible par l'admin."
          : '✏️ Your answer will be recorded and visible to admin.'}
      </p>
    </div>
  );
}
