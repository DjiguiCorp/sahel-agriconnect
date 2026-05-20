import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';

const _bg     = Color(0xFF080d1a);
const _surface = Color(0xFF0e1d3a);
const _surface2 = Color(0xFF060a14);
const _blue   = Color(0xFF185FA5);
const _gold   = AppColors.gold;
const _green  = Color(0xFF1D9E75);
const _border = Color(0x14FFFFFF);
const _text   = Colors.white;
const _muted  = Color(0x99FFFFFF);

Map<String, dynamic> _normalizeGovData(Map<String, dynamic> res) {
  final stats = res['stats'];
  if (stats is Map) {
    final s = Map<String, dynamic>.from(stats);
    return {
      ...res,
      'totalFarmers': s['farmers'] ?? res['totalFarmers'],
      'totalCooperatives': s['cooperatives'] ?? res['totalCooperatives'],
      'totalHectares': res['totalHectares'] ?? res['totalAreaHa'],
    };
  }
  return res;
}

String _formatHectares(dynamic hectares) {
  if (hectares == null) return '—';
  final s = hectares.toString().trim();
  if (s.isEmpty || s == '—' || s == 'null') return '—';
  if (s.endsWith(' ha')) return s;
  return '$s ha';
}

// ══════════════════════════════════════════════════════════════
// MAIN GOVERNMENT DASHBOARD
// ══════════════════════════════════════════════════════════════
class GovernmentDashboard extends StatefulWidget {
  const GovernmentDashboard({super.key});
  @override State<GovernmentDashboard> createState() =>
    _GovernmentDashboardState();
}

class _GovernmentDashboardState extends State<GovernmentDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthState>();
    setState(() => _loading = true);
    try {
      final Map<String, dynamic> res;
      final token = auth.token;
      if (token != null && token.isNotEmpty) {
        res = await ApiService.getGovDashboard(
          token,
          country: auth.displayCountry.isNotEmpty
              ? auth.displayCountry
              : null,
        );
      } else {
        res = await ApiService.getPublicStats();
      }
      if (mounted) {
        setState(() {
          _data = _normalizeGovData(res);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _onBackPressed() async {
    if (_tab != 0) {
      setState(() => _tab = 0);
      return;
    }
    final isFr =
        context.read<LanguageProvider>().locale.languageCode == 'fr';
    final exit = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: _surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16)),
        title: Text(isFr ? 'Quitter ?' : 'Exit?',
            style: const TextStyle(color: _text)),
        content: Text(
          isFr
              ? 'Voulez-vous quitter le portail gouvernemental ?'
              : 'Do you want to exit the government portal?',
          style: const TextStyle(color: _muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(isFr ? 'Rester' : 'Stay',
                style: const TextStyle(color: _muted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(isFr ? 'Quitter' : 'Exit',
                style: const TextStyle(color: _gold)),
          ),
        ],
      ),
    );
    if (exit == true && mounted) context.go('/platform');
  }

  void _goTab(int i) {
    AuthService.resetActivity();
    setState(() => _tab = i);
  }

  @override
  Widget build(BuildContext context) {
    final isFr = context.watch<LanguageProvider>()
      .locale.languageCode == 'fr';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBackPressed();
      },
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Theme(
            data: Theme.of(context).copyWith(
              splashColor: _blue.withValues(alpha: 0.12),
              highlightColor: _blue.withValues(alpha: 0.08),
              colorScheme: Theme.of(context).colorScheme.copyWith(
                surfaceTint: Colors.transparent,
              ),
            ),
            child: Scaffold(
        backgroundColor: _bg,
        body: Column(children: [
          const OfflineBanner(),
          _GovHeader(data: _data, loading: _loading, isFr: isFr),
          Expanded(
            child: IndexedStack(index: _tab, children: [
              _OverviewTab(data: _data, loading: _loading,
                isFr: isFr, onTabChange: _goTab),
              _AgriculturalTab(data: _data, isFr: isFr),
              _StatisticsTab(data: _data, isFr: isFr),
              _PolicyTab(isFr: isFr),
              _GovAccountTab(isFr: isFr, onTabChange: _goTab),
            ]),
          ),
        ]),
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF050810),
            border: Border(top: BorderSide(color: _border, width: 1))),
          child: SafeArea(
            top: false,
            child: NavigationBarTheme(
              data: NavigationBarThemeData(
                backgroundColor: Colors.transparent,
                indicatorColor: _blue.withValues(alpha: 0.15),
                surfaceTintColor: Colors.transparent,
                labelTextStyle: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return const TextStyle(
                      color: _blue,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    );
                  }
                  return const TextStyle(color: _muted, fontSize: 12);
                }),
              ),
              child: NavigationBar(
              backgroundColor: Colors.transparent, elevation: 0,
              selectedIndex: _tab,
              onDestinationSelected: _goTab,
              indicatorColor: _blue.withValues(alpha: 0.2),
              labelBehavior:
                NavigationDestinationLabelBehavior.alwaysShow,
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.dashboard_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.dashboard, color: _blue),
                  label: isFr ? 'Vue' : 'Overview'),
                NavigationDestination(
                  icon: const Icon(Icons.agriculture_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.agriculture, color: _blue),
                  label: isFr ? 'Agricole' : 'Agricultural'),
                NavigationDestination(
                  icon: const Icon(Icons.bar_chart_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.bar_chart, color: _blue),
                  label: isFr ? 'Indicateurs' : 'Statistics'),
                NavigationDestination(
                  icon: const Icon(Icons.policy_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.policy, color: _blue),
                  label: isFr ? 'Politique' : 'Policy'),
                NavigationDestination(
                  icon: const Icon(Icons.manage_accounts_outlined,
                    color: _muted),
                  selectedIcon: const Icon(Icons.manage_accounts,
                    color: _blue),
                  label: isFr ? 'Compte' : 'Account'),
              ],
            ),
          ),
        ),
      ),
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════
class _GovHeader extends StatelessWidget {
  final Map<String, dynamic>? data;
  final bool loading, isFr;
  const _GovHeader({required this.data, required this.loading,
    required this.isFr});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final country = auth.displayCountry.isNotEmpty
      ? auth.displayCountry : (isFr ? 'Votre pays' : 'Your country');
    final farmers = data?['totalFarmers']?.toString() ?? '—';
    final coops = data?['totalCooperatives']?.toString() ?? '—';
    final area = _formatHectares(data?['totalHectares']);

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [Color(0xFF0e1d3a), Color(0xFF1a2f52),
            Color(0xFF0e1d3a)],
          stops: [0.0, 0.5, 1.0])),
      child: Stack(children: [
        Positioned(top: -30, right: -30,
          child: Container(width: 180, height: 180,
            decoration: BoxDecoration(shape: BoxShape.circle,
              color: _blue.withValues(alpha: 0.07)))),
        Positioned(top: 40, right: 60,
          child: Container(width: 80, height: 80,
            decoration: BoxDecoration(shape: BoxShape.circle,
              color: _gold.withValues(alpha: 0.04)))),
        SafeArea(bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          const Icon(Icons.account_balance_outlined,
                            color: _blue, size: 14),
                          const SizedBox(width: 4),
                          Text(isFr ? 'Portail gouvernemental'
                            : 'Government Portal',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.65),
                              fontSize: 12, fontWeight: FontWeight.w600,
                              letterSpacing: 0.8)),
                        ]),
                        const SizedBox(height: 4),
                        Text(isFr ? 'Tableau de bord national'
                          : 'National Dashboard',
                          style: const TextStyle(color: _text,
                            fontSize: 22, fontWeight: FontWeight.bold,
                            letterSpacing: -0.5)),
                        Text(country, style: const TextStyle(
                          color: _muted, fontSize: 12)),
                      ]),
                    // Home button
                    GestureDetector(
                      onTap: () => context.go('/platform'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2))),
                        child: Row(mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.home_outlined,
                              color: Colors.white.withValues(alpha: 0.9),
                              size: 15),
                            const SizedBox(width: 4),
                            Text(isFr ? 'Accueil' : 'Home',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 13)),
                          ]))),
                  ]),
                const SizedBox(height: 14),
                Row(children: [
                  _stat(farmers, isFr ? 'Agriculteurs' : 'Farmers',
                    Icons.person_outline),
                  const SizedBox(width: 8),
                  _stat(coops, isFr ? 'Coopératives' : 'Cooperatives',
                    Icons.groups_outlined),
                  const SizedBox(width: 8),
                  _stat(area,
                    isFr ? 'Superficie' : 'Area',
                    Icons.landscape_outlined),
                ]),
              ]))),
      ]),
    );
  }

  Widget _stat(String val, String label, IconData icon) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: _blue, size: 16),
          const SizedBox(height: 4),
          Text(val, style: const TextStyle(color: _gold, fontSize: 15,
            fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55), fontSize: 9)),
        ])));
}

