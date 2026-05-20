import 'package:flutter/material.dart';

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

  static EdgeInsets listBottom(BuildContext context, {double extra = 24}) {
    final mq = MediaQuery.of(context);
    return EdgeInsets.fromLTRB(16, 16, 16, mq.padding.bottom + extra);
  }
}
