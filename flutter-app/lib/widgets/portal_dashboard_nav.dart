import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/glass.dart';
import '../core/language_provider.dart';
import '../core/theme.dart';
import 'sign_out_dialog.dart';

/// Glass-style home + sign-out actions for portal phone headers.
class PortalGlassHeaderActions extends StatelessWidget {
  const PortalGlassHeaderActions({
    super.key,
    this.accentColor = AppColors.gold,
  });

  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        GlassHeaderIconButton(
          icon: Icons.home_rounded,
          accentColor: AppColors.gold,
          tooltip: lp.t('Home', 'Accueil'),
          onTap: () => context.go('/home'),
        ),
        const SizedBox(width: 8),
        GlassHeaderIconButton(
          icon: Icons.logout_rounded,
          accentColor: Colors.white.withValues(alpha: 0.7),
          tooltip: lp.t('Sign out', 'Se déconnecter'),
          onTap: () => showSignOutDialog(context),
        ),
      ],
    );
  }
}

/// Icon-only home + sign-out toolbar for tablet portal content areas.
class PortalDashboardToolbar extends StatelessWidget {
  const PortalDashboardToolbar({super.key});

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.home_rounded, color: AppColors.gold),
            onPressed: () => context.go('/home'),
            tooltip: lp.t('Home', 'Accueil'),
          ),
          const Spacer(),
          IconButton(
            icon: Icon(Icons.logout_rounded, color: Colors.white.withValues(alpha: 0.7)),
            onPressed: () => showSignOutDialog(context),
            tooltip: lp.t('Sign out', 'Se déconnecter'),
          ),
        ],
      ),
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
          style: const TextStyle(color: Colors.white),
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      ),
    );
  }
}

/// Sign-out control for tablet sidebar footers.
class PortalSidebarSignOutButton extends StatelessWidget {
  const PortalSidebarSignOutButton({
    super.key,
    this.borderColor,
  });

  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => showSignOutDialog(context),
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
