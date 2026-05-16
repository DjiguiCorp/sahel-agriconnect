import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import '../../widgets/web_action_tile.dart';

class CooperativeDashboard extends StatefulWidget {
  const CooperativeDashboard({super.key});

  @override
  State<CooperativeDashboard> createState() => _CooperativeDashboardState();
}

class _CooperativeDashboardState extends State<CooperativeDashboard> {
  int _tab = 0;
  late Future<Map<String, dynamic>> _portalFuture;
  String _portalEndpoint = '/api/cooperatives/public-stats';

  @override
  void initState() {
    super.initState();
    _portalFuture = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    if (token != null && token.isNotEmpty) {
      final country = auth.displayCountry;
      _portalEndpoint = country.isNotEmpty
          ? '/api/cooperatives/my-portal?country=$country'
          : '/api/cooperatives/my-portal';
      return ApiService.getCoopPortal(
        token,
        country: country.isNotEmpty ? country : null,
      );
    }
    _portalEndpoint = '/api/cooperatives/public-stats';
    return ApiService.getCoopPublicStats();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: AppColors.cream,
      body: Column(
        children: [
          const OfflineBanner(),
          // Gold header
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.gold, AppColors.goldLight],
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lp.t('Cooperative', 'Coopérative'),
                      style: TextStyle(
                        color: AppColors.forestGreen.withValues(alpha: 0.85),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      lp.t('Members & supply chains', 'Membres & filières'),
                      style: const TextStyle(
                        color: AppColors.forestGreen,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'API Render · sahelagriconnect.com',
                      style: TextStyle(
                        color: AppColors.forestGreen.withValues(alpha: 0.75),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  lp.t('Public overview', 'Aperçu public'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                FutureBuilder<Map<String, dynamic>>(
                  future: _portalFuture,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: AppColors.forestGreen,
                          ),
                        ),
                      );
                    }
                    if (snap.hasError) {
                      return Text(
                        '${lp.t('Network error: ', 'Erreur réseau : ')}${snap.error}',
                        style: const TextStyle(color: AppColors.error),
                      );
                    }
                    final data = snap.data ?? {};
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppColors.forestGreen.withValues(alpha: 0.08),
                          width: 0.5,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'GET $_portalEndpoint',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.forestGreen,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            const JsonEncoder.withIndent('  ').convert(data),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () async {
                    final uri = Uri.parse('https://sahelagriconnect.com');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.gold,
                    foregroundColor: AppColors.forestGreen,
                  ),
                  child: Text(
                    lp.t(
                      'Open sahelagriconnect.com',
                      'Ouvrir sahelagriconnect.com',
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  lp.t(
                    'Connection: ApiService.coopLogin · Portal: ApiService.getCoopPortal(token).',
                    'Connexion : ApiService.coopLogin · Portail : ApiService.getCoopPortal(token).',
                  ),
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted.withValues(alpha: 0.9),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Platform features',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.forestGreen.withValues(alpha: 0.08),
                      width: 0.5,
                    ),
                  ),
                  child: const Column(
                    children: [
                      WebActionTile(
                        title: 'Diaspora partnership',
                        description:
                            'Connect with diaspora investors and donors',
                        action: 'diaspora-partnership',
                        icon: Icons.connecting_airports_outlined,
                      ),
                      Divider(height: 1),
                      WebActionTile(
                        title: 'Equipment fund',
                        description: 'Apply for shared equipment grants',
                        action: 'equipment-fund',
                        icon: Icons.agriculture_outlined,
                      ),
                      Divider(height: 1),
                      WebActionTile(
                        title: 'Manage cooperative',
                        description: 'Members, finances, and certifications',
                        action: 'cooperative-portal',
                        icon: Icons.groups_outlined,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  lp.t('Settings & web', 'Réglages & web'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.forestGreen.withValues(alpha: 0.08),
                      width: 0.5,
                    ),
                  ),
                  child: const Column(
                    children: [
                      WebActionTile(
                        title: 'Delete my account',
                        description:
                            'Permanently remove your data from the platform',
                        action: 'delete-account',
                        icon: Icons.delete_outline,
                        isDangerous: true,
                      ),
                      Divider(height: 1),
                      WebActionTile(
                        title: 'Change password',
                        description: 'Update your login credentials securely',
                        action: 'account/security',
                        icon: Icons.lock_outline,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          _bottomNav(lp),
        ],
      ),
    );
  }

  Widget _bottomNav(LanguageProvider lp) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Colors.grey.shade200, width: 0.5),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              _navItem('🏠', lp.t('Home', 'Accueil'), 0),
              _navItem('🤝', lp.t('Members', 'Membres'), 1),
              _navItem('📦', lp.t('Lots', 'Lots'), 2),
              _navItem('📈', lp.t('Stats', 'Stats'), 3),
              _navItem('👤', lp.t('Profile', 'Profil'), 4),
            ],
          ),
        ),
      );

  Widget _navItem(String emoji, String label, int index) => Expanded(
        child: GestureDetector(
          onTap: () {
            AuthService.resetActivity();
            setState(() => _tab = index);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              children: [
                Text(
                  emoji,
                  style: TextStyle(
                    fontSize: 20,
                    color: _tab == index ? null : const Color(0xFFcccccc),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight:
                        _tab == index ? FontWeight.w700 : FontWeight.w400,
                    color: _tab == index
                        ? AppColors.forestGreen
                        : const Color(0xFFaaaaaa),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
