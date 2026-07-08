import 'package:supabase_flutter/supabase_flutter.dart';

import '../supabase/supabase_bootstrap.dart';

/// Erro lançado quando uma ação de autenticação é chamada sem a
/// sincronização configurada — a UI deve tratar isso mostrando que a conta
/// não está disponível neste momento, nunca deixar a exceção escapar crua.
class AuthNotAvailableException implements Exception {
  const AuthNotAvailableException();

  @override
  String toString() => 'A sincronização não está configurada neste dispositivo.';
}

/// Fina camada sobre o Supabase Auth — a única parte do app que fala com
/// `GoTrueClient` diretamente. Tudo aqui é opcional: sem Supabase
/// configurado, cada método lança [AuthNotAvailableException] em vez de
/// travar, e o app segue 100% utilizável localmente sem conta.
class AuthRepository {
  GoTrueClient get _auth {
    final client = supabaseClientOrNull;
    if (client == null) throw const AuthNotAvailableException();
    return client.auth;
  }

  bool get isAvailable => supabaseClientOrNull != null;

  Session? get currentSession => supabaseClientOrNull?.auth.currentSession;

  User? get currentUser => supabaseClientOrNull?.auth.currentUser;

  Stream<AuthState> get onAuthStateChange => _auth.onAuthStateChange;

  Future<void> signUp({required String email, required String password, String? displayName}) async {
    await _auth.signUp(
      email: email,
      password: password,
      data: displayName == null || displayName.isEmpty ? null : {'display_name': displayName},
    );
  }

  Future<void> signIn({required String email, required String password}) async {
    await _auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<void> sendPasswordResetEmail(String email) async {
    await _auth.resetPasswordForEmail(email);
  }
}
