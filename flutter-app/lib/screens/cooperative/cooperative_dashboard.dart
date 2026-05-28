import 'package:flutter/material.dart';
import '../../core/safe_insets.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/glass.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/offline_queue.dart';
import '../../widgets/offline_banner.dart';

const _bg = Color(0xFF0d1f1a);
const _surface = Color(0xFF1a3530);
const _surface2 = Color(0xFF112820);
const _accent = Color(0xFF1D9E75);
const _gold = AppColors.gold;
const _border = Color(0x14FFFFFF);
const _text = Colors.white;
const _muted = Color(0x99FFFFFF);

Map<String, dynamic> _mapMemberFromApi(Map<String, dynamic> f) {
  final cultures = f['cultures'];
  String crop = '';
  if (cultures is List) {
    crop = cultures.map((e) => e.toString()).join(', ');
  } else if (cultures != null) {
    crop = cultures.toString();
  }
  return {
    'name': f['nom'] ?? f['name'] ?? '—',
    'phone': f['telephone'] ?? f['phone'] ?? '',
    'email': f['email']?.toString() ?? '',
    'region': f['region']?.toString() ?? '',
    'mainCrop': f['mainCrop']?.toString() ?? crop,
    'farmAreaHa': f['farmAreaHa']?.toString() ?? f['superficie']?.toString() ?? '',
    'role': f['role']?.toString() ?? f['statut']?.toString() ?? 'producer',
  };
}

Map<String, dynamic> _mapProductionFromApi(Map<String, dynamic> p) {
  final grade = p['qualityGrade']?.toString() ?? p['quality']?.toString() ?? 'A';
  return {
    'crop': p['commodity'] ?? p['crop'] ?? '—',
    'quantity': p['quantityKg'] ?? p['quantity'] ?? 0,
    'unit': p['unit']?.toString() ?? 'kg',
    'quality': grade.length == 1 ? grade : grade.substring(0, 1),
    'priceXOF': p['priceXOF'] ?? p['pricePerKgUSD'] ?? 0,
    'season': p['season']?.toString() ?? '',
    'location': p['region'] ?? p['location'] ?? '',
    'farmerName': p['farmerName'] ?? '',
    'harvestDate': p['harvestDate']?.toString() ?? '',
    'notes': p['description'] ?? p['notes'] ?? '',
    'declaredAt': p['createdAt']?.toString() ?? '',
  };
}

List<Map<String, dynamic>> _parseMembers(Map<String, dynamic> res) {
  final raw = res['members'] ?? res['memberFarmers'];
  if (raw is! List) return [];
  return raw
      .whereType<Map>()
      .map((e) => _mapMemberFromApi(Map<String, dynamic>.from(e)))
      .toList();
}

List<Map<String, dynamic>> _parseProductions(Map<String, dynamic> res) {
  final raw = res['productions'] ?? res['produceListings'];
  if (raw is! List) return [];
  return raw
      .whereType<Map>()
      .map((e) => _mapProductionFromApi(Map<String, dynamic>.from(e)))
      .toList();
}

// ══════════════════════════════════════════════════════════════
// MAIN COOPERATIVE DASHBOARD
// ══════════════════════════════════════════════════════════════
class CooperativeDashboard extends StatefulWidget {
  const CooperativeDashboard({super.key});
  @override
  State<CooperativeDashboard> createState() => _CooperativeDashboardState();
}

