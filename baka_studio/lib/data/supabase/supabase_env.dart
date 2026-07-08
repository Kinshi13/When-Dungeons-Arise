/// Sincronização entre aparelhos é opcional por completo — sem estas duas
/// variáveis configuradas (via `--dart-define` no momento do build/run), o
/// app segue funcionando 100% local, exatamente como nas fases anteriores.
/// Mesmo padrão já usado pelo app irmão (When Dungeons Arise) neste mesmo
/// monorepo — ver frontend/src/supabaseClient.ts.
///
/// Exemplo de uso:
///   flutter run --dart-define=SUPABASE_URL=https://xxx.supabase.co \
///               --dart-define=SUPABASE_ANON_KEY=eyJ...
const String supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const String supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

bool _isValidHttpUrl(String value) {
  if (value.isEmpty) return false;
  final uri = Uri.tryParse(value);
  return uri != null && (uri.scheme == 'http' || uri.scheme == 'https') && uri.host.isNotEmpty;
}

/// Valida a URL de verdade (não só "não está vazia") — uma configuração
/// ruim (ex.: secret errado num pipeline de CI) deve cair para modo
/// offline, igual a não ter configurado nada, nunca travar o app inteiro.
bool get isSupabaseConfigured => supabaseAnonKey.isNotEmpty && _isValidHttpUrl(supabaseUrl);
