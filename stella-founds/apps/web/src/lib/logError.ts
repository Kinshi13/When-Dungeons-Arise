/**
 * Single funnel for unexpected errors — logs only in development today.
 * Kept as one call site so wiring up real monitoring (Sentry or similar)
 * later is a one-line change here instead of hunting down every catch
 * block across the app.
 */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
}
