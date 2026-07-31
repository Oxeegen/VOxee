export type UpsellDecision = "show" | "hide" | "unknown";

export interface UpsellInput {
  authLoaded: boolean;
  isSignedIn: boolean;
  /** `null` while the entitlement is unresolved — see `useUsage`. */
  hasPaidAccess: boolean | null;
  isPastDue: boolean;
}

/**
 * Three-way so an unknown entitlement is never rendered as free. Signed-out
 * users still get the CTA — there is no usage response to confirm, and the
 * upsell is the point of the screen for them.
 */
export function decideUpsell({
  authLoaded,
  isSignedIn,
  hasPaidAccess,
  isPastDue,
}: UpsellInput): UpsellDecision {
  if (!authLoaded) return "unknown";
  if (!isSignedIn) return "show";
  if (hasPaidAccess === null) return "unknown";
  // Past due already has its own banner, toast and recovery button.
  if (isPastDue || hasPaidAccess) return "hide";
  return "show";
}
