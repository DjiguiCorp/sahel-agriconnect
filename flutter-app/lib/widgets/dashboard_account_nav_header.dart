import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/language_provider.dart';
import '../core/platform_navigation.dart';

/// Top-of-account-tab navigation: return to role dashboard tab 0, or exit to `/platform`.
class DashboardAccountNavHeader extends StatelessWidget {
  const DashboardAccountNavHeader({
    super.key,
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.onBackToDashboard,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final VoidCallback onBackToDashboard;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Column(
      children: [
        GestureDetector(
          onTap: onBackToDashboard,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cardStart, cardEnd]),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.dashboard_outlined, color: accent, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lp.t('Back to Dashboard', 'Retour au tableau de bord'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        lp.t(
                          'Return to your role overview',
                          'Retour à l\'aperçu de votre rôle',
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: Colors.white.withValues(alpha: 0.3),
                ),
              ],
            ),
          ),
        ),
        GestureDetector(
          onTap: () => goPlatformHome(context),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.exit_to_app_outlined,
                    color: Colors.white.withValues(alpha: 0.6),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lp.t('Exit to Main Platform', 'Quitter vers l\'accueil'),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        lp.t(
                          'Go back to platform home screen',
                          'Retour à l\'écran d\'accueil de la plateforme',
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: Colors.white.withValues(alpha: 0.2),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