class _CooperativeDashboardState extends State<CooperativeDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _data;
  bool _loading = true;
  List<Map<String, dynamic>> _members = [];
  List<Map<String, dynamic>> _productions = [];

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
        res = await ApiService.getCoopPortal(
          token,
          country: auth.displayCountry.isNotEmpty ? auth.displayCountry : null,
        );
      } else {
        res = await ApiService.getCoopPublicStats();
      }
      if (mounted) {
        setState(() {
          _data = res;
          _members = _parseMembers(res);
          _productions = _parseProductions(res);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goTab(int i) {
    AuthService.resetActivity();
    setState(() => _tab = i);
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          isFr ? 'Quitter ?' : 'Exit?',
          style: const TextStyle(color: _text),
        ),
        content: Text(
          isFr
              ? 'Voulez-vous quitter la coopérative ?'
              : 'Do you want to exit the cooperative portal?',
          style: const TextStyle(color: _muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              isFr ? 'Rester' : 'Stay',
              style: const TextStyle(color: _muted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              isFr ? 'Quitter' : 'Exit',
              style: const TextStyle(color: _gold),
            ),
          ),
        ],
      ),
    );
    if (exit == true && mounted) context.go('/home');
  }

  void _addMember(Map<String, dynamic> member) =>
      setState(() => _members.add(member));

  void _addProduction(Map<String, dynamic> prod) =>
      setState(() => _productions.add(prod));

  @override
  Widget build(BuildContext context) {
    final isFr = context.watch<LanguageProvider>().locale.languageCode == 'fr';

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
              splashColor: _accent.withValues(alpha: 0.12),
              highlightColor: _accent.withValues(alpha: 0.08),
            ),
            child: Scaffold(
              extendBody: true,
              backgroundColor: _bg,
              body: Column(
                children: [
                  const OfflineBanner(),
                  _CoopHeader(
                    data: _data,
                    members: _members,
                    productions: _productions,
                    loading: _loading,
                    isFr: isFr,
                  ),
                  Expanded(
                    child: IndexedStack(
                      index: _tab,
                      children: [
                        _HomeTab(
                          data: _data,
                          members: _members,
                          productions: _productions,
                          loading: _loading,
                          isFr: isFr,
                          onTabChange: _goTab,
                        ),
                        _MembersTab(
                          members: _members,
                          isFr: isFr,
                          onAdd: _addMember,
                        ),
                        _ProductionTab(
                          productions: _productions,
                          isFr: isFr,
                          onAdd: _addProduction,
                        ),
                        _StatisticsTab(
                          data: _data,
                          members: _members,
                          productions: _productions,
                          isFr: isFr,
                        ),
                        _CoopAccountTab(isFr: isFr, onTabChange: _goTab),
                      ],
                    ),
                  ),
                ],
              ),
              bottomNavigationBar: GlassBottomNav(
                  child: NavigationBarTheme(
                    data: NavigationBarThemeData(
                      backgroundColor: Colors.transparent,
                      indicatorColor: _accent.withValues(alpha: 0.15),
                      surfaceTintColor: Colors.transparent,
                      labelTextStyle: WidgetStateProperty.resolveWith((states) {
                        if (states.contains(WidgetState.selected)) {
                          return const TextStyle(
                            color: _accent,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          );
                        }
                        return const TextStyle(color: _muted, fontSize: 12);
                      }),
                    ),
                    child: NavigationBar(
                      backgroundColor: Colors.transparent,
                      surfaceTintColor: Colors.transparent,
                      elevation: 0,
                      height: 64,
                      selectedIndex: _tab,
                      onDestinationSelected: _goTab,
                      indicatorColor: _accent.withValues(alpha: 0.15),
                      labelBehavior:
                          NavigationDestinationLabelBehavior.alwaysShow,
                      destinations: [
                        NavigationDestination(
                          icon: const Icon(Icons.home_outlined, color: _muted),
                          selectedIcon:
                              const Icon(Icons.home, color: _accent),
                          label: isFr ? 'Accueil' : 'Home',
                        ),
                        NavigationDestination(
                          icon:
                              const Icon(Icons.groups_outlined, color: _muted),
                          selectedIcon:
                              const Icon(Icons.groups, color: _accent),
                          label: isFr ? 'Membres' : 'Members',
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.inventory_2_outlined,
                              color: _muted),
                          selectedIcon: const Icon(Icons.inventory_2,
                              color: _accent),
                          label: isFr ? 'Production' : 'Production',
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.bar_chart_outlined,
                              color: _muted),
                          selectedIcon:
                              const Icon(Icons.bar_chart, color: _accent),
                          label: isFr ? 'Stats' : 'Stats',
                        ),
                        NavigationDestination(
                          icon: const Icon(Icons.manage_accounts_outlined,
                              color: _muted),
                          selectedIcon: const Icon(Icons.manage_accounts,
                              color: _accent),
                          label: isFr ? 'Compte' : 'Account',
                        ),
                      ],
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
class _CoopHeader extends StatelessWidget {
  final Map<String, dynamic>? data;
  final List<Map<String, dynamic>> members;
  final List<Map<String, dynamic>> productions;
  final bool loading;
  final bool isFr;

  const _CoopHeader({
    required this.data,
    required this.members,
    required this.productions,
    required this.loading,
    required this.isFr,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final stats = data?['stats'];
    final coopName = (data?['cooperativeName'] ?? data?['name'])?.toString() ??
        (auth.displayName.isNotEmpty ? auth.displayName : null) ??
        (isFr ? 'Coopérative' : 'Cooperative');

    final memberCount = stats is Map
        ? '${stats['memberCount'] ?? members.length}'
        : '${members.length}';

    final totalKg = productions.fold<double>(
      0,
      (s, p) =>
          s +
          (num.tryParse(p['quantity']?.toString() ?? '0') ?? 0).toDouble(),
    );
    final totalProd = totalKg > 0
        ? '${totalKg.round()} kg'
        : (stats is Map && stats['totalAreaHa'] != null
            ? '${stats['totalAreaHa']} ha'
            : '—');

    final activeCount = members
        .where((m) {
          final s = (m['role'] ?? '').toString().toLowerCase();
          return s.contains('actif') || s == 'active' || s == 'producer';
        })
        .length;
    final activeStr = members.isEmpty ? '—' : '$activeCount';

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1a3c2e), Color(0xFF1e4d38), Color(0xFF1a3c2e)],
          stops: [0.0, 0.5, 1.0],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _accent.withValues(alpha: 0.07),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isFr
                                  ? 'Gestion coopérative'
                                  : 'Cooperative Management',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.65),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.8,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              coopName,
                              style: const TextStyle(
                                color: _text,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -0.5,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
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
                            color: Colors.white.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.home_outlined,
                                color: Colors.white.withValues(alpha: 0.9),
                                size: 15,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isFr ? 'Accueil' : 'Home',
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
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _stat(loading ? '…' : memberCount,
                          isFr ? 'Membres' : 'Members'),
                      const SizedBox(width: 8),
                      _stat(loading ? '…' : totalProd,
                          isFr ? 'Production' : 'Production'),
                      const SizedBox(width: 8),
                      _stat(loading ? '…' : activeStr,
                          isFr ? 'Actifs' : 'Active'),
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

  Widget _stat(String val, String label) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                val,
                style: const TextStyle(
                  color: _accent,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 9,
                ),
              ),
            ],
          ),
        ),
      );
}

// ══════════════════════════════════════════════════════════════
// TAB 0: HOME
// ══════════════════════════════════════════════════════════════
class _HomeTab extends StatelessWidget {
  final Map<String, dynamic>? data;
  final List<Map<String, dynamic>> members;
  final List<Map<String, dynamic>> productions;
  final bool loading;
  final bool isFr;
  final Function(int) onTabChange;

