export function mapFarmerQualityToCert(ql) {
  const q = String(ql || '').toLowerCase();
  if (q === 'international') return 'International';
  if (q === 'regional') return 'Regional';
  if (q === 'local') return 'Local';
  return 'None';
}

export function coopSupplyStatus(l, isFr) {
  if (l.promotedToMarketplace) {
    return { cls: 'bg-blue-100 text-blue-700', label: isFr ? '🌍 Sur AfriYield' : '🌍 On AfriYield' };
  }
  if (l.cooperativeApproved) {
    return { cls: 'bg-green-100 text-green-700', label: isFr ? '✓ Approuvé coopérative' : '✓ Coop Approved' };
  }
  return { cls: 'bg-yellow-100 text-yellow-700', label: isFr ? '⏳ En attente coopérative' : '⏳ Awaiting cooperative' };
}