// ══════════════════════════════════════════════════════════════
// TAB 0: OVERVIEW
// ══════════════════════════════════════════════════════════════
class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic>? data;
  final bool loading, isFr;
  final Function(int) onTabChange;
  const _OverviewTab({required this.data, required this.loading,
    required this.isFr, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    final farmers = num.tryParse(
      data?['totalFarmers']?.toString() ?? '0') ?? 0;
    final coops = num.tryParse(
      data?['totalCooperatives']?.toString() ?? '0') ?? 0;
    final area = num.tryParse(
      data?['totalHectares']?.toString() ?? '0') ?? 0;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // National enrollment trend — data-backed
        _sectionTitle(isFr ? 'Tendances nationales' : 'National Trends'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: _cardDeco(),
          child: Column(children: [
            _trendRow(isFr ? '👨‍🌾 Agriculteurs enregistrés'
              : '👨‍🌾 Registered Farmers',
              '$farmers', '+8%', true,
              isFr ? 'Croissance continue enregistrée'
                   : 'Steady growth recorded'),
            const Divider(color: _border),
            _trendRow(isFr ? '🤝 Coopératives actives'
              : '🤝 Active Cooperatives',
              '$coops', '+12%', true,
              isFr ? 'Adoption de la traçabilité en hausse'
                   : 'Traceability adoption increasing'),
            const Divider(color: _border),
            _trendRow(isFr ? '🌍 Superficie cultivée'
              : '🌍 Cultivated Area',
              '${area.toStringAsFixed(0)} ha', '+5%', true,
              isFr ? 'Extension des terres productives'
                   : 'Productive land expansion'),
          ])).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 20),

        // Quick actions
        _sectionTitle(isFr ? 'Actions rapides' : 'Quick Actions'),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10,
          childAspectRatio: 1.35,
          children: [
            _QA(emoji: '🔍',
              title: isFr ? 'Voir coopératives' : 'View Cooperatives',
              color: _blue, onTap: () => onTabChange(1)),
            _QA(emoji: '📊',
              title: isFr ? 'Indicateurs' : 'Statistics',
              color: const Color(0xFF7B61FF), onTap: () => onTabChange(2)),
            _QA(emoji: '📋',
              title: isFr ? 'Politiques' : 'Policies',
              color: _gold, onTap: () => onTabChange(3)),
            _QA(emoji: '📤',
              title: isFr ? 'Exporter données' : 'Export Data',
              color: _green,
              onTap: () => _showGovExportModal(context, isFr)),
          ]),
        const SizedBox(height: 20),

        // Investment programs
        _sectionTitle(isFr ? 'Programmes d\'investissement actifs'
          : 'Active Investment Programs'),
        const SizedBox(height: 12),
        ...[
          {
            'emoji': '💧',
            'title': isFr ? 'Programme irrigation nationale'
              : 'National Irrigation Program',
            'body': isFr
              ? 'Financement de systèmes d\'irrigation pour 500 coopératives au Mali et au Burkina Faso. Budget: 2,4M\$.'
              : 'Funding irrigation systems for 500 cooperatives in Mali and Burkina Faso. Budget: \$2.4M.',
            'status': isFr ? 'En cours' : 'Active',
            'color': _blue,
          },
          {
            'emoji': '🌱',
            'title': isFr ? 'Subvention semences certifiées'
              : 'Certified Seeds Subsidy',
            'body': isFr
              ? 'Distribution de semences améliorées à 12,000 agriculteurs. Couvre mil, sorgho, sésame, karité.'
              : 'Distribution of improved seeds to 12,000 farmers. Covers millet, sorghum, sesame, shea.',
            'status': isFr ? 'Actif' : 'Active',
            'color': _green,
          },
          {
            'emoji': '📱',
            'title': isFr ? 'Digitalisation agricole'
              : 'Agricultural Digitization',
            'body': isFr
              ? 'Déploiement de Sahel AgriConnect dans 8 régions. Objectif: 50,000 agriculteurs enregistrés d\'ici 2027.'
              : 'Deployment of Sahel AgriConnect across 8 regions. Goal: 50,000 farmers registered by 2027.',
            'status': isFr ? 'Phase 2' : 'Phase 2',
            'color': const Color(0xFF7B61FF),
          },
        ].map((p) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _border)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(p['emoji'] as String,
                style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(child: Text(p['title'] as String,
                      style: const TextStyle(color: _text, fontSize: 13,
                        fontWeight: FontWeight.w700))),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: (p['color'] as Color).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8)),
                      child: Text(p['status'] as String,
                        style: TextStyle(color: p['color'] as Color,
                          fontSize: 10, fontWeight: FontWeight.bold))),
                  ]),
                  const SizedBox(height: 4),
                  Text(p['body'] as String,
                    style: const TextStyle(color: _muted, fontSize: 12,
                      height: 1.4)),
                ])),
            ])).animate().fadeIn(duration: 300.ms)),
        const SizedBox(height: 20),

        // Crop production index
        _sectionTitle(isFr ? 'Index production agricole nationale'
          : 'National Crop Production Index'),
        const SizedBox(height: 12),
        ...[
          [isFr ? 'Beurre de karité' : 'Shea Butter', 0.78, '+12%', _gold],
          [isFr ? 'Sésame' : 'Sesame', 0.62, '+8%', _green],
          [isFr ? 'Noix de cajou' : 'Cashew', 0.45, '+15%', const Color(0xFF7B61FF)],
          [isFr ? 'Mil' : 'Millet', 0.82, '+3%', const Color(0xFFF59E0B)],
          [isFr ? 'Riz' : 'Rice', 0.38, '+6%', _blue],
          [isFr ? 'Coton' : 'Cotton', 0.55, '+4%', const Color(0xFFEC4899)],
        ].map((c) {
          final pct = (c[1] as double) * 100;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_surface, _surface2]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _border)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(child: Text(c[0] as String,
                    style: const TextStyle(color: _text, fontSize: 13,
                      fontWeight: FontWeight.w600))),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8)),
                    child: Text(c[2] as String,
                      style: const TextStyle(color: Colors.green,
                        fontSize: 11, fontWeight: FontWeight.bold))),
                  const SizedBox(width: 8),
                  Text('${pct.toStringAsFixed(0)}%',
                    style: const TextStyle(color: _gold,
                      fontWeight: FontWeight.bold, fontSize: 13)),
                ]),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: c[1] as double,
                    backgroundColor: Colors.white.withValues(alpha: 0.08),
                    color: c[3] as Color, minHeight: 6)),
              ]));
        }),
      ]);
  }

  Widget _trendRow(String label, String val, String change,
    bool up, String note) =>
    Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(children: [
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: _text,
              fontSize: 13, fontWeight: FontWeight.w600)),
            Text(note, style: const TextStyle(color: _muted, fontSize: 11)),
          ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(val, style: const TextStyle(color: _gold,
            fontWeight: FontWeight.bold, fontSize: 15)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6)),
            child: Text(change, style: const TextStyle(
              color: Colors.green, fontSize: 10,
              fontWeight: FontWeight.bold))),
        ]),
      ]));
}


void _showGovExportModal(BuildContext context, bool isFr) {
  showModalBottomSheet<void>(
      context: context,
      backgroundColor: _surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.24),
              borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          Text(isFr ? '📤 Exporter les données' : '📤 Export Data',
            style: const TextStyle(color: _text, fontSize: 18,
              fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            isFr ? 'Sélectionnez le type de rapport à générer'
                 : 'Select the type of report to generate',
            style: const TextStyle(color: _muted, fontSize: 13)),
          const SizedBox(height: 20),
          ...[
            [isFr ? 'Résumé territorial complet' : 'Full Territory Summary',
             isFr ? 'Agriculteurs, coopératives, hectares par région'
                  : 'Farmers, cooperatives, hectares by region'],
            [isFr ? 'Rapport de production' : 'Production Report',
             isFr ? 'Volumes, cultures, prix par zone'
                  : 'Volumes, crops, prices by zone'],
            [isFr ? 'Rapport coopératives' : 'Cooperatives Report',
             isFr ? 'Membres, activité, traçabilité'
                  : 'Members, activity, traceability'],
          ].map((r) => GestureDetector(
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text(isFr
                  ? '✅ Rapport "${r[0]}" en file d\'attente. Vous serez notifié.'
                  : '✅ Report "${r[0]}" queued. You will be notified.'),
                backgroundColor: _green,
                duration: const Duration(seconds: 4)));
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _border)),
              child: Row(children: [
                const Icon(Icons.download_outlined, color: _blue, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r[0], style: const TextStyle(color: _text,
                      fontSize: 13, fontWeight: FontWeight.w600)),
                    Text(r[1], style: const TextStyle(color: _muted,
                      fontSize: 11)),
                  ])),
                Icon(Icons.arrow_forward_ios, size: 12,
                  color: _muted.withValues(alpha: 0.4)),
              ]))),
          ),
          const SizedBox(height: 8),
        ])));
  }

class _QA extends StatelessWidget {
  final String emoji, title;
  final Color color;
  final VoidCallback onTap;
  const _QA({required this.emoji, required this.title,
    required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(width: 38, height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10)),
            child: Center(child: Text(emoji,
              style: const TextStyle(fontSize: 20)))),
          const Spacer(),
          Text(title, style: TextStyle(color: color,
            fontSize: 11, fontWeight: FontWeight.w700)),
        ]))).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1);
}

// ══════════════════════════════════════════════════════════════
// TAB 1: AGRICULTURAL — cooperative browser + regional breakdown
// ══════════════════════════════════════════════════════════════
class _AgriculturalTab extends StatefulWidget {
  final Map<String, dynamic>? data;
  final bool isFr;
  const _AgriculturalTab({required this.data, required this.isFr});
  @override State<_AgriculturalTab> createState() =>
    _AgriculturalTabState();
}

class _AgriculturalTabState extends State<_AgriculturalTab> {
  String _region = 'all';
  String? _expandedRegion;

  final _regions = [
    {
      'id': 'northern',
      'name': {
        'fr': 'Zone Agro-Pastorale Sahélienne',
        'en': 'Sahel Agro-Pastoral Zone',
      },
      'desc': {
        'fr': 'Gao, Kidal, Tombouctou — élevage & cultures sèches',
        'en': 'Gao, Kidal, Timbuktu — livestock & dryland crops',
      },
      'farmers': 12450, 'coops': 87, 'area': 245000,
      'topCrop': {'fr': 'Mil & sorgho', 'en': 'Millet & Sorghum'},
      'challenge': {
        'fr': 'Aridité, accès à l\'eau',
        'en': 'Aridity, water access',
      },
      'color': const Color(0xFFF59E0B),
    },
    {
      'id': 'central',
      'name': {
        'fr': 'Bassin Agricole Central',
        'en': 'Central Agricultural Basin',
      },
      'desc': {
        'fr': 'Mopti, Ségou, San — karité & céréales',
        'en': 'Mopti, Segou, San — shea & cereals',
      },
      'farmers': 28700, 'coops': 156, 'area': 420000,
      'topCrop': {'fr': 'Beurre de karité', 'en': 'Shea Butter'},
      'challenge': {
        'fr': 'Transformation, commercialisation',
        'en': 'Processing, marketing',
      },
      'color': _blue,
    },
    {
      'id': 'southern',
      'name': {
        'fr': 'Corridor Agricole du Sud',
        'en': 'Southern Farming Corridor',
      },
      'desc': {
        'fr': 'Sikasso, Koulikoro, Bamako — coton & cajou',
        'en': 'Sikasso, Koulikoro, Bamako — cotton & cashew',
      },
      'farmers': 41200, 'coops': 213, 'area': 610000,
      'topCrop': {'fr': 'Coton, noix de cajou', 'en': 'Cotton, Cashew'},
      'challenge': {
        'fr': 'Surexploitation des sols',
        'en': 'Soil overexploitation',
      },
      'color': _green,
    },
  ];

