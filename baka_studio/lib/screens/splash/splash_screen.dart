import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';
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
                    const _SplashMark(),
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

/// Provisional mark: a small constellation forming a "B" out of connected
/// points. Isolated in its own widget so it's a one-file swap once final
/// brand art exists.
class _SplashMark extends StatelessWidget {
  const _SplashMark();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 72,
      height: 72,
      child: CustomPaint(painter: _BakaMarkPainter()),
    );
  }
}

class _BakaMarkPainter extends CustomPainter {
  const _BakaMarkPainter();

  @override
  void paint(Canvas canvas, Size size) {
    // Seven points loosely tracing a "B", connected like a constellation.
    final points = [
      Offset(size.width * 0.28, size.height * 0.12),
      Offset(size.width * 0.28, size.height * 0.50),
      Offset(size.width * 0.28, size.height * 0.88),
      Offset(size.width * 0.68, size.height * 0.24),
      Offset(size.width * 0.68, size.height * 0.50),
      Offset(size.width * 0.68, size.height * 0.76),
      Offset(size.width * 0.44, size.height * 0.50),
    ];
    const edges = [
      [0, 1], [1, 2], [0, 3], [3, 6], [6, 1], [1, 4], [4, 6], [6, 5], [5, 2],
    ];

    final linePaint = Paint()
      ..color = BakaColors.stellarBlue.withValues(alpha: 0.5)
      ..strokeWidth = 1.4
      ..style = PaintingStyle.stroke;

    for (final edge in edges) {
      canvas.drawLine(points[edge[0]], points[edge[1]], linePaint);
    }

    final dotPaint = Paint()..color = BakaColors.stellarBlue;
    final glowPaint = Paint()
      ..color = BakaColors.stellarBlue.withValues(alpha: 0.4)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);

    for (final point in points) {
      canvas.drawCircle(point, 4, glowPaint);
      canvas.drawCircle(point, 2.2, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _BakaMarkPainter oldDelegate) => false;
}
