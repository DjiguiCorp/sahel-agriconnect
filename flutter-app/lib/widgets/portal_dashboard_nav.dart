import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/auth_state.dart';
import '../core/language_provider.dart';
import '../core/theme.dart';

Future<void> portalConfirmSignOut(
  BuildContext context, {
  required Color dialogBackground,
}) async {
  final lp = context.read<LanguageProvider>();
  final confirm = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: dialogBackground,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        lp.t('Sign out?', 'Se déconnecter ?'),
        style: const TextStyle(color: Colors.white),
      ),
      content: Text(
        lp.t(
          'You will be returned to the home screen.',
          'Vous serez redirigé vers l\'accueil.',
        ),
        style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext, false),
          child: Text(
            lp.t('Cancel', 'Annuler'),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
          ),
        ),
        TextButton(
          onPressed: () => Navigator.pop(dialogContext, true),
          child: Text(
            lp.t('Sign out', 'Se déconnecter'),
            style: const TextStyle(color: Colors.red),
          ),
        ),
      ],
    ),
  );
  if (confirm == true && context.mounted) {
    await context.read<AuthState>().logout();
    if (context.mounted) context.go('/home');
  }
}

/// Back-to-platform-home + sign-out toolbar for portal dashboards.
class PortalDashboardToolbar extends StatelessWidget {
  const PortalDashboardToolbar({
    super.key,
    required this.dialogBackground,
    this.iconColor,
  });

  final Color dialogBackground;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final color = iconColor ?? Colors.white;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_rounded),
            onPressed: () => context.go('/home'),
            tooltip: lp.t('Home', 'Accueil'),
            color: color,
          ),
          const Spacer(),
          PortalSignOutIconButton(
            dialogBackground: dialogBackground,
            iconColor: color,
          ),
        ],
      ),
    );
  }
}

class PortalSignOutIconButton extends StatelessWidget {
  const PortalSignOutIconButton({
    super.key,
    required this.dialogBackground,
    this.iconColor,
  });

  final Color dialogBackground;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return IconButton(
      icon: const Icon(Icons.logout_rounded),
      onPressed: () =>
          portalConfirmSignOut(context, dialogBackground: dialogBackground),
      tooltip: lp.t('Sign Out', 'Se déconnecter'),
      color: iconColor ?? Colors.red.withValues(alpha: 0.85),
    );
  }
}

/// Platform home entry at the top of tablet sidebars.
class PortalSidebarHomeTile extends StatelessWidget {
  const PortalSidebarHomeTile({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Material(
      color: Colors.transparent,
      child: ListTile(
        leading: const Icon(Icons.home_rounded, color: AppColors.gold),
        title: Text(
          lp.t('Home', 'Accueil'),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.85),
            fontWeight: FontWeight.w600,
          ),
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      ),
    );
  }
}

/// Compact sign-out control for tablet sidebar footers.
class PortalSidebarSignOutButton extends StatelessWidget {
  const PortalSidebarSignOutButton({
    super.key,
    required this.dialogBackground,
    this.borderColor,
  });

  final Color dialogBackground;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () =>
            portalConfirmSignOut(context, dialogBackground: dialogBackground),
        icon: const Icon(Icons.logout_rounded, size: 18),
        label: Text(lp.t('Sign Out', 'Se déconnecter')),
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.red.withValues(alpha: 0.9),
          side: BorderSide(color: borderColor ?? Colors.white24),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}
