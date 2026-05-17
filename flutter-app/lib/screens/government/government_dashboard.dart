import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/dashboard_account_nav_header.dart';
import '../../widgets/dashboard_sign_out_button.dart';
import '../../widgets/offline_banner.dart';

class GovernmentDashboard extends StatefulWidget {
  const GovernmentDashboard({super.key});

  @override
  State<GovernmentDashboard> createState() => _GovernmentDashboardState();
}

class _GovernmentDashboardState extends State<GovernmentDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _data;
  bool _loading = true;

  static const _bg = Color(0xFF0a0f1e);
  static const _headerStart = Color(0xFF1a2035);
  static const _headerEnd = Color(0xFF243050);
  static const _accent = Color(0xFF185FA5);
  static const _cardStart = Color(0xFF1a2035);
  static const _cardEnd = Color(0xFF141830);

  bool get _isPortal =>
      _data != null &&
      _data!.containsKey('stats') &&
      _data!.containsKey('country');

  Map<String, dynamic> get _stats {
    final s = _data?['stats'];
    if (s is Map) return Map<String, dynamic>.from(s);
    return {};
  }

  String _countryLabel(LanguageProvider lp) => _isPortal
      ? (_data?['country']?.toString() ??
          lp.t('National territory', 'Territoire national'))
      : lp.t('Pan-African overview', 'Aperçu panafricain');

  String get _farmersStr => _isPortal
      ? '${_stats['farmers'] ?? 0}'
      : '${_data?['total'] ?? '—'}';

  String get _coopsStr => _isPortal
      ? '${_stats['cooperatives'] ?? 0}'
      : '${_data?['active'] ?? '—'}';

  String get _productionStr => _isPortal
      ? '${_stats['totalResponses'] ?? 0}'
      : '${(_data?['totalArea'] as num?)?.round() ?? '—'} ha';

  String get _investmentStr => _isPortal
      ? '${_stats['activeProjects'] ?? 0}'
      : '—';

  List<Map<String, dynamic>> get _projects => _listOfMaps('projects');

  List<Map<String, dynamic>> get _notifications =>
      _listOfMaps('recentNotifications');

  List<Map<String, dynamic>> _regions(LanguageProvider lp) => _buildRegions(lp);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthState>();
      final token = auth.token;
      final Map<String, dynamic> res;
      if (token != null && token.isNotEmpty) {
        res = await ApiService.getGovDashboard(
          token,
          country:
              auth.displayCountry.isNotEmpty ? auth.displayCountry : null,
        );
      } else {
        res = await ApiService.getPublicStats();
      }
      if (mounted) {
        setState(() {
          _data = res;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> _listOfMaps(String key) {
    final raw = _data?[key];
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  List<Map<String, dynamic>> _buildRegions(LanguageProvider lp) {
    final byCountry = _data?['byCountry'];
    if (byCountry is List && byCountry.isNotEmpty) {
      return byCountry
          .whereType<Map>()
          .map((e) {
            final m = Map<String, dynamic>.from(e);
            return {
              'name': m['_id']?.toString() ?? lp.t('Region', 'Région'),
              'count': m['count'] ?? 0,
              'trend': '+5%',
            };
          })
          .toList();
    }
    final farmers = (_stats['farmers'] as num?)?.toInt() ??
        (_data?['total'] as num?)?.toInt() ??
        0;
    if (farmers <= 0) {
      return [
        {
          'name': lp.t('Northern belt', 'Ceinture nord'),
          'count': 0,
          'trend': '—',
        },
        {
          'name': lp.t('Central plateau', 'Plateau central'),
          'count': 0,
          'trend': '—',
        },
        {
          'name': lp.t('Southern corridor', 'Corridor sud'),
          'count': 0,
          'trend': '—',
        },
      ];
    }
    return [
      {
        'name': lp.t('Northern belt', 'Ceinture nord'),
        'count': (farmers * 0.32).round(),
        'trend': '+8%',
      },
      {
        'name': lp.t('Central plateau', 'Plateau central'),
        'count': (farmers * 0.41).round(),
        'trend': '+4%',
      },
      {
        'name': lp.t('Southern corridor', 'Corridor sud'),
        'count': (farmers * 0.27).round(),
        'trend': '+11%',
      },
    ];
  }

  static String _flagEmoji(String? code) {
    if (code == null || code.length != 2) return '🌍';
    final u = code.toUpperCase();
    final a = u.codeUnitAt(0);
    final b = u.codeUnitAt(1);
    if (a < 65 || a > 90 || b < 65 || b > 90) return '🌍';
    const base = 0x1F1E6;
    return String.fromCharCode(base + a - 65) +
        String.fromCharCode(base + b - 65);
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final String? code = _isPortal && _data != null
        ? _data!['countryCode']?.toString()
        : null;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/platform');
      },
      child: Scaffold(
        backgroundColor: _bg,
        body: Column(
          children: [
            const OfflineBanner(),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_headerStart, _headerEnd],
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: -50,
                    right: -30,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _accent.withValues(alpha: 0.08),
                      ),
                    ),
                  ),
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      lp.t(
                                        'National Agricultural Dashboard',
                                        'Tableau de bord national agricole',
                                      ),
                                      style: TextStyle(
                                        color: Colors.white
                                            .withValues(alpha: 0.65),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Text(
                                          _flagEmoji(code),
                                          style: const TextStyle(fontSize: 26),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            _countryLabel(lp),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 22,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              _headerStat(
                                lp.t('Farmers', 'Agriculteurs'),
                                _loading ? '…' : _farmersStr,
                              ),
                              const SizedBox(width: 8),
                              _headerStat(
                                lp.t('Co-ops', 'Coopératives'),
                                _loading ? '…' : _coopsStr,
                              ),
                              const SizedBox(width: 8),
                              _headerStat(
                                lp.t('Programs', 'Programmes'),
                                _loading ? '…' : _investmentStr,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: _accent),
                    )
                  : RefreshIndicator(
                      color: _accent,
                      onRefresh: _load,
                      child: IndexedStack(
                        index: _tab,
                        children: [
                          _OverviewTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            isPortal: _isPortal,
                            farmers: _loading ? '…' : _farmersStr,
                            cooperatives: _loading ? '…' : _coopsStr,
                            production: _loading ? '…' : _productionStr,
                            investment: _loading ? '…' : _investmentStr,
                            onTabChange: (i) => setState(() => _tab = i),
                          ),
                          _StatisticsTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            regions: _regions(lp),
                            isPortal: _isPortal,
                            farmers: _farmersStr,
                          ),
                          _PolicyTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            projects: _projects,
                            isPortal: _isPortal,
                          ),
                          _UpdatesTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            notifications: _notifications,
                            projects: _projects,
                          ),
                          _AccountTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            onBackToDashboard: () => setState(() => _tab = 0),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF080d18),
            border: Border(
              top: BorderSide(
                color: Colors.white.withValues(alpha: 0.08),
                width: 1,
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: BottomNavigationBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              selectedItemColor: _accent,
              unselectedItemColor: Colors.white30,
              type: BottomNavigationBarType.fixed,
              selectedLabelStyle: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(fontSize: 10),
              currentIndex: _tab,
              onTap: (i) => setState(() => _tab = i),
              items: [
                BottomNavigationBarItem(
                  icon: const Icon(Icons.dashboard_outlined),
                  activeIcon: const Icon(Icons.dashboard),
                  label: lp.t('Overview', 'Aperçu'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.bar_chart_outlined),
                  activeIcon: const Icon(Icons.bar_chart),
                  label: lp.t('Statistics', 'Statistiques'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.policy_outlined),
                  activeIcon: const Icon(Icons.policy),
                  label: lp.t('Policy', 'Politique'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.campaign_outlined),
                  activeIcon: const Icon(Icons.campaign),
                  label: lp.t('Updates', 'Mises à jour'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.manage_accounts_outlined),
                  activeIcon: const Icon(Icons.manage_accounts),
                  label: lp.t('Account', 'Compte'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _headerStat(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 9,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ———————————————————————————————————————————————————————————— Overview
class _OverviewTab extends StatelessWidget {
  const _OverviewTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.isPortal,
    required this.farmers,
    required this.cooperatives,
    required this.production,
    required this.investment,
    required this.onTabChange,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final bool isPortal;
  final String farmers;
  final String cooperatives;
  final String production;
  final String investment;
  final ValueChanged<int> onTabChange;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('Key national metrics', 'Indicateurs nationaux clés'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _metricCard(
              lp.t('Registered farmers', 'Agriculteurs enregistrés'),
              farmers,
              Icons.people_outline,
            ),
            const SizedBox(width: 10),
            _metricCard(
              lp.t('Active cooperatives', 'Coopératives actives'),
              cooperatives,
              Icons.groups_outlined,
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _metricCard(
              isPortal
                  ? lp.t('Production reports', 'Rapports de production')
                  : lp.t('Cultivated area', 'Superficie cultivée'),
              production,
              Icons.eco_outlined,
            ),
            const SizedBox(width: 10),
            _metricCard(
              lp.t('Investment programs', 'Programmes d’investissement'),
              investment,
              Icons.account_balance_outlined,
            ),
          ],
        ),
        if (!isPortal) ...[
          const SizedBox(height: 12),
          Text(
            lp.t(
              'Sign in with your government credentials for country-scoped data.',
              'Connectez-vous avec vos identifiants gouvernementaux pour des données par pays.',
            ),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.45),
              fontSize: 12,
            ),
          ),
        ],
        const SizedBox(height: 20),
        Text(
          lp.t('Quick actions', 'Actions rapides'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        _actionTile(
          context,
          Icons.groups_outlined,
          lp.t('View cooperatives', 'Voir les coopératives'),
          lp.t(
            'Browse cooperative footprint in Statistics',
            'Parcourir l’empreinte coopérative dans Statistiques',
          ),
          () => onTabChange(1),
        ),
        const SizedBox(height: 8),
        _actionTile(
          context,
          Icons.file_download_outlined,
          lp.t('Export data', 'Exporter les données'),
          lp.t(
            'Generate a territory summary export',
            'Générer un export récapitulatif du territoire',
          ),
          () => _showExportSheet(context, accent, lp),
        ),
        const SizedBox(height: 8),
        _actionTile(
          context,
          Icons.show_chart,
          lp.t('Market overview', 'Aperçu du marché'),
          lp.t(
            'Reference commodity benchmarks',
            'Références des matières premières',
          ),
          () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  lp.t(
                    'Shea +12% · Sesame +3% · Cashew +8% vs last quarter.',
                    'Karité +12 % · Sésame +3 % · Cajou +8 % vs trimestre précédent.',
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        _actionTile(
          context,
          Icons.notifications_outlined,
          lp.t('Notifications', 'Notifications'),
          lp.t(
            'National alerts and project broadcasts',
            'Alertes nationales et annonces de projets',
          ),
          () => context.push('/notifications'),
        ),
      ],
    );
  }

  Widget _metricCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [cardStart, cardEnd]),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: accent, size: 20),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 11,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionTile(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [cardStart, cardEnd]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Row(
            children: [
              Icon(icon, color: accent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.white.withValues(alpha: 0.25),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showExportSheet(
    BuildContext context,
    Color accent,
    LanguageProvider lp,
  ) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1a2035),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              lp.t('Export territory data', 'Exporter les données du territoire'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              lp.t(
                'CSV and PDF exports will include farmers, cooperatives, '
                'and program responses for your jurisdiction.',
                'Les exports CSV et PDF incluront agriculteurs, coopératives '
                'et réponses aux programmes pour votre juridiction.',
              ),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.65),
                height: 1.45,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: accent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        lp.t(
                          'Export queued — you will be notified.',
                          'Export en file — vous serez notifié.',
                        ),
                      ),
                    ),
                  );
                },
                child: Text(lp.t('Request export', 'Demander l’export')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ———————————————————————————————————————————————————————————— Statistics
class _StatisticsTab extends StatelessWidget {
  const _StatisticsTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.regions,
    required this.isPortal,
    required this.farmers,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<Map<String, dynamic>> regions;
  final bool isPortal;
  final String farmers;

  static const _cropBars = [
    ('Shea', 0.82),
    ('Sesame', 0.65),
    ('Cashew', 0.71),
    ('Millet', 0.48),
    ('Rice', 0.55),
  ];

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('Crop production index', 'Indice de production agricole'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          isPortal
              ? lp.t(
                  'Illustrative index vs national baseline (territory: $farmers farmers).',
                  'Indice illustratif vs référence nationale (territoire : $farmers agriculteurs).',
                )
              : lp.t(
                  'Pan-African illustrative index — sign in for territory data.',
                  'Indice illustratif panafricain — connectez-vous pour les données territoriales.',
                ),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [cardStart, cardEnd]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            children: _cropBars.map((e) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    SizedBox(
                      width: 56,
                      child: Text(
                        e.$1,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 12,
                        ),
                      ),
                    ),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: e.$2,
                          minHeight: 10,
                          backgroundColor:
                              Colors.black.withValues(alpha: 0.35),
                          color: accent,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${(e.$2 * 100).round()}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          lp.t('Regional breakdown', 'Répartition régionale'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        ...regions.map((r) {
          final name = r['name']?.toString() ?? lp.t('Region', 'Région');
          final count = r['count']?.toString() ?? '0';
          final trend = r['trend']?.toString() ?? '';
          final up = trend.startsWith('+');
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cardStart, cardEnd]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Row(
              children: [
                Icon(Icons.map_outlined, color: accent, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        lp.t(
                          '$count registered farmers',
                          '$count agriculteurs enregistrés',
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (trend.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: (up ? Colors.green : Colors.orange)
                          .withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      trend,
                      style: TextStyle(
                        color: up ? Colors.green : Colors.orange,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
          );
        }),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: accent.withValues(alpha: 0.25)),
            color: accent.withValues(alpha: 0.08),
          ),
          child: Row(
            children: [
              Icon(Icons.trending_up, color: accent, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  lp.t(
                    'National enrollment trend: steady growth in cooperative '
                    'linkages and traceability adoption.',
                    'Tendance nationale : croissance des liens coopératifs '
                    'et de l’adoption de la traçabilité.',
                  ),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.75),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ———————————————————————————————————————————————————————————— Policy
class _PolicyTab extends StatelessWidget {
  const _PolicyTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.projects,
    required this.isPortal,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<Map<String, dynamic>> projects;
  final bool isPortal;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('Agricultural policies', 'Politiques agricoles'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (isPortal && projects.isNotEmpty)
          ...projects.map((p) => _policyCard(
                p['title']?.toString() ??
                    p['titleFr']?.toString() ??
                    lp.t('National program', 'Programme national'),
                p['description']?.toString() ??
                    p['descriptionFr']?.toString() ??
                    lp.t(
                      'Active agricultural initiative.',
                      'Initiative agricole active.',
                    ),
                lp.t('Active program', 'Programme actif'),
              ))
        else ...[
          _policyCard(
            lp.t('Food security & resilience', 'Sécurité alimentaire et résilience'),
            lp.t(
              'Support cooperatives with inputs, storage, and market access.',
              'Soutenir les coopératives en intrants, stockage et accès au marché.',
            ),
            lp.t('National priority', 'Priorité nationale'),
          ),
          _policyCard(
            lp.t('Climate-smart agriculture', 'Agriculture climato-intelligente'),
            lp.t(
              'Promote drought-resistant crops and irrigation planning.',
              'Promouvoir cultures résistantes à la sécheresse et planification irrigation.',
            ),
            lp.t('2025–2027 framework', 'Cadre 2025–2027'),
          ),
          _policyCard(
            lp.t('Youth & women in agriculture', 'Jeunesse et femmes en agriculture'),
            lp.t(
              'Training grants and cooperative leadership programs.',
              'Subventions formation et programmes de leadership coopératif.',
            ),
            lp.t('Ongoing', 'En cours'),
          ),
        ],
        const SizedBox(height: 16),
        Text(
          lp.t('Policy updates', 'Mises à jour politiques'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        _updateChip(
          lp.t('Input subsidy window extended', 'Fenêtre subventions intrants prolongée'),
          lp.t(
            'Eligible cooperatives may register through Q2.',
            'Les coopératives éligibles peuvent s’inscrire jusqu’au T2.',
          ),
          accent,
        ),
        const SizedBox(height: 8),
        _updateChip(
          lp.t('Traceability mandate', 'Obligation de traçabilité'),
          lp.t(
            'Export lots require cooperative certification.',
            'Les lots exportés exigent une certification coopérative.',
          ),
          const Color(0xFF64B5F6),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: accent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.edit_note_outlined),
            label: Text(
              lp.t('Submit policy inquiry', 'Soumettre une demande politique'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: () => _showPolicyInquiry(context, accent),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: accent,
              side: BorderSide(color: accent.withValues(alpha: 0.5)),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.school_outlined),
            label: Text(lp.t('Schedule training session', 'Planifier une formation')),
            onPressed: () => _showTrainingSheet(context, accent),
          ),
        ),
      ],
    );
  }

  Widget _policyCard(String title, String body, String badge) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [cardStart, cardEnd]),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accent.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    color: accent,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _updateChip(String title, String body, Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [cardStart, cardEnd]),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 6,
            height: 6,
            margin: const EdgeInsets.only(top: 6),
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                Text(
                  body,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showPolicyInquiry(BuildContext context, Color accent) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1a2035),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _PolicyInquirySheet(accent: accent),
    );
  }

  void _showTrainingSheet(BuildContext context, Color accent) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1a2035),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _TrainingScheduleSheet(accent: accent),
    );
  }
}

class _PolicyInquirySheet extends StatefulWidget {
  const _PolicyInquirySheet({required this.accent});

  final Color accent;

  @override
  State<_PolicyInquirySheet> createState() => _PolicyInquirySheetState();
}

class _PolicyInquirySheetState extends State<_PolicyInquirySheet> {
  final _name = TextEditingController();
  final _subject = TextEditingController();
  final _message = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              lp.t('Submit policy inquiry', 'Soumettre une demande politique'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _field(_name, lp.t('Your name', 'Votre nom')),
            const SizedBox(height: 12),
            _field(_subject, lp.t('Subject', 'Objet')),
            const SizedBox(height: 12),
            _field(_message, lp.t('Message', 'Message'), maxLines: 4),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      lp.t(
                        'Inquiry submitted — ministry desk will respond.',
                        'Demande envoyée — le bureau ministériel répondra.',
                      ),
                    ),
                  ),
                );
              },
              child: Text(
                lp.t('Send inquiry', 'Envoyer la demande'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label, {int maxLines = 1}) {
    return TextField(
      controller: c,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: widget.accent),
        ),
      ),
    );
  }
}

class _TrainingScheduleSheet extends StatefulWidget {
  const _TrainingScheduleSheet({required this.accent});

  final Color accent;

  @override
  State<_TrainingScheduleSheet> createState() => _TrainingScheduleSheetState();
}

class _TrainingScheduleSheetState extends State<_TrainingScheduleSheet> {
  final _topic = TextEditingController();
  final _location = TextEditingController();
  final _date = TextEditingController();

  @override
  void dispose() {
    _topic.dispose();
    _location.dispose();
    _date.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              lp.t('Schedule training session', 'Planifier une formation'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _topic,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration(lp.t('Training topic', 'Thème de formation')),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _location,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration(lp.t('Location / region', 'Lieu / région')),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _date,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration(lp.t('Preferred date', 'Date souhaitée')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      lp.t(
                        'Training request logged for extension services.',
                        'Demande de formation enregistrée pour les services de vulgarisation.',
                      ),
                    ),
                  ),
                );
              },
              child: Text(
                lp.t('Submit request', 'Envoyer la demande'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _decoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: widget.accent),
      ),
    );
  }
}

