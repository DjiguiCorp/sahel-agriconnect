import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/language_provider.dart';
import 'sign_out_dialog.dart';

/// Sign-out control with confirmation dialog; place at end of account tab scroll content.
class DashboardSignOutButton extends StatelessWidget {
  const DashboardSignOutButton({
    super.key,
    required this.dialogBackground,
  });

  final Color dialogBackground;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Column(
      children: [
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.red.withValues(alpha: 0.5)),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.logout, color: Colors.red, size: 18),
            label: Text(
              lp.t('Sign Out', 'Se déconnecter'),
              style: const TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            onPressed: () => showSignOutDialog(context),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

/// Bottom inset for account tab scroll areas (system nav + app bottom bar).
double dashboardAccountScrollBottom(BuildContext context) =>
    MediaQuery.of(context).padding.bottom + 80;
