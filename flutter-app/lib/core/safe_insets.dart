import 'package:flutter/material.dart';

import 'glass.dart';

/// System navigation bar + keyboard aware spacing for bottom actions.
abstract final class SafeInsets {
  static double bottom(BuildContext context, {double extra = 16}) {
    final mq = MediaQuery.of(context);
    return mq.viewInsets.bottom + mq.padding.bottom + extra;
  }

  static EdgeInsets sheetPadding(
    BuildContext context, {
    double horizontal = 24,
    double top = 24,
    double extra = 24,
  }) {
    return EdgeInsets.fromLTRB(
      horizontal,
      top,
      horizontal,
      bottom(context, extra: extra),
    );
  }

  /// Height of [GlassBottomNav] + system inset (for [Scaffold.extendBody]).
  static double glassBottomNavExtent(BuildContext context) {
    final mq = MediaQuery.of(context);
    // SafeArea bottom + margin(10) + NavigationBar with labels (~80) + buffer.
    return mq.padding.bottom + 10 + 80 + 24;
  }

  /// Scroll padding for lists. Set [glassNav] true only when using
  /// [Scaffold.extendBody] with a floating [GlassBottomNav].
  static EdgeInsets listBottom(
    BuildContext context, {
    double extra = 24,
    bool glassNav = false,
  }) {
    final mq = MediaQuery.of(context);
    final bottom = glassNav
        ? glassBottomNavExtent(context)
        : mq.padding.bottom + extra;
    return EdgeInsets.fromLTRB(16, 16, 16, bottom);
  }
}
