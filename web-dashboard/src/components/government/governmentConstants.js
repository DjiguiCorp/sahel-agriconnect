export const DIRECTIVE_TYPES = [
  {
    key: 'policy_directive',
    emoji: '📜',
    en: 'Broadcast policy directive',
    fr: 'Diffuser une directive politique',
  },
  {
    key: 'coop_registration_drive',
    emoji: '🤝',
    en: 'Cooperative registration drive',
    fr: 'Campagne d’enregistrement des coopératives',
  },
  {
    key: 'export_opportunity',
    emoji: '🌍',
    en: 'Export opportunity for cooperatives',
    fr: 'Opportunité d’export pour coopératives',
  },
  {
    key: 'traceability_mandate',
    emoji: '🔗',
    en: 'National traceability mandate',
    fr: 'Mandat national de traçabilité',
  },
  {
    key: 'project_delegation',
    emoji: '📋',
    en: 'Delegate project to cooperatives',
    fr: 'Déléguer un projet aux coopératives',
  },
];

export function emptyOfficialKyc(admin) {
  return {
    fullLegalName: admin?.name || '',
    officialTitle: '',
    ministryDepartment: admin?.organization || '',
    governmentIdNumber: '',
    authorizationReference: '',
    officialPhone: '',
    officialEmail: admin?.email || '',
    digitalSignatureAck: false,
  };
}
