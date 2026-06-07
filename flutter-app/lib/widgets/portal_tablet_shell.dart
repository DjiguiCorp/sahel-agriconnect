import 'package:flutter/material.dart';

import '../core/responsive.dart';
import 'portal_dashboard_nav.dart';

class PortalSidebarNavItem {
  const PortalSidebarNavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

class PortalSidebarStat extends StatelessWidget {
  const PortalSidebarStat({
    super.key,
    required this.label,
    required this.value,
    this.accentColor = Colors.white,
  });

  final String label;
  final String value;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: Responsive.fontSize(context, 13),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: accentColor,
            fontSize: Responsive.fontSize(context, 14),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

/// Two-column tablet shell: fixed sidebar + scrollable content.
class PortalTabletShell extends StatelessWidget {
  const PortalTabletShell({
    super.key,
    required this.backgroundColor,
    required this.sidebarColor,
    required this.accentColor,
    required this.sidebarHeader,
    required this.stats,
    required this.navItems,
    required this.selectedIndex,
    required this.onNavSelected,
    required this.content,
    this.footer,
    this.topBanner,
    this.onHomeTap,
    this.showSignOutFooter = true,
  });

  final Color backgroundColor;
  final Color sidebarColor;
  final Color accentColor;
  final Widget sidebarHeader;
  final List<Widget> stats;
  final List<PortalSidebarNavItem> navItems;
  final int selectedIndex;
  final ValueChanged<int> onNavSelected;
  final Widget content;
  final Widget? footer;
  final Widget? topBanner;
  final VoidCallback? onHomeTap;
  final bool showSignOutFooter;

  @override
  Widget build(BuildContext context) {
    final pad = Responsive.padding(context);
    return Scaffold(
      backgroundColor: backgroundColor,
      body: Row(
        children: [
          Container(
            width: 280,
            decoration: BoxDecoration(
              color: sidebarColor,
              border: Border(
                right: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
              ),
            ),
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(pad * 0.5, pad * 0.5, pad * 0.5, 16),
                    child: sidebarHeader,
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: pad * 0.5),
                    child: Column(
                      children: stats
                          .map((s) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: s,
                              ))
                          .toList(),
                    ),
                  ),
                  const Divider(height: 1, color: Color(0x14FFFFFF)),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 12,
                      ),
                      children: [
                        if (onHomeTap != null) ...[
                          PortalSidebarHomeTile(onTap: onHomeTap!),
                          const Divider(height: 1, color: Color(0x14FFFFFF)),
                          const SizedBox(height: 4),
                        ],
                        ...List.generate(navItems.length, (i) {
                        final item = navItems[i];
                        final selected = i == selectedIndex;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Material(
                            color: selected
                                ? accentColor.withValues(alpha: 0.12)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            child: InkWell(
                              onTap: () => onNavSelected(i),
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      selected ? item.selectedIcon : item.icon,
                                      color: selected
                                          ? accentColor
                                          : Colors.white.withValues(alpha: 0.5),
                                      size: 22,
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      item.label,
                                      style: TextStyle(
                                        color: selected
                                            ? Colors.white
                                            : Colors.white.withValues(alpha: 0.5),
                                        fontSize: Responsive.fontSize(context, 15),
                                        fontWeight: selected
                                            ? FontWeight.w600
                                            : FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                      ],
                    ),
                  ),
                  if (onHomeTap != null && showSignOutFooter)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: PortalSidebarSignOutButton(
                        borderColor: Colors.white.withValues(alpha: 0.12),
                      ),
                    ),
                  if (footer != null)
                    Padding(padding: const EdgeInsets.all(16), child: footer),
                ],
              ),
            ),
          ),
          Expanded(
            child: Column(
              children: [
                if (topBanner != null) topBanner!,
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(pad * 0.5, 16, pad, pad * 0.5),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (onHomeTap != null)
                          const PortalDashboardToolbar(),
                        Expanded(child: content),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
