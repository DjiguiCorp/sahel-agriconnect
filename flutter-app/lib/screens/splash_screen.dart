import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/auth_state.dart';
import '../core/theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _contentVisible = true;

  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    // Wait for entrance animation to complete
    await Future.delayed(const Duration(milliseconds: 3200));

    if (!mounted) return;

    setState(() => _contentVisible = false);
    await Future.delayed(const Duration(milliseconds: 520));

    if (!mounted) return;

    final auth = context.read<AuthState>();
    final prefs = await SharedPreferences.getInstance();
    final termsAccepted = prefs.getBool('terms_accepted') ?? false;
    final langSelected = prefs.getBool('language_selected') ?? false;

    if (!mounted) return;

    if (!termsAccepted) {
      context.go('/terms');
    } else if (!langSelected) {
      context.go('/language');
    } else if (auth.isLoggedIn) {
      // Navigate to role dashboard
      context.go('/home');
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0d1f17),
      body: Center(
        child: AnimatedOpacity(
          opacity: _contentVisible ? 1 : 0,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInCubic,
          child: AnimatedScale(
            scale: _contentVisible ? 1 : 0.94,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInCubic,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo with entrance animation
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF2d6a4f), Color(0xFF1a3c2e)],
                    ),
                    borderRadius: BorderRadius.circular(36),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.3),
                        blurRadius: 40,
                        spreadRadius: 8,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'SA',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -2,
                      ),
                    ),
                  ),
                )
                    .animate()
                    .scale(
                      begin: const Offset(0.3, 0.3),
                      end: const Offset(1.0, 1.0),
                      duration: 800.ms,
                      curve: Curves.elasticOut,
                    )
                    .fadeIn(duration: 400.ms),

                const SizedBox(height: 32),

                // App name with stagger
                const Text(
                  'Sahel AgriConnect',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ).animate(delay: 400.ms).fadeIn(duration: 500.ms).slideY(
                      begin: 0.3,
                      end: 0,
                      duration: 500.ms,
                      curve: Curves.easeOut,
                    ),

                const SizedBox(height: 8),

                // Tagline with gold color
                const Text(
                  'Produire. Vendre. Gagner.',
                  style: TextStyle(
                    color: AppColors.gold,
                    fontSize: 15,
                    fontStyle: FontStyle.italic,
                    letterSpacing: 0.5,
                  ),
                ).animate(delay: 700.ms).fadeIn(duration: 500.ms).slideY(
                      begin: 0.3,
                      end: 0,
                      duration: 500.ms,
                      curve: Curves.easeOut,
                    ),

                const SizedBox(height: 80),

                // Loading dots animation
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    3,
                    (i) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.7),
                        shape: BoxShape.circle,
                      ),
                    )
                        .animate(
                          delay: Duration(milliseconds: 900 + (i * 150)),
                          onPlay: (controller) => controller.repeat(),
                        )
                        .fadeIn(duration: 300.ms)
                        .then()
                        .fadeOut(duration: 300.ms)
                        .then()
                        .fadeIn(duration: 300.ms),
                  ),
                ).animate(delay: 900.ms).fadeIn(duration: 300.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
