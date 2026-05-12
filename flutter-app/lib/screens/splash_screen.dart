import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

import '../core/theme.dart';
import '../core/glass.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 2800), () {
      if (mounted) context.go('/role');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.3),
            radius: 1.4,
            colors: [
              Color(0xFF1a3c2e),
              Color(0xFF0d1f17),
              Color(0xFF060f0a),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              // Liquid glass orb
              const GlassOrb(
                size: 130,
                child: Text(
                  'SA',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: AppColors.gold,
                    letterSpacing: -1,
                  ),
                ),
              )
                  .animate()
                  .fadeIn(duration: 600.ms, curve: Curves.easeOut)
                  .scale(
                      begin: const Offset(0.8, 0.8),
                      duration: 800.ms,
                      curve: Curves.elasticOut),

              const SizedBox(height: 28),

              const Text(
                'Sahel AgriConnect',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                ),
              )
                  .animate(delay: 300.ms)
                  .fadeIn(duration: 500.ms)
                  .slideY(begin: 0.2, end: 0),

              const SizedBox(height: 6),

              Text(
                'POWERED BY DJIGUI CORPORATION',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.35),
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2,
                ),
              )
                  .animate(delay: 400.ms)
                  .fadeIn(duration: 400.ms),

              const Spacer(),

              // Loading indicator
              Padding(
                padding: const EdgeInsets.only(bottom: 32),
                child: Column(
                  children: [
                    // Animated loading bar
                    Container(
                      width: 48,
                      height: 3,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(2),
                        child: const LinearProgressIndicator(
                          backgroundColor: Colors.transparent,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.gold,
                          ),
                        ),
                      ),
                    )
                        .animate(delay: 600.ms)
                        .fadeIn(duration: 300.ms),

                    const SizedBox(height: 20),

                    // AfriYield pill
                    GlassCard(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      borderRadius: BorderRadius.circular(30),
                      borderColor: AppColors.gold.withValues(alpha: 0.2),
                      backgroundColor: AppColors.gold.withValues(alpha: 0.06),
                      child: Text(
                        'AfriYield Exchange included',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.45),
                          fontSize: 11,
                        ),
                      ),
                    )
                        .animate(delay: 700.ms)
                        .fadeIn(duration: 400.ms),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
