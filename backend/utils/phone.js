/** Normalize phone for storage and lookup (E.164-friendly). */
export function normalizePhone(p) {
  let s = String(p || '').trim().replace(/[\s\-().]/g, '');
  if (!s) return '';
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (!s.startsWith('+') && /^\d{10,15}$/.test(s)) {
    // bare digits — caller should pass dial prefix via toE164 when possible
    return s;
  }
  return s;
}

/** Build E.164 from local digits and dial prefix (e.g. +1, +223). */
export function toE164(local, dialPrefix = '+') {
  const raw = String(local || '').trim();
  if (raw.startsWith('+')) return normalizePhone(raw);
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  const prefix = String(dialPrefix || '+').startsWith('+') ? dialPrefix : `+${dialPrefix}`;
  return `${prefix}${digits}`;
}

/** Mongo filter to match farmer telephone with flexible formatting. */
export function farmerTelephoneQuery(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return { telephone: '' };
  const digits = norm.replace(/\D/g, '');
  const clauses = [{ telephone: norm }, { telephone: phone }];
  if (digits.length >= 8) {
    const tail = digits.slice(-Math.min(10, digits.length));
    const escaped = tail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clauses.push({ telephone: new RegExp(`${escaped}$`) });
  }
  return { $or: clauses };
}
