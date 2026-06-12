import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/auth_state.dart';
import '../core/language_provider.dart';
import '../core/platform_navigation.dart';
import '../core/safe_insets.dart';
import '../core/theme.dart';

class RoleScreen extends StatefulWidget {
  const RoleScreen({super.key, this.initialTab = 0});

  /// 0 = Sign In roles grid, 1 = Discover (prices, coops, crops).
  final int initialTab;

  @override
  State<RoleScreen> createState() => _RoleScreenState();
}

/// Refined dark palette — charcoal base, role accents, minimal green wash.
abstract final class _RolePalette {
  static const bg = Color(0xFF0C0E12);
  static const bgSoft = Color(0xFF12151C);
  static const surface = Color(0xFF181C24);
  static const surfaceHi = Color(0xFF222833);
  static const border = Color(0xFF2E3644);
  static const muted = Color(0xFF8B93A7);
}

class _RoleScreenState extends State<RoleScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';
  bool _searching = false;

  final _prices = [
    {
      'name': 'Shea',
      'price': '450',
      'unit': 'XOF/kg',
      'change': '+12%',
      'up': true,
    },
    {
      'name': 'Sesame',
      'price': '380',
      'unit': 'XOF/kg',
      'change': '+3%',
      'up': true,
    },
    {
      'name': 'Cashew',
      'price': '920',
      'unit': 'XOF/kg',
      'change': '+8%',
      'up': true,
    },
    {
      'name': 'Millet',
      'price': '185',
      'unit': 'XOF/kg',
      'change': '+2%',
      'up': true,
    },
    {
      'name': 'Cotton',
      'price': '265',
      'unit': 'XOF/kg',
      'change': '-1%',
      'up': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    final tab = widget.initialTab.clamp(0, 1);
    _tabCtrl = TabController(length: 2, vsync: this, initialIndex: tab);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  static const roles = [
    _Role(
      emoji: '🌾',
      titleEn: 'Farmer',
      titleFr: 'Agriculteur',
      descEn: 'Declare produce · AI tools · Benefits',
      descFr: 'Déclarer cultures · Outils IA · Avantages',
      route: '/login/farmer',
      authRoute: '/farmer',
      gradStart: Color(0xFF222833),
      gradEnd: Color(0xFF181C24),
      accent: Color(0xFF6B9B4E),
      role: AuthRole.farmer,
    ),
    _Role(
      emoji: '💰',
      titleEn: 'Investor',
      titleFr: 'Investisseur',
      descEn: 'AfriYield Exchange · Returns',
      descFr: 'AfriYield Exchange · Rendements',
      route: '/login/investor',
      authRoute: '/investor',
      gradStart: Color(0xFF1E2838),
      gradEnd: Color(0xFF141A26),
      accent: Color(0xFFD4A84B),
      role: AuthRole.investor,
    ),
    _Role(
      emoji: '🤝',
      titleEn: 'Cooperative',
      titleFr: 'Coopérative',
      descEn: 'Members · Production · Market',
      descFr: 'Membres · Production · Marché',
      route: '/login/cooperative',
      authRoute: '/cooperative',
      gradStart: Color(0xFF1C2620),
      gradEnd: Color(0xFF141A18),
      accent: Color(0xFF3DAA8C),
      role: AuthRole.cooperative,
    ),
    _Role(
      emoji: '🏛️',
      titleEn: 'Government',
      titleFr: 'Gouvernement',
      descEn: 'National data · Policy',
      descFr: 'Données nationales · Politique',
      route: '/login/government',
      authRoute: '/government',
      gradStart: Color(0xFF1A2238),
      gradEnd: Color(0xFF12182A),
      accent: Color(0xFF4A8FD4),
      role: AuthRole.government,
    ),
    _Role(
      emoji: '🌍',
      titleEn: 'NGO / Partner',
      titleFr: 'ONG / Partenaire',
      descEn: 'Programs · Beneficiaries',
      descFr: 'Programmes · Bénéficiaires',
      route: '/login/ngo',
      authRoute: '/ngo',
      gradStart: Color(0xFF1E2428),
      gradEnd: Color(0xFF161A1E),
      accent: Color(0xFF7B8FD4),
      role: AuthRole.ngo,
    ),
    _Role(
      emoji: '⚙️',
      titleEn: 'Processor',
      titleFr: 'Transformateur',
      descEn: 'Supply · Processing · Schedule',
      descFr: 'Approvisionnement · Traitement',
      route: '/login/processor',
      authRoute: '/processor',
      gradStart: Color(0xFF2A2218),
      gradEnd: Color(0xFF1A1510),
      accent: Color(0xFFE8A54B),
      role: AuthRole.processor,
    ),
  ];

  void _handleRoleTap(_Role role, AuthState auth) {
    if (auth.isLoggedIn && auth.role == role.role) {
      context.go(role.authRoute);
    } else if (auth.isLoggedIn) {
      context.go(role.route);
    } else {
      context.go(role.route);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final isFr = lang.isFr;
    final auth = context.watch<AuthState>();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        goPlatformHome(context);
      },
      child: Scaffold(
      backgroundColor: _RolePalette.bg,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  Color(0xFF1A1814),
                  _RolePalette.bgSoft,
                  _RolePalette.bg,
                ],
                stops: [0.0, 0.45, 1.0],
              ),
            ),
          ),
          Positioned(
            top: -60,
            right: -40,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.06),
              ),
            ),
          ),
          Positioned(
            bottom: 120,
            left: -80,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF4A8FD4).withValues(alpha: 0.05),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          _HeaderIconButton(
                            icon: Icons.home_rounded,
                            label: isFr ? 'Accueil' : 'Home',
                            onTap: () => goPlatformHome(context),
                          ),
                          const Spacer(),
                          if (auth.isLoggedIn)
                            _HeaderPill(
                              icon: Icons.dashboard_outlined,
                              label: isFr ? 'Tableau de bord' : 'Dashboard',
                              onTap: () =>
                                  context.go(_getDashboardRoute(auth)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isFr ? 'Bienvenue sur' : 'Welcome to',
                                  style: const TextStyle(
                                    color: _RolePalette.muted,
                                    fontSize: 12,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                                const Text(
                                  'Sahel AgriConnect',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.6,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isFr
                            ? 'Produire ensemble. Vendre plus loin. Gagner plus.'
                            : 'Produce together. Sell further. Earn more.',
                        style: TextStyle(
                          color: AppColors.gold.withValues(alpha: 0.85),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 14),
                      GestureDetector(
                        onTap: () => setState(() => _searching = !_searching),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 11,
                          ),
                          decoration: BoxDecoration(
                            color: _RolePalette.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: _searching
                                  ? AppColors.gold.withValues(alpha: 0.35)
                                  : _RolePalette.border,
                            ),
                          ),
                          child: _searching
                              ? Row(
                                  children: [
                                    const Icon(
                                      Icons.search,
                                      color: AppColors.gold,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: TextField(
                                        controller: _searchCtrl,
                                        autofocus: true,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                        ),
                                        onChanged: (v) =>
                                            setState(() => _searchQuery = v),
                                        decoration: InputDecoration(
                                          hintText: isFr
                                              ? 'Rechercher cultures, coopératives, prix...'
                                              : 'Search crops, cooperatives, prices...',
                                          hintStyle: TextStyle(
                                            color: Colors.white
                                                .withValues(alpha: 0.4),
                                            fontSize: 13,
                                          ),
                                          border: InputBorder.none,
                                          isDense: true,
                                          contentPadding: EdgeInsets.zero,
                                        ),
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () => setState(() {
                                        _searching = false;
                                        _searchQuery = '';
                                        _searchCtrl.clear();
                                      }),
                                      child: const Icon(
                                        Icons.close,
                                        color: Colors.white54,
                                        size: 18,
                                      ),
                                    ),
                                  ],
                                )
                              : Row(
                                  children: [
                                    const Icon(
                                      Icons.search,
                                      color: Colors.white38,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        isFr
                                            ? 'Rechercher cultures, prix, coopératives...'
                                            : 'Search crops, prices, cooperatives...',
                                        style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.38),
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                      if (_searching && _searchQuery.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        _buildSearchResults(isFr),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: _RolePalette.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: _RolePalette.border),
                    ),
                    child: TabBar(
                      controller: _tabCtrl,
                      tabAlignment: TabAlignment.fill,
                      indicatorSize: TabBarIndicatorSize.tab,
                      indicatorPadding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 4,
                      ),
                      labelPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      indicator: BoxDecoration(
                        color: _RolePalette.surfaceHi,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.45),
                        ),
                      ),
                      dividerColor: Colors.transparent,
                      labelColor: AppColors.gold,
                      unselectedLabelColor: _RolePalette.muted,
                      labelStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      unselectedLabelStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      tabs: [
                        Tab(text: isFr ? 'Se connecter' : 'Sign In'),
                        Tab(text: isFr ? 'Découvrir' : 'Discover'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: TabBarView(
                    controller: _tabCtrl,
                    children: [
                      _buildSignInTab(isFr, auth),
                      _buildDiscoverTab(isFr),
                    ],
                  ),
                ),
                Padding(
                  padding: EdgeInsets.only(
                    bottom: SafeInsets.bottom(context, extra: 8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: ['EN', 'FR'].map((l) {
                      final isOn = lang.lang == l.toLowerCase();
                      return GestureDetector(
                        onTap: () => lang.setLang(l.toLowerCase()),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: isOn
                                ? AppColors.gold.withValues(alpha: 0.18)
                                : Colors.white.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isOn
                                  ? AppColors.gold.withValues(alpha: 0.5)
                                  : Colors.white.withValues(alpha: 0.1),
                            ),
                          ),
                          child: Text(
                            l,
                            style: TextStyle(
                              color: isOn
                                  ? AppColors.gold
                                  : Colors.white.withValues(alpha: 0.45),
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
        ],
      ),
    ),
    );
  }

  Widget _buildSignInTab(bool isFr, AuthState auth) {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(12, 0, 12, SafeInsets.bottom(context)),
      physics: const BouncingScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        mainAxisExtent: 108,
      ),
      itemCount: roles.length,
      itemBuilder: (context, i) {
        final role = roles[i];
        final isMyRole = auth.isLoggedIn && auth.role == role.role;
        final title = isFr ? role.titleFr : role.titleEn;
        final desc = isFr ? role.descFr : role.descEn;

        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _handleRoleTap(role, auth),
            borderRadius: BorderRadius.circular(14),
            child: Ink(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [role.gradStart, role.gradEnd],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isMyRole
                      ? role.accent.withValues(alpha: 0.55)
                      : _RolePalette.border,
                  width: isMyRole ? 1.5 : 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 8, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: role.accent.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: role.accent.withValues(alpha: 0.3),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        role.emoji,
                        style: const TextStyle(fontSize: 20, height: 1),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              height: 1.15,
                              letterSpacing: -0.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 3),
                          Text(
                            desc,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.55),
                              fontSize: 9,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (isMyRole) ...[
                            const SizedBox(height: 4),
                            Text(
                              isFr ? '● Connecté' : '● Signed in',
                              style: TextStyle(
                                color: role.accent,
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Container(
                      width: 3,
                      height: 52,
                      margin: const EdgeInsets.only(left: 2, top: 2),
                      decoration: BoxDecoration(
                        color: role.accent,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        )
            .animate(delay: Duration(milliseconds: 50 * i))
            .fadeIn(duration: 250.ms);
      },
    );
  }

  Widget _buildDiscoverTab(bool isFr) {
    return ListView(
      padding: EdgeInsets.fromLTRB(16, 0, 16, SafeInsets.bottom(context, extra: 32)),
      children: [
        Text(
          isFr ? '📈 Prix du marché en direct' : '📈 Live Market Prices',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          isFr
              ? 'Mis à jour quotidiennement · Marchés Afrique de l\'Ouest'
              : 'Updated daily · West African markets',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 80,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemCount: _prices.length,
            itemBuilder: (_, i) {
              final p = _prices[i];
              final up = p['up'] as bool;
              return Container(
                width: 110,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withValues(alpha: 0.08),
                      Colors.white.withValues(alpha: 0.04),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p['name'] as String,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${p['price']} ${p['unit']}',
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Row(
                      children: [
                        Icon(
                          up ? Icons.arrow_upward : Icons.arrow_downward,
                          color: up ? Colors.green : Colors.red,
                          size: 10,
                        ),
                        Text(
                          p['change'] as String,
                          style: TextStyle(
                            color: up ? Colors.green : Colors.red,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isFr ? '🤝 Coopératives en vedette' : '🤝 Featured Cooperatives',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  SizedBox(
                    width: 6,
                    height: 6,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  SizedBox(width: 4),
                  Text(
                    'Live',
                    style: TextStyle(
                      color: Colors.green,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ...[
          {
            'name': 'Coop Karité Ségou',
            'type': isFr ? 'Beurre de karité' : 'Shea Butter',
            'members': '145',
            'region': 'Ségou, Mali',
            'qty': '2,400 kg',
          },
          {
            'name': 'Union Sésame Sikasso',
            'type': isFr ? 'Sésame grade A' : 'Grade A Sesame',
            'members': '87',
            'region': 'Sikasso, Mali',
            'qty': '1,800 kg',
          },
          {
            'name': isFr ? 'Alliance Cajou Mopti' : 'Mopti Cashew Alliance',
            'type': isFr ? 'Noix de cajou' : 'Cashew nuts',
            'members': '198',
            'region': 'Mopti, Mali',
            'qty': '5,200 kg',
          },
        ].map(
          (c) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _RolePalette.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _RolePalette.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF3DAA8C).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.groups_outlined,
                    color: Color(0xFF3DAA8C),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        c['name'] as String,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '${c['type']} · ${c['members']} ${isFr ? 'membres' : 'members'} · ${c['region']}',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isFr ? 'Disponible' : 'Available',
                        style: const TextStyle(
                          color: Colors.green,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      c['qty'] as String,
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          isFr ? '🌿 Cultures tendances' : '🌿 Trending Crops',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1.6,
          children: [
            {
              'emoji': '🌰',
              'name': isFr ? 'Karité' : 'Shea Butter',
              'trend': '+12%',
              'investors': '8',
              'color': const Color(0xFF2d1f00),
              'accent': AppColors.gold,
            },
            {
              'emoji': '🌿',
              'name': isFr ? 'Sésame' : 'Sesame',
              'trend': '+8%',
              'investors': '5',
              'color': const Color(0xFF0a2a25),
              'accent': const Color(0xFF1D9E75),
            },
            {
              'emoji': '🥜',
              'name': isFr ? 'Cajou' : 'Cashew',
              'trend': '+15%',
              'investors': '12',
              'color': const Color(0xFF0d2040),
              'accent': const Color(0xFF185FA5),
            },
            {
              'emoji': '🌾',
              'name': isFr ? 'Mil' : 'Millet',
              'trend': '+3%',
              'investors': '3',
              'color': const Color(0xFF1a1a00),
              'accent': const Color(0xFFF59E0B),
            },
          ]
              .map(
                (c) => Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: c['color'] as Color,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: (c['accent'] as Color).withValues(alpha: 0.25),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            c['emoji'] as String,
                            style: const TextStyle(fontSize: 20),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              c['trend'] as String,
                              style: const TextStyle(
                                color: Colors.green,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Text(
                        c['name'] as String,
                        style: TextStyle(
                          color: c['accent'] as Color,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '${c['investors']} ${isFr ? 'investisseurs actifs' : 'active investors'}',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 9,
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }

  Widget _buildSearchResults(bool isFr) {
    final q = _searchQuery.toLowerCase();
    final allItems = [
      {
        'type': 'crop',
        'name': 'Shea Butter',
        'nameFr': 'Beurre de karité',
        'detail': '450 XOF/kg · +12%',
      },
      {
        'type': 'crop',
        'name': 'Sesame',
        'nameFr': 'Sésame',
        'detail': '380 XOF/kg · +8%',
      },
      {
        'type': 'crop',
        'name': 'Cashew',
        'nameFr': 'Noix de cajou',
        'detail': '920 XOF/kg · +15%',
      },
      {
        'type': 'coop',
        'name': 'Coop Karité Ségou',
        'nameFr': 'Coop Karité Ségou',
        'detail': isFr ? '145 membres · Ségou' : '145 members · Segou',
      },
      {
        'type': 'coop',
        'name': 'Union Sésame Sikasso',
        'nameFr': 'Union Sésame Sikasso',
        'detail': isFr ? '87 membres · Sikasso' : '87 members · Sikasso',
      },
      {
        'type': 'role',
        'name': 'Farmer',
        'nameFr': 'Agriculteur',
        'detail': isFr ? 'Se connecter' : 'Sign in',
      },
      {
        'type': 'role',
        'name': 'Investor',
        'nameFr': 'Investisseur',
        'detail': 'AfriYield Exchange',
      },
    ];

    final results = allItems.where((item) {
      final name = (isFr ? item['nameFr'] : item['name']) ?? '';
      final detail = item['detail'] ?? '';
      return name.toString().toLowerCase().contains(q) ||
          detail.toString().toLowerCase().contains(q);
    }).toList();

    if (results.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          isFr
              ? 'Aucun résultat pour "$_searchQuery"'
              : 'No results for "$_searchQuery"',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 13,
          ),
        ),
      );
    }

    final shown = results.take(5).toList();
    return Container(
      decoration: BoxDecoration(
        color: _RolePalette.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _RolePalette.border),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < shown.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                color: Colors.white.withValues(alpha: 0.06),
              ),
            _searchResultTile(shown[i], isFr),
          ],
        ],
      ),
    );
  }

  Widget _searchResultTile(Map<String, String> item, bool isFr) {
    final typeIcon = item['type'] == 'crop'
        ? Icons.eco_outlined
        : item['type'] == 'coop'
            ? Icons.groups_outlined
            : Icons.person_outline;
    final typeColor = item['type'] == 'crop'
        ? const Color(0xFF1D9E75)
        : item['type'] == 'coop'
            ? const Color(0xFF185FA5)
            : AppColors.gold;

    return ListTile(
      dense: true,
      leading: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: typeColor.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(typeIcon, color: typeColor, size: 16),
      ),
      title: Text(
        isFr ? item['nameFr']! : item['name']!,
        style: const TextStyle(color: Colors.white, fontSize: 13),
      ),
      subtitle: Text(
        item['detail']!,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.45),
          fontSize: 11,
        ),
      ),
      onTap: () {
        if (item['type'] == 'role') {
          final match = roles.where(
            (r) =>
                r.titleEn.toLowerCase() == item['name']!.toLowerCase() ||
                r.titleFr.toLowerCase() == item['nameFr']!.toLowerCase(),
          );
          if (match.isNotEmpty) {
            _handleRoleTap(match.first, context.read<AuthState>());
          }
        }
        setState(() {
          _searching = false;
          _searchQuery = '';
          _searchCtrl.clear();
        });
      },
    );
  }

  String _getDashboardRoute(AuthState auth) {
    switch (auth.role) {
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
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: _RolePalette.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _RolePalette.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: AppColors.gold, size: 18),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderPill extends StatelessWidget {
  const _HeaderPill({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.gold, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Role {
  final String emoji;
  final String titleEn;
  final String titleFr;
  final String descEn;
  final String descFr;
  final String route;
  final String authRoute;
  final Color gradStart;
  final Color gradEnd;
  final Color accent;
  final AuthRole role;

  const _Role({
    required this.emoji,
    required this.titleEn,
    required this.titleFr,
    required this.descEn,
    required this.descFr,
    required this.route,
    required this.authRoute,
    required this.gradStart,
    required this.gradEnd,
    required this.accent,
    required this.role,
  });
}
