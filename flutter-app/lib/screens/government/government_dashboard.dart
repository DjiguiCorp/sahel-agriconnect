import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import '../shared/webview_screen.dart';

abstract final class _Gov {
  static const Color bg = Color(0xFF0a0f1e);
  static const Color accent = Color(0xFF185FA5);
  static const LinearGradient headerGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1a2035), Color(0xFF243050)],
  );
  static const LinearGradient cardGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1a2035), Color(0xFF141830)],
  );
}

class GovernmentDashboard extends StatefulWidget {
  const GovernmentDashboard({super.key});

  @override
  State<GovernmentDashboard> createState() => _GovernmentDashboardState();
}

class _GovernmentDashboardState extends State<GovernmentDashboard> {
  int _tab = 0;
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<void> _reload() async {
    setState(() => _future = _load());
    await _future;
  }

  Future<Map<String, dynamic>> _load() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    if (token != null && token.isNotEmpty) {
      final country = auth.displayCountry.isNotEmpty ? auth.displayCountry : null;
      return ApiService.getGovDashboard(
        token,
        country: country,
      );
    }
    return ApiService.getPublicStats();
  }

  bool _isGovPortal(Map<String, dynamic> d) =>
      d.containsKey('stats') && d.containsKey('country');

  static String _flagEmoji(String? code) {
    if (code == null || code.length != 2) return '🌍';
    final u = code.toUpperCase();
    final a = u.codeUnitAt(0);
    final b = u.codeUnitAt(1);
    if (a < 65 || a > 90 || b < 65 || b > 90) return '🌍';
    const base = 0x1F1E6;
    return String.fromCharCode(base + a - 65) + String.fromCharCode(base + b - 65);
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
      backgroundColor: _Gov.bg,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: FutureBuilder<Map<String, dynamic>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: _Gov.accent),
                  );
                }
                if (snap.hasError) {
                  return Center(
                    child: Text(
                      '${snap.error}',
                      style: const TextStyle(color: Colors.white54),
                      textAlign: TextAlign.center,
                    ),
                  );
                }
                final data = snap.data ?? {};
                return _GovTabBody(
                  tab: _tab,
                  data: data,
                  isPortal: _isGovPortal(data),
                  onRefresh: _reload,
                  lp: lp,
                );
              },
            ),
          ),
          _GovBottomNav(
            tab: _tab,
            lp: lp,
            onChanged: (i) {
              AuthService.resetActivity();
              if (i == 0) {
                context.go('/home');
                return;
              }
              setState(() => _tab = i);
            },
          ),
        ],
      ),
    ),
    );
  }
}

class _GovTabBody extends StatelessWidget {
  const _GovTabBody({
    required this.tab,
    required this.data,
    required this.isPortal,
    required this.onRefresh,
    required this.lp,
  });

  final int tab;
  final Map<String, dynamic> data;
  final bool isPortal;
  final Future<void> Function() onRefresh;
  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    switch (tab) {
      case 1:
        return _GovStatisticsTab(data: data, isPortal: isPortal, lp: lp);
      case 2:
        return _GovMapTab(lp: lp);
      case 3:
        return _GovPolicyTab(data: data, isPortal: isPortal, lp: lp);
      case 4:
        return _GovAccountTab(lp: lp);
      default:
        return _GovOverviewTab(
          data: data,
          isPortal: isPortal,
          onRefresh: onRefresh,
          lp: lp,
        );
    }
  }
}

class _GovOverviewTab extends StatelessWidget {
  const _GovOverviewTab({
    required this.data,
    required this.isPortal,
    required this.onRefresh,
    required this.lp,
  });

  final Map<String, dynamic> data;
  final bool isPortal;
  final Future<void> Function() onRefresh;
  final LanguageProvider lp;

