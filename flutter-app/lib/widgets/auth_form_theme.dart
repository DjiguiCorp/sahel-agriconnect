import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Liquid-glass auth styling for farmer / login screens.
class AuthFormTheme {
  static const fieldTextColor = Color(0xFF0a1f14);
  static const labelColor = Color(0xFF1a3c2e);
  static const hintColor = Color(0xFF4a6358);
  static const fillColor = Color(0xF2FFFFFF);
  static const errorFill = Color(0xFFFFF0F0);

  static const gradientColors = [
    Color(0xFF0a1628),
    Color(0xFF0d2818),
    Color(0xFF1a3c2e),
    Color(0xFF2d5a3d),
    Color(0xFF0d1f17),
  ];

  static BoxDecoration scaffoldGradient() => const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
          stops: [0.0, 0.25, 0.5, 0.75, 1.0],
        ),
      );

  static TextStyle labelStyle() => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: labelColor,
        letterSpacing: 0.2,
      );

  static TextStyle fieldTextStyle() => const TextStyle(
        fontSize: 15,
        color: fieldTextColor,
        fontWeight: FontWeight.w600,
      );

  static InputDecoration decoration({
    required String hint,
    String? labelText,
    Widget? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: labelText,
      hintText: hint,
      hintStyle: const TextStyle(color: hintColor, fontSize: 14),
      labelStyle: labelStyle().copyWith(fontSize: 12),
      filled: true,
      fillColor: fillColor,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: _fieldBorder(0.15),
      enabledBorder: _fieldBorder(0.15),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.gold, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.error, width: 1),
      ),
    );
  }

  static OutlineInputBorder _fieldBorder(double alpha) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: AppColors.forestGreen.withValues(alpha: alpha),
        ),
      );

  static BoxDecoration glassPanelDecoration() => BoxDecoration(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withValues(alpha: 0.95),
            const Color(0xFFE8F5F0).withValues(alpha: 0.92),
            const Color(0xFFF8F4E3).withValues(alpha: 0.88),
          ],
        ),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.35),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.gold.withValues(alpha: 0.12),
            blurRadius: 32,
            offset: const Offset(0, -8),
          ),
          BoxShadow(
            color: AppColors.forestGreen.withValues(alpha: 0.15),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      );

  static BoxDecoration footerDecoration() => BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: LinearGradient(
          colors: [
            AppColors.gold.withValues(alpha: 0.12),
            AppColors.forestGreen.withValues(alpha: 0.08),
          ],
        ),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.25),
        ),
      );

  static BoxDecoration dropdownBoxDecoration() => BoxDecoration(
        color: fillColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.forestGreen.withValues(alpha: 0.18),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.forestGreen.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      );

  static Widget glassIconBadge(IconData icon, {Color? color}) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: [
              (color ?? AppColors.gold).withValues(alpha: 0.25),
              (color ?? AppColors.forestGreen).withValues(alpha: 0.15),
            ],
          ),
          border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
        ),
        child: Icon(icon, size: 32, color: color ?? AppColors.gold),
      );
}
