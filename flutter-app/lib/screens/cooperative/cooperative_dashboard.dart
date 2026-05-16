import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import '../../widgets/web_action_tile.dart';

/// Sahel cooperative management — deep blue-green, teal + gold accents.
abstract final class _Coop {
  static const Color bg = Color(0xFF0f1a2e);
  static const Color teal = Color(0xFF1D9E75);
  static const Color gold = Color(0xFFB5850A);
  static const LinearGradient headerGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1a3a2a), Color(0xFF1e4d35)],
  );
  static const LinearGradient cardGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1a3530), Color(0xFF122820)],
  );
}

class CooperativeDashboard extends StatefulWidget {
  const CooperativeDashboard({super.key});

  @override
  State<CooperativeDashboard> createState() => _CooperativeDashboardState();
}

class _CooperativeDashboardState extends State<CooperativeDashboard> {
  int _tab = 0;
  late Future<Map<String, dynamic>> _portalFuture;

  @override
  void initState() {
    super.initState();
    _portalFuture = _load();
  }

  Future<void> _reload() async {
    setState(() {
      _portalFuture = _load();
    });
    await _portalFuture;
  }

  Future<Map<String, dynamic>> _load() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    if (token != null && token.isNotEmpty) {
      final country = auth.displayCountry;
      return ApiService.getCoopPortal(
        token,
        country: country.isNotEmpty ? country : null,
      );
    }
    return ApiService.getCoopPublicStats();
  }

  bool _isPortal(Map<String, dynamic> data) => data.containsKey('memberFarmers');

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: _Coop.bg,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: FutureBuilder<Map<String, dynamic>>(
              future: _portalFuture,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: _Coop.teal),
                  );
                }
                if (snap.hasError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        '${lp.t('Could not load dashboard', 'Chargement impossible')}:\n${snap.error}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ),
                  );
                }
                final data = snap.data ?? {};
                return _CoopTabView(
                  tab: _tab,
                  data: data,
                  isPortal: _isPortal(data),
                  lp: lp,
                  onRefresh: _reload,
                );
              },
            ),
          ),
          _CoopBottomNav(
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

class _CoopTabView extends StatelessWidget {
  const _CoopTabView({
    required this.tab,
    required this.data,
    required this.isPortal,
    required this.lp,
    required this.onRefresh,
  });

  final int tab;
  final Map<String, dynamic> data;
  final bool isPortal;
  final LanguageProvider lp;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    switch (tab) {
      case 1:
        return _MembersTab(data: data, isPortal: isPortal, lp: lp);
      case 2:
        return _ProductionTab(data: data, isPortal: isPortal, lp: lp);
      case 3:
        return _UpdatesTab(data: data, isPortal: isPortal, lp: lp);
      case 4:
        return _CooperativeAccountTab(lp: lp);
      default:
        return _CoopHomeTab(
          data: data,
          isPortal: isPortal,
          lp: lp,
          onRefresh: onRefresh,
        );
    }
  }
}

// —————————————————————————————————————————————————————————————————— Home
class _CoopHomeTab extends StatelessWidget {
  const _CoopHomeTab({
    required this.data,
    required this.isPortal,
    required this.lp,
    required this.onRefresh,
  });

  final Map<String, dynamic> data;
  final bool isPortal;
  final LanguageProvider lp;
  final Future<void> Function() onRefresh;

