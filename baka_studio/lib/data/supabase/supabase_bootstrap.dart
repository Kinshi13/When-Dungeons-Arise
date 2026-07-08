import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_env.dart';

bool _initialized = false;

/// Inicializa o SDK do Supabase quando (e só quando) as variáveis de
/// ambiente estão configuradas — chamado uma vez em `main()`, antes de
/// `runApp`. Nunca lança: uma configuração ruim (URL/chave erradas) deve
/// cair para o modo totalmente local, não derrubar o app inteiro na
/// inicialização.
Future<void> bootstrapSupabase() async {
  if (!isSupabaseConfigured) return;
  try {
    await Supabase.initialize(
      url: supabaseUrl,
      publishableKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(authFlowType: AuthFlowType.pkce),
    );
    _initialized = true;
  } catch (error, stackTrace) {
    // Mesma filosofia do app irmão: uma sincronização mal configurada nunca
    // pode travar o app — ele simplesmente segue 100% local.
    debugPrint('Supabase não pôde ser inicializado — seguindo em modo local. $error');
    debugPrintStack(stackTrace: stackTrace);
  }
}

/// `null` quando a sincronização não está configurada ou a inicialização
/// falhou — todo código que depende do Supabase deve tratar esse caso
/// explicitamente (ver [RemoteTableClient]), nunca assumir que o client
/// sempre existe.
SupabaseClient? get supabaseClientOrNull => _initialized ? Supabase.instance.client : null;
