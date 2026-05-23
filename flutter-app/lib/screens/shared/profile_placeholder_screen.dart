import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/language_provider.dart';
import '../../core/theme.dart';

/// In-progress profile sub-flow.
///
/// Shown when [FeatureFlags.xxxEnabled] is false for a given feature.
/// Never renders a bare "coming soon" — always gives the user a clear
/// next action (go back, or optionally contact support).
class ProfilePlaceholderScreen extends StatelessWidget {
  const ProfilePlaceholderScreen({
    super.key,
    required this.title,
    this.onContactSupport,
  });

  final String title;

  /// Optional: if provided, shows a secondary "Contact support" button.
  final VoidCallback? onContactSupport;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        title: Text(title),
        backgroundColor: AppColors.forestGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (context.canPop()) context.pop();
          },
        ),
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: AppColors.forestGreen.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(22),
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      color: AppColors.gold,
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  lp.t("We're setting this up", 'Nous préparons cette section'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.forestGreen,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  lp.t(
                    'This part of your profile will be available in an upcoming update. '
                    'You can go back and continue using the app.',
                    'Cette partie de votre profil sera disponible dans une prochaine mise à jour. '
                    'Revenez en arrière pour continuer à utiliser l\u2019application.',
                  ),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.5,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () {
                      if (context.canPop()) context.pop();
                    },
                    icon: const Icon(Icons.arrow_back_rounded, size: 20),
                    label: Text(lp.t('Go back', 'Retour')),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.forestGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                if (onContactSupport != null) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: onContactSupport,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.forestGreen,
                        side: const BorderSide(color: AppColors.forestGreen, width: 1),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(lp.t('Contact support', 'Contacter le support')),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
