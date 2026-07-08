import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/theme.dart';
import 'data/auth/auth_repository.dart';
import 'screens/splash/splash_screen.dart';
import 'state/app_state.dart';
import 'state/auth_state.dart';

class BakaStudioApp extends StatelessWidget {
  const BakaStudioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
        ChangeNotifierProvider(create: (_) => AuthState(AuthRepository())),
      ],
      child: MaterialApp(
        title: 'Baka Studio',
        debugShowCheckedModeBanner: false,
        theme: BakaTheme.dark,
        darkTheme: BakaTheme.dark,
        themeMode: ThemeMode.dark,
        home: const SplashScreen(),
      ),
    );
  }
}
