/**
 * Helpers to normalize Didit webhook / session payloads.
 */

const ACCEPTABLE_DOC_TYPES = new Set([
  'passport',
  'national_id',
  'national-id',
  'nationalid',
  'id_card',
  'id-card',
  'identity_card',
  'residence_permit',
  'residence-permit',
  'residencepermit',
]);

const DRIVER_LIKE = new Set([
  'driver_license',
  'drivers_license',
  'driving_license',
  'driver-license',
  'drivers-license',
  'dl',
]);

export function normalizeDocType(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

export function isAcceptableDocumentType(raw) {
  const t = normalizeDocType(raw);
  if (!t) return false;
  if (ACCEPTABLE_DOC_TYPES.has(t)) return true;
  if (t.includes('passport')) return true;
  if (t.includes('national') && t.includes('id')) return true;
  if (t.includes('residence') && t.includes('permit')) return true;
  if (t.includes('id_card') || t.includes('identity_card')) return true;
  return false;
}

export function isNonIdentityDocument(raw) {
  const t = normalizeDocType(raw);
  if (!t) return false;
  if (DRIVER_LIKE.has(t) || t.includes('driver')) return true;
  if (t.includes('utility') || t.includes('selfie') || t.includes('other')) return true;
  return !isAcceptableDocumentType(t);
}

/** Pull document type from common Didit payload shapes */
export function extractDocumentType(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const candidates = [
    payload.document_type,
    payload.documentType,
    payload.id_type,
    payload.idType,
    payload?.id_verification?.document_type,
    payload?.id_verification?.documentType,
    payload?.id_verification?.id_type,
    payload?.decision?.document_type,
    payload?.decision?.id_verification?.document_type,
    payload?.decision?.id_verification?.documentType,
    payload?.kyc?.document_type,
    Array.isArray(payload.id_documents) ? payload.id_documents[0]?.type : null,
    Array.isArray(payload.id_documents) ? payload.id_documents[0]?.document_type : null,
    payload?.session?.id_verification?.document_type,
  ];
  for (const c of candidates) {
    if (c) return normalizeDocType(c);
  }
  return '';
}

export function extractDiditFields(payload) {
  const p = payload && typeof payload === 'object' ? payload : {};
  const idv =
    p.id_verification ||
    p.decision?.id_verification ||
    p.kyc ||
    p.decision ||
    {};

  const fullName =
    idv.full_name ||
    idv.fullName ||
    idv.name ||
    [idv.first_name || idv.firstName, idv.last_name || idv.lastName]
      .filter(Boolean)
      .join(' ') ||
    p.full_name ||
    p.name ||
    '';

  const documentType = extractDocumentType(p) || extractDocumentType(idv);
  const documentNumber =
    idv.document_number ||
    idv.documentNumber ||
    idv.id_number ||
    idv.idNumber ||
    p.document_number ||
    '';

  const nationality =
    idv.nationality ||
    idv.issuing_state ||
    idv.issuing_country ||
    p.nationality ||
    '';

  const dateOfBirth =
    idv.date_of_birth ||
    idv.dateOfBirth ||
    idv.dob ||
    p.date_of_birth ||
    '';

  const expiryDate =
    idv.expiration_date ||
    idv.expiry_date ||
    idv.date_of_expiration ||
    idv.expiryDate ||
    '';

  const confidence =
    idv.confidence ??
    idv.score ??
    p.confidence ??
    p.decision?.confidence ??
    p.decision?.score ??
    null;

  return {
    fullName: String(fullName || '').trim(),
    documentType,
    documentNumber: String(documentNumber || '').trim(),
    nationality: String(nationality || '').trim(),
    dateOfBirth: String(dateOfBirth || '').trim(),
    expiryDate: String(expiryDate || '').trim(),
    confidence: confidence != null && confidence !== '' ? Number(confidence) : null,
  };
}

export function maskDocumentNumber(num) {
  const s = String(num || '').replace(/\s+/g, '');
  if (!s) return '—';
  if (s.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(4, s.length - 4))}${s.slice(-4)}`;
}
