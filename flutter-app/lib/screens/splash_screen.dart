import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/glass.dart';
import '../core/theme.dart';
import '../screens/shared/terms_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _entranceCtrl;
  late AnimationController _exitCtrl;
  late AnimationController _particleCtrl;
  late AnimationController _glowCtrl;

  bool _exiting = false;

  @override
  void initState() {
    super.initState();

    _entranceCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );

    _exitCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _particleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    _glowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _entranceCtrl.forward();

    Future.delayed(const Duration(milliseconds: 3400), () {
      if (!mounted) return;
      _playExitAndNavigate();
    });
  }

  Future<void> _playExitAndNavigate() async {
    if (!mounted) return;
    setState(() => _exiting = true);
    await _exitCtrl.forward();
    if (!mounted) return;
    await _navigate();
  }

  Future<void> _navigate() async {
    final prefs = await SharedPreferences.getInstance();
    final termsAccepted =
        prefs.getBool(TermsScreen.termsAcceptedKey) ?? false;
    final langSelected = prefs.getBool('language_selected') ?? false;
    if (!mounted) return;
    if (!termsAccepted) {
      context.go('/terms');
      return;
    }
    if (!langSelected) {
      context.go('/language');
      return;
    }
    context.go('/home');
  }

  @override
  void dispose() {
    _entranceCtrl.dispose();
    _exitCtrl.dispose();
    _particleCtrl.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFF060f0a),
      body: AnimatedBuilder(
        animation: Listenable.merge([
          _entranceCtrl,
          _exitCtrl,
          _particleCtrl,
          _glowCtrl,
        ]),
        builder: (context, _) {
          final bgOpacity = CurvedAnimation(
            parent: _entranceCtrl,
            curve: const Interval(0.0, 0.3, curve: Curves.easeIn),
          ).value;

          final orbScale = CurvedAnimation(
            parent: _entranceCtrl,
            curve: const Interval(0.1, 0.55, curve: Curves.elasticOut),
          ).value;

          final orbOpacity = CurvedAnimation(
            parent: _entranceCtrl,
            curve: const Interval(0.1, 0.4, curve: Curves.easeIn),
          ).value;

          final titleSlide = CurvedAnimation(
            parent: _entranceCtrl,
            curve: const Interval(0.35, 0.65, curve: Curves.easeOutCubic),
          ).value;

          final taglineOpacity = CurvedAnimation(
            parent: _entranceCtrl,
            curve: const Interval(0.5, 0.75, curve: Curves.easeIn),
          ).value;

          final barOpacity = CurvedAnimation(
            parent: _entranceCtrl,
            curve: const Interval(0.65, 0.85, curve: Curves.easeIn),
          ).value;

          final pillOpacity = CurvedAnimation(
            parent: _entranceCtrl,
            curve: const Interval(0.75, 1.0, curve: Curves.easeIn),
          ).value;

          final glowIntensity = 0.7 + (_glowCtrl.value * 0.3);

          final exitFade = _exiting
              ? CurvedAnimation(
                  parent: _exitCtrl,
                  curve: const Interval(0.0, 0.7, curve: Curves.easeIn),
                ).value
              : 0.0;

          final exitScale = _exiting
              ? 1.0 +
                  (CurvedAnimation(
                    parent: _exitCtrl,
                    curve: const Interval(0.0, 1.0, curve: Curves.easeInCubic),
                  ).value *
                      0.15)
              : 1.0;

          final contentOpacity = (1.0 - exitFade).clamp(0.0, 1.0);
          final bgFade = (bgOpacity * (1.0 - exitFade)).clamp(0.0, 1.0);

          return Stack(
            children: [
              Opacity(
                opacity: bgFade,
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment(0, -0.2),
                      radius: 1.5,
                      colors: [
                        Color(0xFF1a3c2e),
                        Color(0xFF0d1f17),
                        Color(0xFF060f0a),
                      ],
                      stops: [0.0, 0.55, 1.0],
                    ),
                  ),
                ),
              ),
              Opacity(
                opacity: (taglineOpacity * contentOpacity).clamp(0.0, 1.0),
                child: _ParticleField(
                  controller: _particleCtrl,
                  size: size,
                ),
              ),
              Center(
                child: Opacity(
                  opacity: (orbOpacity * glowIntensity * contentOpacity)
                      .clamp(0.0, 1.0),
                  child: Transform.scale(
                    scale: exitScale,
                    child: Container(
                      width: 220,
                      height: 220,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.gold.withValues(
                              alpha: 0.18 * glowIntensity,
                            ),
                            blurRadius: 80,
                            spreadRadius: 30,
                          ),
                          BoxShadow(
                            color: const Color(0xFF1D9E75).withValues(
                              alpha: 0.12 * glowIntensity,
                            ),
                            blurRadius: 120,
                            spreadRadius: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              SafeArea(
                child: Opacity(
                  opacity: contentOpacity.clamp(0.0, 1.0),
                  child: Column(
                    children: [
                      const Spacer(flex: 3),
                      Transform.scale(
                        scale: (orbScale * exitScale).clamp(0.0, 10.0),
                        child: Opacity(
                          opacity: orbOpacity.clamp(0.0, 1.0),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              Container(
                                width: 154,
                                height: 154,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppColors.gold.withValues(
                                      alpha: 0.15,
                                    ),
                                    width: 1,
                                  ),
                                ),
                              ),
                              Container(
                                width: 142,
                                height: 142,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppColors.gold.withValues(
                                      alpha: 0.08,
                                    ),
                                    width: 1,
                                  ),
                                ),
                              ),
                              GlassOrb(
                                size: 130,
                                child: ShaderMask(
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Color(0xFFE8B84B),
                                      Color(0xFFB5850A),
                                    ],
                                  ).createShader(bounds),
                                  child: const Text(
                                    'SA',
                                    style: TextStyle(
                                      fontSize: 38,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: -2,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 36),
                      Transform.translate(
                        offset: Offset(0, 30 * (1 - titleSlide)),
                        child: Opacity(
                          opacity: titleSlide.clamp(0.0, 1.0),
                          child: Column(
                            children: [
                              const Text(
                                'Sahel AgriConnect',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.8,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TweenAnimationBuilder<double>(
                                tween: Tween(begin: 0, end: titleSlide),
                                duration: const Duration(milliseconds: 600),
                                builder: (_, v, __) => Container(
                                  width: 60 * v,
                                  height: 2,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        Colors.transparent,
                                        AppColors.gold,
                                        Colors.transparent,
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(1),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Opacity(
                        opacity: taglineOpacity.clamp(0.0, 1.0),
                        child: Text(
                          'Produce together. Sell further. Earn more.',
                          style: TextStyle(
                            color: AppColors.gold.withValues(alpha: 0.8),
                            fontSize: 13,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Opacity(
                        opacity: taglineOpacity.clamp(0.0, 1.0),
                        child: Text(
                          'POWERED BY DJIGUI CORPORATION',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.25),
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2.5,
                          ),
                        ),
                      ),
                      const Spacer(flex: 2),
                      Opacity(
                        opacity: barOpacity.clamp(0.0, 1.0),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 40),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate(3, (i) {
                                  final delay = i * 0.15;
                                  final t = ((_particleCtrl.value - delay)
                                      .clamp(0.0, 1.0));
                                  final pulse = math.sin(t * math.pi * 2);
                                  final dotOpacity =
                                      (0.35 + pulse * 0.35).clamp(0.2, 0.7);
                                  final dotScale =
                                      (0.7 + pulse * 0.3).clamp(0.5, 1.0);
                                  return Transform.scale(
                                    scale: dotScale,
                                    child: Container(
                                      width: 6,
                                      height: 6,
                                      margin: const EdgeInsets.symmetric(
                                        horizontal: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.gold.withValues(
                                          alpha: dotOpacity,
                                        ),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  );
                                }),
                              ),
                              const SizedBox(height: 20),
                              Opacity(
                                opacity: pillOpacity.clamp(0.0, 1.0),
                                child: GlassCard(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  borderRadius: BorderRadius.circular(30),
                                  borderColor: AppColors.gold.withValues(
                                    alpha: 0.2,
                                  ),
                                  backgroundColor: AppColors.gold.withValues(
                                    alpha: 0.06,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: AppColors.gold.withValues(
                                            alpha: 0.7,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: AppColors.gold.withValues(
                                                alpha: 0.5,
                                              ),
                                              blurRadius: 4,
                                              spreadRadius: 1,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'AfriYield Exchange included',
                                        style: TextStyle(
                                          color: Colors.white.withValues(
                                            alpha: 0.5,
                                          ),
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (_exiting)
                Opacity(
                  opacity: CurvedAnimation(
                    parent: _exitCtrl,
                    curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
                  ).value *
                      0.6,
                  child: Container(color: Colors.white),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _ParticleField extends StatelessWidget {
  const _ParticleField({required this.controller, required this.size});

  final AnimationController controller;
  final Size size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: size,
      painter: _ParticlePainter(controller.value),
    );
  }
}

class _ParticlePainter extends CustomPainter {
  _ParticlePainter(this.t);

  final double t;

  static final _rng = math.Random(42);

  static final _particles = List.generate(18, (i) {
    return (
      x: _rng.nextDouble(),
      y: _rng.nextDouble(),
      r: 1.0 + _rng.nextDouble() * 2.5,
      speed: 0.12 + _rng.nextDouble() * 0.18,
      phase: _rng.nextDouble(),
      isGold: i % 3 == 0,
    );
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in _particles) {
      final progress = ((t * p.speed + p.phase) % 1.0);
      final y = size.height * (0.8 - progress * 0.7);
      final drift = math.sin(progress * math.pi * 2 + p.phase * 6);
      final x = size.width * p.x + drift * 20;
      final opacity = progress < 0.2
          ? progress / 0.2
          : progress > 0.8
              ? (1.0 - progress) / 0.2
              : 1.0;

      final paint = Paint()
        ..color = (p.isGold ? AppColors.gold : Colors.white)
            .withValues(alpha: opacity * 0.35)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1.5);

      canvas.drawCircle(Offset(x, y), p.r, paint);
    }
  }

  @override
  bool shouldRepaint(_ParticlePainter old) => old.t != t;
}
