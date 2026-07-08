import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show User;

import '../data/auth/auth_repository.dart';

enum AuthStatus {
  /// Sincronização não configurada neste dispositivo — não há conceito de
  /// conta, o app é puramente local.
  unavailable,
  unauthenticated,
  authenticated,
}

/// Estado de sessão do usuário — inteiramente separado do [AppState]: o
/// workspace/dados locais continuam existindo e funcionando mesmo em
/// [AuthStatus.unauthenticated] ou [AuthStatus.unavailable]. Login nunca é
/// obrigatório para usar o app.
class AuthState extends ChangeNotifier {
  AuthState(this._repo) {
    _init();
  }

  final AuthRepository _repo;
  StreamSubscription? _subscription;

  AuthStatus status = AuthStatus.unavailable;
  User? user;
  bool isBusy = false;
  String? errorMessage;

  bool get isAvailable => _repo.isAvailable;

  void _init() {
    if (!_repo.isAvailable) {
      status = AuthStatus.unavailable;
      return;
    }
    user = _repo.currentUser;
    status = user == null ? AuthStatus.unauthenticated : AuthStatus.authenticated;
    _subscription = _repo.onAuthStateChange.listen((event) {
      user = event.session?.user;
      status = user == null ? AuthStatus.unauthenticated : AuthStatus.authenticated;
      notifyListeners();
    });
  }

  Future<bool> _run(Future<void> Function() action) async {
    isBusy = true;
    errorMessage = null;
    notifyListeners();
    try {
      await action();
      return true;
    } catch (error) {
      errorMessage = _friendlyMessage(error);
      return false;
    } finally {
      isBusy = false;
      notifyListeners();
    }
  }

  Future<bool> signUp({required String email, required String password, String? displayName}) {
    return _run(() => _repo.signUp(email: email, password: password, displayName: displayName));
  }

  Future<bool> signIn({required String email, required String password}) {
    return _run(() => _repo.signIn(email: email, password: password));
  }

  Future<bool> signOut() {
    return _run(_repo.signOut);
  }

  Future<bool> sendPasswordResetEmail(String email) {
    return _run(() => _repo.sendPasswordResetEmail(email));
  }

  void clearError() {
    errorMessage = null;
    notifyListeners();
  }

  String _friendlyMessage(Object error) {
    if (error is AuthNotAvailableException) return error.toString();
    final message = error.toString();
    if (message.contains('Invalid login credentials')) return 'Email ou senha incorretos.';
    if (message.contains('User already registered')) return 'Já existe uma conta com este email.';
    if (message.contains('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
    return 'Algo deu errado. Tente novamente em instantes.';
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