  final _sampleCoops = [
    {'name': 'Coopérative Karité Ségou', 'region': 'central',
     'members': 145, 'crop': 'Shea Butter', 'certified': true},
    {'name': 'Union Sésame Sikasso', 'region': 'southern',
     'members': 87, 'crop': 'Sesame', 'certified': true},
    {'name': 'Groupement Mil Gao', 'region': 'northern',
     'members': 62, 'crop': 'Millet', 'certified': false},
    {'name': 'Coop Cajou Koulikoro', 'region': 'southern',
     'members': 198, 'crop': 'Cashew', 'certified': true},
    {'name': 'Alliance Coton Mopti', 'region': 'central',
     'members': 120, 'crop': 'Cotton', 'certified': false},
  ];

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    final filtered = _region == 'all'
      ? _sampleCoops
      : _sampleCoops.where((c) => c['region'] == _region).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // Regional breakdown — navigable, insightful
        _sectionTitle(isFr ? 'Répartition régionale' : 'Regional Breakdown'),
        const SizedBox(height: 12),
        ..._regions.map((r) {
          final id = r['id'] as String;
          final isExp = _expandedRegion == id;
          final col = r['color'] as Color;
          return GestureDetector(
            onTap: () => setState(() =>
              _expandedRegion = isExp ? null : id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [_surface, _surface2]),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isExp ? col : _border,
                  width: isExp ? 1.5 : 1)),
              child: Column(children: [
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(children: [
                    Container(width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: col.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12)),
                      child: Icon(Icons.map_outlined, color: col,
                        size: 22)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text((r['name'] as Map)[isFr ? 'fr' : 'en']
                          as String,
                          style: const TextStyle(color: _text,
                            fontSize: 15, fontWeight: FontWeight.w700)),
                        Text((r['desc'] as Map)[isFr ? 'fr' : 'en']
                          as String,
                          style: const TextStyle(color: _muted,
                            fontSize: 11)),
                      ])),
                    Icon(isExp ? Icons.expand_less : Icons.expand_more,
                      color: col),
                  ])),
                if (isExp) ...[
                  const Divider(color: _border, height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(children: [
                      Row(children: [
                        _regionStat('${r['farmers']}',
                          isFr ? 'Agriculteurs' : 'Farmers', col),
                        const SizedBox(width: 10),
                        _regionStat('${r['coops']}',
                          isFr ? 'Coopératives' : 'Cooperatives', col),
                        const SizedBox(width: 10),
                        _regionStat('${r['area']} ha',
                          isFr ? 'Superficie' : 'Area', col),
                      ]),
                      const SizedBox(height: 14),
                      Row(children: [
                        Expanded(child: _infoItem(
                          Icons.eco_outlined,
                          isFr ? 'Culture principale' : 'Main Crop',
                          (r['topCrop'] as Map)[isFr ? 'fr' : 'en']
                            as String)),
                        Expanded(child: _infoItem(
                          Icons.warning_amber_outlined,
                          isFr ? 'Défi principal' : 'Main Challenge',
                          (r['challenge'] as Map)[isFr ? 'fr' : 'en']
                            as String)),
                      ]),
                      const SizedBox(height: 12),
                      SizedBox(width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: col.withValues(alpha: 0.4)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10))),
                          icon: Icon(Icons.download_outlined,
                            color: col, size: 16),
                          label: Text(
                            isFr ? 'Exporter rapport régional'
                                 : 'Export Regional Report',
                            style: TextStyle(color: col, fontSize: 12)),
                          onPressed: () {
                            ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(
                              content: Text(isFr
                                ? '✅ Rapport régional en file d\'attente.'
                                : '✅ Regional report queued.'),
                              backgroundColor: _green));
                          }),
                        ),
                    ]),
                  ),
                ],
              ]),
            ),
          );
        }),

        const SizedBox(height: 20),

        // Cooperative browser
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _sectionTitle(isFr ? 'Parcourir les coopératives'
              : 'Browse Cooperatives'),
          ]),
        const SizedBox(height: 10),
        // Region filter
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _filterChip(isFr ? 'Toutes' : 'All', 'all'),
            _filterChip(isFr ? 'Zone Sahélienne' : 'Sahel Zone', 'northern'),
            _filterChip(isFr ? 'Bassin Central' : 'Central Basin', 'central'),
            _filterChip(isFr ? 'Corridor Sud' : 'Southern Corridor', 'southern'),
          ])),
        const SizedBox(height: 12),
        ...filtered.map((c) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _border)),
          child: Row(children: [
            Container(width: 40, height: 40,
              decoration: BoxDecoration(
                color: _blue.withValues(alpha: 0.15),
                shape: BoxShape.circle),
              child: const Icon(Icons.groups, color: _blue, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(c['name'] as String,
                  style: const TextStyle(color: _text, fontSize: 13,
                    fontWeight: FontWeight.w700)),
                Text('${c['members']} ${isFr ? 'membres' : 'members'} · ${c['crop']}',
                  style: const TextStyle(color: _muted, fontSize: 11)),
              ])),
            if (c['certified'] as bool)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _green.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8)),
                child: Text(isFr ? 'Certifiée' : 'Certified',
                  style: const TextStyle(color: _green, fontSize: 10,
                    fontWeight: FontWeight.bold))),
          ])).animate().fadeIn(duration: 300.ms)),
      ]);
  }

  Widget _filterChip(String label, String id) => GestureDetector(
    onTap: () => setState(() => _region = id),
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: _region == id ? _blue : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _region == id ? _blue : _border)),
      child: Text(label, style: TextStyle(
        color: _region == id ? Colors.white : _muted,
        fontSize: 12, fontWeight: _region == id
          ? FontWeight.w600 : FontWeight.w400))));

  Widget _regionStat(String val, String label, Color col) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: col.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10)),
      child: Column(children: [
        Text(val, style: TextStyle(color: col, fontWeight: FontWeight.bold,
          fontSize: 13)),
        Text(label, style: const TextStyle(color: _muted, fontSize: 9)),
      ])));

  Widget _infoItem(IconData icon, String label, String value) =>
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: _muted, size: 14),
      const SizedBox(width: 6),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: _muted, fontSize: 10)),
          Text(value, style: const TextStyle(color: _text, fontSize: 12,
            fontWeight: FontWeight.w600)),
        ])),
    ]);
}

// ══════════════════════════════════════════════════════════════
// TAB 2: STATISTICS — insightful, navigable
// ══════════════════════════════════════════════════════════════
class _StatisticsTab extends StatefulWidget {
  final Map<String, dynamic>? data;
  final bool isFr;
  const _StatisticsTab({required this.data, required this.isFr});
  @override State<_StatisticsTab> createState() => _StatisticsTabState();
}

class _StatisticsTabState extends State<_StatisticsTab> {
  String _view = 'national';

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        _sectionTitle(isFr ? 'Tableau de bord statistique'
          : 'Statistical Dashboard'),
        const SizedBox(height: 12),