  Map<String, dynamic> _stats() {
    final s = data['stats'];
    if (s is Map) return Map<String, dynamic>.from(s);
    return {};
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final stats = _stats();
    final farmers = isPortal
        ? (stats['farmers'] as num?)?.toInt() ?? 0
        : (data['total'] as num?)?.toInt() ?? 0;
    final cooperatives =
        isPortal ? (stats['cooperatives'] as num?)?.toInt() ?? 0 : 0;
    final productionValue = isPortal
        ? '${stats['totalResponses'] ?? 0}'
        : '${(data['totalArea'] as num?)?.round() ?? 0} ha';
    final productionLabel = isPortal
        ? lp.t('Total production (reports)', 'Production totale (déclarée)')
        : lp.t('Total cultivated area', 'Superficie cultivée totale');
    final investmentValue = isPortal
        ? '${stats['activeProjects'] ?? 0}'
        : '${data['active'] ?? '—'}';
    final investmentLabel = isPortal
        ? lp.t('Investment programs (active)', 'Programmes d’investissement (actifs)')
        : lp.t('Active farmer accounts', 'Comptes agriculteurs actifs');

    final country = isPortal
        ? (data['country']?.toString() ?? auth.displayCountry)
        : lp.t('Pan-African', 'Péri-Sahel');
    final code =
        isPortal ? data['countryCode']?.toString() : null;

    return RefreshIndicator(
      color: _Gov.accent,
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _GovHeader(
              lp: lp,
              flagEmoji: _GovernmentDashboardState._flagEmoji(code),
              countryName: country,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(
                  lp.t('National statistics', 'Statistiques nationales'),
                  style: const TextStyle(
                    color: _Gov.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                _nationalStatQuad(
                  lp,
                  farmers: farmers,
                  cooperatives: cooperatives,
                  productionLabel: productionLabel,
                  productionValue: productionValue,
                  investmentLabel: investmentLabel,
                  investmentValue: investmentValue,
                ),
                const SizedBox(height: 22),
                Text(
                  lp.t('Regional overview', 'Vue régionale'),
                  style: const TextStyle(
                    color: _Gov.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  height: 160,
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: _Gov.cardGrad,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.map_outlined, color: _Gov.accent, size: 32),
                      const SizedBox(height: 8),
                      Text(
                        lp.t(
                          'Interactive regional map coming soon.',
                          'Carte régionale interactive bientôt disponible.',
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                Text(
                  lp.t('Policy insights', 'Indicateurs de politique'),
                  style: const TextStyle(
                    color: _Gov.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 10),
                _insightCard(
                  lp,
                  lp.t(
                    'Align cooperatives with national food security programs.',
                    'Aligner les coopératives sur la sécurité alimentaire nationale.',
                  ),
                ),
                const SizedBox(height: 8),
                _insightCard(
                  lp,
                  lp.t(
                    'Track project responses and traceability adoption.',
                    'Suivre les réponses aux projets et l’adoption de la traçabilité.',
                  ),
                ),
                const SizedBox(height: 22),
                Text(
                  lp.t('Quick actions', 'Actions rapides'),
                  style: const TextStyle(
                    color: _Gov.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 10),
                _qa(
                  context,
                  lp,
                  Icons.file_download_outlined,
                  lp.t('Export report', 'Exporter un rapport'),
                  () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const InAppWebViewScreen(
                        title: 'Government portal',
                        url: 'https://sahelagriconnect.com/government-portal',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.groups_outlined,
                  lp.t('View cooperatives', 'Voir les coopératives'),
                  () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const InAppWebViewScreen(
                        title: 'Cooperatives',
                        url: 'https://sahelagriconnect.com/join-cooperative',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.show_chart,
                  lp.t('Market overview', 'Aperçu du marché'),
                  () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const InAppWebViewScreen(
                        title: 'Markets',
                        url: 'https://sahelagriconnect.com/afri-yield/marketplace',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.notifications_outlined,
                  lp.t('Notifications', 'Notifications'),
                  () => context.push('/notifications'),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _nationalStatQuad(
    LanguageProvider lp, {
    required int farmers,
    required int cooperatives,
    required String productionLabel,
    required String productionValue,
    required String investmentLabel,
    required String investmentValue,
  }) {
    Widget cell(String label, String value) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: _Gov.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 11,
                  height: 1.25,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            cell(
              lp.t('Farmers registered', 'Agriculteurs enregistrés'),
              '$farmers',
            ),
            const SizedBox(width: 10),
            cell(
              lp.t('Active cooperatives', 'Coopératives actives'),
              '$cooperatives',
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            cell(productionLabel, productionValue),
            const SizedBox(width: 10),
            cell(investmentLabel, investmentValue),
          ],
        ),
      ],
    );
  }

  Widget _insightCard(LanguageProvider lp, String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: _Gov.cardGrad,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _Gov.accent.withValues(alpha: 0.2)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.8),
          fontSize: 13,
          height: 1.4,
        ),
      ),
    );
  }

  Widget _qa(
    BuildContext context,
    LanguageProvider lp,
    IconData icon,
    String title,
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
            gradient: _Gov.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Row(
            children: [
              Icon(icon, color: _Gov.accent),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.3)),
            ],
          ),
        ),
      ),
    );
  }
}

class _GovHeader extends StatelessWidget {
  const _GovHeader({
    required this.lp,
    required this.flagEmoji,
    required this.countryName,
  });

  final LanguageProvider lp;
  final String flagEmoji;
  final String countryName;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: _Gov.headerGrad),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lp.t(
                            'National Agricultural Dashboard',
                            'Tableau national agricole',
                          ),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Text(flagEmoji, style: const TextStyle(fontSize: 28)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                countryName,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.85),
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
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
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.22),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.home_outlined,
                            color: Colors.white.withValues(alpha: 0.9),
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            lp.t('Home', 'Accueil'),
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.9),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GovStatisticsTab extends StatelessWidget {
  const _GovStatisticsTab({
    required this.data,
    required this.isPortal,
    required this.lp,
  });

  final Map<String, dynamic> data;
  final bool isPortal;
  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    if (!isPortal) {
      return _govEmpty(
        lp.t(
          'Sign in to view country-scoped government statistics.',
          'Connectez-vous pour les statistiques nationales.',
        ),
      );
    }
    final s = Map<String, dynamic>.from(data['stats'] as Map? ?? {});
    final rows = <(String, String)>[
      (lp.t('Registered farmers', 'Agriculteurs'), '${s['farmers'] ?? 0}'),
      (lp.t('Cooperatives', 'Coopératives'), '${s['cooperatives'] ?? 0}'),
      (lp.t('Processors', 'Processeurs'), '${s['processors'] ?? 0}'),
      (lp.t('National projects', 'Projets nationaux'), '${s['projects'] ?? 0}'),
      (lp.t('Active projects', 'Projets actifs'), '${s['activeProjects'] ?? 0}'),
      (lp.t('Project responses', 'Réponses projets'), '${s['totalResponses'] ?? 0}'),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text(
          lp.t('Territory metrics', 'Indicateurs du territoire'),
          style: const TextStyle(
            color: _Gov.accent,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        ...rows.map(
          (r) {
            final label = r.$1;
            final value = r.$2;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: _Gov.cardGrad,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(label, style: const TextStyle(color: Colors.white70)),
                  Text(
                    value,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _GovMapTab extends StatelessWidget {
  const _GovMapTab({required this.lp});

  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map_outlined, size: 56, color: _Gov.accent.withValues(alpha: 0.7)),
            const SizedBox(height: 16),
            Text(
              lp.t(
                'Spatial layers for cooperatives, production clusters, '
                'and logistics will appear here.',
                'Les couches spatiales, coopératives et filières seront affichées ici.',
              ),
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GovPolicyTab extends StatelessWidget {
  const _GovPolicyTab({
    required this.data,
    required this.isPortal,
    required this.lp,
  });

  final Map<String, dynamic> data;
  final bool isPortal;
  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    if (!isPortal) {
      return _govEmpty(
        lp.t('Projects and policy tools require authentication.', 'Connexion requise.'),
      );
    }
    final projects = (data['projects'] as List?)
            ?.whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList() ??
        [];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text(
          lp.t('Active programs', 'Programmes actifs'),
          style: const TextStyle(
            color: _Gov.accent,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        if (projects.isEmpty)
          Text(
            lp.t('No recent national projects.', 'Aucun projet récent.'),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
          )
        else
          ...projects.map(
            (p) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: _Gov.cardGrad,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: _Gov.accent.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p['title']?.toString() ?? p['titleFr']?.toString() ?? '—',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if ((p['description'] ?? p['descriptionFr']) != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      '${p['description'] ?? p['descriptionFr']}',
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _GovBottomNav extends StatelessWidget {
  const _GovBottomNav({
    required this.tab,
    required this.lp,
    required this.onChanged,
  });

  final int tab;
  final LanguageProvider lp;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _Gov.bg,
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
        ),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
        ),
        child: BottomNavigationBar(
          currentIndex: tab.clamp(0, 4),
          type: BottomNavigationBarType.fixed,
          backgroundColor: _Gov.bg,
          selectedItemColor: _Gov.accent,
          unselectedItemColor: Colors.white38,
          onTap: onChanged,
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.dashboard_outlined),
              activeIcon: const Icon(Icons.dashboard),
              label: lp.t('Overview', 'Vue'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.bar_chart_outlined),
              activeIcon: const Icon(Icons.bar_chart),
              label: lp.t('Statistics', 'Stats'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.map_outlined),
              activeIcon: const Icon(Icons.map),
              label: lp.t('Map', 'Carte'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.policy_outlined),
              activeIcon: const Icon(Icons.policy),
              label: lp.t('Policy', 'Politique'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.manage_accounts_outlined),
              activeIcon: const Icon(Icons.manage_accounts),
              label: lp.t('Account', 'Compte'),
            ),
          ],
        ),
      ),
    );
  }
}

class _GovAccountTab extends StatelessWidget {
  const _GovAccountTab({required this.lp});

  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final initial =
        auth.displayName.isNotEmpty ? auth.displayName[0].toUpperCase() : '?';

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: const Color(0xFF1a2035),
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/government'),
          ),
          title: Text(
            lp.t('Account', 'Compte'),
            style: const TextStyle(color: Colors.white),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: _Gov.headerGrad),
              alignment: Alignment.bottomCenter,
              padding: const EdgeInsets.only(bottom: 54, top: 48),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: _Gov.accent.withValues(alpha: 0.35),
                    child: Text(
                      initial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    auth.displayName.isNotEmpty ? auth.displayName : 'Official',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          expandedHeight: 200,
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              _acctSection(
                lp,
                lp.t('Navigation', 'Navigation'),
                [
                  _acctTile(
                    Icons.home_outlined,
                    lp.t('Back to Main Home', 'Accueil principal'),
                    () => context.go('/home'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _acctSection(
                lp,
                lp.t('Profile', 'Profil'),
                [
                  _acctTile(
                    Icons.person_outline,
                    lp.t('Edit profile', 'Modifier le profil'),
                        () => context.push('/profile/edit'),
                  ),
                  _acctTile(
                    Icons.language_outlined,
                    lp.t('Language', 'Langue'),
                    () => context.push('/profile/language'),
                  ),
                  _acctTile(
                    Icons.notifications_outlined,
                    lp.t('Notifications', 'Notifications'),
                    () => context.push('/profile/notifications'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _acctSection(
                lp,
                lp.t('Account management', 'Gestion du compte'),
                [
                  _acctTile(
                    Icons.email_outlined,
                    lp.t('Update email', 'Modifier l’e-mail'),
                    () => context.push('/profile/change-email'),
                  ),
                  _acctTile(
                    Icons.phone_outlined,
                    lp.t('Update phone', 'Modifier le téléphone'),
                    () => context.push('/profile/change-phone'),
                  ),
                  _acctTile(
                    Icons.delete_outline,
                    lp.t('Delete account', 'Supprimer le compte'),
                    () => context.push('/profile/delete-account'),
                    danger: true,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _acctSection(
                lp,
                lp.t('Support', 'Support'),
                [
                  _acctTile(Icons.info_outline, lp.t('About', 'À propos'),
                      () => context.push('/about')),
                  _acctTile(Icons.help_outline, lp.t('Help', 'Aide'),
                      () => context.push('/help')),
                  _acctTile(Icons.gavel_outlined, lp.t('Terms', 'Conditions'),
                      () => context.push('/terms?view=1')),
                  _acctTile(
                    Icons.privacy_tip_outlined,
                    lp.t('Privacy', 'Confidentialité'),
                    () => context.push('/terms?view=1'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: const Color(0xFF1a2035),
                      title: Text(
                        lp.t('Sign out?', 'Déconnexion ?'),
                        style: const TextStyle(color: Colors.white),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: Text(
                            lp.t('Cancel', 'Annuler'),
                            style: const TextStyle(color: Colors.white54),
                          ),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('OK', style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  );
                  if (ok == true && context.mounted) {
                    await context.read<AuthState>().logout();
                    if (context.mounted) context.go('/home');
                  }
                },
                icon: const Icon(Icons.logout, color: Colors.red),
                label: Text(
                  lp.t('Sign out', 'Déconnexion'),
                  style: const TextStyle(color: Colors.red),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.red.withValues(alpha: 0.4)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _acctSection(
    LanguageProvider lp,
    String title,
    List<Widget> tiles,
  ) {
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
              letterSpacing: 1.1,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: _Gov.cardGrad,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            children: [
              for (var i = 0; i < tiles.length; i++) ...[
                tiles[i],
                if (i < tiles.length - 1)
                  Divider(
                    height: 1,
                    indent: 56,
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _acctTile(
    IconData icon,
    String title,
    VoidCallback onTap, {
    bool danger = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: danger ? Colors.red : _Gov.accent),
      title: Text(
        title,
        style: TextStyle(color: danger ? Colors.red : Colors.white),
      ),
      trailing: Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.25)),
      onTap: onTap,
    );
  }
}

Widget _govEmpty(String msg) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Text(
        msg,
        textAlign: TextAlign.center,
        style: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
      ),
    ),
  );
}