  List<Map<String, dynamic>> _listOfMaps(String key) {
    final raw = data[key];
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Map<String, dynamic> _stats() {
    final s = data['stats'];
    if (s is Map) return Map<String, dynamic>.from(s);
    return {};
  }

  @override
  Widget build(BuildContext context) {
    final stats = _stats();
    final members = _listOfMaps('memberFarmers');
    final listings = _listOfMaps('produceListings');

    final memberCount = isPortal
        ? (stats['memberCount'] as num?)?.toInt() ?? members.length
        : (data['totalMembers'] as num?)?.toInt() ??
            (data['total'] as num?)?.toInt() ??
            0;

    final totalKg = isPortal
        ? listings.fold<double>(
            0,
            (s, l) =>
                s + (num.tryParse(l['quantityKg']?.toString() ?? '0') ?? 0),
          )
        : 0.0;

    final pendingListings =
        (stats['pendingListings'] as num?)?.toInt() ?? _pendingCount(listings);
    final soldCount =
        listings.where((l) => l['status']?.toString() == 'sold').length;
    final promoted =
        (stats['promotedListings'] as num?)?.toInt() ?? _promotedCount(listings);

    final pipelineUsd = isPortal ? _pipelineUsd(listings) : 0.0;
    final revenueLabel = isPortal
        ? (pipelineUsd > 0
            ? '\$${_fmtUsd(pipelineUsd)}'
            : '\$0')
        : '—';

    final activeMembers = isPortal
        ? members
            .where((m) =>
                '${m['statut']}'.toLowerCase().contains('actif') ||
                '${m['statut']}'.toLowerCase().contains('active'))
            .length
        : (data['active'] as num?)?.toInt() ?? 0;

    final now = DateTime.now();
    final monthAgo = DateTime(now.year, now.month - 1, now.day);
    final newThisMonth = isPortal
        ? members.where((m) {
            final d = DateTime.tryParse(m['createdAt']?.toString() ?? '');
            return d != null && d.isAfter(monthAgo);
          }).length
        : 0;

    final recentListings = [...listings]..sort((a, b) {
        final da = DateTime.tryParse(a['createdAt']?.toString() ?? '') ??
            DateTime(1970);
        final db = DateTime.tryParse(b['createdAt']?.toString() ?? '') ??
            DateTime(1970);
        return db.compareTo(da);
      });

    return RefreshIndicator(
      color: _Coop.teal,
      backgroundColor: const Color(0xFF1a3530),
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _CoopHomeHeader(
            lp: lp,
            memberCount: '$memberCount',
            productionLabel: isPortal
                ? '${_fmtNum(totalKg)} kg'
                : lp.t('Network', 'Réseau'),
            revenueLabel: revenueLabel,
            productionSubtitle: lp.t(
              'Total declared',
              'Total déclaré',
            ),
          )),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _sectionTitle(lp.t('Member overview', 'Aperçu membres')),
                const SizedBox(height: 10),
                _overviewRow(
                  lp.t('Total', 'Total'),
                  '$memberCount',
                  lp.t('Active', 'Actifs'),
                  '$activeMembers',
                  lp.t('New (30d)', 'Nouveaux (30j)'),
                  '$newThisMonth',
                ),
                const SizedBox(height: 22),
                _sectionTitle(lp.t('Production summary', 'Synthèse production')),
                const SizedBox(height: 10),
                _overviewRow(
                  lp.t('Declared', 'Déclaré'),
                  isPortal ? '${_fmtNum(totalKg)} kg' : '—',
                  lp.t('Pending', 'En attente'),
                  '$pendingListings',
                  lp.t('Sold', 'Vendu'),
                  '$soldCount',
                ),
                const SizedBox(height: 22),
                _sectionTitle(
                    lp.t('Market connections', 'Connexions marché')),
                const SizedBox(height: 10),
                _cardShell(
                  child: Row(
                    children: [
                      const Icon(Icons.handshake_outlined, color: _Coop.gold, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              lp.t(
                                'Buyers & marketplace',
                                'Acheteurs & place de marché',
                              ),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              lp.t(
                                '$promoted listings promoted to AfriYield / platform',
                                '$promoted annonces promues sur AfriYield / plateforme',
                              ),
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.55),
                                fontSize: 12,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                _sectionTitle(lp.t('Quick actions', 'Actions rapides')),
                const SizedBox(height: 10),
                _quickAction(
                  context,
                  lp,
                  Icons.person_add_alt_outlined,
                  lp.t('Add member', 'Ajouter un membre'),
                  lp.t(
                    'Send invitations from the cooperative portal',
                    'Envoyer des invitations depuis le portail coopératif',
                  ),
                  () => _openWebAction(context, 'cooperative-portal'),
                ),
                const SizedBox(height: 8),
                _quickAction(
                  context,
                  lp,
                  Icons.post_add_outlined,
                  lp.t('Declare production', 'Déclarer une production'),
                  lp.t(
                    'Collect listings from member farmers',
                    'Collecter les annonces des agriculteurs membres',
                  ),
                  () => _openWebAction(context, 'cooperative-portal'),
                ),
                const SizedBox(height: 8),
                _quickAction(
                  context,
                  lp,
                  Icons.price_change_outlined,
                  lp.t('View market prices', 'Prix du marché'),
                  lp.t(
                    'Benchmark shea, sesame, cashew and more',
                    'Références karité, sésame, cajou, etc.',
                  ),
                  () => _openWebAction(context, 'afri-yield/marketplace'),
                ),
                const SizedBox(height: 8),
                _quickAction(
                  context,
                  lp,
                  Icons.support_agent_outlined,
                  lp.t('Contact support', 'Contacter le support'),
                  lp.t('Help center and email', 'Centre d’aide et e-mail'),
                  () => context.push('/help'),
                ),
                const SizedBox(height: 22),
                _sectionTitle(lp.t('Recent activity', 'Activité récente')),
                const SizedBox(height: 10),
                if (!isPortal)
                  Text(
                    lp.t(
                      'Sign in as a cooperative to see live listings and members.',
                      'Connectez-vous comme coopérative pour voir les données.',
                    ),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontSize: 13,
                    ),
                  )
                else if (recentListings.isEmpty && members.isEmpty)
                  Text(
                    lp.t('No recent activity yet.', 'Aucune activité récente.'),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontSize: 13,
                    ),
                  )
                else ...[
                  ...recentListings.take(6).map((l) {
                    final crop = l['commodity']?.toString() ?? '—';
                    final kg = (num.tryParse(l['quantityKg']?.toString() ?? '0') ?? 0).toDouble();
                    final approved = l['cooperativeApproved'] == true;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _cardShell(
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: _Coop.teal.withValues(alpha: 0.2),
                            child: Text(
                              l['emoji']?.toString() ?? '🌾',
                              style: const TextStyle(fontSize: 18),
                            ),
                          ),
                          title: Text(
                            crop,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          subtitle: Text(
                            '${_fmtNum(kg)} kg · ${approved ? lp.t('Approved', 'Approuvé') : lp.t('Pending review', 'En validation')}',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 12,
                            ),
                          ),
                          trailing: Icon(
                            Icons.chevron_right,
                            color: Colors.white.withValues(alpha: 0.25),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ]),
            ),
          ),
        ],
      ),
    );
  }

  int _pendingCount(List<Map<String, dynamic>> listings) {
    return listings.where((l) => l['cooperativeApproved'] != true).length;
  }

  int _promotedCount(List<Map<String, dynamic>> listings) {
    return listings.where((l) => l['promotedToMarketplace'] == true).length;
  }

  double _pipelineUsd(List<Map<String, dynamic>> listings) {
    return listings.fold<double>(
      0,
      (s, l) {
        final kg = num.tryParse(l['quantityKg']?.toString() ?? '0') ?? 0;
        final px = num.tryParse(l['pricePerKgUSD']?.toString() ?? '0') ?? 0;
        return s + kg * px;
      },
    );
  }

  String _fmtNum(double v) {
    if (v >= 1000) {
      return '${(v / 1000).toStringAsFixed(1).replaceAll('.0', '')}k';
    }
    return v.round().toString();
  }

  String _fmtUsd(double v) {
    if (v >= 1e6) return '${(v / 1e6).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}k';
    return v.round().toString();
  }

  Widget _sectionTitle(String t) {
    return Text(
      t,
      style: const TextStyle(
        color: _Coop.teal,
        fontSize: 16,
        fontWeight: FontWeight.w800,
      ),
    );
  }

  Widget _overviewRow(
    String aLabel,
    String aVal,
    String bLabel,
    String bVal,
    String cLabel,
    String cVal,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: _Coop.cardGrad,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          Expanded(child: _miniStat(aLabel, aVal)),
          Container(
            width: 1,
            height: 36,
            color: Colors.white.withValues(alpha: 0.08),
          ),
          Expanded(child: _miniStat(bLabel, bVal)),
          Container(
            width: 1,
            height: 36,
            color: Colors.white.withValues(alpha: 0.08),
          ),
          Expanded(child: _miniStat(cLabel, cVal)),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _cardShell({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: _Coop.cardGrad,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: child,
    );
  }

  Widget _quickAction(
    BuildContext context,
    LanguageProvider lp,
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
            gradient: _Coop.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _Coop.teal.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _Coop.teal.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: _Coop.teal, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
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
}

Future<void> _openWebAction(BuildContext context, String path) async {
  const base = 'https://sahelagriconnect.com';
  final uri = Uri.parse(path.startsWith('http') ? path : '$base/$path');
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _CoopHomeHeader extends StatelessWidget {
  const _CoopHomeHeader({
    required this.lp,
    required this.memberCount,
    required this.productionLabel,
    required this.revenueLabel,
    required this.productionSubtitle,
  });

  final LanguageProvider lp;
  final String memberCount;
  final String productionLabel;
  final String revenueLabel;
  final String productionSubtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: _Coop.headerGrad),
      child: Stack(
        children: [
          Positioned(
            top: -24,
            right: -24,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _Coop.teal.withValues(alpha: 0.07),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            left: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _Coop.gold.withValues(alpha: 0.06),
              ),
            ),
          ),
          SafeArea(
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
                                'Cooperative Management',
                                'Gestion coopérative',
                              ),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              lp.t(
                                'Members, production & marketplace',
                                'Membres, production & marché',
                              ),
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.65),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.go('/home'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
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
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      _headerStatCard(
                        lp.t('Members', 'Membres'),
                        memberCount,
                        Icons.groups_outlined,
                      ),
                      const SizedBox(width: 10),
                      _headerStatCard(
                        productionSubtitle,
                        productionLabel,
                        Icons.agriculture,
                      ),
                      const SizedBox(width: 10),
                      _headerStatCard(
                        lp.t('Pipeline', 'Pipeline'),
                        revenueLabel,
                        Icons.payments_outlined,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _headerStatCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          gradient: _Coop.cardGrad,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: _Coop.gold.withValues(alpha: 0.9), size: 18),
            const SizedBox(height: 8),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ———————————————————————————————————————————————————————————— Bottom nav
class _CoopBottomNav extends StatelessWidget {
  const _CoopBottomNav({
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
        color: _Coop.bg,
        border: Border(
          top: BorderSide(
            color: Colors.white.withValues(alpha: 0.06),
            width: 0.5,
          ),
        ),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
        ),
        child: BottomNavigationBar(
          currentIndex: tab.clamp(0, 4),
          onTap: onChanged,
          type: BottomNavigationBarType.fixed,
          backgroundColor: _Coop.bg,
          selectedItemColor: _Coop.teal,
          unselectedItemColor: Colors.white38,
          selectedFontSize: 11,
          unselectedFontSize: 10,
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: lp.t('Home', 'Accueil'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.groups_outlined),
              activeIcon: const Icon(Icons.groups),
              label: lp.t('Members', 'Membres'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.agriculture_outlined),
              activeIcon: const Icon(Icons.agriculture),
              label: lp.t('Production', 'Production'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.campaign_outlined),
              activeIcon: const Icon(Icons.campaign),
              label: lp.t('Updates', 'Infos'),
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

// ———————————————————————————————————————————————————————————— Tabs
class _MembersTab extends StatelessWidget {
  const _MembersTab({
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
      return _emptyState(
        lp.t(
          'Sign in with your cooperative account to view members.',
          'Connectez-vous avec le compte de votre coopérative.',
        ),
      );
    }
    final members = (data['memberFarmers'] as List?)
            ?.whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList() ??
        [];
    if (members.isEmpty) {
      return _emptyState(
        lp.t('No member farmers linked yet.', 'Aucun agriculteur lié.'),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: members.length,
      itemBuilder: (ctx, i) {
        final m = members[i];
        final name = m['nom']?.toString() ?? '—';
        final region = m['region']?.toString() ?? '';
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: _Coop.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              backgroundColor: _Coop.teal.withValues(alpha: 0.25),
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            title: Text(
              name,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
            subtitle: Text(
              [
                if (region.isNotEmpty) region,
                m['telephone'] ?? m['email'] ?? '',
              ].where((s) => '$s'.isNotEmpty).join(' · '),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 12,
              ),
            ),
            trailing: Icon(
              Icons.chevron_right,
              color: Colors.white.withValues(alpha: 0.25),
            ),
          ),
        );
      },
    );
  }
}

class _ProductionTab extends StatelessWidget {
  const _ProductionTab({
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
      return _emptyState(
        lp.t(
          'Sign in to track declared produce and approvals.',
          'Connectez-vous pour suivre les déclarations.',
        ),
      );
    }
    final listings = (data['produceListings'] as List?)
            ?.whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList() ??
        [];
    if (listings.isEmpty) {
      return _emptyState(
        lp.t('No produce listings yet.', 'Aucune annonce de production.'),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: listings.length,
      itemBuilder: (ctx, i) {
        final l = listings[i];
        final crop = l['commodity']?.toString() ?? '—';
        final kg = num.tryParse(l['quantityKg']?.toString() ?? '0') ?? 0;
        final approved = l['cooperativeApproved'] == true;
        final promoted = l['promotedToMarketplace'] == true;
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: _Coop.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: approved
                  ? _Coop.teal.withValues(alpha: 0.35)
                  : Colors.white.withValues(alpha: 0.08),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    l['emoji']?.toString() ?? '🌾',
                    style: const TextStyle(fontSize: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      crop,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  if (promoted)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: _Coop.gold.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        lp.t('Market', 'Marché'),
                        style: const TextStyle(
                          color: _Coop.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${kg.toStringAsFixed(0)} kg · ${l['farmerName'] ?? lp.t('Farmer', 'Agriculteur')}',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                approved
                    ? lp.t('Approved for buyers', 'Validé pour acheteurs')
                    : lp.t('Pending cooperative review', 'En revue coopérative'),
                style: TextStyle(
                  color: approved ? _Coop.teal : Colors.amber.shade200,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _UpdatesTab extends StatelessWidget {
  const _UpdatesTab({
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
      return _emptyState(
        lp.t(
          'Government projects and cooperative alerts appear after sign-in.',
          'Projets et alertes après connexion.',
        ),
      );
    }
    final projects = (data['nationalProjects'] as List?)
            ?.whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList() ??
        [];
    final invitations = (data['invitations'] as List?)
            ?.whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList() ??
        [];
    if (projects.isEmpty && invitations.isEmpty) {
      return _emptyState(
        lp.t('No national projects or invites yet.', 'Aucun projet ou invitation.'),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        if (projects.isNotEmpty) ...[
          Text(
            lp.t('National projects', 'Projets nationaux'),
            style: const TextStyle(
              color: _Coop.teal,
              fontWeight: FontWeight.w800,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 10),
          ...projects.map((p) {
            final title =
                p['title']?.toString() ?? p['titleFr']?.toString() ?? 'Project';
            final mine = p['myResponse']?.toString();
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: _Coop.cardGrad,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _Coop.gold.withValues(alpha: 0.12),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.flag_outlined, color: _Coop.gold, size: 20),
                      const SizedBox(width: 8),
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
                    ],
                  ),
                  if (mine != null && mine.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      '${lp.t('Your response:', 'Votre réponse :')} $mine',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
        ],
        if (invitations.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            lp.t('Invitations', 'Invitations'),
            style: const TextStyle(
              color: _Coop.teal,
              fontWeight: FontWeight.w800,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 10),
          ...invitations.take(15).map((inv) {
            final status = inv['status']?.toString() ?? '';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: _Coop.cardGrad,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.mail_outline, color: _Coop.teal, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      inv['inviteeEmail']?.toString() ??
                          inv['inviteePhone']?.toString() ??
                          '—',
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                  Text(
                    status,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ],
    );
  }
}

Widget _emptyState(String message) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.45),
          fontSize: 14,
          height: 1.4,
        ),
      ),
    ),
  );
}

// ———————————————————————————————————————————————————————————— Account
class _CooperativeAccountTab extends StatelessWidget {
  const _CooperativeAccountTab({required this.lp});

  final LanguageProvider lp;

  Future<void> _openWeb() async {
    final uri = Uri.parse('https://sahelagriconnect.com');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final initial =
        auth.displayName.isNotEmpty ? auth.displayName[0].toUpperCase() : '?';

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 180,
          pinned: true,
          backgroundColor: const Color(0xFF1a3a2a),
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/cooperative'),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: _Coop.headerGrad),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            _Coop.teal,
                            _Coop.teal.withValues(alpha: 0.7),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _Coop.teal.withValues(alpha: 0.35),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          initial,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      auth.displayName.isNotEmpty
                          ? auth.displayName
                          : lp.t('Cooperative', 'Coopérative'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _Coop.gold.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _Coop.gold.withValues(alpha: 0.35),
                        ),
                      ),
                      child: Text(
                        lp.t('🤝 Cooperative account', 'Compte coopératif'),
                        style: const TextStyle(
                          color: _Coop.gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          title: Text(
            lp.t('Account', 'Compte'),
            style: const TextStyle(color: Colors.white, fontSize: 18),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (auth.displayEmail.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Text(
                      auth.displayEmail,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                      ),
                    ),
                  ),
                _CoopAccountSection(
                  title: lp.t('Navigation', 'Navigation'),
                  children: [
                    _CoopAccountTile(
                      icon: Icons.home_outlined,
                      iconColor: _Coop.teal,
                      title: lp.t('Back to Main Home', 'Retour à l’accueil'),
                      subtitle: lp.t(
                        'Platform overview',
                        'Aperçu de la plateforme',
                      ),
                      onTap: () => context.go('/home'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _CoopAccountSection(
                  title: lp.t('Profile', 'Profil'),
                  children: [
                    _CoopAccountTile(
                      icon: Icons.person_outline,
                      iconColor: _Coop.gold,
                      title: lp.t('Edit Profile', 'Modifier le profil'),
                      subtitle: lp.t('Name and details', 'Nom et détails'),
                      onTap: () => context.push('/profile/edit'),
                    ),
                    _CoopAccountTile(
                      icon: Icons.language_outlined,
                      iconColor: const Color(0xFF7FD4B8),
                      title: lp.t('Language', 'Langue'),
                      subtitle: lp.t('English / Français', 'Anglais / Français'),
                      onTap: () => context.push('/profile/language'),
                    ),
                    _CoopAccountTile(
                      icon: Icons.notifications_outlined,
                      iconColor: const Color(0xFFFFB74D),
                      title: lp.t('Notifications', 'Notifications'),
                      subtitle: lp.t('Alerts', 'Alertes'),
                      onTap: () => context.push('/profile/notifications'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _CoopAccountSection(
                  title: lp.t('Security & account', 'Sécurité et compte'),
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        gradient: _Coop.cardGrad,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.06),
                        ),
                      ),
                      child: Column(
                        children: [
                          WebActionTile(
                            title: lp.t('Delete my account', 'Supprimer mon compte'),
                            description: lp.t(
                              'Permanently remove cooperative data',
                              'Supprimer définitivement les données',
                            ),
                            action: 'delete-account',
                            icon: Icons.delete_outline,
                            isDangerous: true,
                            titleColor: Colors.white,
                            subtitleColor: Colors.white70,
                          ),
                          Divider(
                            height: 1,
                            color: Colors.white.withValues(alpha: 0.06),
                          ),
                          WebActionTile(
                            title: lp.t('Update credentials', 'Identifiants'),
                            description: lp.t(
                              'Change password on the web portal',
                              'Mot de passe sur le portail web',
                            ),
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
                const SizedBox(height: 16),
                _CoopAccountSection(
                  title: lp.t('Support', 'Support'),
                  children: [
                    _CoopAccountTile(
                      icon: Icons.help_outline,
                      iconColor: _Coop.teal,
                      title: lp.t('Help Center', 'Centre d’aide'),
                      subtitle: lp.t('FAQs', 'FAQ'),
                      onTap: () => context.push('/help'),
                    ),
                    _CoopAccountTile(
                      icon: Icons.gavel_outlined,
                      iconColor: Colors.white54,
                      title: lp.t('Terms of Service', 'Conditions'),
                      subtitle: lp.t('Legal', 'Mentions légales'),
                      onTap: () => context.push('/terms?view=1'),
                    ),
                    _CoopAccountTile(
                      icon: Icons.privacy_tip_outlined,
                      iconColor: Colors.white54,
                      title: lp.t('Privacy Policy', 'Confidentialité'),
                      subtitle: lp.t('Data use', 'Données'),
                      onTap: () => context.push('/terms?view=1'),
                    ),
                    _CoopAccountTile(
                      icon: Icons.language,
                      iconColor: const Color(0xFF64B5F6),
                      title: lp.t('Web portal', 'Portail web'),
                      subtitle: 'sahelagriconnect.com',
                      trailing: const _CoopWebBadge(),
                      onTap: _openWeb,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final ok = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: const Color(0xFF1a3530),
                          title: Text(
                            lp.t('Sign out?', 'Déconnexion ?'),
                            style: const TextStyle(color: Colors.white),
                          ),
                          content: Text(
                            lp.t(
                              'You will return to role selection.',
                              'Retour au choix de rôle.',
                            ),
                            style: const TextStyle(color: Colors.white70),
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
                              child: const Text(
                                'Sign out',
                                style: TextStyle(color: Colors.red),
                              ),
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
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CoopAccountSection extends StatelessWidget {
  const _CoopAccountSection({
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
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
            gradient: _Coop.cardGrad,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            children: children.asMap().entries.map((e) {
              final last = e.key == children.length - 1;
              return Column(
                children: [
                  e.value,
                  if (!last)
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
}

class _CoopAccountTile extends StatelessWidget {
  const _CoopAccountTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 18),
      ),
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.45),
          fontSize: 12,
        ),
      ),
      trailing: trailing ??
          Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.25)),
    );
  }
}

class _CoopWebBadge extends StatelessWidget {
  const _CoopWebBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Text(
        'WEB',
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: Colors.lightBlueAccent,
        ),
      ),
    );
  }
}
