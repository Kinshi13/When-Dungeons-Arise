import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/theme.dart';
import 'data/auth/auth_repository.dart';
import 'data/repositories/local_settings_repository.dart';
import 'data/sync/sync_engine.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/sync/adoption_dialog.dart';
import 'state/app_state.dart';
import 'state/auth_state.dart';
import 'state/sync_coordinator.dart';

class BakaStudioApp extends StatelessWidget {
  const BakaStudioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
        ChangeNotifierProvider(create: (_) => AuthState(AuthRepository())),
        Provider<SyncEngine>(lazy: false, create: (context) => SyncEngine(context.read<AppState>().db)),
        ChangeNotifierProvider<SyncCoordinator>(
          lazy: false,
          create: (context) => SyncCoordinator(
            context.read<AuthState>(),
            context.read<AppState>().db,
            LocalSettingsRepository(context.read<AppState>().db),
            context.read<SyncEngine>(),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'Baka Studio',
        debugShowCheckedModeBanner: false,
        theme: BakaTheme.dark,
        darkTheme: BakaTheme.dark,
        themeMode: ThemeMode.dark,
        home: const AdoptionDialogListener(child: SplashScreen()),
      ),
    );
  }
}
