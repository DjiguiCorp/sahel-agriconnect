import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/auth_state.dart';
import '../core/language_provider.dart';
import '../core/theme.dart';
import '../core/glass.dart';

class RoleOption {
  final String emoji;
  final String titleEn;
  final String titleFr;
  final String descEn;
  final String descFr;
  final String route;
  final Color accent;
  final bool isHighlighted;

  const RoleOption({
    required this.emoji,
    required this.titleEn,
    required this.titleFr,
    required this.descEn,
    required this.descFr,
    required this.route,
    required this.accent,
    this.isHighlighted = false,
  });
}

class RoleScreen extends StatelessWidget {
  const RoleScreen({super.key});

  static const roles = [
    RoleOption(
      emoji: '🌾',
      titleEn: 'Farmer',
      titleFr: 'Agriculteur',
      descEn: 'Declare produce, AI tools',
      descFr: 'Déclarer vos cultures, outils IA',
      route: '/login/farmer',
      accent: Color(0xFF3B6D11),
    ),
    RoleOption(
      emoji: '💰',
      titleEn: 'Investor',
      titleFr: 'Investisseur',
      descEn: 'AfriYield Exchange',
      descFr: 'AfriYield Exchange',
      route: '/login/investor',
      accent: Color(0xFFB5850A),
      isHighlighted: true,
    ),
    RoleOption(
      emoji: '🤝',
      titleEn: 'Cooperative',
      titleFr: 'Coopérative',
      descEn: 'Manage members & supply',
      descFr: 'Membres et productions',
      route: '/login/cooperative',
      accent: Color(0xFFB5850A),
    ),
    RoleOption(
      emoji: '🏛️',
      titleEn: 'Government',
      titleFr: 'Gouvernement',
      descEn: 'National dashboard',
      descFr: 'Tableau de bord national',
      route: '/login/government',
      accent: Color(0xFF185FA5),
    ),
    RoleOption(
      emoji: '🌍',
      titleEn: 'NGO / Partner',
      titleFr: 'ONG / Partenaire',
      descEn: 'Partner programs',
      descFr: 'Programmes partenaires',
      route: '/login/ngo',
      accent: Color(0xFF1D9E75),
    ),
    RoleOption(
      emoji: '⚙️',
      titleEn: 'Processor',
      titleFr: 'Processeur',
      descEn: 'Transformation center',
      descFr: 'Centre de transformation',
      route: '/login/processor',
      accent: Color(0xFF3B6D11),
    ),
  ];

  static String _dashboardRoute(AuthRole role) {
    switch (role) {
      case AuthRole.farmer:
        return '/farmer';
      case AuthRole.investor:
        return '/investor';
      case AuthRole.cooperative:
        return '/cooperative';
      case AuthRole.government:
        return '/government';
      case AuthRole.ngo:
        return '/ngo';
      case AuthRole.processor:
        return '/processor';
      default:
        return '/home';
    }
  }

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();
    final isFr = langProvider.locale.languageCode == 'fr';

    return Scaffold(
      backgroundColor: const Color(0xFF0d1f17),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.go('/platform'),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF1a3c2e), Color(0xFF0d1f17)],
            ),
          ),
        ),
        title: const Text(
          'Sahel AgriConnect',
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1a3c2e), Color(0xFF0d1f17)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 24),

              Column(
                children: [
                  Text(
                    isFr ? 'Bienvenue sur' : 'Welcome to',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 13,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Sahel AgriConnect',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isFr
                        ? 'Produire ensemble. Vendre plus loin. Gagner plus.'
                        : 'Produce together. Sell further. Earn more.',
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      fontStyle: FontStyle.italic,
                      letterSpacing: 0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isFr
                        ? 'Comment souhaitez-vous continuer ?'
                        : 'How would you like to continue?',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 12,
                    ),
                  ),
                ],
              ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1),

              const SizedBox(height: 28),

              // Role grid
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.2,
                    ),
                    itemCount: roles.length,
                    itemBuilder: (context, i) {
                      final role = roles[i];
                      return GlassCard(
                        borderColor: role.isHighlighted
                            ? role.accent.withValues(alpha: 0.4)
                            : Colors.white.withValues(alpha: 0.1),
                        backgroundColor: role.isHighlighted
                            ? role.accent.withValues(alpha: 0.08)
                            : Colors.white.withValues(alpha: 0.05),
                        onTap: () {
                          if (auth.isLoggedIn) {
                            context.go(_dashboardRoute(auth.role));
                          } else {
                            context.go(role.route);
                          }
                        },
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: role.accent.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                child: Text(
                                  role.emoji,
                                  style: const TextStyle(fontSize: 20),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              isFr ? role.titleFr : role.titleEn,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isFr ? role.descFr : role.descEn,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.35),
                                fontSize: 10,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                            ),
                          ],
                        ),
                      )
                          .animate(delay: Duration(milliseconds: 100 * i))
                          .fadeIn(duration: 300.ms)
                          .scale(begin: const Offset(0.9, 0.9));
                    },
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: ['EN', 'FR'].map((lang) {
                    final isOn = langProvider.lang == lang.toLowerCase();
                    return GestureDetector(
                      onTap: () => langProvider.setLang(lang.toLowerCase()),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isOn
                              ? AppColors.gold.withValues(alpha: 0.2)
                              : Colors.white.withValues(alpha: 0.07),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isOn
                                ? AppColors.gold.withValues(alpha: 0.5)
                                : Colors.white.withValues(alpha: 0.1),
                            width: 0.5,
                          ),
                        ),
                        child: Text(
                          lang,
                          style: TextStyle(
                            color: isOn
                                ? AppColors.gold
                                : Colors.white.withValues(alpha: 0.5),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
