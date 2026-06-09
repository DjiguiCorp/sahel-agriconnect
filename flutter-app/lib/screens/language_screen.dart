import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/glass.dart';
import '../core/language_provider.dart';
import '../core/theme.dart';
import 'shared/terms_screen.dart';

/// First-run language picker — shown before terms so legal copy matches locale.
class LanguageScreen extends StatelessWidget {
  const LanguageScreen({super.key});

  Future<void> _select(BuildContext context, Locale locale) async {
    final lp = context.read<LanguageProvider>();
    await lp.setLang(locale.languageCode);
    await Future<void>.delayed(const Duration(milliseconds: 100));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('language_selected', true);
    if (!context.mounted) return;
    final termsAccepted =
        prefs.getBool(TermsScreen.termsAcceptedKey) ?? false;
    context.go(termsAccepted ? '/home' : '/terms');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0a1f14),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0a1f14), Color(0xFF1a3c2e)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
            child: Column(
              children: [
                const Spacer(flex: 2),
                GlassOrb(
                  size: 96,
                  child: ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFE8B84B), Color(0xFFB5850A)],
                    ).createShader(bounds),
                    child: const Text(
                      'SA',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -1.5,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                const Text(
                  'Choose your language',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  'Choisissez votre langue',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 15,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                _LangButton(
                  flag: '🇬🇧',
                  label: 'English',
                  onTap: () => _select(context, const Locale('en')),
                ),
                const SizedBox(height: 12),
                _LangButton(
                  flag: '🇫🇷',
                  label: 'Français',
                  onTap: () => _select(context, const Locale('fr')),
                ),
                const Spacer(flex: 3),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LangButton extends StatelessWidget {
  const _LangButton({
    required this.flag,
    required this.label,
    required this.onTap,
  });

  final String flag;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderColor: AppColors.gold.withValues(alpha: 0.35),
      onTap: onTap,
      child: Row(
        children: [
          Text(flag, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Icon(
            Icons.arrow_forward_ios_rounded,
            size: 16,
            color: Colors.white.withValues(alpha: 0.35),
          ),
        ],
      ),
    );
  }
}
