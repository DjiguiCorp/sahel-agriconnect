import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/auth_state.dart';
import '../core/language_provider.dart';
import '../core/theme.dart';
import '../services/biometric_service.dart';

/// Result of the post-login biometric opt-in sheet.
enum BiometricSetupResult {
  enabled,
  skipped,
  unavailable,
}

/// After OTP login, offers to enable Face ID / fingerprint for faster return visits.
/// Only stores [sessionSeed] when the user passes the system biometric prompt.
Future<BiometricSetupResult> offerBiometricSetupIfAvailable(
  BuildContext context, {
  required String? sessionSeed,
  required String role,
}) async {
  if (sessionSeed == null || sessionSeed.isEmpty) {
    return BiometricSetupResult.unavailable;
  }

  final cap = await BiometricService.getCapability();
  if (!cap.deviceSupported) {
    return BiometricSetupResult.unavailable;
  }

  if (!context.mounted) return BiometricSetupResult.unavailable;

  final auth = context.read<AuthState>();

  if (await BiometricService.isOptedIn()) {
    await auth.enableBiometricRelogin(sessionSeed, role);
    return BiometricSetupResult.enabled;
  }

  if (!context.mounted) return BiometricSetupResult.unavailable;

  final result = await showModalBottomSheet<BiometricSetupResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    isDismissible: true,
    builder: (ctx) => _BiometricSetupSheet(
      capability: cap,
      role: role,
      sessionSeed: sessionSeed,
    ),
  );

  await BiometricService.markSetupPromptShown();
  return result ?? BiometricSetupResult.skipped;
}

class _BiometricSetupSheet extends StatefulWidget {
  const _BiometricSetupSheet({
    required this.capability,
    required this.role,
    required this.sessionSeed,
  });

  final BiometricCapability capability;
  final String role;
  final String sessionSeed;

  @override
  State<_BiometricSetupSheet> createState() => _BiometricSetupSheetState();
}

class _BiometricSetupSheetState extends State<_BiometricSetupSheet> {
  bool _enrolling = false;
  String? _error;

  Future<void> _enable() async {
    final lp = context.read<LanguageProvider>();
    setState(() {
      _enrolling = true;
      _error = null;
    });

    final passed = await BiometricService.authenticate(
      reason: lp.t(
        'Allow Sahel AgriConnect to use biometrics for faster sign-in',
        'Autoriser Sahel AgriConnect à utiliser la biométrie pour une connexion plus rapide',
      ),
    );

    if (!mounted) return;

    if (!passed) {
      setState(() {
        _enrolling = false;
        _error = lp.t(
          'Biometric setup was not completed. You can enable this later from your account settings.',
          'Configuration biométrique non terminée. Vous pourrez l\'activer plus tard dans les paramètres du compte.',
        );
      });
      return;
    }

    await context
        .read<AuthState>()
        .enableBiometricRelogin(widget.sessionSeed, widget.role);
    await BiometricService.setOptedIn(true);

    if (!mounted) return;
    Navigator.of(context).pop(BiometricSetupResult.enabled);
  }

  void _skip() {
    Navigator.of(context).pop(BiometricSetupResult.skipped);
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final cap = widget.capability;
    final method = BiometricService.methodLabel(cap, lp.t);
    final icon = BiometricService.methodIcon(cap);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
        decoration: BoxDecoration(
          color: const Color(0xFF1a3c2e),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.15),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.4),
                ),
              ),
              child: Icon(icon, size: 40, color: AppColors.gold),
            ),
            const SizedBox(height: 20),
            Text(
              lp.t(
                'Use $method next time?',
                'Utiliser $method la prochaine fois ?',
              ),
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              lp.t(
                'Your phone will ask you to confirm with $method or your device PIN — just like other banking and wallet apps. Older phones without biometrics can keep signing in with OTP.',
                'Votre téléphone vous demandera de confirmer avec $method ou votre code appareil — comme les autres applications. Les téléphones sans biométrie continueront avec un code OTP.',
              ),
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 14,
                height: 1.45,
              ),
            ),
            if (!cap.canCheckBiometrics) ...[
              const SizedBox(height: 12),
              Text(
                lp.t(
                  'Set up Face ID or a fingerprint in your phone Settings first, then tap Enable below.',
                  'Configurez Face ID ou une empreinte dans les Réglages du téléphone, puis appuyez sur Activer.',
                ),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.gold,
                  fontSize: 13,
                  height: 1.35,
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.redAccent, fontSize: 12),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _enrolling ? null : _enable,
                icon: _enrolling
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.forestGreen,
                        ),
                      )
                    : Icon(icon, size: 22),
                label: Text(
                  lp.t('Enable $method', 'Activer $method'),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.forestGreen,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _enrolling ? null : _skip,
              child: Text(
                lp.t('Not now — use OTP instead', 'Pas maintenant — OTP'),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