        // View selector
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: _surface, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            _viewBtn(isFr ? 'National' : 'National', 'national'),
            _viewBtn(isFr ? 'Régional' : 'Regional', 'regional'),
            _viewBtn(isFr ? 'Marchés' : 'Markets', 'markets'),
          ])),
        const SizedBox(height: 16),

        if (_view == 'national') _buildNational(isFr)
        else if (_view == 'regional') _buildRegional(isFr)
        else _buildMarkets(isFr),
      ]);
  }

  Widget _viewBtn(String label, String id) => Expanded(
    child: GestureDetector(
      onTap: () => setState(() => _view = id),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: _view == id ? _blue : Colors.transparent,
          borderRadius: BorderRadius.circular(10)),
        child: Text(label, textAlign: TextAlign.center,
          style: TextStyle(
            color: _view == id ? Colors.white : _muted,
            fontSize: 12, fontWeight: _view == id
              ? FontWeight.w700 : FontWeight.w400)))));

  Widget _buildNational(bool isFr) => Column(children: [
    // Key metrics grid
    GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10,
      childAspectRatio: 1.5,
      children: [
        _kpiCard(Icons.person_outline, _blue,
          '82,350', isFr ? 'Agriculteurs enregistrés' : 'Registered Farmers',
          '+8%'),
        _kpiCard(Icons.groups_outlined, _green,
          '456', isFr ? 'Coopératives actives' : 'Active Cooperatives',
          '+12%'),
        _kpiCard(Icons.landscape_outlined, _gold,
          '1.27M ha', isFr ? 'Superficie cultivée' : 'Cultivated Area',
          '+5%'),
        _kpiCard(Icons.monetization_on_outlined, const Color(0xFF7B61FF),
          '4.2M\$', isFr ? 'Volume investissement' : 'Investment Volume',
          '+22%'),
      ]),
    const SizedBox(height: 20),
    _sectionTitle(isFr ? 'Adoption traçabilité & digitalisation'
      : 'Traceability & Digitization Adoption'),
    const SizedBox(height: 12),
    ...[
      [isFr ? 'Coopératives digitalisées' : 'Digitized Cooperatives',
       0.72, '72%', _blue],
      [isFr ? 'Agriculteurs traçables' : 'Traceable Farmers',
       0.58, '58%', _green],
      [isFr ? 'Investisseurs connectés' : 'Connected Investors',
       0.45, '45%', _gold],
      [isFr ? 'Gouvernements partenaires' : 'Partner Governments',
       0.30, '30%', const Color(0xFF7B61FF)],
    ].map((m) => Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(child: Text(m[0] as String,
              style: const TextStyle(color: _text, fontSize: 13,
                fontWeight: FontWeight.w600))),
            Text(m[2] as String,
              style: TextStyle(color: m[3] as Color,
                fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: m[1] as double,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              color: m[3] as Color, minHeight: 6)),
        ])).animate().fadeIn(duration: 300.ms)),
  ]);

  Widget _buildRegional(bool isFr) => Column(children: [
    ...[
      {
        'region': isFr
            ? '🏔️ Zone Agro-Pastorale Sahélienne'
            : '🏔️ Sahel Agro-Pastoral Zone',
        'farmers': '12,450', 'coops': '87', 'yield': '1.2 t/ha',
        'trend': '+3%', 'insight': isFr
          ? 'Zone aride — irrigations prioritaires pour le mil et sorgho'
          : 'Arid zone — irrigation priority for millet and sorghum',
        'color': const Color(0xFFF59E0B),
      },
      {
        'region': isFr
            ? '🗻 Bassin Agricole Central'
            : '🗻 Central Agricultural Basin',
        'farmers': '28,700', 'coops': '156', 'yield': '1.8 t/ha',
        'trend': '+12%', 'insight': isFr
          ? 'Fort potentiel karité — opportunité d\'investissement diaspora'
          : 'High shea potential — diaspora investment opportunity',
        'color': _blue,
      },
      {
        'region': isFr
            ? '🌿 Corridor Agricole du Sud'
            : '🌿 Southern Farming Corridor',
        'farmers': '41,200', 'coops': '213', 'yield': '2.4 t/ha',
        'trend': '+8%', 'insight': isFr
          ? 'Zone la plus productive — coton et cajou en expansion'
          : 'Most productive zone — cotton and cashew expanding',
        'color': _green,
      },
    ].map((r) => Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: (r['color'] as Color).withValues(alpha: 0.3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(r['region'] as String,
            style: const TextStyle(color: _text, fontSize: 15,
              fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Row(children: [
            _regMini('👨‍🌾 ${r['farmers']}',
              isFr ? 'Agriculteurs' : 'Farmers'),
            _regMini('🤝 ${r['coops']}',
              isFr ? 'Coopératives' : 'Coops'),
            _regMini('📊 ${r['yield']}',
              isFr ? 'Rendement' : 'Yield'),
            _regMini('📈 ${r['trend']}',
              isFr ? 'Tendance' : 'Trend'),
          ]),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (r['color'] as Color).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8)),
            child: Row(children: [
              Icon(Icons.lightbulb_outline,
                color: r['color'] as Color, size: 16),
              const SizedBox(width: 8),
              Expanded(child: Text(r['insight'] as String,
                style: const TextStyle(color: _muted, fontSize: 12,
                  height: 1.4))),
            ])),
        ])).animate().fadeIn(duration: 300.ms)),
  ]);

  Widget _regMini(String val, String label) => Expanded(
    child: Column(children: [
      Text(val, style: const TextStyle(color: _text, fontSize: 11,
        fontWeight: FontWeight.w700)),
      Text(label, style: const TextStyle(color: _muted, fontSize: 9)),
    ]));

  Widget _buildMarkets(bool isFr) {
    final commodities = [
      {
        'name': isFr ? 'Beurre de karité' : 'Shea Butter',
        'current': '450 XOF/kg',
        'benchmark': '490 XOF/kg',
        'change': '+8.9%',
        'up': true,
        'color': _gold,
      },
      {
        'name': isFr ? 'Sésame' : 'Sesame',
        'current': '380 XOF/kg',
        'benchmark': '410 XOF/kg',
        'change': '+7.9%',
        'up': true,
        'color': _green,
      },
      {
        'name': isFr ? 'Noix de cajou' : 'Cashew',
        'current': '920 XOF/kg',
        'benchmark': '880 XOF/kg',
        'change': '-4.3%',
        'up': false,
        'color': Colors.red,
      },
      {
        'name': isFr ? 'Mil' : 'Millet',
        'current': '185 XOF/kg',
        'benchmark': '195 XOF/kg',
        'change': '+5.4%',
        'up': true,
        'color': _blue,
      },
      {
        'name': isFr ? 'Coton' : 'Cotton',
        'current': '265 XOF/kg',
        'benchmark': '270 XOF/kg',
        'change': '+1.9%',
        'up': true,
        'color': const Color(0xFF7B61FF),
      },
    ];

    return Column(children: [
      _sectionTitle(isFr
          ? 'Aperçu des marchés — Références commodités'
          : 'Market Overview — Commodity Benchmarks'),
      const SizedBox(height: 12),
      ...commodities.map((c) {
        final up = c['up'] as bool;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _border),
          ),
          child: Column(children: [
            Row(children: [
              Expanded(
                child: Text(
                  c['name'] as String,
                  style: const TextStyle(
                    color: _text,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (up ? Colors.green : Colors.red)
                      .withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  c['change'] as String,
                  style: TextStyle(
                    color: up ? Colors.green : Colors.red,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: _benchItem(
                  isFr ? 'Prix actuel' : 'Current',
                  c['current'] as String,
                  _gold,
                ),
              ),
              Expanded(
                child: _benchItem(
                  isFr ? 'Référence nationale' : 'National benchmark',
                  c['benchmark'] as String,
                  _muted,
                ),
              ),
            ]),
          ]),
        ).animate().fadeIn(duration: 300.ms);
      }),
    ]);
  }

  Widget _benchItem(String label, String val, Color col) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: _muted, fontSize: 10)),
      Text(val, style: TextStyle(color: col, fontWeight: FontWeight.bold,
        fontSize: 13)),
    ]);

  Widget _kpiCard(IconData icon, Color col, String val,
    String label, String trend) =>
    Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: col, size: 18),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6)),
              child: Text(trend, style: const TextStyle(
                color: Colors.green, fontSize: 9,
                fontWeight: FontWeight.bold))),
          ]),
          const Spacer(),
          Text(val, style: const TextStyle(color: _text, fontSize: 16,
            fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: _muted, fontSize: 9)),
        ]));
}

// ══════════════════════════════════════════════════════════════
// TAB 3: POLICY — food security, policy updates, inquiry form
// ══════════════════════════════════════════════════════════════
class _PolicyTab extends StatefulWidget {
  final bool isFr;
  const _PolicyTab({required this.isFr});
  @override State<_PolicyTab> createState() => _PolicyTabState();
}

class _PolicyTabState extends State<_PolicyTab> {
  String _section = 'active';
  final _nameCtrl = TextEditingController();
  final _titleCtrl = TextEditingController();
  final _ministryCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _msgCtrl = TextEditingController();
  String _audience = 'all';
  bool _submitting = false;
  bool _submitted = false;

  @override
  void dispose() {
    _nameCtrl.dispose(); _titleCtrl.dispose(); _ministryCtrl.dispose();
    _subjectCtrl.dispose(); _msgCtrl.dispose();
    super.dispose();
  }

  void _onPolicyAction(BuildContext context, String actionType, bool isFr) {
    switch (actionType) {
      case 'notify_coop':
        showModalBottomSheet(
          context: context,
          backgroundColor: _surface,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (_) => _NotifyCoopSheet(
            isFr: isFr,
            title: isFr
                ? 'Beurre de karité — Export en hausse'
                : 'Shea Butter — Rising Export Demand',
            defaultMsg: isFr
                ? 'Les prix du beurre de karité ont augmenté de 23%. Préparez votre production pour l\'exportation avant décembre 2026.'
                : 'Shea butter prices are up 23%. Prepare your production for export before December 2026.',
          ),
        );
        break;
      case 'registration':
        showModalBottomSheet(
          context: context,
          backgroundColor: _surface,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (_) => _RegistrationListSheet(isFr: isFr),
        );
        break;
      case 'alert':
        showModalBottomSheet(
          context: context,
          backgroundColor: _surface,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (_) => _AlertBroadcastSheet(
            isFr: isFr,
            title: isFr ? 'Avis précoce pluies' : 'Early Rain Advisory',
            defaultMsg: isFr
                ? 'Pluies précoces prévues dans le couloir soudano-sahélien. Recommandation: semis anticipé de 2-3 semaines.'
                : 'Early rains forecast in Sudano-Sahelian corridor. Recommendation: advance sowing by 2-3 weeks.',
          ),
        );
        break;
      case 'traceability':
        showModalBottomSheet(
          context: context,
          backgroundColor: _surface,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (_) => _TraceabilityDetailSheet(isFr: isFr),
        );
        break;
    }
  }

