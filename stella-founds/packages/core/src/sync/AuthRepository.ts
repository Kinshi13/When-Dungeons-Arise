/**
 * Future account/auth surface for cross-device sync. No implementation yet.
 */
export interface AuthSession {
  userId: string;
  email: string | null;
}

export interface AuthRepository {
  getSession(): Promise<AuthSession | null>;
  signIn(): Promise<AuthSession>;
  signOut(): Promise<void>;
}