// ———————————————————————————————————————————————————————————— Updates
class _UpdatesTab extends StatelessWidget {
  const _UpdatesTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.notifications,
    required this.projects,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<Map<String, dynamic>> notifications;
  final List<Map<String, dynamic>> projects;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final items = <_UpdateItem>[];

    for (final n in notifications.take(8)) {
      items.add(
        _UpdateItem(
          n['title']?.toString() ?? lp.t('National alert', 'Alerte nationale'),
          n['message']?.toString() ??
              n['body']?.toString() ??
              lp.t('Pending notification.', 'Notification en attente.'),
          lp.t('Alert', 'Alerte'),
          accent,
        ),
      );
    }
    for (final p in projects.take(5)) {
      items.add(
        _UpdateItem(
          p['title']?.toString() ??
              p['titleFr']?.toString() ??
              lp.t('Program', 'Programme'),
          p['description']?.toString() ??
              p['descriptionFr']?.toString() ??
              lp.t(
                'National agricultural program update.',
                'Mise à jour du programme agricole national.',
              ),
          lp.t('Program', 'Programme'),
          const Color(0xFF64B5F6),
        ),
      );
    }

    if (items.isEmpty) {
      items.addAll([
        _UpdateItem(
          lp.t(
            '📈 Shea export demand rising',
            '📈 Demande export karité en hausse',
          ),
          lp.t(
            'EU buyers seeking certified cooperative lots this quarter.',
            'Acheteurs UE recherchent lots coopératifs certifiés ce trimestre.',
          ),
          lp.t('Today', 'Aujourd’hui'),
          Colors.green,
        ),
        _UpdateItem(
          lp.t(
            '🏛️ Cooperative registration drive',
            '🏛️ Campagne d’enregistrement coopératif',
          ),
          lp.t(
            'New digital onboarding for regional cooperatives.',
            'Nouvelle inscription numérique pour coopératives régionales.',
          ),
          lp.t('This week', 'Cette semaine'),
          accent,
        ),
        _UpdateItem(
          lp.t(
            '🌧️ Early rains advisory',
            '🌧️ Avis pluies précoces',
          ),
          lp.t(
            'Northern belt farmers advised on sesame planting window.',
            'Agriculteurs du nord conseillés sur la fenêtre de semis du sésame.',
          ),
          lp.t('2 days ago', 'Il y a 2 jours'),
          const Color(0xFFF59E0B),
        ),
      ]);
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('National updates', 'Actualités nationales'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        ...items.map(
          (u) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _updateCard(u, cardStart, cardEnd),
          ),
        ),
      ],
    );
  }

  Widget _updateCard(_UpdateItem u, Color start, Color end) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [start, end]),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.only(top: 5),
            decoration: BoxDecoration(color: u.color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  u.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  u.body,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  u.time,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.35),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _UpdateItem {
  _UpdateItem(this.title, this.body, this.time, this.color);

  final String title;
  final String body;
  final String time;
  final Color color;
}