  const _HomeTab({
    required this.data,
    required this.members,
    required this.productions,
    required this.loading,
    required this.isFr,
    required this.onTabChange,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _accent.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('🤝', style: TextStyle(fontSize: 32)),
              const SizedBox(height: 10),
              Text(
                isFr
                    ? 'Bienvenue dans votre coopérative'
                    : 'Welcome to your Cooperative',
                style: const TextStyle(
                  color: _text,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                isFr
                    ? 'Gérez vos membres, suivez la production et connectez-vous avec les acheteurs et investisseurs.'
                    : 'Manage your members, track production, and connect with buyers and investors.',
                style: const TextStyle(
                  color: _muted,
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 16),
        Text(
          isFr ? 'Actions rapides' : 'Quick Actions',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.35,
          children: [
            _QA(
              emoji: '👥',
              title: isFr ? 'Ajouter membre' : 'Add Member',
              color: _accent,
              onTap: () => onTabChange(1),
            ),
            _QA(
              emoji: '🌾',
              title: isFr ? 'Enregistrer production' : 'Log Production',
              color: const Color(0xFF4CAF50),
              onTap: () => onTabChange(2),
            ),
            _QA(
              emoji: '📊',
              title: isFr ? 'Statistiques' : 'Statistics',
              color: const Color(0xFF2196F3),
              onTap: () => onTabChange(3),
            ),
            _QA(
              emoji: '⚙️',
              title: isFr ? 'Mon compte' : 'My Account',
              color: _gold,
              onTap: () => onTabChange(4),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isFr ? 'Prix du marché' : 'Market Prices',
              style: const TextStyle(
                color: _text,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              isFr ? 'Aujourd\'hui' : 'Today',
              style: const TextStyle(color: _muted, fontSize: 12),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...[
          [isFr ? 'Beurre de karité' : 'Shea Butter', '450 XOF/kg', '+12%', true],
          [isFr ? 'Sésame' : 'Sesame', '380 XOF/kg', '+3%', true],
          [isFr ? 'Noix de cajou' : 'Cashew', '920 XOF/kg', '+8%', true],
          [isFr ? 'Arachides' : 'Groundnuts', '280 XOF/kg', '-1%', false],
        ].map(
          (p) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_surface, _surface2]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _border),
            ),
            child: Row(
              children: [
                const Icon(Icons.eco_outlined, color: _accent, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    p[0] as String,
                    style: const TextStyle(
                      color: _text,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Text(
                  p[1] as String,
                  style: const TextStyle(color: _muted, fontSize: 12),
                ),
                const SizedBox(width: 10),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: (p[3] as bool ? Colors.green : Colors.red)
                        .withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    p[2] as String,
                    style: TextStyle(
                      color: p[3] as bool ? Colors.green : Colors.red,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isFr ? 'Membres récents' : 'Recent Members',
              style: const TextStyle(
                color: _text,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
            GestureDetector(
              onTap: () => onTabChange(1),
              child: Text(
                isFr ? 'Voir tout' : 'See all',
                style: const TextStyle(color: _gold, fontSize: 12),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (members.isEmpty)
          _empty(
            Icons.groups_outlined,
            isFr ? 'Aucun membre' : 'No members yet',
            isFr
                ? 'Ajoutez votre premier membre ci-dessus'
                : 'Add your first member above',
          )
        else
          ...members.take(3).map(
                (m) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [_surface, _surface2]),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: _accent.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            (m['name'] as String? ?? 'M')[0].toUpperCase(),
                            style: const TextStyle(
                              color: _accent,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              m['name'] as String? ?? '—',
                              style: const TextStyle(
                                color: _text,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              m['role'] as String? ??
                                  m['phone'] as String? ??
                                  '—',
                              style: const TextStyle(
                                color: _muted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: _accent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          isFr ? 'Actif' : 'Active',
                          style: const TextStyle(
                            color: _accent,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 300.ms),
              ),
      ],
    );
  }
}

class _QA extends StatelessWidget {
  final String emoji;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _QA({
    required this.emoji,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.25)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 20)),
                ),
              ),
              const Spacer(),
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1);
}

// ══════════════════════════════════════════════════════════════
// TAB 1: MEMBERS
// ══════════════════════════════════════════════════════════════
class _MembersTab extends StatefulWidget {
  final List<Map<String, dynamic>> members;
  final bool isFr;
  final void Function(Map<String, dynamic>) onAdd;

  const _MembersTab({
    required this.members,
    required this.isFr,
    required this.onAdd,
  });

  @override
  State<_MembersTab> createState() => _MembersTabState();
}

class _MembersTabState extends State<_MembersTab> {
  bool _showForm = false;
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  final _cropCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  String _role = 'producer';
  String _gender = 'male';
  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _regionCtrl.dispose();
    _cropCtrl.dispose();
    _areaCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty || _phoneCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isFr
                ? 'Nom et téléphone sont obligatoires'
                : 'Name and phone are required',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthState>();
      final queue = context.read<OfflineQueue>();
      final member = {
        'name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'region': _regionCtrl.text.trim(),
        'mainCrop': _cropCtrl.text.trim(),
        'farmAreaHa': _areaCtrl.text.trim(),
        'role': _role,
        'gender': _gender,
        'joinedAt': DateTime.now().toIso8601String(),
      };
      await queue.enqueue(
        path: '/api/cooperatives/members',
        body: {'coopEmail': auth.displayEmail, ...member},
        label: 'Add cooperative member',
        token: auth.token,
      );
      widget.onAdd(member);
      if (mounted) {
        setState(() {
          _submitting = false;
          _showForm = false;
          _nameCtrl.clear();
          _phoneCtrl.clear();
          _emailCtrl.clear();
          _regionCtrl.clear();
          _cropCtrl.clear();
          _areaCtrl.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.isFr
                  ? '✅ Membre ajouté avec succès !'
                  : '✅ Member added successfully!',
            ),
            backgroundColor: _accent,
          ),
        );
      }
    } catch (_) {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        if (!_showForm)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: _accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.person_add_outlined),
              label: Text(
                isFr ? 'Ajouter un membre' : 'Add New Member',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              onPressed: () => setState(() => _showForm = true),
            ),
          ),
        if (_showForm) ...[
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: _text),
                onPressed: () => setState(() => _showForm = false),
              ),
              Text(
                isFr ? 'Nouveau membre' : 'New Member',
                style: const TextStyle(
                  color: _text,
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _card(
            children: [
              _sectionLabel(
                isFr
                    ? '👤 Informations personnelles'
                    : '👤 Personal Information',
              ),
              _lbl(isFr ? 'Nom complet *' : 'Full Name *'),
              _tf(_nameCtrl, isFr ? 'Prénom et nom' : 'First and last name'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _lbl(isFr ? 'Genre' : 'Gender'),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          isDense: true,
                          value: _gender,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text),
                          decoration: _dec(''),
                          items: [
                            DropdownMenuItem(
                              value: 'male',
                              child: Text(
                                isFr ? 'Homme' : 'Male',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'female',
                              child: Text(
                                isFr ? 'Femme' : 'Female',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'other',
                              child: Text(
                                isFr ? 'Autre' : 'Other',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                          ],
                          onChanged: (v) =>
                              setState(() => _gender = v ?? 'male'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _lbl(isFr ? 'Rôle' : 'Role'),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          isDense: true,
                          value: _role,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text),
                          decoration: _dec(''),
                          items: [
                            DropdownMenuItem(
                              value: 'producer',
                              child: Text(
                                isFr ? 'Producteur' : 'Producer',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'treasurer',
                              child: Text(
                                isFr ? 'Trésorier' : 'Treasurer',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'secretary',
                              child: Text(
                                isFr ? 'Secrétaire' : 'Secretary',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'president',
                              child: Text(
                                isFr ? 'Président' : 'President',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                          ],
                          onChanged: (v) =>
                              setState(() => _role = v ?? 'producer'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _sectionLabel(isFr ? '📞 Contact' : '📞 Contact'),
              _lbl(isFr ? 'Téléphone *' : 'Phone *'),
              _tf(_phoneCtrl, '+223...', type: TextInputType.phone),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Email (optionnel)' : 'Email (optional)'),
              _tf(_emailCtrl, 'membre@email.com',
                  type: TextInputType.emailAddress),
              const SizedBox(height: 16),
              _sectionLabel(
                isFr
                    ? '🌾 Informations agricoles'
                    : '🌾 Agricultural Information',
              ),
              _lbl(isFr ? 'Région / Village' : 'Region / Village'),
              _tf(_regionCtrl,
                  isFr ? 'Ex: Koulikoro, Ségou' : 'e.g. Koulikoro, Segou'),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Culture principale' : 'Main Crop'),
              _tf(_cropCtrl,
                  isFr ? 'Ex: Karité, Sésame, Mil' : 'e.g. Shea, Sesame, Millet'),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Superficie cultivée (ha)' : 'Farm Area (ha)'),
              _tf(_areaCtrl, '0.5', type: TextInputType.number),
              const SizedBox(height: 20),
              _btn(
                isFr ? 'Ajouter le membre' : 'Add Member',
                _submitting,
                _submit,
                _accent,
              ),
            ],
          ),
        ],
        const SizedBox(height: 20),
        Text(
          '${isFr ? 'Membres' : 'Members'} (${widget.members.length})',
          style: const TextStyle(
            color: _text,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (widget.members.isEmpty)
          _empty(
            Icons.groups_outlined,
            isFr ? 'Aucun membre' : 'No members yet',
            isFr
                ? 'Ajoutez votre premier membre ci-dessus'
                : 'Add your first member above',
          )
        else
          ...widget.members.asMap().entries.map(
                (e) => _MemberCard(m: e.value, index: e.key, isFr: isFr),
              ),
      ],
    );
  }
}

class _MemberCard extends StatelessWidget {
  final Map<String, dynamic> m;
  final int index;
  final bool isFr;

  const _MemberCard({
    required this.m,
    required this.index,
    required this.isFr,
  });

  String _roleLabel(String? role) {
    switch (role) {
      case 'treasurer':
        return isFr ? 'Trésorier' : 'Treasurer';
      case 'secretary':
        return isFr ? 'Secrétaire' : 'Secretary';
      case 'president':
        return isFr ? 'Président' : 'President';
      case 'producer':
        return isFr ? 'Producteur' : 'Producer';
      default:
        return role ?? (isFr ? 'Producteur' : 'Producer');
    }
  }

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [_surface, _surface2]),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _accent.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      (m['name'] as String? ?? '?')[0].toUpperCase(),
                      style: const TextStyle(
                        color: _accent,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        m['name'] as String? ?? '—',
                        style: const TextStyle(
                          color: _text,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        m['phone'] as String? ?? '',
                        style: const TextStyle(color: _muted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _roleLabel(m['role'] as String?),
                    style: const TextStyle(
                      color: _accent,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            if ((m['mainCrop'] as String? ?? '').isNotEmpty ||
                (m['region'] as String? ?? '').isNotEmpty) ...[
              const Divider(color: _border, height: 16),
              Wrap(
                spacing: 12,
                children: [
                  if ((m['region'] as String? ?? '').isNotEmpty)
                    _chip(Icons.location_on_outlined, m['region'] as String),
                  if ((m['mainCrop'] as String? ?? '').isNotEmpty)
                    _chip(Icons.eco_outlined, m['mainCrop'] as String),
                  if ((m['farmAreaHa'] as String? ?? '').isNotEmpty)
                    _chip(Icons.landscape_outlined, '${m['farmAreaHa']} ha'),
                ],
              ),
            ],
          ],
        ),
      ).animate(delay: Duration(milliseconds: 50 * index))
          .fadeIn(duration: 300.ms)
          .slideY(begin: 0.1);

  Widget _chip(IconData icon, String label) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: _muted, size: 12),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(color: _muted, fontSize: 11)),
        ],
      );
}

// ══════════════════════════════════════════════════════════════
// TAB 2: PRODUCTION
// ══════════════════════════════════════════════════════════════
class _ProductionTab extends StatefulWidget {
  final List<Map<String, dynamic>> productions;
  final bool isFr;
  final void Function(Map<String, dynamic>) onAdd;

  const _ProductionTab({
    required this.productions,
    required this.isFr,
    required this.onAdd,
  });

  @override
  State<_ProductionTab> createState() => _ProductionTabState();
}

class _ProductionTabState extends State<_ProductionTab> {
  bool _showForm = false;
  final _cropCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _farmerCtrl = TextEditingController();
  String _unit = 'kg';
  String _quality = 'A';
  String _season = 'rainy';
  DateTime? _harvestDate;
  bool _submitting = false;

  @override
  void dispose() {
    _cropCtrl.dispose();
    _qtyCtrl.dispose();
    _priceCtrl.dispose();
    _notesCtrl.dispose();
    _locationCtrl.dispose();
    _farmerCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_cropCtrl.text.isEmpty || _qtyCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isFr
                ? 'Culture et quantité sont obligatoires'
                : 'Crop and quantity are required',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthState>();
      final queue = context.read<OfflineQueue>();
      final prod = {
        'crop': _cropCtrl.text.trim(),
        'quantity': double.tryParse(_qtyCtrl.text) ?? 0,
        'unit': _unit,
        'quality': _quality,
        'priceXOF': double.tryParse(_priceCtrl.text) ?? 0,
        'season': _season,
        'location': _locationCtrl.text.trim(),
        'farmerName': _farmerCtrl.text.trim(),
        'harvestDate': _harvestDate?.toIso8601String() ?? '',
        'notes': _notesCtrl.text.trim(),
        'declaredAt': DateTime.now().toIso8601String(),
      };
      await queue.enqueue(
        path: '/api/cooperatives/productions',
        body: {'coopEmail': auth.displayEmail, ...prod},
        label: 'Log production',
        token: auth.token,
      );
      widget.onAdd(prod);
      if (mounted) {
        setState(() {
          _submitting = false;
          _showForm = false;
          _cropCtrl.clear();
          _qtyCtrl.clear();
          _priceCtrl.clear();
          _notesCtrl.clear();
          _locationCtrl.clear();
          _farmerCtrl.clear();
          _harvestDate = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.isFr
                  ? '✅ Production enregistrée !'
                  : '✅ Production logged!',
            ),
            backgroundColor: const Color(0xFF4CAF50),
          ),
        );
      }
    } catch (_) {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        if (!_showForm)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.add_circle_outline),
              label: Text(
                isFr ? 'Enregistrer une production' : 'Log New Production',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              onPressed: () => setState(() => _showForm = true),
            ),
          ),
        if (_showForm) ...[
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: _text),
                onPressed: () => setState(() => _showForm = false),
              ),
              Text(
                isFr ? 'Nouvelle production' : 'New Production',
                style: const TextStyle(
                  color: _text,
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _card(
            children: [
              _sectionLabel(
                isFr ? '🌾 Détails de la récolte' : '🌾 Harvest Details',
              ),
              _lbl(isFr ? 'Type de culture *' : 'Crop Type *'),
              _tf(
                _cropCtrl,
                isFr ? 'Ex: Beurre de karité, Sésame' : 'e.g. Shea Butter, Sesame',
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _lbl(isFr ? 'Quantité *' : 'Quantity *'),
                        _tf(_qtyCtrl, isFr ? 'Ex: 500' : 'e.g. 500',
                            type: TextInputType.number),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 96,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _lbl(isFr ? 'Unité' : 'Unit'),
                        DropdownButtonFormField<String>(
                          value: _unit,
                          isExpanded: true,
                          isDense: true,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text, fontSize: 13),
                          decoration: _dec(''),
                          items: ['kg', 'tonne', 'L', 'sac']
                              .map(
                                (u) => DropdownMenuItem(
                                  value: u,
                                  child: Text(
                                    u,
                                    style: const TextStyle(color: _text),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _unit = v ?? 'kg'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _lbl(isFr ? 'Qualité' : 'Quality'),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          isDense: true,
                          value: _quality,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text),
                          decoration: _dec(''),
                          items: [
                            DropdownMenuItem(
                              value: 'A',
                              child: Text(
                                isFr ? 'A — Premium' : 'A — Premium',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'B',
                              child: Text(
                                isFr ? 'B — Standard' : 'B — Standard',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'C',
                              child: Text(
                                isFr ? 'C — Ordinaire' : 'C — Ordinary',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                          ],
                          onChanged: (v) =>
                              setState(() => _quality = v ?? 'A'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _lbl(isFr ? 'Saison' : 'Season'),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          isDense: true,
                          value: _season,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text),
                          decoration: _dec(''),
                          items: [
                            DropdownMenuItem(
                              value: 'rainy',
                              child: Text(
                                isFr ? 'Pluies' : 'Rainy',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'dry',
                              child: Text(
                                isFr ? 'Sèche' : 'Dry',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                          ],
                          onChanged: (v) =>
                              setState(() => _season = v ?? 'rainy'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _sectionLabel(
                isFr ? '💰 Prix & localisation' : '💰 Price & Location',
              ),
              _lbl(isFr ? 'Prix souhaité (XOF/kg)' : 'Asking Price (XOF/kg)'),
              _tf(_priceCtrl, isFr ? 'Ex: 450' : 'e.g. 450',
                  type: TextInputType.number),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Lieu de production' : 'Production Location'),
              _tf(_locationCtrl,
                  isFr ? 'Ex: Koulikoro, Mali' : 'e.g. Koulikoro, Mali'),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Nom du producteur' : 'Farmer Name'),
              _tf(_farmerCtrl, isFr ? 'Nom du membre' : 'Member name'),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Date de récolte' : 'Harvest Date'),
              InkWell(
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                    builder: (_, child) => Theme(
                      data: ThemeData.dark().copyWith(
                        colorScheme: const ColorScheme.dark(
                          primary: _accent,
                          surface: _surface,
                        ),
                      ),
                      child: child!,
                    ),
                  );
                  if (d != null && mounted) setState(() => _harvestDate = d);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: _bg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.15),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined,
                          color: _muted, size: 18),
                      const SizedBox(width: 10),
                      Text(
                        _harvestDate != null
                            ? '${_harvestDate!.day}/${_harvestDate!.month}/${_harvestDate!.year}'
                            : (isFr ? 'Choisir une date' : 'Choose date'),
                        style: TextStyle(
                          color: _harvestDate != null ? _text : _muted,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Notes (optionnel)' : 'Notes (optional)'),
              _tf(
                _notesCtrl,
                isFr
                    ? 'Informations supplémentaires...'
                    : 'Additional information...',
                maxLines: 3,
              ),
              const SizedBox(height: 20),
              _btn(
                isFr ? 'Enregistrer la production' : 'Submit Production',
                _submitting,
                _submit,
                const Color(0xFF4CAF50),
              ),
            ],
          ),
        ],
        const SizedBox(height: 20),
        Text(
          '${isFr ? 'Productions' : 'Productions'} (${widget.productions.length})',
          style: const TextStyle(
            color: _text,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (widget.productions.isEmpty)
          _empty(
            Icons.inventory_2_outlined,
            isFr ? 'Aucune production enregistrée' : 'No production logged',
            isFr
                ? 'Enregistrez votre première production ci-dessus'
                : 'Log your first production above',
          )
        else
          ...widget.productions.asMap().entries.map((e) {
            final p = e.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [_surface, _surface2]),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: _border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF4CAF50).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.eco,
                        color: Color(0xFF4CAF50), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p['crop'] as String? ?? '—',
                          style: const TextStyle(
                            color: _text,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '${p['quantity']} ${p['unit']} · '
                          '${isFr ? 'Qualité' : 'Grade'} ${p['quality']}',
                          style: const TextStyle(color: _muted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${p['priceXOF'] ?? '—'} XOF/kg',
                        style: const TextStyle(
                          color: _gold,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF4CAF50).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isFr ? 'Déclaré' : 'Logged',
                          style: const TextStyle(
                            color: Color(0xFF4CAF50),
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 3: STATISTICS
// ══════════════════════════════════════════════════════════════
class _StatisticsTab extends StatelessWidget {
  final Map<String, dynamic>? data;
  final List<Map<String, dynamic>> members;
  final List<Map<String, dynamic>> productions;
  final bool isFr;

  const _StatisticsTab({
    required this.data,
    required this.members,
    required this.productions,
    required this.isFr,
  });

  @override
  Widget build(BuildContext context) {
    final totalMembers = members.length;
    final totalProds = productions.length;
    final totalQty = productions.fold<double>(
      0,
      (s, p) =>
          s + (num.tryParse(p['quantity']?.toString() ?? '0') ?? 0).toDouble(),
    );
    final avgPrice = productions.isEmpty
        ? 0.0
        : productions.fold<double>(
                0,
                (s, p) =>
                    s +
                    (num.tryParse(p['priceXOF']?.toString() ?? '0') ?? 0)
                        .toDouble(),
              ) /
            productions.length;

    final crops = <String, double>{};
    for (final p in productions) {
      final c = p['crop'] as String? ?? 'Other';
      crops[c] = (crops[c] ?? 0) +
          (num.tryParse(p['quantity']?.toString() ?? '0') ?? 0).toDouble();
    }

    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        Text(
          isFr ? 'Vue d\'ensemble' : 'Overview',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.5,
          children: [
            _StatCard(
              icon: Icons.groups_outlined,
              color: _accent,
              value: '$totalMembers',
              label: isFr ? 'Membres totaux' : 'Total Members',
            ),
            _StatCard(
              icon: Icons.inventory_2_outlined,
              color: const Color(0xFF4CAF50),
              value: '$totalProds',
              label: isFr ? 'Productions' : 'Productions',
            ),
            _StatCard(
              icon: Icons.scale_outlined,
              color: const Color(0xFF2196F3),
              value: '${totalQty.toStringAsFixed(0)} kg',
              label: isFr ? 'Volume total' : 'Total Volume',
            ),
            _StatCard(
              icon: Icons.monetization_on_outlined,
              color: _gold,
              value: '${avgPrice.toStringAsFixed(0)} XOF',
              label: isFr ? 'Prix moyen/kg' : 'Avg price/kg',
            ),
          ],
        ).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 20),
        Text(
          isFr ? 'Tendances du marché' : 'Market Trends',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        ...[
          {
            'icon': '📈',
            'color': Colors.green,
            'title': isFr
                ? 'Beurre de karité en hausse'
                : 'Shea Butter trending up',
            'body': isFr
                ? 'Le prix du karité a augmenté de 12% ce mois. Opportunité de vente idéale.'
                : 'Shea butter price up 12% this month. Ideal selling opportunity.',
            'badge': '+12%',
          },
          {
            'icon': '🌍',
            'color': const Color(0xFF2196F3),
            'title': isFr ? 'Forte demande UE & Asie' : 'Strong EU & Asia demand',
            'body': isFr
                ? 'Les acheteurs européens et asiatiques cherchent des produits certifiés bio. Votre coopérative est bien positionnée.'
                : 'European and Asian buyers are seeking certified organic products. Your cooperative is well positioned.',
            'badge': 'Trending',
          },
          {
            'icon': '💰',
            'color': _gold,
            'title': isFr
                ? 'Investisseurs diaspora actifs'
                : 'Diaspora investors active',
            'body': isFr
                ? '8 investisseurs de la diaspora cherchent à financer des coopératives comme la vôtre via AfriYield.'
                : '8 diaspora investors are looking to fund cooperatives like yours via AfriYield.',
            'badge': 'New',
          },
        ].map(
          (t) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_surface, _surface2]),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t['icon'] as String, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              t['title'] as String,
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
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: (t['color'] as Color)
                                  .withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              t['badge'] as String,
                              style: TextStyle(
                                color: t['color'] as Color,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        t['body'] as String,
                        style: const TextStyle(
                          color: _muted,
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 300.ms),
        ),
        const SizedBox(height: 20),
        if (crops.isNotEmpty) ...[
          Text(
            isFr ? 'Répartition par culture' : 'Breakdown by Crop',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ...crops.entries.map((e) {
            final pct = totalQty > 0 ? e.value / totalQty : 0.0;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [_surface, _surface2]),
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
                          e.key,
                          style: const TextStyle(
                            color: _text,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Text(
                        '${e.value.toStringAsFixed(0)} kg',
                        style: const TextStyle(
                          color: _gold,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct.toDouble(),
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      color: _accent,
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${(pct * 100).toStringAsFixed(1)}%',
                    style: const TextStyle(color: _muted, fontSize: 10),
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

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  const _StatCard({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [_surface, _surface2]),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const Spacer(),
            Text(
              value,
              style: const TextStyle(
                color: _text,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(label, style: const TextStyle(color: _muted, fontSize: 10)),
          ],
        ),
      );
}

// ══════════════════════════════════════════════════════════════
// TAB 4: ACCOUNT
// ══════════════════════════════════════════════════════════════
class _CoopAccountTab extends StatelessWidget {
  final bool isFr;
  final Function(int) onTabChange;

  const _CoopAccountTab({required this.isFr, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = auth.displayName.isNotEmpty
        ? auth.displayName
        : (isFr ? 'Coopérative' : 'Cooperative');
    final initial = name[0].toUpperCase();

    return ListView(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 100,
      ),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1a3c2e), Color(0xFF1e4d38)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [_accent, Color(0xFF0d7a55)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: _accent.withValues(alpha: 0.4),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    initial,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: _text,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      auth.displayEmail,
                      style: const TextStyle(color: _muted, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: _accent.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _accent.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        isFr ? '🤝 Coopérative' : '🤝 Cooperative Account',
                        style: const TextStyle(
                          color: _accent,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _sec(isFr ? 'NAVIGATION' : 'NAVIGATION', [
          _tile(
            context,
            Icons.home_outlined,
            _accent,
            isFr ? 'Retour au tableau de bord' : 'Back to Dashboard',
            isFr ? 'Vue principale coopérative' : 'Main cooperative view',
            () => onTabChange(0),
          ),
          _tile(
            context,
            Icons.exit_to_app_outlined,
            _muted,
            isFr ? 'Quitter vers l\'accueil' : 'Exit to Main Home',
            isFr ? 'Page principale de la plateforme' : 'Main platform home page',
            () => context.go('/home'),
          ),
        ]),
        const SizedBox(height: 14),
        _sec(isFr ? 'MON PROFIL' : 'MY PROFILE', [
          _tile(
            context,
            Icons.edit_outlined,
            _gold,
            isFr ? 'Modifier le profil' : 'Edit Profile',
            isFr ? 'Nom, région, cultures' : 'Name, region, crops',
            () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => _CoopEditProfileScreen(isFr: isFr),
              ),
            ),
          ),
          _tile(
            context,
            Icons.language_outlined,
            const Color(0xFF9C27B0),
            isFr ? 'Langue' : 'Language',
            'English / Français',
            () => context.push('/profile/language'),
          ),
          _tile(
            context,
            Icons.notifications_outlined,
            const Color(0xFFFF9800),
            isFr ? 'Notifications' : 'Notifications',
            isFr ? 'Gérer les alertes' : 'Manage alerts',
            () => context.push('/profile/notifications'),
          ),
        ]),
        const SizedBox(height: 14),
        _sec(isFr ? 'SÉCURITÉ' : 'SECURITY', [
          _tile(
            context,
            Icons.phone_outlined,
            const Color(0xFF2196F3),
            isFr ? 'Mettre à jour le téléphone' : 'Update Phone',
            isFr ? 'Changer votre numéro' : 'Change your number',
            () => context.push('/profile/change-phone'),
          ),
          _tile(
            context,
            Icons.email_outlined,
            const Color(0xFF2196F3),
            isFr ? 'Mettre à jour l\'email' : 'Update Email',
            isFr ? 'Changer votre adresse email' : 'Change your email',
            () => context.push('/profile/change-email'),
          ),
        ]),
        const SizedBox(height: 14),
        _sec('SUPPORT', [
          _tile(
            context,
            Icons.help_outline,
            const Color(0xFF4CAF50),
            isFr ? 'Centre d\'aide' : 'Help Center',
            isFr ? 'FAQ et guides' : 'FAQs and guides',
            () => context.push('/help'),
          ),
          _tile(
            context,
            Icons.gavel_outlined,
            _muted,
            isFr ? 'Conditions d\'utilisation' : 'Terms of Service',
            isFr ? 'Voir les conditions' : 'View terms',
            () => context.push('/terms?view=1&tab=0'),
          ),
          _tile(
            context,
            Icons.privacy_tip_outlined,
            _muted,
            isFr ? 'Politique de confidentialité' : 'Privacy Policy',
            isFr ? 'Comment nous utilisons vos données' : 'How we use your data',
            () => context.push('/terms?view=1&tab=1'),
          ),
        ]),
        const SizedBox(height: 16),
        Center(
          child: Column(
            children: [
              Text(
                'Sahel AgriConnect v1.1.0',
                style: TextStyle(
                  color: _muted.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '🤝 Ensemble pour l\'agriculture.',
                style: TextStyle(
                  color: _muted.withValues(alpha: 0.25),
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.red.withValues(alpha: 0.5)),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.logout, color: Colors.red, size: 18),
            label: Text(
              isFr ? 'Se déconnecter' : 'Sign Out',
              style: const TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  backgroundColor: _surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  title: Text(
                    isFr ? 'Se déconnecter ?' : 'Sign out?',
                    style: const TextStyle(color: _text),
                  ),
                  content: Text(
                    isFr
                        ? 'Vous serez redirigé vers l\'accueil.'
                        : 'You will be returned to the home screen.',
                    style: const TextStyle(color: _muted),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: Text(
                        isFr ? 'Annuler' : 'Cancel',
                        style: const TextStyle(color: _muted),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: Text(
                        isFr ? 'Se déconnecter' : 'Sign out',
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              );
              if (confirm == true && context.mounted) {
                await context.read<AuthState>().logout();
                if (context.mounted) context.go('/home');
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _sec(String title, List<Widget> items) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              title,
              style: TextStyle(
                color: _muted.withValues(alpha: 0.55),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_surface, _surface2]),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _border),
            ),
            child: Column(
              children: items.asMap().entries.map((e) {
                return Column(
                  children: [
                    e.value,
                    if (e.key < items.length - 1)
                      const Divider(height: 1, color: _border, indent: 56),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      );

  Widget _tile(
    BuildContext ctx,
    IconData icon,
    Color iconColor,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) =>
      ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        leading: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(9),
          ),
          child: Icon(icon, color: iconColor, size: 17),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: _text,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: _muted, fontSize: 12),
        ),
        trailing: Icon(
          Icons.arrow_forward_ios,
          size: 13,
          color: _muted.withValues(alpha: 0.3),
        ),
      );
}

// ══════════════════════════════════════════════════════════════
// EDIT PROFILE
// ══════════════════════════════════════════════════════════════
class _CoopEditProfileScreen extends StatefulWidget {
  final bool isFr;

  const _CoopEditProfileScreen({required this.isFr});

  @override
  State<_CoopEditProfileScreen> createState() => _CoopEditProfileScreenState();
}

class _CoopEditProfileScreenState extends State<_CoopEditProfileScreen> {
  late TextEditingController _nameCtrl;
  late TextEditingController _countryCtrl;
  late TextEditingController _regionCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _focusCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthState>();
    _nameCtrl = TextEditingController(text: auth.displayName);
    _countryCtrl = TextEditingController(text: auth.displayCountry);
    _regionCtrl = TextEditingController();
    _phoneCtrl = TextEditingController(text: auth.displayPhone);
    _focusCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _countryCtrl.dispose();
    _regionCtrl.dispose();
    _phoneCtrl.dispose();
    _focusCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    context.read<AuthState>().updateLocalProfile(
          name: _nameCtrl.text.trim(),
          phone: _phoneCtrl.text.trim(),
          country: _countryCtrl.text.trim(),
        );
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          widget.isFr ? '✅ Profil mis à jour !' : '✅ Profile updated!',
        ),
        backgroundColor: _accent,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a3c2e),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isFr ? 'Modifier le profil' : 'Edit Profile',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          16,
          16,
          16,
          SafeInsets.bottom(context, extra: 100),
        ),
        child: _card(
          children: [
            _sectionLabel(
              isFr ? '🤝 Infos de la coopérative' : '🤝 Cooperative Information',
            ),
            _lbl(isFr ? 'Nom de la coopérative' : 'Cooperative Name'),
            _tf(
              _nameCtrl,
              isFr ? 'Nom de votre coopérative' : 'Your cooperative name',
            ),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Pays' : 'Country'),
            _tf(_countryCtrl, isFr ? 'Votre pays' : 'Your country'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Région' : 'Region'),
            _tf(_regionCtrl, isFr ? 'Ex: Koulikoro' : 'e.g. Koulikoro'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Téléphone' : 'Phone'),
            _tf(_phoneCtrl, '+223 / +33 / +1...', type: TextInputType.phone),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Domaine principal' : 'Main Focus'),
            _tf(
              _focusCtrl,
              isFr ? 'Ex: Karité, Sésame, Céréales' : 'e.g. Shea, Sesame, Cereals',
            ),
            const SizedBox(height: 20),
            _btn(
              isFr ? 'Enregistrer les modifications' : 'Save Changes',
              _saving,
              _save,
              _accent,
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════
Widget _card({required List<Widget> children}) => Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );

Widget _sectionLabel(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        t,
        style: const TextStyle(
          color: _text,
          fontSize: 14,
          fontWeight: FontWeight.w700,
        ),
      ),
    );

Widget _lbl(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        t,
        style: const TextStyle(
          color: _muted,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );

Widget _tf(
  TextEditingController c,
  String hint, {
  TextInputType type = TextInputType.text,
  int maxLines = 1,
}) =>
    TextField(
      controller: c,
      keyboardType: type,
      maxLines: maxLines,
      style: const TextStyle(color: _text, fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: _muted, fontSize: 13),
        filled: true,
        fillColor: _bg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: _accent),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    );

InputDecoration _dec(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: _muted, fontSize: 13),
      filled: true,
      fillColor: _bg,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _accent),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );

Widget _btn(String label, bool loading, VoidCallback onTap, Color color) =>
    SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        onPressed: loading ? null : onTap,
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
      ),
    );

Widget _empty(IconData icon, String title, String subtitle) => Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        children: [
          Icon(icon, color: _muted, size: 48),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: _text,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: _muted, fontSize: 12),
          ),
        ],
      ),
    );