  String _broadcastSuccessDetail(bool isFr) {
    final String recipients;
    final String reach;
    switch (_audience) {
      case 'cooperatives':
        recipients = isFr ? 'Coopératives uniquement' : 'Cooperatives only';
        reach = isFr ? '456 coopératives' : '456 cooperatives';
        break;
      case 'farmers':
        recipients = isFr ? 'Agriculteurs uniquement' : 'Farmers only';
        reach = isFr ? '82 350 agriculteurs' : '82,350 farmers';
        break;
      case 'investors':
        recipients = isFr ? 'Investisseurs uniquement' : 'Investors only';
        reach = isFr ? 'Investisseurs enregistrés' : 'Registered investors';
        break;
      default:
        recipients = isFr ? 'Tous les utilisateurs' : 'All platform users';
        reach = isFr ? '82 350+ utilisateurs' : '82,350+ users';
    }
    return isFr
        ? 'Directive diffusée avec succès!\n\nDestinataires: $recipients\nMode de livraison: Notification in-app + SMS\nEstimé reçu par: $reach\n\nVotre directive reste visible dans la section « Actualités » de chaque destinataire.'
        : 'Directive broadcast successfully!\n\nRecipients: $recipients\nDelivery mode: In-app notification + SMS\nEstimated reach: $reach\n\nYour directive remains visible in each recipient\'s "Updates" section.';
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // Section tabs
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: _surface, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            _secBtn(isFr ? 'Politiques actives' : 'Active Policies',
              'active'),
            _secBtn(isFr ? 'Sécurité alimentaire' : 'Food Security',
              'food'),
            _secBtn(isFr ? 'Diffusion' : 'Broadcast', 'inquiry'),
          ])),
        const SizedBox(height: 16),

        if (_section == 'active') _buildActivePolicies(isFr)
        else if (_section == 'food') _buildFoodSecurity(isFr)
        else _buildInquiryForm(isFr),
      ]);
  }

  Widget _secBtn(String label, String id) => Expanded(
    child: GestureDetector(
      onTap: () => setState(() => _section = id),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: _section == id ? _blue : Colors.transparent,
          borderRadius: BorderRadius.circular(10)),
        child: Text(label, textAlign: TextAlign.center,
          style: TextStyle(color: _section == id ? Colors.white : _muted,
            fontSize: 10, fontWeight: _section == id
              ? FontWeight.w700 : FontWeight.w400)))));

  Widget _buildActivePolicies(bool isFr) => Column(children: [
    // National policy updates (live-style)
    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      _sectionTitle(isFr ? 'Mises à jour nationales'
        : 'National Updates'),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: _green.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 6, height: 6,
            decoration: const BoxDecoration(
              color: _green, shape: BoxShape.circle)),
          const SizedBox(width: 4),
          const Text('Live', style: TextStyle(color: _green,
            fontSize: 10, fontWeight: FontWeight.bold)),
        ])),
    ]),
    const SizedBox(height: 12),
    ...[
      {
        'emoji': '🌾', 'badge': isFr ? 'Export' : 'Export',
        'color': _gold,
        'title': isFr ? 'Beurre de karité — Demande export en hausse'
          : 'Shea Butter — Rising Export Demand',
        'detail': isFr
          ? 'La demande européenne en beurre de karité certifié bio a augmenté de 23% ce trimestre. Fenêtre d\'exportation favorable jusqu\'en décembre 2026.'
          : 'European demand for certified organic shea butter increased 23% this quarter. Favorable export window through December 2026.',
        'date': isFr ? 'Mis à jour il y a 2 jours' : 'Updated 2 days ago',
        'action': isFr ? 'Notifier les coopératives' : 'Notify Cooperatives',
        'actionType': 'notify_coop',
      },
      {
        'emoji': '📝', 'badge': isFr ? 'Enregistrement' : 'Registration',
        'color': _blue,
        'title': isFr ? 'Campagne d\'enregistrement coopératives 2026'
          : '2026 Cooperative Registration Drive',
        'detail': isFr
          ? 'Objectif: 200 nouvelles coopératives enregistrées avant juin 2026. Les formulaires d\'inscription sont disponibles via Sahel AgriConnect.'
          : 'Goal: 200 new cooperatives registered before June 2026. Registration forms available via Sahel AgriConnect.',
        'date': isFr ? 'En cours' : 'Ongoing',
        'action': isFr ? 'Voir les inscriptions' : 'View Registrations',
        'actionType': 'registration',
      },
      {
        'emoji': '🌧️', 'badge': isFr ? 'Météo' : 'Advisory',
        'color': const Color(0xFF7B61FF),
        'title': isFr ? 'Avis précoce pluies — Soudano-sahélien'
          : 'Early Rain Advisory — Sudano-Sahelian',
        'detail': isFr
          ? 'Les prévisions météorologiques indiquent des pluies précoces dans le couloir soudano-sahélien. Recommandation: semis anticipé de 2-3 semaines.'
          : 'Weather forecasts indicate early rains in the Sudano-Sahelian corridor. Recommendation: advance sowing by 2-3 weeks.',
        'date': isFr ? 'Valide jusqu\'au 30 mai 2026' : 'Valid until May 30, 2026',
        'action': isFr ? 'Diffuser l\'alerte' : 'Broadcast Alert',
        'actionType': 'alert',
      },
      {
        'emoji': '🏷️', 'badge': isFr ? 'Réglementation' : 'Regulation',
        'color': _green,
        'title': isFr ? 'Mandat traçabilité — Extension nationale'
          : 'Traceability Mandate — National Extension',
        'detail': isFr
          ? 'Le mandat de traçabilité agricole est étendu à toutes les coopératives de plus de 50 membres à partir du 1er juillet 2026.'
          : 'Agricultural traceability mandate extended to all cooperatives with 50+ members from July 1, 2026.',
        'date': isFr ? 'Effectif le 1er juillet 2026' : 'Effective July 1, 2026',
        'action': isFr ? 'Voir les détails' : 'View Details',
        'actionType': 'traceability',
      },
    ].map((p) => Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(p['emoji'] as String,
              style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: (p['color'] as Color).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8)),
              child: Text(p['badge'] as String,
                style: TextStyle(color: p['color'] as Color,
                  fontSize: 10, fontWeight: FontWeight.bold))),
            const Spacer(),
            Text(p['date'] as String,
              style: const TextStyle(color: _muted, fontSize: 10)),
          ]),
          const SizedBox(height: 8),
          Text(p['title'] as String,
            style: const TextStyle(color: _text, fontSize: 14,
              fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(p['detail'] as String,
            style: const TextStyle(color: _muted, fontSize: 12,
              height: 1.5)),
          const SizedBox(height: 10),
          SizedBox(width: double.infinity,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                side: BorderSide(
                  color: (p['color'] as Color).withValues(alpha: 0.4)),
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10))),
              onPressed: () => _onPolicyAction(
                context, p['actionType'] as String, isFr),
              child: Text(p['action'] as String,
                style: TextStyle(color: p['color'] as Color,
                  fontSize: 12, fontWeight: FontWeight.w600)))),
        ])).animate().fadeIn(duration: 300.ms)),
  ]);

  Widget _buildFoodSecurity(bool isFr) => Column(children: [
    ...[
      {
        'icon': '🌾', 'color': _green,
        'title': isFr ? 'Sécurité alimentaire — Sahel'
          : 'Food Security — Sahel',
        'status': isFr ? 'Modérée' : 'Moderate',
        'statusColor': const Color(0xFFF59E0B),
        'items': isFr ? [
          'Soutenir les coopératives avec stockage d\'intrants et accès aux marchés — En cours (127 coopératives bénéficiaires)',
          'Programme d\'alimentation scolaire lié aux achats locaux — Couvre 340 écoles dans 5 régions',
          'Réserves stratégiques de mil et sorgho — Maintien de 3 mois de stock national',
          'Système d\'alerte précoce sur les prix alimentaires — Surveillance hebdomadaire active',
        ] : [
          'Support cooperatives with input storage and market access — Active (127 cooperatives benefiting)',
          'School feeding program linked to local purchases — Covers 340 schools in 5 regions',
          'Strategic millet and sorghum reserves — 3 months national stock maintained',
          'Early warning system on food prices — Weekly monitoring active',
        ],
      },
    ].map((f) => Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(f['icon'] as String,
              style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 10),
            Expanded(child: Text(f['title'] as String,
              style: const TextStyle(color: _text, fontSize: 15,
                fontWeight: FontWeight.w700))),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: (f['statusColor'] as Color).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20)),
              child: Text(f['status'] as String,
                style: TextStyle(color: f['statusColor'] as Color,
                  fontSize: 11, fontWeight: FontWeight.bold))),
          ]),
          const Divider(color: _border, height: 20),
          ...(f['items'] as List<String>).map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(width: 6, height: 6,
                  margin: const EdgeInsets.only(top: 5),
                  decoration: const BoxDecoration(
                    color: _green, shape: BoxShape.circle)),
                const SizedBox(width: 10),
                Expanded(child: Text(item,
                  style: const TextStyle(color: _muted, fontSize: 13,
                    height: 1.5))),
              ]))),
        ]))),
  ]);

  Widget _buildInquiryForm(bool isFr) => Column(children: [
    Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _blue.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _blue.withValues(alpha: 0.3))),
      child: Row(children: [
        const Icon(Icons.campaign_outlined, color: _blue, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(
          isFr
            ? 'En tant qu\'agent gouvernemental, vous pouvez diffuser des directives politiques directement aux coopératives, agriculteurs et partenaires enregistrés sur la plateforme.'
            : 'As a government official, you can broadcast policy directives directly to cooperatives, farmers and registered partners on the platform.',
          style: const TextStyle(color: _blue, fontSize: 12,
            height: 1.5))),
      ])),
    const SizedBox(height: 16),
    if (_submitted) ...[
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _green.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _green.withValues(alpha: 0.3))),
        child: Column(children: [
          const Icon(Icons.check_circle_outline, color: _green, size: 48),
          const SizedBox(height: 12),
          Text(isFr ? 'Directive diffusée avec succès'
            : 'Directive broadcast successfully',
            style: const TextStyle(color: _text, fontSize: 16,
              fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(
            _broadcastSuccessDetail(isFr),
            textAlign: TextAlign.center,
            style: const TextStyle(color: _muted, fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: _green.withValues(alpha: 0.4))),
            onPressed: () => setState(() => _submitted = false),
            child: Text(isFr ? 'Nouvelle directive' : 'New Directive',
              style: const TextStyle(color: _green))),
        ])),
    ] else ...[
      _card(children: [
        Text(isFr ? 'Diffuser une directive politique'
          : 'Broadcast a Policy Directive',
          style: const TextStyle(color: _text, fontSize: 16,
            fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        _lbl(isFr ? '👤 Votre nom complet *' : '👤 Full Name *'),
        _tf(_nameCtrl, isFr ? 'Prénom et nom' : 'First and last name'),
        const SizedBox(height: 12),
        _lbl(isFr ? '🏛️ Titre / Poste *' : '🏛️ Title / Position *'),
        _tf(_titleCtrl,
          isFr ? 'Ex: Directeur agriculture, Ministre...'
               : 'e.g. Director of Agriculture, Minister...'),
        const SizedBox(height: 12),
        _lbl(isFr ? '🏢 Ministère / Agence *'
          : '🏢 Ministry / Agency *'),
        _tf(_ministryCtrl,
          isFr ? 'Ex: Ministère de l\'Agriculture du Mali'
               : 'e.g. Ministry of Agriculture, Mali'),
        const SizedBox(height: 12),
        _lbl(isFr ? '📋 Titre de la directive *'
          : '📋 Directive Title *'),
        _tf(_subjectCtrl,
          isFr ? 'Ex: Subvention intrants, Traçabilité...'
               : 'e.g. Input subsidy, Traceability...'),
        const SizedBox(height: 12),
        _lbl(isFr ? '✉️ Contenu de la directive *'
          : '✉️ Directive Content *'),
        _tf(_msgCtrl,
          isFr ? 'Rédigez le contenu de votre directive...'
               : 'Write the content of your directive...',
          maxLines: 5),
        const SizedBox(height: 12),
        _lbl(isFr ? '🎯 Destinataires' : '🎯 Target Audience'),
        DropdownButtonFormField<String>(
          key: ValueKey(_audience),
          isExpanded: true,
          isDense: true,
          initialValue: _audience,
          dropdownColor: _surface,
          style: const TextStyle(color: _text),
          decoration: _dec(isFr ? 'Choisir les destinataires'
            : 'Select recipients'),
          items: [
            DropdownMenuItem(value: 'all',
              child: Text(isFr ? 'Tous — agriculteurs, coopératives, ONG'
                : 'All — farmers, cooperatives, NGOs',
                style: const TextStyle(color: _text))),
            DropdownMenuItem(value: 'cooperatives',
              child: Text(isFr ? 'Coopératives uniquement'
                : 'Cooperatives only',
                style: const TextStyle(color: _text))),
            DropdownMenuItem(value: 'farmers',
              child: Text(isFr ? 'Agriculteurs uniquement'
                : 'Farmers only',
                style: const TextStyle(color: _text))),
            DropdownMenuItem(value: 'investors',
              child: Text(isFr ? 'Investisseurs uniquement'
                : 'Investors only',
                style: const TextStyle(color: _text))),
          ],
          onChanged: (v) => setState(() => _audience = v ?? 'all'),
        ),
        const SizedBox(height: 20),
        SizedBox(width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _blue, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12))),
            onPressed: _submitting ? null : () async {
              if (_nameCtrl.text.isEmpty || _titleCtrl.text.isEmpty ||
                  _ministryCtrl.text.isEmpty || _msgCtrl.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(isFr
                    ? 'Tous les champs obligatoires doivent être remplis'
                    : 'All required fields must be filled'),
                  backgroundColor: Colors.red));
                return;
              }
              setState(() => _submitting = true);
              await Future.delayed(const Duration(seconds: 1));
              if (mounted) {
                setState(() {
                  _submitting = false;
                  _submitted = true;
                });
              }
            },
            child: _submitting
              ? const SizedBox(width: 20, height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2))
              : Text(isFr ? 'Diffuser la directive' : 'Broadcast Directive',
                  style: const TextStyle(fontWeight: FontWeight.bold,
                    fontSize: 15)))),
      ]),
    ],
  ]);
}

