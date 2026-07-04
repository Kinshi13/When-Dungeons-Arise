import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

export type { Session, User };

export function isSyncAvailable(): boolean {
  return isSupabaseConfigured();
}

export async function signUp(email: string, password: string): Promise<string | null> {
  if (!supabase) return "Sincronização não configurada.";
  const { error } = await supabase.auth.signUp({ email, password });
  return error?.message ?? null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return "Sincronização não configurada.";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Chama o callback sempre que a sessão muda (login/logout/refresh de token) —
// devolve a função de cleanup, no mesmo padrão dos outros listeners do app
// (ver onWallpaperChanged em wallpaperEvents.ts).
export function onAuthChanged(callback: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
