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

class CooperativeDashboard extends StatefulWidget {
  const CooperativeDashboard({super.key});

  @override
  State<CooperativeDashboard> createState() => _CooperativeDashboardState();
}

class _CooperativeDashboardState extends State<CooperativeDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _data;
  bool _loading = true;

  static const _bg = Color(0xFF0f1a2e);
  static const _headerStart = Color(0xFF1a3a2a);
  static const _headerEnd = Color(0xFF1e4d35);
  static const _accent = Color(0xFF1D9E75);
  static const _cardStart = Color(0xFF1a3530);
  static const _cardEnd = Color(0xFF122820);

  bool get _isPortal => _data?.containsKey('memberFarmers') ?? false;

  Map<String, dynamic> get _stats {
    final s = _data?['stats'];
    if (s is Map) return Map<String, dynamic>.from(s);
    return {};
  }

  List<Map<String, dynamic>> get _members {
    final raw = _data?['memberFarmers'];
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  List<Map<String, dynamic>> get _listings {
    final raw = _data?['produceListings'];
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  String get _memberCountStr {
    if (_isPortal) {
      return '${_stats['memberCount'] ?? _members.length}';
    }
    return '${_data?['totalMembers'] ?? _data?['total'] ?? '—'}';
  }

  String get _productionStr {
    if (_isPortal) {
      final kg = _listings.fold<double>(
        0,
        (s, l) => s + (num.tryParse(l['quantityKg']?.toString() ?? '0') ?? 0),
      );
      if (kg > 0) return '${kg.round()} kg';
      final ha = _stats['totalAreaHa'];
      if (ha != null) return '$ha ha';
      return '—';
    }
    return '—';
  }

  String get _activeStr {
    if (_isPortal) {
      final active = _members
          .where(
            (m) =>
                '${m['statut']}'.toLowerCase().contains('actif') ||
                '${m['statut']}'.toLowerCase().contains('active'),
          )
          .length;
      return '$active';
    }
    return '${_data?['active'] ?? '—'}';
  }

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
        res = await ApiService.getCoopPortal(
          token,
          country:
              auth.displayCountry.isNotEmpty ? auth.displayCountry : null,
        );
      } else {
        res = await ApiService.getCoopPublicStats();
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

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();
    final coopName = auth.displayName.isNotEmpty
        ? auth.displayName
        : lp.t('Your Cooperative', 'Votre coopérative');

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
                    top: -40,
                    right: -40,
                    child: Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _accent.withValues(alpha: 0.06),
                      ),
                    ),
                  ),
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                lp.t(
                                  'Cooperative Management',
                                  'Gestion coopérative',
                                ),
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
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              _statCard(
                                lp.t('Members', 'Membres'),
                                _loading ? '…' : _memberCountStr,
                                Icons.groups_outlined,
                              ),
                              const SizedBox(width: 10),
                              _statCard(
                                lp.t('Production', 'Production'),
                                _loading ? '…' : _productionStr,
                                Icons.agriculture_outlined,
                              ),
                              const SizedBox(width: 10),
                              _statCard(
                                lp.t('Active', 'Actifs'),
                                _loading ? '…' : _activeStr,
                                Icons.check_circle_outline,
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
                          _CoopHomeTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            isPortal: _isPortal,
                            memberCount: _memberCountStr,
                            pendingListings:
                                '${_stats['pendingListings'] ?? 0}',
                            onTabChange: (i) => setState(() => _tab = i),
                          ),
                          _MembersTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            members: _members,
                            isPortal: _isPortal,
                          ),
                          _ProductionTab(
                            listings: _listings,
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            isPortal: _isPortal,
                          ),
                          _UpdatesTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            projects: _listOfMaps('nationalProjects'),
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
            color: const Color(0xFF0d1825),
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

  Widget _statCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.white.withValues(alpha: 0.12),
              Colors.white.withValues(alpha: 0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: Column(
          children: [
            Icon(icon, color: _accent, size: 18),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _listOfMaps(String key) {
    final raw = _data?[key];
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }
}

class _CoopHomeTab extends StatelessWidget {
  const _CoopHomeTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.isPortal,
    required this.memberCount,
    required this.pendingListings,
    required this.onTabChange,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final bool isPortal;
  final String memberCount;
  final String pendingListings;
  final ValueChanged<int> onTabChange;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [cardStart, cardEnd]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                lp.t(
                  '🤝 Welcome to your Cooperative',
                  '🤝 Bienvenue dans votre coopérative',
                ),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isPortal
                    ? lp.t(
                        'You have $memberCount linked members and '
                            '$pendingListings listings awaiting approval.',
                        'Vous avez $memberCount membres liés et '
                            '$pendingListings annonces en attente d\'approbation.',
                      )
                    : lp.t(
                        'Manage your members, track production, '
                            'and connect with buyers and investors.',
                        'Gérez vos membres, suivez la production '
                            'et connectez-vous aux acheteurs et investisseurs.',
                      ),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          lp.t('Quick Actions', 'Actions rapides'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.4,
          children: [
            _QuickAction(
              icon: '👥',
              title: lp.t('Add Member', 'Ajouter un membre'),
              color: accent,
              onTap: () => onTabChange(1),
            ),
            _QuickAction(
              icon: '🌾',
              title: lp.t('Log Production', 'Enregistrer la production'),
              color: const Color(0xFF4CAF50),
              onTap: () => onTabChange(2),
            ),
            _QuickAction(
              icon: '📊',
              title: lp.t('View Stats', 'Voir les statistiques'),
              color: const Color(0xFF2196F3),
              onTap: () => onTabChange(2),
            ),
            _QuickAction(
              icon: '📢',
              title: lp.t('Updates', 'Mises à jour'),
              color: const Color(0xFFF59E0B),
              onTap: () => onTabChange(3),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          lp.t('Current Market Prices', 'Prix du marché actuels'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ...[
          {
            'crop': lp.t('🌾 Shea Butter', '🌾 Beurre de karité'),
            'price': '450 XOF/kg',
            'trend': '+12%',
          },
          {
            'crop': lp.t('🌿 Sesame', '🌿 Sésame'),
            'price': '380 XOF/kg',
            'trend': '+3%',
          },
          {
            'crop': lp.t('🥜 Cashew', '🥜 Cajou'),
            'price': '920 XOF/kg',
            'trend': '+8%',
          },
        ].map(
          (item) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cardStart, cardEnd]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Row(
              children: [
                Text(
                  item['crop']!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Text(
                  item['price']!,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    item['trend']!,
                    style: const TextStyle(
                      color: Colors.green,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
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

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  final String icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const Spacer(),
            Text(
              title,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MembersTab extends StatelessWidget {
  const _MembersTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.members,
    required this.isPortal,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<Map<String, dynamic>> members;
  final bool isPortal;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: accent,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.person_add_outlined),
            label: Text(
              lp.t('Add New Member', 'Ajouter un membre'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: () {
              showModalBottomSheet<void>(
                context: context,
                backgroundColor: const Color(0xFF1a3530),
                isScrollControlled: true,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                builder: (_) => _AddMemberSheet(accent: accent),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        if (!isPortal)
          _emptyCard(
            Icons.lock_outline,
            lp.t('Sign in required', 'Connexion requise'),
            lp.t(
              'Sign in with your cooperative account to view members.',
              'Connectez-vous avec votre compte coopérative pour voir les membres.',
            ),
          )
        else if (members.isEmpty)
          _emptyCard(
            Icons.groups_outlined,
            lp.t('No members yet', 'Aucun membre pour l\'instant'),
            lp.t(
              'Add your first cooperative member\nto start managing your group.',
              'Ajoutez votre premier membre coopératif\npour commencer à gérer votre groupe.',
            ),
          )
        else
          ...members.map((m) {
            final name = m['nom']?.toString() ?? lp.t('Member', 'Membre');
            final region = m['region']?.toString() ?? '';
            final cultures = (m['cultures'] as List?)?.join(', ') ?? '';
            final statut = m['statut']?.toString() ?? '';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [cardStart, cardEnd]),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: accent.withValues(alpha: 0.2),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
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
                        if (cultures.isNotEmpty)
                          Text(
                            cultures,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.55),
                              fontSize: 12,
                            ),
                          ),
                        if (region.isNotEmpty)
                          Text(
                            region,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.4),
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (statut.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statut,
                        style: TextStyle(
                          color: accent,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _emptyCard(IconData icon, String title, String body) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [cardStart, cardEnd]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white.withValues(alpha: 0.4), size: 48),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 13,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _AddMemberSheet extends StatelessWidget {
  const _AddMemberSheet({required this.accent});

  final Color accent;

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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            lp.t('Add New Member', 'Ajouter un membre'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: lp.t('Member Name', 'Nom du membre'),
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.2),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: accent),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            style: const TextStyle(color: Colors.white),
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: lp.t('Phone Number', 'Numéro de téléphone'),
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.2),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: accent),
              ),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: accent,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      lp.t(
                        'Member invitations are sent from the cooperative portal.',
                        'Les invitations membres sont envoyées depuis le portail coopérative.',
                      ),
                    ),
                  ),
                );
              },
              child: Text(
                lp.t('Add Member', 'Ajouter'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductionTab extends StatelessWidget {
  const _ProductionTab({
    required this.listings,
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.isPortal,
  });

  final List<Map<String, dynamic>> listings;
  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final bool isPortal;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
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
              lp.t('Log New Production', 'Enregistrer une production'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: () {
              showModalBottomSheet<void>(
                context: context,
                backgroundColor: const Color(0xFF1a3530),
                isScrollControlled: true,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                builder: (_) => _LogProductionSheet(accent: accent),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        if (!isPortal)
          _productionEmpty(
            Icons.lock_outline,
            lp.t('Sign in required', 'Connexion requise'),
            lp.t(
              'Sign in to view and approve member produce listings.',
              'Connectez-vous pour voir et approuver les annonces de production des membres.',
            ),
          )
        else if (listings.isEmpty)
          _productionEmpty(
            Icons.agriculture_outlined,
            lp.t('No production logged yet', 'Aucune production enregistrée'),
            lp.t(
              'Log your cooperative\'s produce to connect with buyers.',
              'Enregistrez la production de votre coopérative pour vous connecter aux acheteurs.',
            ),
          )
        else
          ...listings.map((l) {
            final crop = l['cropType']?.toString() ??
                l['commodity']?.toString() ??
                lp.t('Produce', 'Produit');
            final qty = l['quantityKg']?.toString() ?? '—';
            final status = l['status']?.toString() ?? '';
            final approved = l['cooperativeApproved'] == true;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [cardStart, cardEnd]),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  Icon(Icons.inventory_2_outlined, color: accent, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          crop,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '$qty kg',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 12,
                          ),
                        ),
                        if (status.isNotEmpty)
                          Text(
                            status,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.4),
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: (approved ? Colors.green : Colors.orange)
                          .withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      approved
                          ? lp.t('Approved', 'Approuvé')
                          : lp.t('Pending', 'En attente'),
                      style: TextStyle(
                        color: approved ? Colors.green : Colors.orange,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _productionEmpty(IconData icon, String title, String body) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [cardStart, cardEnd]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white.withValues(alpha: 0.4), size: 48),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 13,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _LogProductionSheet extends StatelessWidget {
  const _LogProductionSheet({required this.accent});

  final Color accent;

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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            lp.t('Log Production', 'Enregistrer la production'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: lp.t(
                'Crop Type (e.g. Shea Butter)',
                'Type de culture (ex. beurre de karité)',
              ),
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.2),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: accent),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            style: const TextStyle(color: Colors.white),
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: lp.t('Quantity (kg)', 'Quantité (kg)'),
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.2),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: accent),
              ),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      lp.t(
                        'Production logging syncs with member farmer listings.',
                        'L\'enregistrement de production se synchronise avec les annonces des agriculteurs membres.',
                      ),
                    ),
                  ),
                );
              },
              child: Text(
                lp.t('Submit', 'Envoyer'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UpdatesTab extends StatelessWidget {
  const _UpdatesTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.projects,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<Map<String, dynamic>> projects;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    if (projects.isNotEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            lp.t('National programs', 'Programmes nationaux'),
            style: TextStyle(
              color: accent,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ...projects.map((p) {
            final title = lp.isFr
                ? (p['titleFr']?.toString() ??
                    p['title']?.toString() ??
                    lp.t('Program', 'Programme'))
                : (p['title']?.toString() ??
                    p['titleFr']?.toString() ??
                    lp.t('Program', 'Programme'));
            final desc = lp.isFr
                ? (p['descriptionFr']?.toString() ??
                    p['description']?.toString() ??
                    '')
                : (p['description']?.toString() ??
                    p['descriptionFr']?.toString() ??
                    '');
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _updateCard(
                title,
                desc.isEmpty
                    ? lp.t(
                        'Active national program for cooperatives.',
                        'Programme national actif pour les coopératives.',
                      )
                    : desc,
                lp.t('Program', 'Programme'),
                accent,
                cardStart,
                cardEnd,
              ),
            );
          }),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        _updateCard(
          lp.t(
            '📈 Shea Butter Prices Up 12%',
            '📈 Prix du beurre de karité en hausse de 12 %',
          ),
          lp.t(
            'High demand in EU markets. Good time to connect with buyers.',
            'Forte demande sur les marchés européens. Bon moment pour contacter les acheteurs.',
          ),
          lp.t('Today', 'Aujourd\'hui'),
          Colors.green,
          cardStart,
          cardEnd,
        ),
        const SizedBox(height: 10),
        _updateCard(
          lp.t(
            '🤝 New Cooperative Feature',
            '🤝 Nouvelle fonctionnalité coopérative',
          ),
          lp.t(
            'You can now add members directly from the app. Tap Members tab.',
            'Vous pouvez maintenant ajouter des membres depuis l\'application. Appuyez sur l\'onglet Membres.',
          ),
          lp.t('This week', 'Cette semaine'),
          accent,
          cardStart,
          cardEnd,
        ),
        const SizedBox(height: 10),
        _updateCard(
          lp.t(
            '🌾 Sesame Season Starting',
            '🌾 Début de la saison du sésame',
          ),
          lp.t(
            'Sesame harvest season begins. Declare your production early.',
            'La saison de récolte du sésame commence. Déclarez votre production tôt.',
          ),
          lp.t('2 days ago', 'Il y a 2 jours'),
          const Color(0xFFF59E0B),
          cardStart,
          cardEnd,
        ),
      ],
    );
  }

  Widget _updateCard(
    String title,
    String body,
    String time,
    Color color,
    Color start,
    Color end,
  ) {
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
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  time,
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
            lp.t('Update email', 'Modifier l\'e-mail'),
            lp.t('Change cooperative email', 'Changer l\'e-mail de la coopérative'),
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
              'Permanently remove cooperative data',
              'Supprimer définitivement les données de la coopérative',
            ),
            () => context.go('/profile/delete-account'),
          ),
        ]),
        const SizedBox(height: 16),
        _section(lp.t('Support', 'Support'), [
          _tile(
            context,
            Icons.help_outline,
            const Color(0xFF4CAF50),
            lp.t('Help Center', 'Centre d\'aide'),
            lp.t('FAQs and guides', 'FAQ et guides'),
            () => context.go('/help'),
          ),
          _tile(
            context,
            Icons.policy_outlined,
            Colors.white54,
            lp.t('Terms of Service', 'Conditions d\'utilisation'),
            lp.t('View terms', 'Voir les conditions'),
            () => context.push('/terms?view=1'),
          ),
          _tile(
            context,
            Icons.privacy_tip_outlined,
            Colors.white54,
            lp.t('Privacy Policy', 'Politique de confidentialité'),
            lp.t('View privacy', 'Voir la confidentialité'),
            () => context.push('/terms?view=1'),
          ),
        ]),
        const DashboardSignOutButton(
          dialogBackground: Color(0xFF0f1a2e),
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
                      color: Colors.white.withValues(alpha: 0.06),
                      indent: 56,
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
