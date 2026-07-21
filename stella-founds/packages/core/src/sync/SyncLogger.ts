/** Dev-only. Never active in production — every call is gated behind the
 * same check, so there's exactly one place that could get this wrong. */
function isDev(): boolean {
  try {
    return Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
}

export const SyncLogger = {
  operation(message: string, detail?: unknown): void {
    if (!isDev()) return;
    console.debug(`[sync] ${message}`, detail ?? '');
  },
  timing(label: string, ms: number): void {
    if (!isDev()) return;
    console.debug(`[sync] ${label} took ${ms.toFixed(1)}ms`);
  },
  error(message: string, error: unknown): void {
    if (!isDev()) return;
    console.error(`[sync] ${message}`, error);
  },
  conflict(collection: string, entityId: string, resolution: string): void {
    if (!isDev()) return;
    console.warn(`[sync] conflict on ${collection}/${entityId} → ${resolution}`);
  },
};
