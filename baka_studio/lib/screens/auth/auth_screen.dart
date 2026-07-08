import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../state/auth_state.dart';
import '../../widgets/baka_studio_mark.dart';
import '../../widgets/stellar_background.dart';
import '../../widgets/stellar_button.dart';
import '../../widgets/stellar_card.dart';

enum _AuthMode { login, signUp, forgotPassword }

/// Login / criar conta / recuperar senha.
///
/// Preserva a identidade "Cosmic Constellation Workspace" (marca + fundo
/// estelar) com densidade baixa e sem animação além do fade padrão de
/// navegação, para não competir com a legibilidade do formulário.
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _displayNameController = TextEditingController();

  _AuthMode _mode = _AuthMode.login;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _displayNameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final authState = context.read<AuthState>();
    authState.clearError();
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    switch (_mode) {
      case _AuthMode.login:
        final ok = await authState.signIn(email: email, password: password);
        if (ok && mounted) Navigator.of(context).pop();
      case _AuthMode.signUp:
        final ok = await authState.signUp(
          email: email,
          password: password,
          displayName: _displayNameController.text.trim(),
        );
        if (ok && mounted) Navigator.of(context).pop();
      case _AuthMode.forgotPassword:
        final ok = await authState.sendPasswordResetEmail(email);
        if (ok && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Se o email existir, enviamos um link de recuperação.')),
          );
          setState(() => _mode = _AuthMode.login);
        }
    }
  }

  void _switchMode(_AuthMode mode) {
    context.read<AuthState>().clearError();
    setState(() => _mode = mode);
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthState>();

    return Scaffold(
      backgroundColor: BakaColors.midnightVoid,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const StellarBackground(density: 36),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(BakaSpacing.xl),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const BakaStudioMark(size: 56),
                      const SizedBox(height: BakaSpacing.md),
                      Text('Baka Studio', style: BakaTypography.wordmark.copyWith(fontSize: 22)),
                      const SizedBox(height: BakaSpacing.xxs),
                      Text(
                        'Seu universo criativo, sincronizado entre dispositivos.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: BakaSpacing.xl),
                      StellarCard(
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(_title(_mode), style: Theme.of(context).textTheme.headlineSmall),
                              const SizedBox(height: BakaSpacing.lg),
                              if (_mode == _AuthMode.signUp) ...[
                                TextFormField(
                                  controller: _displayNameController,
                                  decoration: const InputDecoration(labelText: 'Nome (opcional)'),
                                  textInputAction: TextInputAction.next,
                                ),
                                const SizedBox(height: BakaSpacing.sm),
                              ],
                              TextFormField(
                                controller: _emailController,
                                decoration: const InputDecoration(labelText: 'Email'),
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                autofillHints: const [AutofillHints.email],
                                validator: _validateEmail,
                              ),
                              if (_mode != _AuthMode.forgotPassword) ...[
                                const SizedBox(height: BakaSpacing.sm),
                                TextFormField(
                                  controller: _passwordController,
                                  decoration: const InputDecoration(labelText: 'Senha'),
                                  obscureText: true,
                                  textInputAction: TextInputAction.done,
                                  autofillHints: const [AutofillHints.password],
                                  onFieldSubmitted: (_) => _submit(),
                                  validator: _validatePassword,
                                ),
                              ],
                              if (authState.errorMessage != null) ...[
                                const SizedBox(height: BakaSpacing.sm),
                                Text(
                                  authState.errorMessage!,
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: BakaColors.danger),
                                ),
                              ],
                              const SizedBox(height: BakaSpacing.lg),
                              StellarButton(
                                label: _primaryLabel(_mode),
                                onPressed: authState.isBusy ? null : _submit,
                                loading: authState.isBusy,
                              ),
                              const SizedBox(height: BakaSpacing.xs),
                              ..._secondaryActions(context, authState),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _title(_AuthMode mode) => switch (mode) {
    _AuthMode.login => 'Entrar',
    _AuthMode.signUp => 'Criar conta',
    _AuthMode.forgotPassword => 'Recuperar senha',
  };

  String _primaryLabel(_AuthMode mode) => switch (mode) {
    _AuthMode.login => 'Entrar',
    _AuthMode.signUp => 'Criar conta',
    _AuthMode.forgotPassword => 'Enviar link de recuperação',
  };

  List<Widget> _secondaryActions(BuildContext context, AuthState authState) {
    switch (_mode) {
      case _AuthMode.login:
        return [
          StellarButton(
            label: 'Criar conta',
            variant: StellarButtonVariant.text,
            onPressed: authState.isBusy ? null : () => _switchMode(_AuthMode.signUp),
          ),
          StellarButton(
            label: 'Esqueci minha senha',
            variant: StellarButtonVariant.text,
            onPressed: authState.isBusy ? null : () => _switchMode(_AuthMode.forgotPassword),
          ),
        ];
      case _AuthMode.signUp:
        return [
          StellarButton(
            label: 'Já tenho uma conta',
            variant: StellarButtonVariant.text,
            onPressed: authState.isBusy ? null : () => _switchMode(_AuthMode.login),
          ),
        ];
      case _AuthMode.forgotPassword:
        return [
          StellarButton(
            label: 'Voltar para o login',
            variant: StellarButtonVariant.text,
            onPressed: authState.isBusy ? null : () => _switchMode(_AuthMode.login),
          ),
        ];
    }
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Informe seu email.';
    if (!value.contains('@') || !value.contains('.')) return 'Email inválido.';
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Informe sua senha.';
    if (value.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    return null;
  }
}
