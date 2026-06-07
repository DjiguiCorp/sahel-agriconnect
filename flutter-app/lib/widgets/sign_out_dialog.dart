import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/auth_state.dart';
import '../core/language_provider.dart';

/// Unified sign-out confirmation used across all portals and profile screens.
Future<void> showSignOutDialog(BuildContext context) async {
  final lp = context.read<LanguageProvider>();
  final auth = context.read<AuthState>();

  final confirmed = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: const Color(0xFF1a3c2e),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Text(
        lp.t('Sign out', 'Se déconnecter'),
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
      content: Text(
        lp.t(
          'Are you sure you want to sign out?',
          'Êtes-vous sûr de vouloir vous déconnecter ?',
        ),
        style: const TextStyle(color: Colors.white70),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: Text(
            lp.t('Cancel', 'Annuler'),
            style: const TextStyle(color: Colors.white54),
          ),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: Colors.red.shade700,
          ),
          child: Text(lp.t('Sign out', 'Se déconnecter')),
        ),
      ],
    ),
  );

  if (confirmed == true && context.mounted) {
    await auth.logout();
    if (context.mounted) context.go('/home');
  }
}
