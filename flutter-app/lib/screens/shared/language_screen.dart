import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/language_provider.dart';
import '../../core/theme.dart';

class LanguageScreen extends StatelessWidget {
  const LanguageScreen({super.key});

  Future<void> _select(BuildContext context, String code) async {
    final lp = context.read<LanguageProvider>();
    await lp.setLang(code);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          code == 'fr'
              ? 'Langue changée en Français'
              : 'Language changed to English',
        ),
        backgroundColor: AppColors.forestGreen,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final selected = lp.lang;

    final langs = <Map<String, String>>[
      {
        'code': 'fr',
        'name': 'Français',
        'native': 'Langue officielle',
        'flag': '🇫🇷',
        'coverage':
            "Mali · Burkina Faso · Sénégal · Côte d'Ivoire · Niger · 20+ pays",
      },
      {
        'code': 'en',
        'name': 'English',
        'native': 'Official language',
        'flag': '🇬🇧',
        'coverage':
            'Ghana · Nigeria · Kenya · South Africa · Tanzania · 20+ countries',
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        title: Text(lp.t('Language', 'Langue')),
        backgroundColor: AppColors.forestGreen,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 16, top: 4),
            child: Text(
              lp.t(
                'Choose your preferred language',
                'Choisissez votre langue préférée',
              ),
              style: TextStyle(fontSize: 13, color: Colors.grey[600]),
            ),
          ),
          ...langs.map((lang) {
            final code = lang['code']!;
            final isSelected = selected == code;
            return GestureDetector(
              onTap: () => _select(context, code),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.forestGreen.withValues(alpha: 0.06)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.forestGreen
                        : Colors.grey.shade200,
                    width: isSelected ? 1.5 : 0.5,
                  ),
                ),
                child: Row(
                  children: [
                    Text(lang['flag']!, style: const TextStyle(fontSize: 28)),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lang['name']!,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? AppColors.forestGreen : null,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            lang['native']!,
                            style:
                                TextStyle(fontSize: 11, color: Colors.grey[500]),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            lang['coverage']!,
                            style:
                                TextStyle(fontSize: 11, color: Colors.grey[400]),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: AppColors.forestGreen,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 14,
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
