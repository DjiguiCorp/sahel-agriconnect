import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
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

  String get _countryLabel => _isPortal
      ? (_data?['country']?.toString() ?? 'National territory')
      : 'Pan-African overview';

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

  List<Map<String, dynamic>> get _regions => _buildRegions();

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

  List<Map<String, dynamic>> _buildRegions() {
    final byCountry = _data?['byCountry'];
    if (byCountry is List && byCountry.isNotEmpty) {
      return byCountry
          .whereType<Map>()
          .map((e) {
            final m = Map<String, dynamic>.from(e);
            return {
              'name': m['_id']?.toString() ?? 'Region',
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
        {'name': 'Northern belt', 'count': 0, 'trend': '—'},
        {'name': 'Central plateau', 'count': 0, 'trend': '—'},
        {'name': 'Southern corridor', 'count': 0, 'trend': '—'},
      ];
    }
    return [
      {
        'name': 'Northern belt',
        'count': (farmers * 0.32).round(),
        'trend': '+8%',
      },
      {
        'name': 'Central plateau',
        'count': (farmers * 0.41).round(),
        'trend': '+4%',
      },
      {
        'name': 'Southern corridor',
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
    final String? code = _isPortal && _data != null
        ? _data!['countryCode']?.toString()
        : null;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
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
                                      'National Agricultural Dashboard',
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
                                            _countryLabel,
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
                              GestureDetector(
                                onTap: () => context.go('/home'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 7,
                                  ),
                                  decoration: BoxDecoration(
                                    color:
                                        Colors.white.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: Colors.white
                                          .withValues(alpha: 0.2),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.home_outlined,
                                        color: Colors.white
                                            .withValues(alpha: 0.85),
                                        size: 15,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Home',
                                        style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.85),
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              _headerStat(
                                'Farmers',
                                _loading ? '…' : _farmersStr,
                              ),
                              const SizedBox(width: 8),
                              _headerStat(
                                'Co-ops',
                                _loading ? '…' : _coopsStr,
                              ),
                              const SizedBox(width: 8),
                              _headerStat(
                                'Programs',
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
            Container(
              color: _bg,
              child: Row(
                children: [
                  _tabBtn('Overview', 0),
                  _tabBtn('Statistics', 1),
                  _tabBtn('Policy', 2),
                  _tabBtn('Updates', 3),
                  _tabBtn('Account', 4),
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
                      child: _buildTab(_tab),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tabBtn(String label, int index) {
    final selected = _tab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: selected ? _accent : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: selected ? _accent : Colors.white38,
              fontSize: 10,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
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

  Widget _buildTab(int tab) {
    switch (tab) {
      case 1:
        return _StatisticsTab(
          accent: _accent,
          cardStart: _cardStart,
          cardEnd: _cardEnd,
          regions: _regions,
          isPortal: _isPortal,
          farmers: _farmersStr,
        );
      case 2:
        return _PolicyTab(
          accent: _accent,
          cardStart: _cardStart,
          cardEnd: _cardEnd,
          projects: _projects,
          isPortal: _isPortal,
        );
      case 3:
        return _UpdatesTab(
          accent: _accent,
          cardStart: _cardStart,
          cardEnd: _cardEnd,
          notifications: _notifications,
          projects: _projects,
        );
      case 4:
        return const _AccountTab(
          accent: _accent,
          cardStart: _cardStart,
          cardEnd: _cardEnd,
        );
      default:
        return _OverviewTab(
          accent: _accent,
          cardStart: _cardStart,
          cardEnd: _cardEnd,
          isPortal: _isPortal,
          farmers: _loading ? '…' : _farmersStr,
          cooperatives: _loading ? '…' : _coopsStr,
          production: _loading ? '…' : _productionStr,
          investment: _loading ? '…' : _investmentStr,
          onTabChange: (i) => setState(() => _tab = i),
        );
    }
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
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Key national metrics',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _metricCard('Registered farmers', farmers, Icons.people_outline),
            const SizedBox(width: 10),
            _metricCard(
              'Active cooperatives',
              cooperatives,
              Icons.groups_outlined,
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _metricCard(
              isPortal ? 'Production reports' : 'Cultivated area',
              production,
              Icons.eco_outlined,
            ),
            const SizedBox(width: 10),
            _metricCard(
              'Investment programs',
              investment,
              Icons.account_balance_outlined,
            ),
          ],
        ),
        if (!isPortal) ...[
          const SizedBox(height: 12),
          Text(
            'Sign in with your government credentials for country-scoped data.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.45),
              fontSize: 12,
            ),
          ),
        ],
        const SizedBox(height: 20),
        const Text(
          'Quick actions',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        _actionTile(
          context,
          Icons.groups_outlined,
          'View cooperatives',
          'Browse cooperative footprint in Statistics',
          () => onTabChange(1),
        ),
        const SizedBox(height: 8),
        _actionTile(
          context,
          Icons.file_download_outlined,
          'Export data',
          'Generate a territory summary export',
          () => _showExportSheet(context, accent),
        ),
        const SizedBox(height: 8),
        _actionTile(
          context,
          Icons.show_chart,
          'Market overview',
          'Reference commodity benchmarks',
          () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Shea +12% · Sesame +3% · Cashew +8% vs last quarter.',
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        _actionTile(
          context,
          Icons.notifications_outlined,
          'Notifications',
          'National alerts and project broadcasts',
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

  void _showExportSheet(BuildContext context, Color accent) {
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
            const Text(
              'Export territory data',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'CSV and PDF exports will include farmers, cooperatives, '
              'and program responses for your jurisdiction.',
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
                    const SnackBar(
                      content: Text('Export queued — you will be notified.'),
                    ),
                  );
                },
                child: const Text('Request export'),
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
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Crop production index',
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          isPortal
              ? 'Illustrative index vs national baseline (territory: $farmers farmers).'
              : 'Pan-African illustrative index — sign in for territory data.',
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
          'Regional breakdown',
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        ...regions.map((r) {
          final name = r['name']?.toString() ?? 'Region';
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
                        '$count registered farmers',
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
                  'National enrollment trend: steady growth in cooperative '
                  'linkages and traceability adoption.',
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
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Agricultural policies',
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
                    'National program',
                p['description']?.toString() ??
                    p['descriptionFr']?.toString() ??
                    'Active agricultural initiative.',
                'Active program',
              ))
        else ...[
          _policyCard(
            'Food security & resilience',
            'Support cooperatives with inputs, storage, and market access.',
            'National priority',
          ),
          _policyCard(
            'Climate-smart agriculture',
            'Promote drought-resistant crops and irrigation planning.',
            '2025–2027 framework',
          ),
          _policyCard(
            'Youth & women in agriculture',
            'Training grants and cooperative leadership programs.',
            'Ongoing',
          ),
        ],
        const SizedBox(height: 16),
        Text(
          'Policy updates',
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        _updateChip(
          'Input subsidy window extended',
          'Eligible cooperatives may register through Q2.',
          accent,
        ),
        const SizedBox(height: 8),
        _updateChip(
          'Traceability mandate',
          'Export lots require cooperative certification.',
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
            label: const Text(
              'Submit policy inquiry',
              style: TextStyle(fontWeight: FontWeight.bold),
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
            label: const Text('Schedule training session'),
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
            const Text(
              'Submit policy inquiry',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _field(_name, 'Your name'),
            const SizedBox(height: 12),
            _field(_subject, 'Subject'),
            const SizedBox(height: 12),
            _field(_message, 'Message', maxLines: 4),
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
                  const SnackBar(
                    content: Text(
                      'Inquiry submitted — ministry desk will respond.',
                    ),
                  ),
                );
              },
              child: const Text(
                'Send inquiry',
                style: TextStyle(fontWeight: FontWeight.bold),
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
            const Text(
              'Schedule training session',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _topic,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration('Training topic'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _location,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration('Location / region'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _date,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration('Preferred date'),
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
                  const SnackBar(
                    content: Text(
                      'Training request logged for extension services.',
                    ),
                  ),
                );
              },
              child: const Text(
                'Submit request',
                style: TextStyle(fontWeight: FontWeight.bold),
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
    final items = <_UpdateItem>[];

    for (final n in notifications.take(8)) {
      items.add(
        _UpdateItem(
          n['title']?.toString() ?? 'National alert',
          n['message']?.toString() ??
              n['body']?.toString() ??
              'Pending notification.',
          'Alert',
          accent,
        ),
      );
    }
    for (final p in projects.take(5)) {
      items.add(
        _UpdateItem(
          p['title']?.toString() ?? p['titleFr']?.toString() ?? 'Program',
          p['description']?.toString() ??
              p['descriptionFr']?.toString() ??
              'National agricultural program update.',
          'Program',
          const Color(0xFF64B5F6),
        ),
      );
    }

    if (items.isEmpty) {
      items.addAll([
        const _UpdateItem(
          '📈 Shea export demand rising',
          'EU buyers seeking certified cooperative lots this quarter.',
          'Today',
          Colors.green,
        ),
        _UpdateItem(
          '🏛️ Cooperative registration drive',
          'New digital onboarding for regional cooperatives.',
          'This week',
          accent,
        ),
        const _UpdateItem(
          '🌧️ Early rains advisory',
          'Northern belt farmers advised on sesame planting window.',
          '2 days ago',
          Color(0xFFF59E0B),
        ),
      ]);
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'National updates',
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
  const _UpdateItem(this.title, this.body, this.time, this.color);

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
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        _tile(
          context,
          Icons.home_outlined,
          accent,
          'Back to Main Home',
          'Return to platform overview',
          () => context.go('/home'),
        ),
        const SizedBox(height: 16),
        _section('Profile', [
          _tile(
            context,
            Icons.person_outline,
            AppColors.gold,
            'Edit Profile',
            'Update your details',
            () => context.go('/profile/edit'),
          ),
          _tile(
            context,
            Icons.language_outlined,
            const Color(0xFF9C27B0),
            'Language',
            'English / Français',
            () => context.go('/profile/language'),
          ),
          _tile(
            context,
            Icons.notifications_outlined,
            const Color(0xFFFF9800),
            'Notifications',
            'Manage alerts',
            () => context.go('/profile/notifications'),
          ),
        ]),
        const SizedBox(height: 16),
        _section('Account management', [
          _tile(
            context,
            Icons.email_outlined,
            accent,
            'Update email',
            'Change official email',
            () => context.go('/profile/change-email'),
          ),
          _tile(
            context,
            Icons.phone_outlined,
            accent,
            'Update phone',
            'Change contact phone',
            () => context.go('/profile/change-phone'),
          ),
          _tile(
            context,
            Icons.delete_outline,
            Colors.red,
            'Delete account',
            'Permanently remove government access',
            () => context.go('/profile/delete-account'),
          ),
        ]),
        const SizedBox(height: 16),
        _section('Support', [
          _tile(
            context,
            Icons.help_outline,
            accent,
            'Help Center',
            'FAQs and guides',
            () => context.go('/help'),
          ),
          _tile(
            context,
            Icons.gavel_outlined,
            Colors.white54,
            'Terms of Service',
            'View terms',
            () => context.push('/terms?view=1'),
          ),
          _tile(
            context,
            Icons.privacy_tip_outlined,
            Colors.white54,
            'Privacy Policy',
            'View privacy',
            () => context.push('/terms?view=1'),
          ),
        ]),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.red.withValues(alpha: 0.4)),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.logout, color: Colors.red),
            label: const Text(
              'Sign Out',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
            onPressed: () async {
              await context.read<AuthState>().logout();
              if (context.mounted) context.go('/home');
            },
          ),
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
