import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Sincronização entre aparelhos (Fase 1: só Lembretes, prova de conceito) —
// opcional por completo. Sem as variáveis de ambiente configuradas (ver
// .env.example), o app segue funcionando 100% local, exatamente como antes.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function isValidHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  // Valida a URL de verdade (não só "existe") — createClient lança uma
  // exceção síncrona pra uma URL inválida, e isso já derrubou o app inteiro
  // uma vez (secret do GitHub Actions configurado com o valor errado). Uma
  // configuração ruim deve cair pra modo offline, igual não ter configurado
  // nada, nunca travar o app inteiro.
  return !!url && !!anonKey && isValidHttpUrl(url);
}

// Só cria o client de verdade se as duas variáveis existirem — evita o
// createClient reclamar (ou pior, tentar falar com uma URL vazia) em quem
// ainda não configurou a sincronização.
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(url!, anonKey!, {
      auth: {
        // Sessão persistida no próprio localStorage do WebView — não precisa
        // logar de novo toda vez que o app reabre.
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
