import 'package:flutter/material.dart';

enum DeviceType { phone, tablet }

class Responsive {
  /// Logical screen width from the platform [View], not the current widget's
  /// layout constraints (avoids false phone detection inside ConstrainedBox).
  static double screenWidth(BuildContext context) {
    final view = View.maybeOf(context);
    if (view != null) {
      return MediaQueryData.fromView(view).size.width;
    }
    return MediaQuery.sizeOf(context).width;
  }

  static DeviceType getDeviceType(BuildContext context) {
    final width = screenWidth(context);
    return width >= 768 ? DeviceType.tablet : DeviceType.phone;
  }

  static bool isTablet(BuildContext context) =>
      getDeviceType(context) == DeviceType.tablet;

  static bool isPhone(BuildContext context) =>
      getDeviceType(context) == DeviceType.phone;

  static double padding(BuildContext context) =>
      isTablet(context) ? 48.0 : 24.0;

  static double fontSize(BuildContext context, double phoneSize) =>
      isTablet(context) ? phoneSize * 1.3 : phoneSize;

  static int gridColumns(BuildContext context) =>
      isTablet(context) ? 3 : 2;

  static Widget builder({
    required BuildContext context,
    required Widget phone,
    required Widget tablet,
  }) {
    return isTablet(context) ? tablet : phone;
  }
}
