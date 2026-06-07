import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/glass.dart';
import '../core/language_provider.dart';
import '../core/theme.dart';
import 'sign_out_dialog.dart';

/// Glass-style switch-portal + sign-out actions for portal phone headers.
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
          icon: Icons.grid_view_rounded,
          accentColor: AppColors.gold,
          tooltip: lp.t('Switch portal', 'Changer de portail'),
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

/// Top app bar actions for tablet portal layouts (switch portal + sign out).
class PortalTopActionsBar extends StatelessWidget implements PreferredSizeWidget {
  const PortalTopActionsBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      actions: [
        IconButton(
          icon: const Icon(Icons.grid_view_rounded, color: AppColors.gold),
          onPressed: () => context.go('/home'),
          tooltip: lp.t('Switch portal', 'Changer de portail'),
        ),
        IconButton(
          icon: Icon(
            Icons.logout_rounded,
            color: Colors.white.withValues(alpha: 0.7),
          ),
          onPressed: () => showSignOutDialog(context),
          tooltip: lp.t('Sign out', 'Se déconnecter'),
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}

/// @deprecated Use [PortalTopActionsBar] on tablet. Kept for farmer custom layout.
class PortalDashboardToolbar extends StatelessWidget {
  const PortalDashboardToolbar({super.key});

  @override
  Widget build(BuildContext context) => const PortalTopActionsBar();
}
