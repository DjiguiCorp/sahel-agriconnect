import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Shared glass-style fields for auth screens (readable on light cards).
class AuthFormTheme {
  static const fieldTextColor = Color(0xFF0d2818);
  static const labelColor = Color(0xFF1a3c2e);
  static const hintColor = Color(0xFF6B7F72);
  static const fillColor = Color(0xE8F4F0FF);
  static const errorFill = Color(0xFFFFF0F0);

  static TextStyle labelStyle() => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: labelColor,
        letterSpacing: 0.2,
      );

  static TextStyle fieldTextStyle() => const TextStyle(
        fontSize: 15,
        color: fieldTextColor,
        fontWeight: FontWeight.w500,
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
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: AppColors.forestGreen.withValues(alpha: 0.12),
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: AppColors.forestGreen.withValues(alpha: 0.12),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.forestGreen, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.error, width: 1),
      ),
    );
  }

  static BoxDecoration glassPanelDecoration() => BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.25),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.forestGreen.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      );

  static BoxDecoration footerDecoration() => BoxDecoration(
        color: const Color(0xFFF0F7F4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppColors.forestGreen.withValues(alpha: 0.1),
        ),
      );
}