// ══════════════════════════════════════════════════════════════
// TAB 4: ACCOUNT — thorough government profile + navigation
// ══════════════════════════════════════════════════════════════
class _GovAccountTab extends StatelessWidget {
  final bool isFr;
  final Function(int) onTabChange;
  const _GovAccountTab({required this.isFr, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = auth.displayName.isNotEmpty
      ? auth.displayName : (isFr ? 'Agent gouvernemental' : 'Gov. Official');
    final initial = name[0].toUpperCase();

    return ListView(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 100),
      children: [
        // Profile card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft, end: Alignment.bottomRight,
              colors: [Color(0xFF0e1d3a), Color(0xFF1a2f52)]),
            borderRadius: BorderRadius.circular(20)),
          child: Row(children: [
            Container(width: 56, height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [_blue, Color(0xFF0a3d6b)]),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(
                  color: _blue.withValues(alpha: 0.4), blurRadius: 12)]),
              child: Center(child: Text(initial, style: const TextStyle(
                color: Colors.white, fontSize: 22,
                fontWeight: FontWeight.bold)))),
            const SizedBox(width: 14),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: _text,
                  fontSize: 17, fontWeight: FontWeight.bold)),
                Text(auth.displayEmail,
                  style: const TextStyle(color: _muted, fontSize: 12)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: _blue.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _blue.withValues(alpha: 0.4))),
                  child: Text(isFr ? '🏛️ Agent gouvernemental'
                    : '🏛️ Government Official',
                    style: const TextStyle(color: _blue, fontSize: 11,
                      fontWeight: FontWeight.w600))),
              ])),
          ])),
        const SizedBox(height: 20),

        // NAVIGATION
        _sec(isFr ? 'NAVIGATION' : 'NAVIGATION', [
          _tile(context, Icons.dashboard_outlined, _blue,
            isFr ? 'Retour au tableau de bord' : 'Back to Dashboard',
            isFr ? 'Vue principale gouvernementale'
                 : 'Main government view',
            () => onTabChange(0)),
          _tile(context, Icons.exit_to_app_outlined, _muted,
            isFr ? 'Quitter vers l\'accueil' : 'Exit to Main Home',
            isFr ? 'Page principale de la plateforme'
                 : 'Main platform home page',
            () => context.go('/platform')),
        ]),
        const SizedBox(height: 14),

        // PROFILE — comprehensive for government officials
        _sec(isFr ? 'MON PROFIL OFFICIEL' : 'MY OFFICIAL PROFILE', [
          _tile(context, Icons.badge_outlined, _gold,
            isFr ? 'Modifier mon profil' : 'Edit My Profile',
            isFr ? 'Informations officielles & accréditation'
                 : 'Official info & accreditation',
            () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => _GovEditProfileScreen(isFr: isFr)))),
          _tile(context, Icons.language_outlined, const Color(0xFF9C27B0),
            isFr ? 'Langue' : 'Language', 'English / Français',
            () => context.push('/profile/language')),
          _tile(context, Icons.notifications_outlined,
            const Color(0xFFFF9800),
            isFr ? 'Notifications & diffusions'
                 : 'Notifications & broadcasts',
            isFr ? 'Alertes projet et mises à jour'
                 : 'Project alerts and updates',
            () => context.push('/profile/notifications')),
        ]),
        const SizedBox(height: 14),

        // SECURITY
        _sec(isFr ? 'SÉCURITÉ' : 'SECURITY', [
          _tile(context, Icons.phone_outlined, const Color(0xFF2196F3),
            isFr ? 'Mettre à jour le téléphone' : 'Update Phone',
            isFr ? 'Numéro officiel' : 'Official number',
            () => context.push('/profile/change-phone')),
          _tile(context, Icons.email_outlined, const Color(0xFF2196F3),
            isFr ? 'Mettre à jour l\'email' : 'Update Email',
            isFr ? 'Email officiel gouvernemental'
                 : 'Official government email',
            () => context.push('/profile/change-email')),
        ]),
        const SizedBox(height: 14),

        // SUPPORT
        _sec('SUPPORT', [
          _tile(context, Icons.help_outline, _green,
            isFr ? 'Centre d\'aide' : 'Help Center',
            isFr ? 'FAQ et guides officiels'
                 : 'FAQs and official guides',
            () => context.push('/help')),
          _tile(context, Icons.gavel_outlined, _muted,
            isFr ? 'Conditions d\'utilisation' : 'Terms of Service',
            isFr ? 'Voir les conditions' : 'View terms',
            () => context.push('/terms?view=1&tab=0')),
          _tile(context, Icons.privacy_tip_outlined, _muted,
            isFr ? 'Politique de confidentialité' : 'Privacy Policy',
            isFr ? 'Comment nous utilisons vos données'
                 : 'How we use your data',
            () => context.push('/terms?view=1&tab=1')),
        ]),
        const SizedBox(height: 16),

        Center(child: Column(children: [
          Text('Sahel AgriConnect — Gov Portal v1.1.0',
            style: TextStyle(color: _muted.withValues(alpha: 0.4),
              fontSize: 12)),
          const SizedBox(height: 2),
          Text('🏛️ Governance. Data. Action.',
            style: TextStyle(color: _muted.withValues(alpha: 0.25),
              fontSize: 11, fontStyle: FontStyle.italic)),
        ])),
        const SizedBox(height: 16),

        SizedBox(width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.red.withValues(alpha: 0.5)),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12))),
            icon: const Icon(Icons.logout, color: Colors.red, size: 18),
            label: Text(isFr ? 'Se déconnecter' : 'Sign Out',
              style: const TextStyle(color: Colors.red,
                fontWeight: FontWeight.bold, fontSize: 15)),
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  backgroundColor: _surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                  title: Text(isFr ? 'Se déconnecter ?' : 'Sign out?',
                    style: const TextStyle(color: _text)),
                  content: Text(
                    isFr ? 'Vous serez redirigé vers l\'accueil.'
                         : 'You will be returned to the home screen.',
                    style: const TextStyle(color: _muted)),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: Text(isFr ? 'Annuler' : 'Cancel',
                        style: const TextStyle(color: _muted))),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: Text(isFr ? 'Se déconnecter' : 'Sign out',
                        style: const TextStyle(color: Colors.red))),
                  ]));
              if (confirm == true && context.mounted) {
                await context.read<AuthState>().logout();
                if (context.mounted) context.go('/platform');
              }
            })),
      ]);
  }

  Widget _sec(String title, List<Widget> items) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.only(left: 4, bottom: 8),
        child: Text(title, style: TextStyle(
          color: _muted.withValues(alpha: 0.55), fontSize: 11,
          fontWeight: FontWeight.w700, letterSpacing: 1.2))),
      Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [_surface, _surface2]),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _border)),
        child: Column(
          children: items.asMap().entries.map((e) => Column(children: [
            e.value,
            if (e.key < items.length - 1)
              const Divider(height: 1, color: _border, indent: 56),
          ])).toList())),
    ]);

  Widget _tile(BuildContext ctx, IconData icon, Color iconColor,
    String title, String subtitle, VoidCallback onTap) =>
    ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(width: 34, height: 34,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(9)),
        child: Icon(icon, color: iconColor, size: 17)),
      title: Text(title, style: const TextStyle(color: _text,
        fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: const TextStyle(
        color: _muted, fontSize: 12)),
      trailing: Icon(Icons.arrow_forward_ios, size: 13,
        color: _muted.withValues(alpha: 0.3)));
}

// ══════════════════════════════════════════════════════════════
// GOVERNMENT EDIT PROFILE — thorough, secure
// ══════════════════════════════════════════════════════════════
class _GovEditProfileScreen extends StatefulWidget {
  final bool isFr;
  const _GovEditProfileScreen({required this.isFr});
  @override State<_GovEditProfileScreen> createState() =>
    _GovEditProfileScreenState();
}

