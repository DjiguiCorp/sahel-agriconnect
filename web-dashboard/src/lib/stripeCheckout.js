/**
 * Stripe is available for ALL countries.
 * West African users pay via card just like diaspora users.
 * Orange Money and MTN MoMo are Phase 2 and not live yet.
 */
export function isStripeCheckoutAvailable(_country) {
  return true;
}
