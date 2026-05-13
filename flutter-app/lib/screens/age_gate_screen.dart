import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/age_gate_refresh.dart';
import '../core/theme.dart';

class AgeGateScreen extends StatelessWidget {
  const AgeGateScreen({super.key});

  static Future<bool> hasAccepted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('age_gate_accepted') ?? false;
  }

  static Future<void> accept() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('age_gate_accepted', true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1a3c2e), Color(0xFF0d1f17)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              children: [
                const Spacer(),
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.3),
                      width: 0.5,
                    ),
                  ),
                  child: const Center(
                    child: Text('🌾', style: TextStyle(fontSize: 32)),
                  ),
                )
                    .animate()
                    .fadeIn(duration: 600.ms)
                    .scale(begin: const Offset(0.8, 0.8)),

                const SizedBox(height: 28),

                const Text(
                  'AfriYield Exchange',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ).animate(delay: 200.ms).fadeIn().slideY(begin: 0.2),

                const SizedBox(height: 8),

                Text(
                  'Investment portal',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.gold.withValues(alpha: 0.95),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ).animate(delay: 250.ms).fadeIn(),

                const SizedBox(height: 14),

                Text(
                  'AfriYield Exchange is an investment platform. You must be 18 or older to access investment opportunities and financial data.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 14,
                    height: 1.7,
                  ),
                ).animate(delay: 300.ms).fadeIn(),

                const SizedBox(height: 20),

                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.3),
                      width: 0.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Text('🔞', style: TextStyle(fontSize: 28)),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Minimum age: 18 years',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'You must be 18 or older to download and use this application.',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.55),
                                fontSize: 12,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate(delay: 400.ms).fadeIn(),

                const Spacer(),

                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () async {
                      await accept();
                      if (context.mounted) {
                        context.read<AgeGateRefresh>().onAcceptedFromPrefs();
                      }
                      if (context.mounted) context.go('/login/investor');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: AppColors.forestGreen,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'I am 18 or older — Continue',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ).animate(delay: 500.ms).fadeIn().slideY(begin: 0.3),

                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: TextButton(
                    onPressed: () => SystemNavigator.pop(),
                    style: TextButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(
                          color: Colors.white.withValues(alpha: 0.2),
                          width: 0.5,
                        ),
                      ),
                    ),
                    child: Text(
                      'I am under 18 — Exit',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 14,
                      ),
                    ),
                  ),
                ).animate(delay: 600.ms).fadeIn(),

                const SizedBox(height: 16),
                Text(
                  'By continuing you agree to our Terms of Use and Privacy Policy',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