// ———————————————————————————————————————————————————————————— Account
class _AccountTab extends StatelessWidget {
  const _AccountTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.onBackToDashboard,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final VoidCallback onBackToDashboard;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: dashboardAccountScrollBottom(context),
      ),
      children: [
        DashboardAccountNavHeader(
          accent: accent,
          cardStart: cardStart,
          cardEnd: cardEnd,
          onBackToDashboard: onBackToDashboard,
        ),
        _section(lp.t('Profile', 'Profil'), [
          _tile(
            context,
            Icons.person_outline,
            AppColors.gold,
            lp.t('Edit Profile', 'Modifier le profil'),
            lp.t('Update your details', 'Mettre à jour vos informations'),
            () => context.go('/profile/edit'),
          ),
          _tile(
            context,
            Icons.language_outlined,
            const Color(0xFF9C27B0),
            lp.t('Language', 'Langue'),
            lp.t('English / Français', 'English / Français'),
            () => context.go('/profile/language'),
          ),
          _tile(
            context,
            Icons.notifications_outlined,
            const Color(0xFFFF9800),
            lp.t('Notifications', 'Notifications'),
            lp.t('Manage alerts', 'Gérer les alertes'),
            () => context.go('/profile/notifications'),
          ),
        ]),
        const SizedBox(height: 16),
        _section(lp.t('Account management', 'Gestion du compte'), [
          _tile(
            context,
            Icons.email_outlined,
            accent,
            lp.t('Update email', 'Modifier l’e-mail'),
            lp.t('Change official email', 'Changer l’e-mail officiel'),
            () => context.go('/profile/change-email'),
          ),
          _tile(
            context,
            Icons.phone_outlined,
            accent,
            lp.t('Update phone', 'Modifier le téléphone'),
            lp.t('Change contact phone', 'Changer le téléphone de contact'),
            () => context.go('/profile/change-phone'),
          ),
          _tile(
            context,
            Icons.delete_outline,
            Colors.red,
            lp.t('Delete account', 'Supprimer le compte'),
            lp.t(
              'Permanently remove government access',
              'Supprimer définitivement l’accès gouvernemental',
            ),
            () => context.go('/profile/delete-account'),
          ),
        ]),
        const SizedBox(height: 16),
        _section(lp.t('Support', 'Support'), [
          _tile(
            context,
            Icons.help_outline,
            accent,
            lp.t('Help Center', 'Centre d’aide'),
            lp.t('FAQs and guides', 'FAQ et guides'),
            () => context.go('/help'),
          ),
          _tile(
            context,
            Icons.gavel_outlined,
            Colors.white54,
            lp.t('Terms of Service', 'Conditions d’utilisation'),
            lp.t('View terms', 'Voir les conditions'),
            () => context.push('/terms?view=1&tab=0'),
          ),
          _tile(
            context,
            Icons.privacy_tip_outlined,
            Colors.white54,
            lp.t('Privacy Policy', 'Politique de confidentialité'),
            lp.t('View privacy', 'Voir la confidentialité'),
            () => context.push('/terms?view=1&tab=1'),
          ),
        ]),
        const DashboardSignOutButton(
          dialogBackground: Color(0xFF0a0f1e),
        ),
      ],
    );
  }

  Widget _section(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title.toUpperCase(),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [cardStart, cardEnd]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            children: items.asMap().entries.map((e) {
              final isLast = e.key == items.length - 1;
              return Column(
                children: [
                  e.value,
                  if (!isLast)
                    Divider(
                      height: 1,
                      indent: 56,
                      color: Colors.white.withValues(alpha: 0.06),
                    ),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _tile(
    BuildContext ctx,
    IconData icon,
    Color color,
    String title,
    String sub,
    VoidCallback onTap,
  ) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(9),
        ),
        child: Icon(icon, color: color, size: 17),
      ),
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        sub,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.45),
          fontSize: 12,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 13,
        color: Colors.white.withValues(alpha: 0.25),
      ),
    );
  }
}