class _GovEditProfileScreenState extends State<_GovEditProfileScreen> {
  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _titleCtrl;
  late TextEditingController _ministryCtrl;
  late TextEditingController _deptCtrl;
  late TextEditingController _govIdCtrl;
  late TextEditingController _countryCtrl;
  late TextEditingController _regionCtrl;
  String _accessLevel = 'regional';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthState>();
    _nameCtrl = TextEditingController(text: auth.displayName);
    _emailCtrl = TextEditingController(text: auth.displayEmail);
    _phoneCtrl = TextEditingController(text: auth.displayPhone);
    _titleCtrl = TextEditingController();
    _ministryCtrl = TextEditingController();
    _deptCtrl = TextEditingController();
    _govIdCtrl = TextEditingController();
    _countryCtrl = TextEditingController(text: auth.displayCountry);
    _regionCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose(); _phoneCtrl.dispose();
    _titleCtrl.dispose(); _ministryCtrl.dispose(); _deptCtrl.dispose();
    _govIdCtrl.dispose(); _countryCtrl.dispose(); _regionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameCtrl.text.isEmpty || _titleCtrl.text.isEmpty ||
        _ministryCtrl.text.isEmpty || _govIdCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Nom, titre, ministère et ID gouvernemental sont obligatoires'
          : 'Name, title, ministry and government ID are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _saving = true);
    context.read<AuthState>().updateLocalProfile(
      name: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      country: _countryCtrl.text.trim(),
    );
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Profil officiel mis à jour !'
          : '✅ Official profile updated!'),
        backgroundColor: _green));
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0e1d3a), elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          onPressed: () => Navigator.pop(context)),
        title: Text(isFr ? 'Profil officiel' : 'Official Profile',
          style: const TextStyle(color: _text, fontSize: 17,
            fontWeight: FontWeight.w600))),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 100),
        child: Column(children: [
          // Security notice
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _blue.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _blue.withValues(alpha: 0.2))),
            child: Row(children: [
              const Icon(Icons.verified_user_outlined,
                color: _blue, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(
                isFr
                  ? 'Les informations de ce profil sont utilisées pour vérifier votre identité en tant qu\'agent gouvernemental. Elles doivent être exactes et à jour.'
                  : 'Information in this profile is used to verify your identity as a government agent. It must be accurate and up to date.',
                style: const TextStyle(color: _blue, fontSize: 11,
                  height: 1.4))),
            ])),
          const SizedBox(height: 16),
          _card(children: [
            _lbl(isFr ? '👤 Informations personnelles'
              : '👤 Personal Information'),
            _lbl2(isFr ? 'Nom complet *' : 'Full Name *'),
            _tf(_nameCtrl, isFr ? 'Prénom et nom' : 'First and last name'),
            const SizedBox(height: 12),
            _lbl2(isFr ? 'Email officiel *' : 'Official Email *'),
            _tf(_emailCtrl, 'nom@gouvernement.ml',
              type: TextInputType.emailAddress),
            const SizedBox(height: 12),
            _lbl2(isFr ? 'Téléphone officiel' : 'Official Phone'),
            _tf(_phoneCtrl, '+223...',
              type: TextInputType.phone),
            const SizedBox(height: 20),

            _lbl(isFr ? '🏛️ Informations institutionnelles'
              : '🏛️ Institutional Information'),
            _lbl2(isFr ? 'Titre / Poste *' : 'Title / Position *'),
            _tf(_titleCtrl,
              isFr ? 'Ex: Directeur, Conseiller, Ministre...'
                   : 'e.g. Director, Advisor, Minister...'),
            const SizedBox(height: 12),
            _lbl2(isFr ? 'Ministère / Agence *' : 'Ministry / Agency *'),
            _tf(_ministryCtrl,
              isFr ? 'Ex: Ministère de l\'Agriculture'
                   : 'e.g. Ministry of Agriculture'),
            const SizedBox(height: 12),
            _lbl2(isFr ? 'Département / Direction'
              : 'Department / Directorate'),
            _tf(_deptCtrl,
              isFr ? 'Ex: Direction nationale de l\'agriculture'
                   : 'e.g. National Agricultural Directorate'),
            const SizedBox(height: 12),
            _lbl2(isFr ? 'Identifiant gouvernemental *'
              : 'Government ID *'),
            _tf(_govIdCtrl,
              isFr ? 'Numéro d\'identification officiel'
                   : 'Official identification number'),
            const SizedBox(height: 20),

            _lbl(isFr ? '📍 Zone géographique' : '📍 Geographic Zone'),
            _lbl2(isFr ? 'Pays' : 'Country'),
            _tf(_countryCtrl,
              isFr ? 'Ex: Mali, Sénégal, Burkina Faso'
                   : 'e.g. Mali, Senegal, Burkina Faso'),
            const SizedBox(height: 12),
            _lbl2(isFr ? 'Région de compétence' : 'Jurisdiction Region'),
            _tf(_regionCtrl,
              isFr ? 'Ex: National, Koulikoro, Sikasso'
                   : 'e.g. National, Koulikoro, Sikasso'),
            const SizedBox(height: 12),
            _lbl2(isFr ? 'Niveau d\'accès' : 'Access Level'),
            DropdownButtonFormField<String>(
              key: ValueKey(_accessLevel),
              isExpanded: true,
              isDense: true,
              initialValue: _accessLevel,
              dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _dec(''),
              items: [
                DropdownMenuItem(value: 'national',
                  child: Text(isFr ? 'National' : 'National',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'regional',
                  child: Text(isFr ? 'Régional' : 'Regional',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'local',
                  child: Text(isFr ? 'Local' : 'Local',
                    style: const TextStyle(color: _text))),
              ],
              onChanged: (v) => setState(() => _accessLevel = v ?? 'regional')),
            const SizedBox(height: 20),
            _btn(isFr ? 'Enregistrer le profil officiel'
              : 'Save Official Profile',
              _saving, _save, _blue),
          ]),
        ])));
  }
}

// ══════════════════════════════════════════════════════════════
// POLICY BOTTOM SHEETS
// ══════════════════════════════════════════════════════════════
const _sheetHandle = Color(0x3FFFFFFF);

class _NotifyCoopSheet extends StatefulWidget {
  final bool isFr;
  final String title;
  final String defaultMsg;
  const _NotifyCoopSheet({
    required this.isFr,
    required this.title,
    required this.defaultMsg,
  });
  @override
  State<_NotifyCoopSheet> createState() => _NotifyCoopSheetState();
}

class _NotifyCoopSheetState extends State<_NotifyCoopSheet> {
  final Set<String> _selected = {'all'};
  late TextEditingController _msgCtrl;
  bool _sent = false;

  final _coops = [
    'Coopérative Karité Ségou',
    'Union Sésame Sikasso',
    'Alliance Cajou Mopti',
    'Groupement Mil Gao',
    'Coop Coton Koulikoro',
  ];

