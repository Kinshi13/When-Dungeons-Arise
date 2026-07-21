import type { AuthRepository, AuthSession } from './AuthRepository';
import { SyncLogger } from './SyncLogger';

const STORAGE_KEY = 'stella-founds:auth-session';
const BROADCAST_CHANNEL = 'stella-founds:auth';
const REFRESH_MARGIN_MS = 60 * 1000; // refresh a minute before expiry, not exactly at it

/**
 * The one Auth State in the app — every screen and repository reads
 * account status through here, never through window.localStorage or a
 * token passed around by hand. Centralizing it is what makes "logout
 * clears everything sensitive" and "every tab agrees on login state"
 * checkable in one place instead of scattered across call sites.
 *
 * Storage choice: sessionStorage, not localStorage. A session survives a
 * reload of the same tab (sessionStorage does persist across reloads) but
 * not a browser restart, and isn't shared by default with a tab opened
 * fresh — which is why logout is additionally broadcast over a
 * BroadcastChannel, so every open tab still agrees the instant one of them
 * logs out, without tokens themselves ever needing to live in the more
 * persistent, more exposed localStorage.
 */
export class AuthController {
  private readonly repository: AuthRepository;
  private readonly target = new EventTarget();
  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(BROADCAST_CHANNEL);
  private session: AuthSession | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(repository: AuthRepository) {
    this.repository = repository;
    this.channel?.addEventListener('message', (event) => {
      if (event.data === 'logout') this.applySession(null, { broadcast: false });
    });
  }

  /** Reads a previously-persisted session (if any) and schedules its
   * refresh — called once at app boot, before anything reads getSession(). */
  async restoreSession(): Promise<void> {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const session = await this.repository.login();
      this.applySession(session, { broadcast: false });
      return;
    }
    try {
      const session: AuthSession = JSON.parse(raw);
      this.applySession(session, { broadcast: false });
    } catch (error) {
      SyncLogger.error('failed to parse persisted session, issuing a new one', error);
      const session = await this.repository.login();
      this.applySession(session, { broadcast: false });
    }
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  async login(): Promise<AuthSession> {
    const session = await this.repository.login();
    this.applySession(session, { broadcast: false });
    return session;
  }

  async logout(): Promise<void> {
    await this.repository.logout();
    this.applySession(null, { broadcast: true });
  }

  onChange(callback: (session: AuthSession | null) => void): () => void {
    const handler = () => callback(this.session);
    this.target.addEventListener('change', handler);
    return () => this.target.removeEventListener('change', handler);
  }

  private applySession(session: AuthSession | null, { broadcast }: { broadcast: boolean }): void {
    this.session = session;
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (session) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      this.scheduleRefresh(session);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }

    if (broadcast) this.channel?.postMessage('logout');
    this.target.dispatchEvent(new Event('change'));
  }

  private scheduleRefresh(session: AuthSession): void {
    const msUntilRefresh = Math.max(0, new Date(session.expiresAt).getTime() - Date.now() - REFRESH_MARGIN_MS);
    this.refreshTimer = setTimeout(() => {
      this.repository
        .refreshToken(session)
        .then((refreshed) => this.applySession(refreshed, { broadcast: false }))
        .catch((error) => SyncLogger.error('token refresh failed', error));
    }, msUntilRefresh);
  }
}
