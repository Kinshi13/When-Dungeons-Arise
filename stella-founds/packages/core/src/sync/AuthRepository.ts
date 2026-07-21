export interface AuthSession {
  userId: string;
  email: string | null;
  accessToken: string;
  refreshToken: string;
  /** ISO timestamp — AuthController schedules a refresh ahead of this. */
  expiresAt: string;
}

/**
 * The single surface anything in the app is allowed to use for account
 * state. A real backend (Supabase, etc.) implements this later; nothing
 * above this interface — screens, repositories, the SyncEngine — ever
 * needs to change when that happens.
 */
export interface AuthRepository {
  getSession(): Promise<AuthSession | null>;
  login(): Promise<AuthSession>;
  logout(): Promise<void>;
  refreshToken(session: AuthSession): Promise<AuthSession>;
}