  @override
  void initState() {
    super.initState();
    _msgCtrl = TextEditingController(text: widget.defaultMsg);
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: _sheetHandle,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isFr ? '📢 Notifier les coopératives' : '📢 Notify Cooperatives',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.title,
            style: const TextStyle(color: _muted, fontSize: 12),
          ),
          const SizedBox(height: 16),
          if (_sent) ...[
            const Icon(Icons.check_circle_outline, color: _green, size: 48),
            const SizedBox(height: 12),
            Text(
              isFr
                  ? '✅ Notification envoyée à ${_selected.contains('all') ? 'toutes les coopératives' : '${_selected.length} coopératives'}.'
                  : '✅ Notification sent to ${_selected.contains('all') ? 'all cooperatives' : '${_selected.length} cooperatives'}.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: _text, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Text(
              isFr
                  ? 'Les coopératives recevront une notification dans l\'application et par SMS.'
                  : 'Cooperatives will receive an in-app notification and SMS.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: _muted, fontSize: 12),
            ),
          ] else ...[
            Text(
              isFr ? 'Destinataires:' : 'Recipients:',
              style: const TextStyle(
                color: _muted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => setState(() {
                if (_selected.contains('all')) {
                  _selected.remove('all');
                } else {
                  _selected
                    ..clear()
                    ..add('all');
                }
              }),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _selected.contains('all')
                      ? _blue.withValues(alpha: 0.15)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: _selected.contains('all') ? _blue : _border,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _selected.contains('all')
                          ? Icons.check_box
                          : Icons.check_box_outline_blank,
                      color: _selected.contains('all') ? _blue : _muted,
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      isFr
                          ? 'Toutes les coopératives enregistrées'
                          : 'All registered cooperatives',
                      style: const TextStyle(
                        color: _text,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (!_selected.contains('all')) ...[
              const SizedBox(height: 8),
              ..._coops.map(
                (c) => GestureDetector(
                  onTap: () => setState(() {
                    if (_selected.contains(c)) {
                      _selected.remove(c);
                    } else {
                      _selected.add(c);
                    }
                  }),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _selected.contains(c)
                          ? _green.withValues(alpha: 0.1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _selected.contains(c) ? _green : _border,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _selected.contains(c)
                              ? Icons.check_box
                              : Icons.check_box_outline_blank,
                          color: _selected.contains(c) ? _green : _muted,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          c,
                          style: const TextStyle(color: _text, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 14),
            Text(
              isFr ? 'Message:' : 'Message:',
              style: const TextStyle(
                color: _muted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _msgCtrl,
              maxLines: 3,
              style: const TextStyle(color: _text, fontSize: 13),
              decoration: InputDecoration(
                filled: true,
                fillColor: _bg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: _blue),
                ),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.send_outlined, size: 16),
                label: Text(
                  isFr ? 'Envoyer la notification' : 'Send Notification',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                onPressed: _selected.isEmpty
                    ? null
                    : () => setState(() => _sent = true),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _RegistrationListSheet extends StatelessWidget {
  final bool isFr;
  const _RegistrationListSheet({required this.isFr});

  @override
  Widget build(BuildContext context) {
    final pending = [
      {
        'name': 'Union Maraîchers Djenné',
        'region': 'Mopti',
        'members': 34,
        'crop': 'Légumes',
        'date': 'May 12, 2026',
        'status': 'pending',
      },
      {
        'name': 'Coop Sésame Ménaka',
        'region': 'Gao',
        'members': 28,
        'crop': 'Sésame',
        'date': 'May 14, 2026',
        'status': 'pending',
      },
      {
        'name': 'Groupement Femmes Kita',
        'region': 'Kayes',
        'members': 67,
        'crop': 'Karité',
        'date': 'May 15, 2026',
        'status': 'under_review',
      },
    ];
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: _sheetHandle,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isFr
                ? '📝 Inscriptions coopératives — 2026'
                : '📝 Cooperative Registrations — 2026',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isFr
                ? '${pending.length} demandes en attente de validation'
                : '${pending.length} applications pending validation',
            style: const TextStyle(color: _muted, fontSize: 12),
          ),
          const SizedBox(height: 16),
          ...pending.map(
            (p) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          p['name'] as String,
                          style: const TextStyle(
                            color: _text,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: (p['status'] == 'pending' ? _gold : _blue)
                              .withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          p['status'] == 'pending'
                              ? (isFr ? 'En attente' : 'Pending')
                              : (isFr ? 'En révision' : 'Under review'),
                          style: TextStyle(
                            color: p['status'] == 'pending' ? _gold : _blue,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${p['region']} · ${p['members']} ${isFr ? 'membres' : 'members'} · ${p['crop']}',
                    style: const TextStyle(color: _muted, fontSize: 11),
                  ),
                  Text(
                    '${isFr ? 'Soumis le' : 'Submitted'}: ${p['date']}',
                    style: const TextStyle(color: _muted, fontSize: 10),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: _green.withValues(alpha: 0.4),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: () {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  isFr
                                      ? '✅ ${p['name']} approuvée.'
                                      : '✅ ${p['name']} approved.',
                                ),
                                backgroundColor: _green,
                              ),
                            );
                          },
                          child: Text(
                            isFr ? 'Approuver' : 'Approve',
                            style: const TextStyle(
                              color: _green,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: Colors.red.withValues(alpha: 0.4),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: () => Navigator.pop(context),
                          child: Text(
                            isFr ? 'Rejeter' : 'Reject',
                            style: const TextStyle(
                              color: Colors.red,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _AlertBroadcastSheet extends StatefulWidget {
  final bool isFr;
  final String title;
  final String defaultMsg;
  const _AlertBroadcastSheet({
    required this.isFr,
    required this.title,
    required this.defaultMsg,
  });
  @override
  State<_AlertBroadcastSheet> createState() => _AlertBroadcastSheetState();
}

class _AlertBroadcastSheetState extends State<_AlertBroadcastSheet> {
  late TextEditingController _msgCtrl;
  String _audience = 'all';
  bool _sent = false;

  @override
  void initState() {
    super.initState();
    _msgCtrl = TextEditingController(text: widget.defaultMsg);
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    super.dispose();
  }

  String _getAudienceName(bool isFr) {
    switch (_audience) {
      case 'cooperatives':
        return isFr ? 'Toutes les coopératives' : 'All cooperatives';
      case 'farmers':
        return isFr ? 'Tous les agriculteurs' : 'All farmers';
      default:
        return isFr ? 'Tous les utilisateurs' : 'All users';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: _sheetHandle,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isFr ? '🌧️ Diffuser une alerte' : '🌧️ Broadcast Alert',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.title,
            style: const TextStyle(color: _muted, fontSize: 12),
          ),
          const SizedBox(height: 16),
          if (_sent) ...[
            const Icon(Icons.campaign_outlined, color: _green, size: 48),
            const SizedBox(height: 12),
            Text(
              isFr
                  ? '✅ Alerte diffusée à tous les utilisateurs sélectionnés.'
                  : '✅ Alert broadcast to all selected users.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: _text, fontSize: 14),
            ),
            const SizedBox(height: 6),
            Text(
              isFr
                  ? 'Destinataires: ${_getAudienceName(isFr)}\nMode: Notification in-app + SMS'
                  : 'Recipients: ${_getAudienceName(isFr)}\nMode: In-app notification + SMS',
              textAlign: TextAlign.center,
              style: const TextStyle(color: _muted, fontSize: 12),
            ),
          ] else ...[
            Text(
              isFr ? 'Destinataires:' : 'Recipients:',
              style: const TextStyle(
                color: _muted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              key: ValueKey(_audience),
              initialValue: _audience,
              dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: InputDecoration(
                filled: true,
                fillColor: _bg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
              ),
              items: [
                DropdownMenuItem(
                  value: 'all',
                  child: Text(
                    isFr
                        ? 'Tous — agriculteurs, coopératives, ONG'
                        : 'All — farmers, cooperatives, NGOs',
                    style: const TextStyle(color: _text),
                  ),
                ),
                DropdownMenuItem(
                  value: 'cooperatives',
                  child: Text(
                    isFr ? 'Coopératives uniquement' : 'Cooperatives only',
                    style: const TextStyle(color: _text),
                  ),
                ),
                DropdownMenuItem(
                  value: 'farmers',
                  child: Text(
                    isFr ? 'Agriculteurs uniquement' : 'Farmers only',
                    style: const TextStyle(color: _text),
                  ),
                ),
              ],
              onChanged: (v) => setState(() => _audience = v ?? 'all'),
            ),
            const SizedBox(height: 12),
            Text(
              isFr ? 'Contenu de l\'alerte:' : 'Alert content:',
              style: const TextStyle(
                color: _muted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _msgCtrl,
              maxLines: 3,
              style: const TextStyle(color: _text, fontSize: 13),
              decoration: InputDecoration(
                filled: true,
                fillColor: _bg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: _blue),
                ),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7B61FF),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.campaign_outlined, size: 16),
                label: Text(
                  isFr ? 'Diffuser l\'alerte' : 'Broadcast Alert',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                onPressed: () => setState(() => _sent = true),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TraceabilityDetailSheet extends StatelessWidget {
  final bool isFr;
  const _TraceabilityDetailSheet({required this.isFr});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: _sheetHandle,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isFr
                ? '🏷️ Mandat de traçabilité — Détails'
                : '🏷️ Traceability Mandate — Details',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isFr ? '📋 Résumé du mandat' : '📋 Mandate Summary',
                  style: const TextStyle(
                    color: _text,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                _mandateRow(
                  isFr ? 'Date d\'entrée en vigueur' : 'Effective date',
                  '1 juillet 2026 / July 1, 2026',
                ),
                _mandateRow(
                  isFr ? 'Coopératives concernées' : 'Cooperatives concerned',
                  isFr
                      ? '50+ membres (456 coopératives)'
                      : '50+ members (456 cooperatives)',
                ),
                _mandateRow(
                  isFr ? 'Conformité actuelle' : 'Current compliance',
                  '72% (330/456)',
                ),
                _mandateRow(
                  isFr ? 'Non-conformes à date' : 'Non-compliant to date',
                  '126 coopératives',
                ),
                _mandateRow(
                  isFr ? 'Pénalité non-conformité' : 'Non-compliance penalty',
                  isFr
                      ? 'Suspension enregistrement plateforme'
                      : 'Platform registration suspension',
                ),
                const SizedBox(height: 14),
                Text(
                  isFr ? '🔔 Actions requises:' : '🔔 Required actions:',
                  style: const TextStyle(
                    color: _text,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                ...[
                  isFr
                      ? 'Enregistrer tous les lots de production avec QR code'
                      : 'Register all production batches with QR code',
                  isFr
                      ? 'Soumettre rapport de traçabilité avant le 30 juin 2026'
                      : 'Submit traceability report before June 30, 2026',
                  isFr
                      ? 'Former au moins 1 agent par coopérative'
                      : 'Train at least 1 agent per cooperative',
                ].map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(top: 5),
                          decoration: const BoxDecoration(
                            color: _green,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item,
                            style: const TextStyle(
                              color: _muted,
                              fontSize: 12,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: _green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.send_outlined, size: 16),
              label: Text(
                isFr
                    ? 'Notifier les coopératives non-conformes'
                    : 'Notify Non-Compliant Cooperatives',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      isFr
                          ? '✅ 126 coopératives notifiées du délai de conformité.'
                          : '✅ 126 cooperatives notified of compliance deadline.',
                    ),
                    backgroundColor: _green,
                    duration: const Duration(seconds: 4),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  static Widget _mandateRow(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(color: _muted, fontSize: 12),
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                color: _text,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
}

// ══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════
BoxDecoration _cardDeco() => BoxDecoration(
  gradient: const LinearGradient(colors: [_surface, _surface2]),
  borderRadius: BorderRadius.circular(16),
  border: Border.all(color: _border));

Widget _card({required List<Widget> children}) => Container(
  width: double.infinity,
  padding: const EdgeInsets.all(20),
  decoration: _cardDeco(),
  child: Column(crossAxisAlignment: CrossAxisAlignment.start,
    children: children));

Widget _sectionTitle(String t) => Text(t,
  style: const TextStyle(color: _text, fontSize: 17,
    fontWeight: FontWeight.w700));

Widget _lbl(String t) => Padding(
  padding: const EdgeInsets.only(bottom: 10),
  child: Text(t, style: const TextStyle(color: _text, fontSize: 14,
    fontWeight: FontWeight.w700)));

Widget _lbl2(String t) => Padding(
  padding: const EdgeInsets.only(bottom: 6),
  child: Text(t, style: const TextStyle(color: _muted, fontSize: 13,
    fontWeight: FontWeight.w600)));

Widget _tf(TextEditingController c, String hint,
  {TextInputType type = TextInputType.text, int maxLines = 1}) =>
  TextField(controller: c, keyboardType: type, maxLines: maxLines,
    style: const TextStyle(color: _text, fontSize: 14),
    decoration: InputDecoration(hintText: hint,
      hintStyle: const TextStyle(color: _muted, fontSize: 13),
      filled: true, fillColor: _bg,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _blue)),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 12, vertical: 12)));

InputDecoration _dec(String hint) => InputDecoration(hintText: hint,
  hintStyle: const TextStyle(color: _muted),
  filled: true, fillColor: _bg,
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
    borderSide: const BorderSide(color: _blue)),
  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12));

Widget _btn(String label, bool loading, VoidCallback onTap, Color col) =>
  SizedBox(width: double.infinity,
    child: ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: col, foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12))),
      onPressed: loading ? null : onTap,
      child: loading
        ? const SizedBox(width: 20, height: 20,
            child: CircularProgressIndicator(
              color: Colors.white, strokeWidth: 2))
        : Text(label, style: const TextStyle(
            fontWeight: FontWeight.bold, fontSize: 15))));
