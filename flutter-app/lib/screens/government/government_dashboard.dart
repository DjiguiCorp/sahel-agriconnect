import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import '../../widgets/web_action_tile.dart';

class GovernmentDashboard extends StatefulWidget {
  const GovernmentDashboard({super.key});

  @override
  State<GovernmentDashboard> createState() => _GovernmentDashboardState();
}

class _GovernmentDashboardState extends State<GovernmentDashboard> {
  int _tab = 0;
  late Future<Map<String, dynamic>> _statsFuture;
  String _statsEndpoint = '/api/farmers/public-stats';

  @override
  void initState() {
    super.initState();
    _statsFuture = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    if (token != null && token.isNotEmpty) {
      final country = auth.displayCountry;
      _statsEndpoint = country.isNotEmpty
          ? '/api/government/dashboard?country=$country'
          : '/api/government/dashboard';
      return ApiService.getGovDashboard(
        token,
        country: country.isNotEmpty ? country : null,
      );
    }
    _statsEndpoint = '/api/farmers/public-stats';
    return ApiService.getPublicStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: AppColors.darkBg,
      body: Column(
        children: [
          const OfflineBanner(),
          // Dark green header
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.forestGreen, AppColors.sage],
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
                      'Gouvernement',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.75),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Tableau national',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'API Render · sahelagriconnect.com',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
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
                  'Agrégats publics',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 12),
                FutureBuilder<Map<String, dynamic>>(
                  future: _statsFuture,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(
                          child: CircularProgressIndicator(color: AppColors.gold),
                        ),
                      );
                    }
                    if (snap.hasError) {
                      return Text(
                        'Erreur: ${snap.error}',
                        style: const TextStyle(color: AppColors.error),
                      );
                    }
                    final data = snap.data ?? {};
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.08),
                          width: 0.5,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'GET $_statsEndpoint',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.gold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            const JsonEncoder.withIndent('  ').convert(data),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.white.withValues(alpha: 0.65),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
                OutlinedButton(
                  onPressed: () async {
                    final uri = Uri.parse('https://sahelagriconnect.com');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.gold,
                    side: const BorderSide(color: AppColors.gold),
                  ),
                  child: const Text('Portail sahelagriconnect.com'),
                ),
                const SizedBox(height: 12),
                Text(
                  'Authentifié: ApiService.govLogin · ApiService.getGovDashboard(token).',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Réglages & web',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.08),
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
                        titleColor: Colors.white,
                        subtitleColor: Colors.white70,
                      ),
                      Divider(height: 1, color: Color(0x22FFFFFF)),
                      WebActionTile(
                        title: 'Change password',
                        description:
                            'Update your login credentials securely',
                        action: 'account/security',
                        icon: Icons.lock_outline,
                        titleColor: Colors.white,
                        subtitleColor: Colors.white70,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          _bottomNav(),
        ],
      ),
    );
  }

  Widget _bottomNav() => Container(
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          border: Border(
            top: BorderSide(
              color: Colors.white.withValues(alpha: 0.06),
              width: 0.5,
            ),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              _navItem('🏛️', 'Vue', 0),
              _navItem('🌾', 'Agricoles', 1),
              _navItem('📊', 'Indicateurs', 2),
              _navItem('🔔', 'Alertes', 3),
              _navItem('👤', 'Profil', 4),
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
                    color: _tab == index
                        ? AppColors.gold
                        : Colors.white.withValues(alpha: 0.28),
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
                        ? AppColors.gold
                        : Colors.white.withValues(alpha: 0.35),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
