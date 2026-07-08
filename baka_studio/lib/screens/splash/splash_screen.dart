import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';
import '../../widgets/baka_studio_mark.dart';
import '../../widgets/stellar_background.dart';
import '../shell/app_shell.dart';

/// Brief, non-blocking splash: the mark fades and settles in well under a
/// second, then hands off to the shell. No spinning galaxy, no long intro.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: BakaMotion.slow)..forward();
    _scale = Tween<double>(begin: 0.92, end: 1).animate(CurvedAnimation(parent: _controller, curve: BakaMotion.enter));
    _opacity = CurvedAnimation(parent: _controller, curve: BakaMotion.enter);
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: BakaMotion.base,
          pageBuilder: (_, _, _) => const AppShell(),
          transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
        ),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BakaColors.midnightVoid,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const StellarBackground(density: 90),
          Center(
            child: FadeTransition(
              opacity: _opacity,
              child: ScaleTransition(
                scale: _scale,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const BakaStudioMark(size: 72),
                    const SizedBox(height: BakaSpacing.md),
                    Text('Baka Studio', style: BakaTypography.wordmark.copyWith(fontSize: 24)),
                    const SizedBox(height: BakaSpacing.xxs),
                    Text('Rede Baka', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
