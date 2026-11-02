import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Shared free-tier welcome + Growth upgrade prompts.
abstract final class PremiumUpgradeDialog {
  static Future<void> showRegistrationWelcome(
    BuildContext context, {
    required bool isFr,
    required String roleLabel,
  }) {
    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF181C24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          isFr ? 'Bienvenue — inscription gratuite' : 'Welcome — free registration',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        content: Text(
          isFr
              ? 'Votre compte $roleLabel est gratuit. Au fur et à mesure de votre croissance, des fonctionnalités premium (export international, AfriYield Exchange, formations DSU) pourront être débloquées.'
              : 'Your $roleLabel account is free. As you grow, premium features (overseas export, AfriYield Exchange, DSU training) can be unlocked.',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.75),
            fontSize: 14,
            height: 1.45,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              isFr ? 'Continuer' : 'Continue',
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Future<void> showCoopGrowthUpgrade(
    BuildContext context, {
    required bool isFr,
  }) {
    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF181C24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          isFr ? 'Passer au forfait Growth' : 'Upgrade to Growth',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        content: Text(
          isFr
              ? 'Débloquez l\'export à l\'étranger, l\'accès investissement AfriYield Exchange et les partenariats de formation DSU.\n\nForfait Growth : 199 \$ / an.'
              : 'Unlock overseas export, AfriYield Exchange investment access, and DSU training partnerships.\n\nGrowth tier: \$199/year.',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.75),
            fontSize: 14,
            height: 1.45,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              isFr ? 'Plus tard' : 'Not now',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              isFr ? 'Compris' : 'Got it',
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Future<void> showProcessorPremiumLock(
    BuildContext context, {
    required bool isFr,
  }) {
    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF181C24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          isFr ? 'Fonctionnalité premium' : 'Premium feature',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        content: Text(
          isFr
              ? 'L\'accès aux marchés internationaux et la certification export sont des fonctionnalités premium. Votre inscription reste gratuite — débloquez-les quand votre centre est prêt.'
              : 'Overseas market access and export certification are premium features. Registration stays free — unlock them when your center is ready.',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.75),
            fontSize: 14,
            height: 1.45,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              isFr ? 'Fermer' : 'Close',
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
