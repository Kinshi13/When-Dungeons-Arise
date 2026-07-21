import type { AuthRepository, AuthSession } from './AuthRepository';

const SESSION_LENGTH_MS = 60 * 60 * 1000; // 1h — arbitrary until a real backend issues real-lived tokens.
const ANON_USER_ID = 'local-anonymous';

function issueSession(): AuthSession {
  const now = Date.now();
  return {
    userId: ANON_USER_ID,
    email: null,
    accessToken: `local.${now}`,
    refreshToken: `local-refresh.${now}`,
    expiresAt: new Date(now + SESSION_LENGTH_MS).toISOString(),
  };
}

/**
 * Default AuthRepository until a real backend is wired up: everyone gets a
 * single local, offline-capable "anonymous" session, issued and refreshed
 * entirely on-device. It exercises the exact same interface a real
 * Supabase/Firebase-backed repository would, so swapping one in later is a
 * one-line change in the container, not a rewrite of AuthController or any
 * screen that reads session state.
 */
export class LocalAuthRepository implements AuthRepository {
  async getSession(): Promise<AuthSession | null> {
    return null; // AuthController owns restoring a previously-issued session; this repository only issues new ones.
  }

  async login(): Promise<AuthSession> {
    return issueSession();
  }

  async logout(): Promise<void> {
    // No remote session to invalidate yet.
  }

  async refreshToken(): Promise<AuthSession> {
    return issueSession();
  }
}
