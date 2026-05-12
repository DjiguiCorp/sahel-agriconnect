import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const forestGreen = Color(0xFF1a3c2e);
  static const sage = Color(0xFF2d5a3d);
  static const gold = Color(0xFFB5850A);
  static const goldLight = Color(0xFFd4a017);
  static const cream = Color(0xFFF8F4E3);
  static const darkBg = Color(0xFF0d1f17);
  static const darkCard = Color(0xFF111e17);
  static const white = Color(0xFFFFFFFF);
  static const textDark = Color(0xFF1a1a1a);
  static const textMuted = Color(0xFF888780);

  // Status
  static const success = Color(0xFF4ade80);
  static const warning = Color(0xFFfbbf24);
  static const error = Color(0xFFf87171);

  // Glass
  static Color glassWhite = Colors.white.withValues(alpha: 0.08);
  static Color glassBorder = Colors.white.withValues(alpha: 0.12);
  static Color glassGold = AppColors.gold.withValues(alpha: 0.12);
}

class AppTheme {
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: AppColors.forestGreen,
          secondary: AppColors.gold,
          surface: AppColors.cream,
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme().copyWith(
          displayLarge: GoogleFonts.plusJakartaSans(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: AppColors.forestGreen),
          titleLarge: GoogleFonts.plusJakartaSans(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.forestGreen),
          titleMedium: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.forestGreen),
          bodyMedium: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: AppColors.textDark),
          bodySmall: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: AppColors.textMuted),
        ),
        scaffoldBackgroundColor: AppColors.cream,
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.gold,
          secondary: AppColors.forestGreen,
          surface: AppColors.darkCard,
        ),
        scaffoldBackgroundColor: AppColors.darkBg,
        textTheme:
            GoogleFonts.plusJakartaSansTextTheme(ThemeData.dark().textTheme),
      );
}
