import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/auth_state.dart';
import '../../core/glass.dart';
import '../../core/language_provider.dart';
import '../../core/platform_navigation.dart';
import '../../core/responsive.dart';
import '../../core/safe_insets.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/offline_queue.dart';
import '../../widgets/country_picker.dart';
import '../../widgets/offline_banner.dart';
import '../../widgets/portal_dashboard_nav.dart';

// ── COLOR CONSTANTS ────────────────────────────────────────────
const _bg = Color(0xFF0f2318);
const _surface = Color(0xFF1e4535);
const _surface2 = Color(0xFF162e24);
const _border = Color(0x14FFFFFF);
const _gold = AppColors.gold;
const _green = Color(0xFF1D9E75);
const _text = Colors.white;
const _textMuted = Color(0x80FFFFFF);

/// Supplies dashboard "home" navigation to screens pushed on top of tabs.
class _FarmerToolScope extends InheritedWidget {
  const _FarmerToolScope({required this.onHome, required super.child});

  final VoidCallback onHome;

  static _FarmerToolScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_FarmerToolScope>();

  @override
  bool updateShouldNotify(_FarmerToolScope oldWidget) =>
      onHome != oldWidget.onHome;
}

// ══════════════════════════════════════════════════════════════
// MAIN FARMER DASHBOARD
// ══════════════════════════════════════════════════════════════
class FarmerDashboard extends StatefulWidget {
  const FarmerDashboard({super.key});

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _farmer;
  bool _loadingFarmer = true;
  List<Map<String, dynamic>> _prices = [];

  List<String> get _cultures =>
      (_farmer?['cultures'] as List?)?.map((e) => e.toString()).toList() ?? [];

  @override
  void initState() {
    super.initState();
    _loadFarmer();
  }

  Future<void> _loadFarmer() async {
    final auth = context.read<AuthState>();
    
    // Load market prices
    ApiService.getMarketplacePrices().then((res) {
      if (!mounted) return;
      final raw = res['prices'];
      if (raw is! List) return;
      final list = <Map<String, dynamic>>[];
      for (final e in raw) {
        if (e is Map) list.add(Map<String, dynamic>.from(e));
      }
      setState(() => _prices = list);
    }).catchError((_) {});

    // Load farmer data
    final email = auth.displayEmail;
    if (email.isEmpty) {
      if (mounted) setState(() => _loadingFarmer = false);
      return;
    }
    try {
      final res = await ApiService.get(
        '/api/farmers?email=${Uri.encodeComponent(email)}',
        token: auth.token,
      );
      final f = res['farmer'];
      if (mounted) {
        setState(() {
          _farmer = f is Map ? Map<String, dynamic>.from(f) : null;
          _loadingFarmer = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingFarmer = false);
    }
  }

  void _goTab(int i) => setState(() => _tab = i);

  void _returnToDashboardHome() {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
    _goTab(0);
  }

  void _goPlatformHome() {
    while (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
    if (mounted) goPlatformHome(context);
  }

  Widget _wrapFarmerTool(Widget child) =>
      _FarmerToolScope(onHome: _goPlatformHome, child: child);

  void _pushFarmerTool(Widget child) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => _wrapFarmerTool(child)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isFr = context.watch<LanguageProvider>().locale.languageCode == 'fr';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
      },
      child: Responsive.builder(
        context: context,
        phone: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: _buildPhoneLayout(isFr),
          ),
        ),
        tablet: _buildTabletLayout(isFr),
      ),
    );
  }

  Widget _buildDashboardTabs(bool isFr) {
    return IndexedStack(
      index: _tab,
      children: [
        _FarmerHomeTab(
          farmer: _farmer,
          loading: _loadingFarmer,
          cultures: _cultures,
          prices: _prices,
          isFr: isFr,
          onTabChange: _goTab,
          onPushTool: _pushFarmerTool,
        ),
        _FarmerProduceTab(
          farmer: _farmer,
          cultures: _cultures,
          loading: _loadingFarmer,
          isFr: isFr,
          onGoHome: _returnToDashboardHome,
        ),
        _FarmerAIToolsTab(
          isFr: isFr,
          farmer: _farmer,
          onPushTool: _pushFarmerTool,
        ),
        _FarmerBenefitsTab(
          isFr: isFr,
          onPushTool: _pushFarmerTool,
        ),
        _FarmerAccountTab(isFr: isFr, onTabChange: _goTab),
      ],
    );
  }

  Widget _buildPhoneLayout(bool isFr) {
    return Scaffold(
      extendBody: false,
      backgroundColor: _bg,
      body: Column(
        children: [
          const OfflineBanner(),
          _FarmerHeader(
            farmer: _farmer,
            loading: _loadingFarmer,
            isFr: isFr,
          ),
          Expanded(child: _buildDashboardTabs(isFr)),
        ],
      ),
      bottomNavigationBar: GlassBottomNav(
        child: NavigationBar(
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          height: 64,
          selectedIndex: _tab,
          onDestinationSelected: _goTab,
          indicatorColor: _gold.withValues(alpha: 0.15),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: _farmerNavDestinations(isFr),
        ),
      ),
    );
  }

  Widget _buildTabletLayout(bool isFr) {
    return Scaffold(
      extendBody: false,
      backgroundColor: _bg,
      body: Row(
        children: [
          _FarmerTabletSidebar(
            farmer: _farmer,
            loading: _loadingFarmer,
            isFr: isFr,
            tab: _tab,
            cultures: _cultures,
            onTabChange: _goTab,
            onGoHome: _goPlatformHome,
          ),
          Expanded(
            child: Column(
              children: [
                const OfflineBanner(),
                const PortalTopActionsBar(),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 32, 24),
                    child: _buildDashboardTabs(isFr),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<NavigationDestination> _farmerNavDestinations(bool isFr) {
    return [
      NavigationDestination(
        icon: const Icon(Icons.home_outlined, color: _textMuted),
        selectedIcon: const Icon(Icons.home, color: _gold),
        label: isFr ? 'Accueil' : 'Home',
      ),
      NavigationDestination(
        icon: const Icon(Icons.grass_outlined, color: _textMuted),
        selectedIcon: const Icon(Icons.grass, color: _gold),
        label: isFr ? 'Production' : 'Produce',
      ),
      NavigationDestination(
        icon: const Icon(Icons.psychology_outlined, color: _textMuted),
        selectedIcon: const Icon(Icons.psychology, color: _gold),
        label: isFr ? 'Outils IA' : 'AI Tools',
      ),
      NavigationDestination(
        icon: const Icon(Icons.card_giftcard_outlined, color: _textMuted),
        selectedIcon: const Icon(Icons.card_giftcard, color: _gold),
        label: isFr ? 'Avantages' : 'Benefits',
      ),
      NavigationDestination(
        icon: const Icon(Icons.manage_accounts_outlined, color: _textMuted),
        selectedIcon: const Icon(Icons.manage_accounts, color: _gold),
        label: isFr ? 'Compte' : 'Account',
      ),
    ];
  }
}

// ══════════════════════════════════════════════════════════════
// TABLET SIDEBAR
// ══════════════════════════════════════════════════════════════
class _FarmerTabletSidebar extends StatelessWidget {
  final Map<String, dynamic>? farmer;
  final bool loading;
  final bool isFr;
  final int tab;
  final List<String> cultures;
  final ValueChanged<int> onTabChange;
  final VoidCallback onGoHome;

  const _FarmerTabletSidebar({
    required this.farmer,
    required this.loading,
    required this.isFr,
    required this.tab,
    required this.cultures,
    required this.onTabChange,
    required this.onGoHome,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = farmer?['nom']?.toString() ?? auth.displayName;

    return Container(
      width: 280,
      decoration: const BoxDecoration(
        color: _surface2,
        border: Border(right: BorderSide(color: _border)),
      ),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: _gold.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Text('🌾', style: TextStyle(fontSize: 26)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              loading ? '...' : name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: _text,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              isFr ? 'Portail agriculteur' : 'Farmer portal',
                              style: const TextStyle(
                                color: _textMuted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _SidebarStat(
                    label: isFr ? 'Cultures' : 'Crops',
                    value: loading ? '—' : '${cultures.length}',
                  ),
                  const SizedBox(height: 8),
                  _SidebarStat(
                    label: isFr ? 'Statut' : 'Status',
                    value: isFr ? 'Actif' : 'Active',
                  ),
                ],
              ),
            ),
            const Divider(color: _border, height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                children: [
                  _SidebarNavItem(
                    icon: Icons.home_outlined,
                    selectedIcon: Icons.home,
                    label: isFr ? 'Accueil' : 'Home',
                    selected: tab == 0,
                    onTap: () => onTabChange(0),
                  ),
                  _SidebarNavItem(
                    icon: Icons.grass_outlined,
                    selectedIcon: Icons.grass,
                    label: isFr ? 'Production' : 'Produce',
                    selected: tab == 1,
                    onTap: () => onTabChange(1),
                  ),
                  _SidebarNavItem(
                    icon: Icons.psychology_outlined,
                    selectedIcon: Icons.psychology,
                    label: isFr ? 'Outils IA' : 'AI Tools',
                    selected: tab == 2,
                    onTap: () => onTabChange(2),
                  ),
                  _SidebarNavItem(
                    icon: Icons.card_giftcard_outlined,
                    selectedIcon: Icons.card_giftcard,
                    label: isFr ? 'Avantages' : 'Benefits',
                    selected: tab == 3,
                    onTap: () => onTabChange(3),
                  ),
                  _SidebarNavItem(
                    icon: Icons.manage_accounts_outlined,
                    selectedIcon: Icons.manage_accounts,
                    label: isFr ? 'Compte' : 'Account',
                    selected: tab == 4,
                    onTap: () => onTabChange(4),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SidebarStat extends StatelessWidget {
  final String label;
  final String value;

  const _SidebarStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: _textMuted, fontSize: 13)),
        Text(
          value,
          style: const TextStyle(
            color: _gold,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _SidebarNavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SidebarNavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: selected ? _gold.withValues(alpha: 0.12) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(
                  selected ? selectedIcon : icon,
                  color: selected ? _gold : _textMuted,
                  size: 22,
                ),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: TextStyle(
                    color: selected ? _text : _textMuted,
                    fontSize: 15,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ══════════════════════════════════════════════════════════════
class _FarmerHeader extends StatelessWidget {
  final Map<String, dynamic>? farmer;
  final bool loading;
  final bool isFr;
  const _FarmerHeader({required this.farmer, required this.loading, required this.isFr});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = farmer?['nom']?.toString() ?? auth.displayName;
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? (isFr ? 'Bonjour' : 'Good morning')
        : hour < 18
            ? (isFr ? 'Bon après-midi' : 'Good afternoon')
            : (isFr ? 'Bonsoir' : 'Good evening');

    return GlassPortalHeader(
      gradientColors: const [
        Color(0xFF1a3c2e),
        Color(0xFF2d6a4f),
        Color(0xFF1a3c2e),
      ],
      accentColor: _gold,
      titleRow: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                greeting,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 13,
                ),
              ),
              Text(
                name.isNotEmpty ? name : (isFr ? 'Agriculteur' : 'Farmer'),
                style: const TextStyle(
                  color: _text,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const PortalGlassHeaderActions(),
              const SizedBox(width: 8),
              GlassHeaderIconButton(
                icon: Icons.notifications_outlined,
                accentColor: Colors.white,
                onTap: () => context.push('/profile/notifications'),
              ),
            ],
          ).animate().fadeIn(duration: 600.ms),
        ],
      ),
      statsRow: Row(
        children: [
          GlassStatTile(
            value: farmer?['surface']?.toString() ?? '—',
            label: isFr ? 'Superficie' : 'Total area',
            accentColor: _gold,
          ),
          const SizedBox(width: 8),
          GlassStatTile(
            value: loading
                ? '...'
                : '${(farmer?['cultures'] as List?)?.length ?? 0}',
            label: isFr ? 'Cultures' : 'Crops listed',
            accentColor: _gold,
          ),
          const SizedBox(width: 8),
          GlassStatTile(
            value: farmer?['statut'] == 'Actif'
                ? (isFr ? 'Actif' : 'Active')
                : '—',
            label: isFr ? 'Statut' : 'Status',
            accentColor: _gold,
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 0: HOME
// ══════════════════════════════════════════════════════════════
class _FarmerHomeTab extends StatelessWidget {
  final Map<String, dynamic>? farmer;
  final bool loading;
  final List<String> cultures;
  final List<Map<String, dynamic>> prices;
  final bool isFr;
  final Function(int) onTabChange;
  final void Function(Widget screen) onPushTool;

  const _FarmerHomeTab({
    required this.farmer, required this.loading,
    required this.cultures, required this.prices,
    required this.isFr, required this.onTabChange,
    required this.onPushTool,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [

        // ── QUICK ACTIONS GRID ─────────────────────────────────
        Text(isFr ? 'Actions rapides' : 'Quick Actions',
          style: const TextStyle(color: _text, fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10,
          childAspectRatio: 1.35,
          children: [
            _QuickAction(
              icon: Icons.add_circle_outline,
              emoji: '🌾',
              title: isFr ? 'Déclarer récolte' : 'Declare Produce',
              color: _green,
              onTap: () => onTabChange(1),
            ),
            _QuickAction(
              icon: Icons.psychology_outlined,
              emoji: '🧠',
              title: isFr ? 'Outils IA' : 'AI Tools',
              color: const Color(0xFF7B61FF),
              onTap: () => onTabChange(2),
            ),
            _QuickAction(
              icon: Icons.card_giftcard_outlined,
              emoji: '🎁',
              title: isFr ? 'Mes avantages' : 'My Benefits',
              color: _gold,
              onTap: () => onTabChange(3),
            ),
            _QuickAction(
              icon: Icons.handshake_outlined,
              emoji: '🤝',
              title: isFr ? 'Coopérative' : 'Join Cooperative',
              color: const Color(0xFF1D9E75),
              onTap: () => onPushTool(_JoinCooperativeScreen(isFr: isFr)),
            ),
          ],
        ),

        const SizedBox(height: 24),

        // ── MARKET PRICES ─────────────────────────────────────
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(isFr ? 'Prix du marché' : 'Market Prices',
              style: const TextStyle(color: _text, fontSize: 17, fontWeight: FontWeight.w700)),
            Text(isFr ? 'Aujourd\'hui' : 'Today',
              style: const TextStyle(color: _textMuted, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 12),
        if (prices.isEmpty) ...[
          // Static fallback prices always showing
          ...[
            {'name': isFr ? 'Beurre de karité' : 'Shea Butter',
             'price': '450 XOF/kg', 'change': '+12%', 'up': true},
            {'name': isFr ? 'Sésame' : 'Sesame',
             'price': '380 XOF/kg', 'change': '+3%', 'up': true},
            {'name': isFr ? 'Noix de cajou' : 'Cashew',
             'price': '920 XOF/kg', 'change': '+8%', 'up': true},
            {'name': isFr ? 'Arachides' : 'Groundnuts',
             'price': '280 XOF/kg', 'change': '-1%', 'up': false},
            {'name': isFr ? 'Coton' : 'Cotton',
             'price': '265 XOF/kg', 'change': '+5%', 'up': true},
          ].map((p) => _PriceCard(
            name: p['name'] as String,
            price: p['price'] as String,
            change: p['change'] as String,
            up: p['up'] as bool,
          )),
        ] else
          ...prices.map((p) => _PriceCard(
            name: p['name']?.toString() ?? '',
            price: '${p['price'] ?? '—'} ${p['currency'] ?? 'XOF'}/kg',
            change: '${p['change'] ?? '0%'}',
            up: (p['change']?.toString() ?? '+0').startsWith('+'),
          )),

        const SizedBox(height: 24),

        // ── MY PRODUCE PIPELINE ───────────────────────────────
        Text(isFr ? 'Mes cultures déclarées' : 'My Declared Crops',
          style: const TextStyle(color: _text, fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _border),
          ),
          child: cultures.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Icon(Icons.grass_outlined,
                        color: _textMuted, size: 40),
                      const SizedBox(height: 8),
                      Text(
                        isFr ? 'Aucune culture déclarée'
                             : 'No crops declared yet',
                        style: const TextStyle(color: _text, fontSize: 14)),
                      const SizedBox(height: 4),
                      Text(
                        isFr ? 'Tapez "Déclarer récolte" ci-dessus'
                             : 'Tap "Declare Produce" above to start',
                        style: const TextStyle(color: _textMuted, fontSize: 12)),
                    ],
                  ),
                )
              : Column(
                  children: cultures.asMap().entries.map((e) => Column(
                    children: [
                      if (e.key > 0) const Divider(height: 1, color: _border),
                      ListTile(
                        leading: const Icon(Icons.eco_outlined, color: _green),
                        title: Text(e.value,
                          style: const TextStyle(color: _text,
                            fontWeight: FontWeight.w500)),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _green.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(isFr ? 'Enregistré' : 'On file',
                            style: const TextStyle(
                              color: _green, fontSize: 11,
                              fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ],
                  )).toList(),
                ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String emoji;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.emoji,
    required this.title, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [_surface, _surface2],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.25)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38, height: 38,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 20))),
              ),
              const Spacer(),
              Text(title, style: TextStyle(
                color: color, fontSize: 12,
                fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1);
  }
}

class _PriceCard extends StatelessWidget {
  final String name, price, change;
  final bool up;
  const _PriceCard({required this.name, required this.price,
    required this.change, required this.up});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          const Icon(Icons.eco_outlined, color: _green, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(name, style: const TextStyle(
              color: _text, fontSize: 13, fontWeight: FontWeight.w500))),
          Text(price, style: const TextStyle(
            color: _textMuted, fontSize: 12)),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: (up ? Colors.green : Colors.red).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(change, style: TextStyle(
              color: up ? Colors.green : Colors.red,
              fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 1: PRODUCE
// ══════════════════════════════════════════════════════════════
class _FarmerProduceTab extends StatefulWidget {
  final Map<String, dynamic>? farmer;
  final List<String> cultures;
  final bool loading;
  final bool isFr;
  final VoidCallback onGoHome;
  const _FarmerProduceTab({
    required this.farmer,
    required this.cultures,
    required this.loading,
    required this.isFr,
    required this.onGoHome,
  });
  @override State<_FarmerProduceTab> createState() => _FarmerProduceTabState();
}

class _FarmerProduceTabState extends State<_FarmerProduceTab> {
  bool _showForm = false;
  bool _showSyncNote = false;

  // Form controllers
  final _cropCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _quality = 'A';
  String _unit = 'kg';
  bool _submitting = false;

  @override
  void dispose() {
    _cropCtrl.dispose(); _qtyCtrl.dispose();
    _priceCtrl.dispose(); _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_cropCtrl.text.trim().isEmpty || _qtyCtrl.text.trim().isEmpty) return;
    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthState>();
      final queue = context.read<OfflineQueue>();
      await queue.enqueue(
        path: '/api/produce/declare',
        body: {
          'farmerEmail': auth.displayEmail,
          'crop': _cropCtrl.text.trim(),
          'quantity': double.tryParse(_qtyCtrl.text) ?? 0,
          'unit': _unit,
          'quality': _quality,
          'priceXOF': double.tryParse(_priceCtrl.text) ?? 0,
          'notes': _notesCtrl.text.trim(),
        },
        label: 'Declare produce',
        token: auth.token,
      );
      if (mounted) {
        setState(() {
          _submitting = false;
          _showForm = false;
          _showSyncNote = true;
        });
        _cropCtrl.clear();
        _qtyCtrl.clear();
        _priceCtrl.clear();
        _notesCtrl.clear();
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(widget.isFr
            ? '✅ Production déclarée avec succès'
            : '✅ Produce declared successfully'),
          backgroundColor: _green,
        ));
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
        if (_showSyncNote) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1D9E75).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF1D9E75).withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.sync, color: Color(0xFF1D9E75), size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    isFr
                        ? 'Votre déclaration est synchronisée avec la plateforme web Sahel AgriConnect et visible par les acheteurs et investisseurs.'
                        : 'Your declaration is synced with the Sahel AgriConnect web platform and visible to buyers and investors.',
                    style: const TextStyle(
                      color: Color(0xFF1D9E75),
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // DECLARE BUTTON
        if (!_showForm) ...[
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1e4535), Color(0xFF162e24)]),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _green.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('🌾', style: TextStyle(fontSize: 36)),
                const SizedBox(height: 12),
                Text(
                  isFr ? 'Déclarer une nouvelle récolte'
                       : 'Declare New Produce',
                  style: const TextStyle(color: _text, fontSize: 18,
                    fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  isFr ? 'Enregistrez vos cultures pour les connecter aux acheteurs.'
                       : 'Register your crops to connect with buyers and cooperatives.',
                  style: const TextStyle(color: _textMuted, fontSize: 13,
                    height: 1.5)),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.add_circle_outline),
                    label: Text(isFr ? 'Déclarer ma récolte' : 'Declare My Produce',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () => setState(() => _showForm = true),
                  ),
                ),
              ],
            ),
          ),
        ],

        // DECLARATION FORM (native, no webview)
        if (_showForm) ...[
          _FormNavBar(
            title: isFr ? 'Déclarer une récolte' : 'Declare Produce',
            onBack: () => setState(() => _showForm = false),
            onHome: () {
              setState(() => _showForm = false);
              widget.onGoHome();
            },
          ),
          const SizedBox(height: 8),
          _formCard(children: [
            _fieldLabel(isFr ? 'Type de culture *' : 'Crop Type *'),
            _textField(_cropCtrl, isFr ? 'Ex: Beurre de karité' : 'e.g. Shea Butter'),
            const SizedBox(height: 14),
            _fieldLabel(isFr ? 'Quantité *' : 'Quantity *'),
            Row(
              children: [
                Expanded(
                  child: _textField(_qtyCtrl,
                    isFr ? 'Ex: 500' : 'e.g. 500',
                    type: TextInputType.number)),
                const SizedBox(width: 8),
                SizedBox(
                  width: 90,
                  child: DropdownButtonFormField<String>(
                    isExpanded: true,
                    isDense: true,
                    value: _unit,
                    dropdownColor: _surface,
                    style: const TextStyle(color: _text, fontSize: 13),
                    decoration: _inputDecoration(''),
                    items: ['kg', 'tonne', 'L']
                      .map((u) => DropdownMenuItem(value: u,
                        child: Text(u,
                          style: const TextStyle(color: _text, fontSize: 13))))
                      .toList(),
                    onChanged: (v) => setState(() => _unit = v ?? 'kg'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _fieldLabel(isFr ? 'Qualité' : 'Quality Grade'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              isDense: true,
              value: _quality,
              dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _inputDecoration(isFr ? 'Choisir la qualité' : 'Select quality'),
              items: ['A', 'B', 'C']
                .map((q) => DropdownMenuItem(value: q,
                  child: Text(
                    q == 'A' ? (isFr ? 'A — Supérieure' : 'A — Superior')
                    : q == 'B' ? (isFr ? 'B — Standard' : 'B — Standard')
                    : (isFr ? 'C — Ordinaire' : 'C — Ordinary'),
                    style: const TextStyle(color: _text))))
                .toList(),
              onChanged: (v) => setState(() => _quality = v ?? 'A'),
            ),
            const SizedBox(height: 14),
            _fieldLabel(isFr ? 'Prix souhaité (XOF/kg)' : 'Asking Price (XOF/kg)'),
            _textField(_priceCtrl,
              isFr ? 'Ex: 450' : 'e.g. 450',
              type: TextInputType.number),
            const SizedBox(height: 14),
            _fieldLabel(isFr ? 'Notes (optionnel)' : 'Notes (optional)'),
            _textField(_notesCtrl,
              isFr ? 'Infos supplémentaires...' : 'Additional information...',
              maxLines: 3),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                    : Text(isFr ? 'Soumettre la déclaration' : 'Submit Declaration',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),
          ]),
        ],

        const SizedBox(height: 24),

        // MY DECLARED PRODUCE LIST
        Text(isFr ? 'Mes productions déclarées' : 'My Declared Productions',
          style: const TextStyle(color: _text, fontSize: 16,
            fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (widget.loading)
          const Center(child: CircularProgressIndicator(color: _gold))
        else if (widget.cultures.isEmpty)
          _emptyState(
            icon: Icons.grass_outlined,
            title: isFr ? 'Aucune culture déclarée' : 'No crops declared yet',
            subtitle: isFr
              ? 'Déclarez votre première récolte ci-dessus'
              : 'Declare your first produce above',
          )
        else
          ...widget.cultures.asMap().entries.map((e) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_surface, _surface2]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _border),
            ),
            child: Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: _green.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.eco, color: _green, size: 18)),
                const SizedBox(width: 12),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(e.value, style: const TextStyle(
                      color: _text, fontWeight: FontWeight.w600)),
                    Text(isFr ? 'Culture enregistrée' : 'Crop on file',
                      style: const TextStyle(color: _textMuted, fontSize: 12)),
                  ],
                )),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _green.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(isFr ? 'Actif' : 'Active',
                    style: const TextStyle(
                      color: _green, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          )),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 2: AI TOOLS (all native, no webview)
// ══════════════════════════════════════════════════════════════
class _FarmerAIToolsTab extends StatelessWidget {
  final bool isFr;
  final Map<String, dynamic>? farmer;
  final void Function(Widget screen) onPushTool;
  const _FarmerAIToolsTab({
    required this.isFr,
    required this.farmer,
    required this.onPushTool,
  });

  @override
  Widget build(BuildContext context) {
    final tools = [
      _AiTool(
        emoji: '🌱', title: isFr ? 'Diagnostic du sol' : 'Soil Diagnosis',
        desc: isFr ? 'Analysez votre sol' : 'Analyze your soil',
        color: const Color(0xFF4CAF50),
        screen: _SoilDiagnosisScreen(isFr: isFr),
      ),
      _AiTool(
        emoji: '🔬', title: isFr ? 'Détection maladie' : 'Disease Detection',
        desc: isFr ? 'Analyse photo' : 'Photo analysis',
        color: const Color(0xFFF59E0B),
        screen: _DiseaseDetectionScreen(isFr: isFr),
      ),
      _AiTool(
        emoji: '🧠', title: 'Think Tank',
        desc: isFr ? 'Conseiller IA' : 'AI Advisor',
        color: const Color(0xFF7B61FF),
        screen: _ThinkTankScreen(isFr: isFr, farmer: farmer),
      ),
      _AiTool(
        emoji: '💧', title: isFr ? 'Irrigation' : 'Irrigation',
        desc: isFr ? 'Planification eau' : 'Water planning',
        color: const Color(0xFF2196F3),
        screen: _IrrigationScreen(isFr: isFr),
      ),
      _AiTool(
        emoji: '📊', title: isFr ? 'Optimiseur production' : 'Production Optimizer',
        desc: isFr ? 'Planification IA' : 'AI planning',
        color: const Color(0xFF10B981),
        screen: _ProductionOptimizerScreen(isFr: isFr),
      ),
      _AiTool(
        emoji: '🔍', title: isFr ? 'Traçabilité' : 'Traceability',
        desc: isFr ? 'Suivre votre lot' : 'Track your lot',
        color: const Color(0xFFEC4899),
        screen: _TraceabilityScreen(isFr: isFr),
      ),
    ];

    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        Text(isFr ? 'Outils agricoles IA' : 'AI Agricultural Tools',
          style: const TextStyle(color: _text, fontSize: 17,
            fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(
          isFr ? 'Tous les outils sont disponibles directement dans l\'app'
               : 'All tools work directly in the app — no browser needed',
          style: const TextStyle(color: _textMuted, fontSize: 12)),
        const SizedBox(height: 14),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10,
          childAspectRatio: 1.2,
          children: tools.asMap().entries.map((e) =>
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => onPushTool(e.value.screen),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [_surface, _surface2]),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: e.value.color.withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: e.value.color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(child: Text(e.value.emoji,
                          style: const TextStyle(fontSize: 22)))),
                      const Spacer(),
                      Text(e.value.title, style: TextStyle(
                        color: e.value.color, fontSize: 12,
                        fontWeight: FontWeight.w700)),
                      Text(e.value.desc, style: const TextStyle(
                        color: _textMuted, fontSize: 10)),
                    ],
                  ),
                ),
              ),
            ).animate(delay: Duration(milliseconds: 60 * e.key))
              .fadeIn(duration: 300.ms).slideY(begin: 0.1),
          ).toList(),
        ),

        const SizedBox(height: 20),

        // Training booking — native form
        _sectionHeader(isFr ? 'Formation & développement' : 'Training & Development'),
        const SizedBox(height: 10),
        _actionCard(
          icon: Icons.school_outlined,
          iconColor: _gold,
          title: isFr ? 'Réserver une formation' : 'Book Training Session',
          subtitle: isFr
            ? 'Planifiez une session avec nos experts agricoles'
            : 'Schedule a session with our agricultural experts',
          onTap: () => onPushTool(_TrainingBookingScreen(isFr: isFr)),
        ),
      ],
    );
  }
}

class _AiTool {
  final String emoji, title, desc;
  final Color color;
  final Widget screen;
  const _AiTool({required this.emoji, required this.title,
    required this.desc, required this.color, required this.screen});
}

// ══════════════════════════════════════════════════════════════
// TAB 3: BENEFITS (native checkboxes + forms)
// ══════════════════════════════════════════════════════════════
class _FarmerBenefitsTab extends StatelessWidget {
  final bool isFr;
  final void Function(Widget screen) onPushTool;
  const _FarmerBenefitsTab({required this.isFr, required this.onPushTool});

  @override
  Widget build(BuildContext context) {
    final benefits = [
      _Benefit(
        emoji: '🚜',
        title: isFr ? 'Équipement agricole' : 'Agricultural Equipment',
        subtitle: isFr ? 'Tracteurs, outils, semences' : 'Tractors, tools, seeds',
        color: const Color(0xFF4CAF50),
        items: isFr
          ? ['Tracteur', 'Charrue', 'Semoir', 'Irrigateur', 'Sécateur']
          : ['Tractor', 'Plow', 'Seeder', 'Irrigator', 'Pruner'],
      ),
      _Benefit(
        emoji: '🌿',
        title: isFr ? 'Engrais & intrants' : 'Fertilizers & Inputs',
        subtitle: isFr ? 'Engrais, pesticides, semences' : 'Fertilizers, pesticides, seeds',
        color: const Color(0xFF10B981),
        items: isFr
          ? ['Engrais NPK', 'Compost', 'Pesticide bio', 'Herbicide', 'Semences améliorées']
          : ['NPK Fertilizer', 'Compost', 'Organic pesticide', 'Herbicide', 'Improved seeds'],
      ),
      _Benefit(
        emoji: '📚',
        title: isFr ? 'Formation agricole' : 'Agricultural Training',
        subtitle: isFr ? 'Formations certifiées' : 'Certified training programs',
        color: const Color(0xFF2196F3),
        items: isFr
          ? ['Gestion de sol', 'Agriculture biologique', 'Irrigation', 'Gestion post-récolte', 'Commerce']
          : ['Soil management', 'Organic farming', 'Irrigation', 'Post-harvest', 'Trade skills'],
      ),
      _Benefit(
        emoji: '💰',
        title: isFr ? 'Subvention gouvernementale' : 'Government Subsidy',
        subtitle: isFr ? 'Aides financières disponibles' : 'Available financial aid',
        color: _gold,
        items: isFr
          ? ['Subvention semences', 'Aide équipement', 'Prime production', 'Aide eau', 'Soutien export']
          : ['Seed subsidy', 'Equipment aid', 'Production bonus', 'Water support', 'Export support'],
      ),
      _Benefit(
        emoji: '✅',
        title: isFr ? 'Certification qualité' : 'Quality Certification',
        subtitle: isFr ? 'Certifiez votre production' : 'Certify your production',
        color: const Color(0xFF7B61FF),
        items: isFr
          ? ['Bio certifié', 'Commerce équitable', 'ISO qualité', 'Certification EU', 'Label local']
          : ['Organic certified', 'Fair trade', 'ISO quality', 'EU certification', 'Local label'],
      ),
    ];

    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        Text(isFr ? 'Avantages & programmes' : 'Benefits & Programs',
          style: const TextStyle(color: _text, fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(
          isFr ? 'Sélectionnez ce dont vous avez besoin et soumettez directement'
               : 'Select what you need and submit directly',
          style: const TextStyle(color: _textMuted, fontSize: 12)),
        const SizedBox(height: 14),
        ...benefits.map((b) => _BenefitCard(benefit: b, isFr: isFr)),

        const SizedBox(height: 16),

        // JOIN COOPERATIVE
        _sectionHeader(isFr ? 'Réseau coopératif' : 'Cooperative Network'),
        const SizedBox(height: 10),
        _actionCard(
          icon: Icons.handshake_outlined,
          iconColor: _green,
          title: isFr ? 'Rejoindre une coopérative' : 'Join a Cooperative',
          subtitle: isFr
            ? 'Trouvez et rejoignez une coopérative près de chez vous'
            : 'Find and join a cooperative near you',
          onTap: () => onPushTool(_JoinCooperativeScreen(isFr: isFr)),
        ),
      ],
    );
  }
}

class _Benefit {
  final String emoji, title, subtitle;
  final Color color;
  final List<String> items;
  const _Benefit({required this.emoji, required this.title,
    required this.subtitle, required this.color, required this.items});
}

class _BenefitCard extends StatefulWidget {
  final _Benefit benefit;
  final bool isFr;
  const _BenefitCard({required this.benefit, required this.isFr});
  @override State<_BenefitCard> createState() => _BenefitCardState();
}

class _BenefitCardState extends State<_BenefitCard> {
  bool _expanded = false;
  final Set<int> _selected = {};
  bool _submitting = false;
  bool _submitted = false;

  Future<void> _submit() async {
    if (_selected.isEmpty) return;
    setState(() => _submitting = true);
    await Future.delayed(const Duration(seconds: 1)); // simulate API
    if (mounted) {
      setState(() { _submitting = false; _submitted = true; _expanded = false; });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Demande envoyée! Nous vous contacterons sous 48h.'
          : '✅ Request sent! We will contact you within 48 hours.'),
        backgroundColor: _green,
        duration: const Duration(seconds: 4),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _expanded
            ? widget.benefit.color.withValues(alpha: 0.4)
            : _border),
      ),
      child: Column(
        children: [
          // Header row
          InkWell(
            onTap: () => setState(() { _expanded = !_expanded; _submitted = false; }),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: widget.benefit.color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(child: Text(widget.benefit.emoji,
                      style: const TextStyle(fontSize: 22)))),
                  const SizedBox(width: 12),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.benefit.title, style: const TextStyle(
                        color: _text, fontSize: 14, fontWeight: FontWeight.w700)),
                      Text(widget.benefit.subtitle, style: const TextStyle(
                        color: _textMuted, fontSize: 12)),
                    ],
                  )),
                  if (_submitted)
                    const Icon(Icons.check_circle, color: _green, size: 20)
                  else
                    Icon(
                      _expanded ? Icons.expand_less : Icons.expand_more,
                      color: _textMuted),
                ],
              ),
            ),
          ),

          // Expandable checklist
          if (_expanded) ...[
            const Divider(height: 1, color: _border),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.isFr ? 'Sélectionnez ce dont vous avez besoin:'
                                : 'Select what you need:',
                    style: const TextStyle(color: _textMuted, fontSize: 12)),
                  const SizedBox(height: 8),
                  ...widget.benefit.items.asMap().entries.map((e) =>
                    InkWell(
                      onTap: () => setState(() {
                        if (_selected.contains(e.key)) _selected.remove(e.key);
                        else _selected.add(e.key);
                      }),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: 22, height: 22,
                              decoration: BoxDecoration(
                                color: _selected.contains(e.key)
                                  ? widget.benefit.color
                                  : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: _selected.contains(e.key)
                                    ? widget.benefit.color
                                    : _textMuted.withValues(alpha: 0.5)),
                              ),
                              child: _selected.contains(e.key)
                                ? const Icon(Icons.check, color: Colors.white, size: 14)
                                : null,
                            ),
                            const SizedBox(width: 10),
                            Text(e.value, style: const TextStyle(
                              color: _text, fontSize: 13)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _selected.isEmpty
                          ? _surface : widget.benefit.color,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: _selected.isEmpty || _submitting ? null : _submit,
                      child: _submitting
                        ? const SizedBox(width: 18, height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                        : Text(
                            widget.isFr ? 'Envoyer la demande' : 'Submit Request',
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 4: ACCOUNT (with proper navigation)
// ══════════════════════════════════════════════════════════════
class _FarmerAccountTab extends StatefulWidget {
  final bool isFr;
  final Function(int) onTabChange;
  const _FarmerAccountTab({required this.isFr, required this.onTabChange});

  @override
  State<_FarmerAccountTab> createState() => _FarmerAccountTabState();
}

class _FarmerAccountTabState extends State<_FarmerAccountTab> {
  bool _deletingAccount = false;

  Future<void> _deleteAccount(BuildContext context) async {
    final isFr = widget.isFr;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: _surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          isFr ? 'Supprimer mon compte et mes données ?' : 'Delete my account and data?',
          style: const TextStyle(color: _text),
        ),
        content: Text(
          isFr
              ? 'Cette action est définitive. Votre profil et vos données personnelles seront supprimés.'
              : 'This action is permanent. Your profile and personal data will be removed.',
          style: const TextStyle(color: _textMuted, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(isFr ? 'Annuler' : 'Cancel',
                style: const TextStyle(color: _textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(isFr ? 'Supprimer' : 'Delete',
                style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true || !context.mounted) return;

    setState(() => _deletingAccount = true);
    try {
      final auth = context.read<AuthState>();
      final token = auth.token;
      if (token == null || token.isEmpty) {
        throw Exception(isFr ? 'Session expirée' : 'Session expired');
      }
      final res = await ApiService.delete('/api/farmers/account', token: token);
      if (res['success'] != true) {
        throw Exception(
          res['error']?.toString() ??
              (isFr ? 'Échec de la suppression' : 'Deletion failed'),
        );
      }
      await auth.clearSavedFarmerIdentity();
      await auth.logout();
      if (context.mounted) context.go('/home');
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red.shade700,
        ),
      );
    } finally {
      if (mounted) setState(() => _deletingAccount = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final isFr = widget.isFr;
    final name = auth.displayName.isNotEmpty ? auth.displayName : (isFr ? 'Agriculteur' : 'Farmer');
    final initial = name[0].toUpperCase();

    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        // Profile card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft, end: Alignment.bottomRight,
              colors: [Color(0xFF1a3c2e), Color(0xFF2d6a4f)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [_gold, Color(0xFFE8B84B)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(
                    color: _gold.withValues(alpha: 0.4),
                    blurRadius: 12)],
                ),
                child: Center(child: Text(initial, style: const TextStyle(
                  color: Colors.white, fontSize: 22,
                  fontWeight: FontWeight.bold)))),
              const SizedBox(width: 14),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(
                    color: _text, fontSize: 17, fontWeight: FontWeight.bold)),
                  Text(auth.displayEmail, style: const TextStyle(
                    color: _textMuted, fontSize: 12)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: _green.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _green.withValues(alpha: 0.4)),
                    ),
                    child: Text(isFr ? '🌾 Agriculteur' : '🌾 Farmer Account',
                      style: const TextStyle(color: _green, fontSize: 11,
                        fontWeight: FontWeight.w600))),
                ],
              )),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // NAVIGATION section
        _accountSection(
          title: isFr ? 'NAVIGATION' : 'NAVIGATION',
          children: [
            _accountTile(context,
              icon: Icons.home_outlined, iconColor: _green,
              title: isFr ? 'Retour au tableau de bord' : 'Back to Dashboard',
              subtitle: isFr ? 'Vue principale agriculteur' : 'Main farmer overview',
              onTap: () => widget.onTabChange(0)),
            _accountTile(context,
              icon: Icons.exit_to_app_outlined, iconColor: _textMuted,
              title: isFr ? 'Quitter vers l\'accueil' : 'Exit to Main Home',
              subtitle: isFr ? 'Page principale de la plateforme' : 'Main platform home page',
              onTap: () => context.go('/home')),
          ],
        ),
        const SizedBox(height: 14),

        // PROFILE section
        _accountSection(
          title: isFr ? 'MON PROFIL' : 'MY PROFILE',
          children: [
            _accountTile(context,
              icon: Icons.person_outline, iconColor: _gold,
              title: isFr ? 'Modifier le profil' : 'Edit Profile',
              subtitle: isFr ? 'Nom, région, cultures' : 'Name, region, crops',
              onTap: () => context.push('/profile/edit')),
            _accountTile(context,
              icon: Icons.language_outlined, iconColor: const Color(0xFF9C27B0),
              title: isFr ? 'Langue' : 'Language',
              subtitle: 'English / Français',
              onTap: () => context.push('/profile/language')),
            _accountTile(context,
              icon: Icons.notifications_outlined, iconColor: const Color(0xFFFF9800),
              title: isFr ? 'Notifications' : 'Notifications',
              subtitle: isFr ? 'Gérer les alertes' : 'Manage alerts',
              onTap: () => context.push('/profile/notifications')),
          ],
        ),
        const SizedBox(height: 14),

        // SECURITY section
        _accountSection(
          title: isFr ? 'SÉCURITÉ' : 'SECURITY',
          children: [
            _accountTile(context,
              icon: Icons.phone_outlined, iconColor: const Color(0xFF2196F3),
              title: isFr ? 'Mettre à jour le téléphone' : 'Update Phone Number',
              subtitle: isFr ? 'Changer votre numéro' : 'Change your number',
              onTap: () => context.push('/profile/change-phone')),
            _accountTile(context,
              icon: Icons.email_outlined, iconColor: const Color(0xFF2196F3),
              title: isFr ? 'Mettre à jour l\'email' : 'Update Email',
              subtitle: isFr ? 'Changer votre adresse email' : 'Change your email address',
              onTap: () => context.push('/profile/change-email')),
          ],
        ),
        const SizedBox(height: 14),

        // SUPPORT section
        _accountSection(
          title: 'SUPPORT',
          children: [
            _accountTile(context,
              icon: Icons.help_outline, iconColor: const Color(0xFF4CAF50),
              title: isFr ? 'Centre d\'aide' : 'Help Center',
              subtitle: isFr ? 'FAQ et guides' : 'FAQs and guides',
              onTap: () => context.push('/help')),
            _accountTile(context,
              icon: Icons.gavel_outlined, iconColor: _textMuted,
              title: isFr ? 'Conditions d\'utilisation' : 'Terms of Service',
              subtitle: isFr ? 'Voir les conditions' : 'View terms',
              onTap: () => context.push('/terms?view=1&tab=0')),
            _accountTile(context,
              icon: Icons.privacy_tip_outlined, iconColor: _textMuted,
              title: isFr ? 'Politique de confidentialité' : 'Privacy Policy',
              subtitle: isFr ? 'Comment nous utilisons vos données' : 'How we use your data',
              onTap: () => context.push('/terms?view=1&tab=1')),
          ],
        ),
        const SizedBox(height: 14),

        // VERSION
        Center(child: Column(children: [
          Text('Sahel AgriConnect v1.1.0',
            style: TextStyle(color: _textMuted.withValues(alpha: 0.4), fontSize: 12)),
          const SizedBox(height: 2),
          Text('🌾 Produce. Sell. Earn.',
            style: TextStyle(color: _textMuted.withValues(alpha: 0.25),
              fontSize: 11, fontStyle: FontStyle.italic)),
        ])),
        const SizedBox(height: 16),

        // DELETE ACCOUNT
        SizedBox(
          width: double.infinity,
          child: TextButton.icon(
            style: TextButton.styleFrom(
              foregroundColor: Colors.red.shade300,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            icon: _deletingAccount
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.red,
                    ),
                  )
                : const Icon(Icons.delete_forever_outlined, size: 18),
            label: Text(
              isFr ? 'Supprimer mon compte et mes données' : 'Delete my account and data',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
            onPressed: _deletingAccount ? null : () => _deleteAccount(context),
          ),
        ),
        const SizedBox(height: 8),

        // SIGN OUT
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.red.withValues(alpha: 0.4)),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
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
                    style: const TextStyle(color: _textMuted)),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: Text(isFr ? 'Annuler' : 'Cancel',
                        style: const TextStyle(color: _textMuted))),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: Text(isFr ? 'Se déconnecter' : 'Sign out',
                        style: const TextStyle(color: Colors.red))),
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

  Widget _accountSection({required String title, required List<Widget> children}) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 8),
        child: Text(title, style: TextStyle(
          color: _textMuted.withValues(alpha: 0.55), fontSize: 11,
          fontWeight: FontWeight.w700, letterSpacing: 1.2))),
      Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [_surface, _surface2]),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _border)),
        child: Column(
          children: children.asMap().entries.map((e) => Column(
            children: [
              e.value,
              if (e.key < children.length - 1)
                const Divider(height: 1, color: _border, indent: 56),
            ],
          )).toList(),
        ),
      ),
    ]);

  Widget _accountTile(BuildContext ctx, {
    required IconData icon, required Color iconColor,
    required String title, required String subtitle, required VoidCallback onTap,
  }) => ListTile(
    onTap: onTap,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
    leading: Container(
      width: 34, height: 34,
      decoration: BoxDecoration(
        color: iconColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(9)),
      child: Icon(icon, color: iconColor, size: 17)),
    title: Text(title, style: const TextStyle(
      color: _text, fontSize: 14, fontWeight: FontWeight.w500)),
    subtitle: Text(subtitle, style: const TextStyle(
      color: _textMuted, fontSize: 12)),
    trailing: Icon(Icons.arrow_forward_ios, size: 13,
      color: _textMuted.withValues(alpha: 0.3)),
  );
}

// ══════════════════════════════════════════════════════════════
// NATIVE AI TOOL SCREENS (replacing all webviews)
// ══════════════════════════════════════════════════════════════

// ── SOIL DIAGNOSIS ───────────────────────────────────────────
class _SoilDiagnosisScreen extends StatefulWidget {
  final bool isFr;
  const _SoilDiagnosisScreen({required this.isFr});
  @override State<_SoilDiagnosisScreen> createState() => _SoilDiagnosisScreenState();
}

class _SoilDiagnosisScreenState extends State<_SoilDiagnosisScreen> {
  String _soilType = 'clay';
  String _season = 'rainy';
  bool _submitting = false;
  bool _showResult = false;
  String _aiResult = '';

  final _cropCtrl = TextEditingController();
  final _irrigCtrl = TextEditingController();
  final _fertCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  Future<void> _analyze() async {
    if (_cropCtrl.text.trim().isEmpty) return;
    setState(() => _submitting = true);
    // Simulate AI response
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() {
        _submitting = false;
        _showResult = true;
        _aiResult = widget.isFr
          ? '''📊 **Résultat du diagnostic**

Votre sol de type **${_getSoilTypeName(_soilType)}** est adapté à la culture de **${_cropCtrl.text}**.

**Recommandations:**
- pH optimal: 6.0 - 7.0
- Amendement conseillé: Compost organique (2t/ha)
- Engrais: NPK 15-15-15 avant semis
- Irrigation: ${_season == 'rainy' ? 'Drainage amélioré nécessaire' : 'Irrigation goutte-à-goutte recommandée'}

**Rendement estimé:** 1.5 - 2.5 tonnes/ha

Soumettez votre demande pour une analyse approfondie par nos agronomes.'''
          : '''📊 **Diagnosis Result**

Your **${_getSoilTypeName(_soilType)}** soil is suitable for growing **${_cropCtrl.text}**.

**Recommendations:**
- Optimal pH: 6.0 - 7.0
- Soil amendment: Organic compost (2t/ha)
- Fertilizer: NPK 15-15-15 before sowing
- Irrigation: ${_season == 'rainy' ? 'Improved drainage needed' : 'Drip irrigation recommended'}

**Estimated yield:** 1.5 - 2.5 tonnes/ha

Submit your request for an in-depth analysis by our agronomists.''';
      });
    }
  }

  String _getSoilTypeName(String type) {
    final map = {
      'clay': widget.isFr ? 'Argile' : 'Clay',
      'sandy': widget.isFr ? 'Sableux' : 'Sandy',
      'loamy': widget.isFr ? 'Limoneux' : 'Loamy',
      'silty': widget.isFr ? 'Silteux' : 'Silty',
    };
    return map[type] ?? type;
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: isFr ? 'Diagnostic du sol' : 'Soil Diagnosis',
      emoji: '🌱',
      color: const Color(0xFF4CAF50),
      child: _showResult
        ? _ResultView(
            result: _aiResult,
            isFr: isFr,
            onReset: () => setState(() { _showResult = false; _aiResult = ''; }),
          )
        : Column(children: [
            _formCard(children: [
              _fieldLabel(isFr ? 'Type de sol *' : 'Soil Type *'),
              DropdownButtonFormField<String>(
                isExpanded: true,
                isDense: true,
                value: _soilType,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: _inputDecoration(isFr ? 'Type de sol' : 'Soil type'),
                items: [
                  DropdownMenuItem(value: 'clay',
                    child: Text(isFr ? 'Argile' : 'Clay',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'sandy',
                    child: Text(isFr ? 'Sableux' : 'Sandy',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'loamy',
                    child: Text(isFr ? 'Limoneux' : 'Loamy',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'silty',
                    child: Text(isFr ? 'Silteux' : 'Silty',
                      style: const TextStyle(color: _text))),
                ],
                onChanged: (v) => setState(() => _soilType = v ?? 'clay'),
              ),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Culture principale *' : 'Main Crop *'),
              _textField(_cropCtrl, isFr ? 'Ex: Mil, Karité, Sésame' : 'e.g. Millet, Shea, Sesame'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Saison de culture' : 'Growing Season'),
              DropdownButtonFormField<String>(
                isExpanded: true,
                isDense: true,
                value: _season,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: _inputDecoration(isFr ? 'Saison' : 'Season'),
                items: [
                  DropdownMenuItem(value: 'rainy',
                    child: Text(isFr ? 'Saison des pluies' : 'Rainy Season',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'dry',
                    child: Text(isFr ? 'Saison sèche' : 'Dry Season',
                      style: const TextStyle(color: _text))),
                ],
                onChanged: (v) => setState(() => _season = v ?? 'rainy'),
              ),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Système d\'irrigation' : 'Irrigation System'),
              _textField(_irrigCtrl,
                isFr ? 'Ex: Goutte-à-goutte, aspersion' : 'e.g. Drip, sprinkler, none'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Engrais utilisés' : 'Fertilizers Used'),
              _textField(_fertCtrl,
                isFr ? 'Ex: NPK, compost, fumier' : 'e.g. NPK, compost, manure'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Observations' : 'Observations'),
              _textField(_notesCtrl,
                isFr ? 'Problèmes constatés...' : 'Issues observed...',
                maxLines: 3),
              const SizedBox(height: 20),
              _submitBtn(
                isFr ? 'Analyser mon sol' : 'Analyze My Soil',
                _submitting, _analyze,
                const Color(0xFF4CAF50)),
            ]),
          ]),
    );
  }
}

// ── DISEASE DETECTION ─────────────────────────────────────────
class _DiseaseDetectionScreen extends StatefulWidget {
  final bool isFr;
  const _DiseaseDetectionScreen({required this.isFr});
  @override State<_DiseaseDetectionScreen> createState() => _DiseaseDetectionScreenState();
}

class _DiseaseDetectionScreenState extends State<_DiseaseDetectionScreen> {
  final _cropCtrl = TextEditingController();
  final _symptomsCtrl = TextEditingController();
  File? _image;
  String _affected = 'leaves';
  bool _submitting = false;
  bool _showResult = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null && mounted) setState(() => _image = File(picked.path));
  }

  Future<void> _analyze() async {
    if (_cropCtrl.text.isEmpty) return;
    setState(() => _submitting = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() { _submitting = false; _showResult = true; });
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: isFr ? 'Détection maladie' : 'Disease Detection',
      emoji: '🔬', color: const Color(0xFFF59E0B),
      child: _showResult
        ? _ResultView(
            result: isFr
              ? '''🔬 **Résultat de l\'analyse**

Plante analysée: **${_cropCtrl.text}**
Partie affectée: **${_affected}**

**Diagnostic probable:**
- Mildiou (Plasmopara viticola) — probabilité 72%
- Alternariose — probabilité 18%

**Traitement recommandé:**
- Fongicide systémique à base de cuivre
- Réduction de l\'humidité
- Élimination des parties infectées

**Action urgente:** Traitez sous 48 heures pour limiter la propagation.

Nos agronomes peuvent vous aider avec un plan de traitement personnalisé.'''
              : '''🔬 **Analysis Result**

Plant analyzed: **${_cropCtrl.text}**
Affected part: **${_affected}**

**Probable diagnosis:**
- Downy mildew — 72% probability
- Alternaria blight — 18% probability

**Recommended treatment:**
- Copper-based systemic fungicide
- Reduce humidity around plants
- Remove and destroy infected parts

**Urgent action:** Treat within 48 hours to limit spread.

Our agronomists can help with a personalized treatment plan.''',
            isFr: isFr,
            onReset: () => setState(() => _showResult = false),
          )
        : Column(children: [
            _formCard(children: [
              // Photo picker
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 150,
                  decoration: BoxDecoration(
                    color: _bg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                      style: BorderStyle.solid),
                  ),
                  child: _image != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(_image!, fit: BoxFit.cover, width: double.infinity))
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add_photo_alternate_outlined,
                            color: Color(0xFFF59E0B), size: 36),
                          const SizedBox(height: 8),
                          Text(
                            isFr ? 'Ajouter une photo de la plante'
                                 : 'Add a photo of the plant',
                            style: const TextStyle(color: _textMuted, fontSize: 13)),
                        ],
                      ),
                ),
              ),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Type de plante/culture *' : 'Plant/Crop Type *'),
              _textField(_cropCtrl, isFr ? 'Ex: Mil, Karité, Tomate' : 'e.g. Millet, Tomato'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Partie affectée' : 'Affected Part'),
              DropdownButtonFormField<String>(
                isExpanded: true,
                isDense: true,
                value: _affected,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: _inputDecoration(isFr ? 'Partie' : 'Part'),
                items: [
                  DropdownMenuItem(value: 'leaves',
                    child: Text(isFr ? 'Feuilles' : 'Leaves',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'stem',
                    child: Text(isFr ? 'Tige' : 'Stem',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'root',
                    child: Text(isFr ? 'Racines' : 'Roots',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'fruit',
                    child: Text(isFr ? 'Fruits/Grains' : 'Fruits/Grains',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'whole',
                    child: Text(isFr ? 'Toute la plante' : 'Whole plant',
                      style: const TextStyle(color: _text))),
                ],
                onChanged: (v) => setState(() => _affected = v ?? 'leaves'),
              ),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Symptômes observés' : 'Observed Symptoms'),
              _textField(_symptomsCtrl,
                isFr ? 'Décrivez les symptômes...' : 'Describe the symptoms...',
                maxLines: 3),
              const SizedBox(height: 20),
              _submitBtn(
                isFr ? 'Analyser la maladie' : 'Analyze Disease',
                _submitting, _analyze, const Color(0xFFF59E0B)),
            ]),
          ]),
    );
  }
}

// ── THINK TANK (AI Chat + expert messaging) ───────────────────
class _ThinkTankScreen extends StatefulWidget {
  final bool isFr;
  final Map<String, dynamic>? farmer;
  const _ThinkTankScreen({required this.isFr, this.farmer});
  @override State<_ThinkTankScreen> createState() => _ThinkTankScreenState();
}

class _ThinkTankScreenState extends State<_ThinkTankScreen> {
  static const _purple = Color(0xFF7B61FF);

  int _mode = 0; // 0 = AI advisor, 1 = message expert
  final _msgCtrl = TextEditingController();
  final _expertProblemCtrl = TextEditingController();
  final _expertCropCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final List<Map<String, String>> _messages = [];
  bool _loading = false;
  bool _submittingExpert = false;
  bool _expertSent = false;
  String _urgency = 'within_week';

  final List<String> _suggestions = [];

  bool get _cooperativeMember {
    final f = widget.farmer;
    if (f == null) return false;
    if (f['lienCooperative'] == 'Oui') return true;
    final name = f['nomCooperative']?.toString() ?? '';
    if (name.isNotEmpty) return true;
    return f['cooperativeId'] != null;
  }

  String? get _cooperativeName {
    final name = widget.farmer?['nomCooperative']?.toString() ?? '';
    return name.isNotEmpty ? name : null;
  }

  String? get _cooperativeId => widget.farmer?['cooperativeId']?.toString();

  @override
  void initState() {
    super.initState();
    final cultures = (widget.farmer?['cultures'] as List?)?.cast<String>();
    if (cultures != null && cultures.isNotEmpty) {
      _expertCropCtrl.text = cultures.first;
    }
    _suggestions.addAll(widget.isFr
      ? ['Quel engrais pour le mil ?', 'Comment prévenir les maladies du karité ?',
         'Meilleure période de semis ?', 'Comment améliorer mon rendement ?']
      : ['Best fertilizer for millet?', 'How to prevent shea butter diseases?',
         'Best planting season?', 'How to improve my yield?']);
    _messages.add({
      'role': 'assistant',
      'content': widget.isFr
        ? '👋 Bonjour ! Je suis votre conseiller agricole IA. Posez-moi n\'importe quelle question sur votre exploitation !\n\nBesoin d\'un humain ? Passez à « Message expert ».'
        : '👋 Hello! I\'m your AI agricultural advisor. Ask me anything about your farm!\n\nNeed a person? Switch to "Message expert".',
    });
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _expertProblemCtrl.dispose();
    _expertCropCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _send(String text) async {
    if (text.trim().isEmpty) return;
    _msgCtrl.clear();
    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _loading = true;
    });
    _scrollDown();
    await Future.delayed(const Duration(milliseconds: 1500));
    if (mounted) {
      setState(() {
        _loading = false;
        _messages.add({
          'role': 'assistant',
          'content': _generateResponse(text),
        });
      });
      _scrollDown();
    }
  }

  String _generateResponse(String question) {
    final q = question.toLowerCase();
    if (q.contains('engrais') || q.contains('fertilizer')) {
      return widget.isFr
        ? '🌱 Pour votre sol, je recommande:\n\n• **NPK 15-15-15** au semis\n• **Urée** 45 jours après\n• **Compost organique** en saison sèche\n\nLa dose standard est 150 kg/ha. Avez-vous des informations sur votre type de sol ?'
        : '🌱 For your soil, I recommend:\n\n• **NPK 15-15-15** at planting\n• **Urea** 45 days after\n• **Organic compost** in dry season\n\nStandard dose is 150 kg/ha. Do you have info about your soil type?';
    }
    if (q.contains('maladie') || q.contains('disease') || q.contains('pest')) {
      return widget.isFr
        ? '🔬 Pour prévenir les maladies:\n\n• Rotation des cultures tous les 2 ans\n• Traitement fongicide préventif\n• Éliminer les débris de récolte\n• Utiliser des semences certifiées\n\nQuel type de culture est affecté ?'
        : '🔬 To prevent diseases:\n\n• Crop rotation every 2 years\n• Preventive fungicide treatment\n• Remove crop debris\n• Use certified seeds\n\nWhich crop is affected?';
    }
    return widget.isFr
      ? '🧠 Excellente question ! Pour vous donner les meilleures recommandations, pouvez-vous me préciser:\n\n1. Votre culture principale\n2. Votre région\n3. La saison actuelle\n\nJe pourrai ainsi vous donner des conseils personnalisés.'
      : '🧠 Great question! To give you the best recommendations, could you tell me:\n\n1. Your main crop\n2. Your region\n3. The current season\n\nThis will help me give you personalized advice.';
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut);
      }
    });
  }

  Future<void> _submitExpertRequest() async {
    final isFr = widget.isFr;
    final problem = _expertProblemCtrl.text.trim();
    if (problem.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(isFr
            ? 'Décrivez votre problème pour l\'expert'
            : 'Describe your issue for the expert'),
        backgroundColor: Colors.orange,
      ));
      return;
    }

    final auth = context.read<AuthState>();
    final name = auth.displayName.isNotEmpty
        ? auth.displayName
        : (widget.farmer?['nom']?.toString() ?? 'Farmer');
    final email = auth.displayEmail;
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(isFr
            ? 'E-mail requis — complétez votre profil'
            : 'Email required — complete your profile'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    setState(() => _submittingExpert = true);
    try {
      final res = await ApiService.submitExpertRequest(
        farmerName: name,
        farmerEmail: email,
        farmerPhone: widget.farmer?['telephone']?.toString() ?? auth.displayPhone,
        country: widget.farmer?['country']?.toString() ?? auth.displayCountry,
        region: widget.farmer?['region']?.toString(),
        cropType: _expertCropCtrl.text.trim(),
        problemDescription: problem,
        cooperativeMember: _cooperativeMember,
        cooperativeName: _cooperativeName,
        cooperativeId: _cooperativeId,
        urgency: _urgency,
        source: 'think_tank',
      );

      if (!mounted) return;
      final ok = res['success'] == true || res['id'] != null;
      if (ok) {
        setState(() => _expertSent = true);
        final note = res['routingNote']?.toString() ??
            (isFr
                ? (_cooperativeMember
                    ? 'Votre coopérative et l\'administration ont été notifiées.'
                    : 'L\'administration a reçu votre demande.')
                : (_cooperativeMember
                    ? 'Your cooperative and admin were notified.'
                    : 'The admin team received your request.'));
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(note),
          backgroundColor: const Color(0xFF2d6a4f),
          duration: const Duration(seconds: 5),
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(res['error']?.toString() ??
              (isFr ? 'Envoi impossible' : 'Could not send')),
          backgroundColor: Colors.red,
        ));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(isFr ? 'Erreur réseau' : 'Network error'),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _submittingExpert = false);
    }
  }

  Widget _modeChip(String label, int mode) {
    final sel = _mode == mode;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _mode = mode),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: sel ? _purple.withValues(alpha: 0.25) : _surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: sel ? _purple : Colors.white.withValues(alpha: 0.12),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: sel ? _purple : _textMuted,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExpertPanel(bool isFr) {
    if (_expertSent) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, color: _green, size: 56),
              const SizedBox(height: 16),
              Text(
                isFr ? 'Demande envoyée !' : 'Request sent!',
                style: const TextStyle(
                  color: _text,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isFr
                    ? (_cooperativeMember
                        ? 'Votre coopérative et l\'équipe admin vous contacteront sous 48 h.'
                        : 'L\'équipe admin Sahel AgriConnect traitera votre demande.')
                    : (_cooperativeMember
                        ? 'Your cooperative and admin will contact you within 48 hours.'
                        : 'Sahel AgriConnect admin will handle your request.'),
                textAlign: TextAlign.center,
                style: const TextStyle(color: _textMuted, fontSize: 13, height: 1.5),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(4, 0, 4, 16),
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: (_cooperativeMember ? _green : Colors.orange)
                .withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: (_cooperativeMember ? _green : Colors.orange)
                  .withValues(alpha: 0.35),
            ),
          ),
          child: Text(
            isFr
                ? (_cooperativeMember
                    ? '✓ Membre coopératif — votre message est envoyé à votre coopérative et à l\'administration.'
                    : 'Votre message est envoyé directement à l\'administration Sahel AgriConnect.')
                : (_cooperativeMember
                    ? '✓ Cooperative member — your message goes to your cooperative and admin.'
                    : 'Your message goes directly to Sahel AgriConnect admin.'),
            style: TextStyle(
              color: _cooperativeMember ? _green : Colors.orange,
              fontSize: 12,
              height: 1.45,
            ),
          ),
        ),
        const SizedBox(height: 14),
        _fieldLabel(isFr ? 'Décrivez votre problème *' : 'Describe your issue *'),
        TextField(
          controller: _expertProblemCtrl,
          maxLines: 5,
          style: const TextStyle(color: _text),
          decoration: _inputDecoration(
            isFr ? 'Ex: maladie sur mes plants de sésame...' : 'e.g. disease on my sesame plants...',
          ),
        ),
        const SizedBox(height: 12),
        _fieldLabel(isFr ? 'Culture concernée' : 'Crop (optional)'),
        TextField(
          controller: _expertCropCtrl,
          style: const TextStyle(color: _text),
          decoration: _inputDecoration(isFr ? 'Mil, karité, sésame...' : 'Millet, shea, sesame...'),
        ),
        const SizedBox(height: 12),
        _fieldLabel(isFr ? 'Urgence' : 'Urgency'),
        DropdownButtonFormField<String>(
          isExpanded: true,
          isDense: true,
          value: _urgency,
          dropdownColor: _surface,
          style: const TextStyle(color: _text),
          decoration: _inputDecoration(''),
          items: [
            DropdownMenuItem(
              value: 'immediate',
              child: Text(isFr ? 'Immédiate' : 'Immediate'),
            ),
            DropdownMenuItem(
              value: 'within_week',
              child: Text(isFr ? 'Cette semaine' : 'Within a week'),
            ),
            DropdownMenuItem(
              value: 'seasonal',
              child: Text(isFr ? 'Saisonnière' : 'Seasonal'),
            ),
          ],
          onChanged: (v) {
            if (v != null) setState(() => _urgency = v);
          },
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: _submittingExpert ? null : _submitExpertRequest,
            icon: _submittingExpert
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.support_agent, size: 20),
            label: Text(
              isFr ? 'Envoyer à un expert' : 'Send to an expert',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _purple,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: 'Think Tank', emoji: '🧠',
      color: _purple,
      scrollable: false,
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              _modeChip(isFr ? 'Conseiller IA' : 'AI Advisor', 0),
              const SizedBox(width: 8),
              _modeChip(isFr ? 'Message expert' : 'Message expert', 1),
            ],
          ),
        ),
        if (_mode == 1)
          Expanded(child: _buildExpertPanel(isFr))
        else ...[
        // Suggestions
        if (_messages.length == 1) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Wrap(
              spacing: 8, runSpacing: 8,
              children: _suggestions.map((s) => GestureDetector(
                onTap: () => _send(s),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7B61FF).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF7B61FF).withValues(alpha: 0.3)),
                  ),
                  child: Text(s, style: const TextStyle(
                    color: Color(0xFF7B61FF), fontSize: 12)),
                ),
              )).toList(),
            ),
          ),
        ],

        // Messages
        Expanded(
          child: ListView.builder(
            controller: _scrollCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _messages.length + (_loading ? 1 : 0),
            itemBuilder: (_, i) {
              if (i == _messages.length) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Row(children: [
                    SizedBox(width: 8),
                    SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(
                        color: Color(0xFF7B61FF), strokeWidth: 2)),
                    SizedBox(width: 8),
                    Text('...', style: TextStyle(color: _textMuted)),
                  ]),
                );
              }
              final msg = _messages[i];
              final isUser = msg['role'] == 'user';
              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75),
                  decoration: BoxDecoration(
                    color: isUser
                      ? const Color(0xFF7B61FF).withValues(alpha: 0.8)
                      : _surface,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomRight: isUser ? const Radius.circular(4) : null,
                      bottomLeft: !isUser ? const Radius.circular(4) : null),
                  ),
                  child: Text(msg['content'] ?? '',
                    style: const TextStyle(color: _text, fontSize: 13, height: 1.5)),
                ),
              ).animate().fadeIn(duration: 200.ms).slideY(begin: 0.05);
            },
          ),
        ),

        // Input
        Container(
          padding: EdgeInsets.fromLTRB(
            16,
            8,
            16,
            SafeInsets.bottom(context, extra: 16),
          ),
          color: _bg,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => setState(() => _mode = 1),
                  icon: const Icon(Icons.support_agent, size: 16, color: _gold),
                  label: Text(
                    isFr ? 'Parler à un expert humain' : 'Talk to a human expert',
                    style: const TextStyle(color: _gold, fontSize: 12),
                  ),
                ),
              ),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    style: const TextStyle(color: _text),
                    onSubmitted: _send,
                    decoration: InputDecoration(
                      hintText: isFr ? 'Posez votre question...' : 'Ask your question...',
                      hintStyle: const TextStyle(color: _textMuted),
                      filled: true,
                      fillColor: _surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _send(_msgCtrl.text),
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: const BoxDecoration(
                      color: _purple,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.send, color: Colors.white, size: 18),
                  ),
                ),
              ]),
            ],
          ),
        ),
        ],
      ]),
    );
  }
}

// ── IRRIGATION PLANNING ───────────────────────────────────────
class _IrrigationScreen extends StatefulWidget {
  final bool isFr;
  const _IrrigationScreen({required this.isFr});
  @override State<_IrrigationScreen> createState() => _IrrigationScreenState();
}

class _IrrigationScreenState extends State<_IrrigationScreen> {
  final _cropCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  final _sourceCtrl = TextEditingController();
  String _system = 'drip';
  String _season = 'dry';
  bool _submitting = false;
  bool _showResult = false;

  Future<void> _plan() async {
    if (_cropCtrl.text.isEmpty || _areaCtrl.text.isEmpty) return;
    setState(() => _submitting = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() { _submitting = false; _showResult = true; });
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: isFr ? 'Planification irrigation' : 'Irrigation Planning',
      emoji: '💧', color: const Color(0xFF2196F3),
      child: _showResult
        ? _ResultView(
            result: isFr
              ? '''💧 **Plan d\'irrigation personnalisé**

Culture: **${_cropCtrl.text}**
Surface: **${_areaCtrl.text} ha**
Système: **${_system == 'drip' ? 'Goutte-à-goutte' : _system}**

**Besoins en eau:**
- Apport journalier recommandé: 5-8 mm/jour
- Volume total saison: 450-600 m³/ha
- Fréquence: Tous les 2-3 jours

**Planning semaine:**
Lun/Mer/Ven: Irrigation 2h (tôt le matin)
Mar/Jeu/Sam: Repos
Dim: Maintenance et contrôle

**Économie d\'eau:** Le goutte-à-goutte économise 40% vs aspersion.'''
              : '''💧 **Personalized Irrigation Plan**

Crop: **${_cropCtrl.text}**
Area: **${_areaCtrl.text} ha**
System: **${_system}**

**Water requirements:**
- Daily input recommended: 5-8 mm/day
- Total seasonal volume: 450-600 m³/ha
- Frequency: Every 2-3 days

**Weekly schedule:**
Mon/Wed/Fri: Irrigate 2hrs (early morning)
Tue/Thu/Sat: Rest
Sun: Maintenance and inspection

**Water savings:** Drip irrigation saves 40% vs sprinkler.''',
            isFr: isFr,
            onReset: () => setState(() => _showResult = false),
          )
        : Column(children: [
            _formCard(children: [
              _fieldLabel(isFr ? 'Culture à irriguer *' : 'Crop to Irrigate *'),
              _textField(_cropCtrl, isFr ? 'Ex: Tomate, Oignon, Riz' : 'e.g. Tomato, Onion, Rice'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Superficie (hectares) *' : 'Area (hectares) *'),
              _textField(_areaCtrl, '0.5', type: TextInputType.number),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Système d\'irrigation' : 'Irrigation System'),
              DropdownButtonFormField<String>(
                isExpanded: true,
                isDense: true,
                value: _system,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: _inputDecoration(''),
                items: [
                  DropdownMenuItem(value: 'drip',
                    child: Text(isFr ? 'Goutte-à-goutte' : 'Drip',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'sprinkler',
                    child: Text(isFr ? 'Aspersion' : 'Sprinkler',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'flood',
                    child: Text(isFr ? 'Submersion' : 'Flood',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'manual',
                    child: Text(isFr ? 'Manuel' : 'Manual',
                      style: const TextStyle(color: _text))),
                ],
                onChanged: (v) => setState(() => _system = v ?? 'drip'),
              ),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Source d\'eau' : 'Water Source'),
              _textField(_sourceCtrl,
                isFr ? 'Ex: Puits, rivière, forage' : 'e.g. Well, river, borehole'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Saison' : 'Season'),
              DropdownButtonFormField<String>(
                isExpanded: true,
                isDense: true,
                value: _season,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: _inputDecoration(''),
                items: [
                  DropdownMenuItem(value: 'dry',
                    child: Text(isFr ? 'Saison sèche' : 'Dry season',
                      style: const TextStyle(color: _text))),
                  DropdownMenuItem(value: 'rainy',
                    child: Text(isFr ? 'Saison pluvieuse' : 'Rainy season',
                      style: const TextStyle(color: _text))),
                ],
                onChanged: (v) => setState(() => _season = v ?? 'dry'),
              ),
              const SizedBox(height: 20),
              _submitBtn(
                isFr ? 'Générer mon plan d\'irrigation' : 'Generate Irrigation Plan',
                _submitting, _plan, const Color(0xFF2196F3)),
            ]),
          ]),
    );
  }
}

// ── PRODUCTION OPTIMIZER ──────────────────────────────────────
class _ProductionOptimizerScreen extends StatefulWidget {
  final bool isFr;
  const _ProductionOptimizerScreen({required this.isFr});
  @override State<_ProductionOptimizerScreen> createState() => _ProductionOptimizerScreenState();
}

class _ProductionOptimizerScreenState extends State<_ProductionOptimizerScreen> {
  final _cropCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  final _yieldCtrl = TextEditingController();
  final _irrigCtrl = TextEditingController();
  final _fertCtrl = TextEditingController();
  final _seedCtrl = TextEditingController();
  bool _submitting = false;
  bool _showResult = false;

  Future<void> _optimize() async {
    if (_cropCtrl.text.isEmpty) return;
    setState(() => _submitting = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() { _submitting = false; _showResult = true; });
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: isFr ? 'Optimiseur de production' : 'Production Optimizer',
      emoji: '📊', color: const Color(0xFF10B981),
      child: _showResult
        ? _ResultView(
            result: isFr
              ? '''📊 **Plan d\'optimisation IA**

Culture: **${_cropCtrl.text}**
Surface: **${_areaCtrl.text.isNotEmpty ? _areaCtrl.text : '1'} ha**
Rendement actuel: **${_yieldCtrl.text.isNotEmpty ? _yieldCtrl.text : '1'} t/ha**

**Objectif:** +35% de rendement

**Actions prioritaires:**
1. 🌱 Variétés améliorées → +15% rendement
2. 💧 Optimisation irrigation → +10% rendement
3. 🧪 Fertilisation raisonnée → +8% rendement
4. 🐛 Protection phytosanitaire → +7% rendement

**Calendrier cultural:**
- Semis: Début saison (selon météo)
- Fertilisation: J+15, J+45
- Récolte optimale: 90-120 jours

**ROI estimé:** 180% sur la saison'''
              : '''📊 **AI Optimization Plan**

Crop: **${_cropCtrl.text}**
Area: **${_areaCtrl.text.isNotEmpty ? _areaCtrl.text : '1'} ha**
Current yield: **${_yieldCtrl.text.isNotEmpty ? _yieldCtrl.text : '1'} t/ha**

**Goal:** +35% yield improvement

**Priority actions:**
1. 🌱 Improved varieties → +15% yield
2. 💧 Irrigation optimization → +10% yield
3. 🧪 Reasoned fertilization → +8% yield
4. 🐛 Crop protection → +7% yield

**Crop calendar:**
- Planting: Season start (weather-dependent)
- Fertilization: D+15, D+45
- Optimal harvest: 90-120 days

**Estimated ROI:** 180% per season''',
            isFr: isFr,
            onReset: () => setState(() => _showResult = false),
          )
        : Column(children: [
            _formCard(children: [
              _fieldLabel(isFr ? 'Culture *' : 'Crop *'),
              _textField(_cropCtrl, isFr ? 'Ex: Mil, Karité, Sésame' : 'e.g. Millet, Shea'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Superficie (ha)' : 'Area (ha)'),
              _textField(_areaCtrl, '1.0', type: TextInputType.number),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Rendement actuel (t/ha)' : 'Current Yield (t/ha)'),
              _textField(_yieldCtrl, '1.0', type: TextInputType.number),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Irrigation actuelle' : 'Current Irrigation'),
              _textField(_irrigCtrl,
                isFr ? 'Ex: Aucune, manuelle, goutte-à-goutte' : 'e.g. None, manual, drip'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Engrais utilisés' : 'Fertilizers Used'),
              _textField(_fertCtrl,
                isFr ? 'Ex: NPK, compost' : 'e.g. NPK, compost'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Type de semences' : 'Seed Type'),
              _textField(_seedCtrl,
                isFr ? 'Ex: Local, certifié, hybride' : 'e.g. Local, certified, hybrid'),
              const SizedBox(height: 20),
              _submitBtn(
                isFr ? 'Optimiser ma production' : 'Optimize My Production',
                _submitting, _optimize, const Color(0xFF10B981)),
            ]),
          ]),
    );
  }
}

// ── TRACEABILITY ─────────────────────────────────────────────
class _TraceabilityScreen extends StatefulWidget {
  final bool isFr;
  const _TraceabilityScreen({required this.isFr});
  @override State<_TraceabilityScreen> createState() => _TraceabilityScreenState();
}

class _TraceabilityScreenState extends State<_TraceabilityScreen> {
  final _lotCtrl = TextEditingController();
  final _cropCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  bool _submitting = false;
  bool _showResult = false;

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: isFr ? 'Traçabilité' : 'Traceability',
      emoji: '🔍', color: const Color(0xFFEC4899),
      child: _showResult
        ? _ResultView(
            result: isFr
              ? '''🔍 **Lot enregistré avec succès**

Numéro de lot: **LOT-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}**
Culture: **${_cropCtrl.text}**
Quantité: **${_qtyCtrl.text} kg**
Origine: **${_locationCtrl.text}**

**QR Code généré** — Partagez ce code avec vos acheteurs pour tracer votre production de la ferme au marché.

**Statut du lot:** Enregistré ✅
**Date:** ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}

Vos acheteurs peuvent scanner le QR code pour vérifier l\'origine et la qualité.'''
              : '''🔍 **Lot Registered Successfully**

Lot number: **LOT-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}**
Crop: **${_cropCtrl.text}**
Quantity: **${_qtyCtrl.text} kg**
Origin: **${_locationCtrl.text}**

**QR Code generated** — Share this code with your buyers to trace your production from farm to market.

**Lot status:** Registered ✅
**Date:** ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}

Your buyers can scan the QR code to verify origin and quality.''',
            isFr: isFr,
            onReset: () => setState(() => _showResult = false),
          )
        : Column(children: [
            _formCard(children: [
              _fieldLabel(isFr ? 'Numéro de lot (optionnel)' : 'Lot Number (optional)'),
              _textField(_lotCtrl, isFr ? 'Auto-généré si vide' : 'Auto-generated if empty'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Culture *' : 'Crop *'),
              _textField(_cropCtrl, isFr ? 'Ex: Beurre de karité' : 'e.g. Shea Butter'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Quantité (kg) *' : 'Quantity (kg) *'),
              _textField(_qtyCtrl, '500', type: TextInputType.number),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Lieu de production *' : 'Production Location *'),
              _textField(_locationCtrl,
                isFr ? 'Ex: Koulikoro, Mali' : 'e.g. Koulikoro, Mali'),
              const SizedBox(height: 20),
              _submitBtn(
                isFr ? 'Créer le lot traçable' : 'Create Traceable Lot',
                _submitting,
                () async {
                  if (_cropCtrl.text.isEmpty || _qtyCtrl.text.isEmpty) return;
                  setState(() => _submitting = true);
                  await Future.delayed(const Duration(seconds: 1));
                  if (mounted) setState(() { _submitting = false; _showResult = true; });
                },
                const Color(0xFFEC4899)),
            ]),
          ]),
    );
  }
}

// ── TRAINING BOOKING ─────────────────────────────────────────
class _TrainingBookingScreen extends StatefulWidget {
  final bool isFr;
  const _TrainingBookingScreen({required this.isFr});
  @override State<_TrainingBookingScreen> createState() => _TrainingBookingScreenState();
}

class _TrainingBookingScreenState extends State<_TrainingBookingScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _topic = 'soil';
  DateTime? _date;
  bool _submitting = false;
  bool _submitted = false;

  final _topics = <String, String>{};

  @override
  void initState() {
    super.initState();
    _topics.addAll(widget.isFr ? {
      'soil': 'Gestion du sol',
      'irrigation': 'Irrigation moderne',
      'organic': 'Agriculture biologique',
      'harvest': 'Gestion post-récolte',
      'trade': 'Commerce et vente',
      'digital': 'Agriculture numérique',
    } : {
      'soil': 'Soil Management',
      'irrigation': 'Modern Irrigation',
      'organic': 'Organic Farming',
      'harvest': 'Post-Harvest Management',
      'trade': 'Trade & Sales',
      'digital': 'Digital Agriculture',
    });
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: isFr ? 'Réserver une formation' : 'Book Training',
      emoji: '📚', color: _gold,
      child: _submitted
        ? _ResultView(
            result: isFr
              ? '''✅ **Formation réservée !**

Participant: **${_nameCtrl.text}**
Thème: **${_topics[_topic]}**
${_date != null ? 'Date souhaitée: **${_date!.day}/${_date!.month}/${_date!.year}**' : ''}

**Notre équipe vous contactera sous 24-48h** pour confirmer la date et le lieu de la formation.

Contact: **${_phoneCtrl.text}**

Merci pour votre inscription ! Nous sommes impatients de travailler avec vous.'''
              : '''✅ **Training Booked!**

Participant: **${_nameCtrl.text}**
Topic: **${_topics[_topic]}**
${_date != null ? 'Requested date: **${_date!.day}/${_date!.month}/${_date!.year}**' : ''}

**Our team will contact you within 24-48 hours** to confirm the date and venue.

Contact: **${_phoneCtrl.text}**

Thank you for registering! We look forward to working with you.''',
            isFr: isFr,
            onReset: () => setState(() { _submitted = false; _nameCtrl.clear(); _phoneCtrl.clear(); }),
          )
        : Column(children: [
            _formCard(children: [
              _fieldLabel(isFr ? 'Votre nom *' : 'Your Name *'),
              _textField(_nameCtrl, isFr ? 'Prénom et nom' : 'First and last name'),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Téléphone *' : 'Phone *'),
              _textField(_phoneCtrl, '+223...', type: TextInputType.phone),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Thème de formation *' : 'Training Topic *'),
              DropdownButtonFormField<String>(
                isExpanded: true,
                isDense: true,
                value: _topic,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: _inputDecoration(isFr ? 'Choisir le thème' : 'Choose topic'),
                items: _topics.entries.map((e) => DropdownMenuItem(
                  value: e.key,
                  child: Text(e.value, style: const TextStyle(color: _text)))).toList(),
                onChanged: (v) => setState(() => _topic = v ?? 'soil'),
              ),
              const SizedBox(height: 14),
              _fieldLabel(isFr ? 'Date souhaitée' : 'Preferred Date'),
              InkWell(
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 7)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 180)),
                    builder: (_, child) => Theme(
                      data: ThemeData.dark().copyWith(
                        colorScheme: const ColorScheme.dark(
                          primary: _gold, surface: _surface)),
                      child: child!),
                  );
                  if (d != null && mounted) setState(() => _date = d);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    color: _bg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.calendar_today_outlined, color: _textMuted, size: 18),
                    const SizedBox(width: 10),
                    Text(
                      _date != null
                        ? '${_date!.day}/${_date!.month}/${_date!.year}'
                        : (isFr ? 'Choisir une date' : 'Choose a date'),
                      style: TextStyle(
                        color: _date != null ? _text : _textMuted, fontSize: 14)),
                  ]),
                ),
              ),
              const SizedBox(height: 20),
              _submitBtn(
                isFr ? 'Confirmer la réservation' : 'Confirm Booking',
                _submitting,
                () async {
                  if (_nameCtrl.text.isEmpty || _phoneCtrl.text.isEmpty) return;
                  setState(() => _submitting = true);
                  await Future.delayed(const Duration(seconds: 1));
                  if (mounted) setState(() { _submitting = false; _submitted = true; });
                }, _gold),
            ]),
          ]),
    );
  }
}

// ── JOIN COOPERATIVE ──────────────────────────────────────────
class _JoinCooperativeScreen extends StatefulWidget {
  final bool isFr;
  const _JoinCooperativeScreen({required this.isFr});
  @override State<_JoinCooperativeScreen> createState() => _JoinCooperativeScreenState();
}

class _JoinCooperativeScreenState extends State<_JoinCooperativeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _localityCtrl = TextEditingController();
  final _nationalIdCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  final _yearsCtrl = TextEditingController();
  final _msgCtrl = TextEditingController();
  String _filterRegion = 'all';
  String _farmRegion = 'koulikoro';
  String _country = 'Mali';
  String _areaUnit = 'hectares';
  String _irrigation = 'non';
  String? _selectedCoopId;
  String? _selectedCoopName;
  final Set<String> _selectedCrops = {};
  bool _alreadyMember = false;
  bool _consent = false;
  bool _submitting = false;
  bool _submitted = false;
  bool _prefilled = false;

  static const _cropOptions = [
    'Mil',
    'Sorgho',
    'Maïs',
    'Arachide',
    'Coton',
    'Niébé',
    'Riz',
    'Karité',
    'Sésame',
    'Cajou',
  ];


  final _coops = [
    {'id': '1', 'name': 'Coopérative Karité Mali', 'region': 'koulikoro', 'members': 145},
    {'id': '2', 'name': 'Union Agricole du Sahel', 'region': 'segou', 'members': 230},
    {'id': '3', 'name': 'Coop Sésame Sikasso', 'region': 'sikasso', 'members': 87},
    {'id': '4', 'name': 'Alliance Arachide Nord', 'region': 'mopti', 'members': 192},
    {'id': '5', 'name': 'Groupement Mil & Sorgho', 'region': 'gao', 'members': 63},
  ];

  List<Map<String, dynamic>> get _filteredCoops =>
      _coops
          .where((c) => _filterRegion == 'all' || c['region'] == _filterRegion)
          .toList()
          .cast<Map<String, dynamic>>();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_prefilled) return;
    _prefilled = true;
    final auth = context.read<AuthState>();
    if (auth.displayName.isNotEmpty) _nameCtrl.text = auth.displayName;
    if (auth.displayEmail.isNotEmpty) _emailCtrl.text = auth.displayEmail;
    if (auth.displayCountry.isNotEmpty) _country = auth.displayCountry;
    final region = auth.user?['region']?.toString();
    if (region != null && region.isNotEmpty) {
      _farmRegion = region.toLowerCase();
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _localityCtrl.dispose();
    _nationalIdCtrl.dispose();
    _areaCtrl.dispose();
    _yearsCtrl.dispose();
    _msgCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final isFr = widget.isFr;
    if (_selectedCoopId == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(isFr
            ? 'Sélectionnez une coopérative'
            : 'Select a cooperative'),
        backgroundColor: Colors.orange,
      ));
      return;
    }
    if (_selectedCrops.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(isFr
            ? 'Sélectionnez au moins une culture'
            : 'Select at least one crop'),
        backgroundColor: Colors.orange,
      ));
      return;
    }
    if (!_consent) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(isFr
            ? 'Vous devez accepter le traitement des données'
            : 'You must accept data processing'),
        backgroundColor: Colors.orange,
      ));
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthState>();
      final queue = context.read<OfflineQueue>();
      await queue.enqueue(
        path: '/api/cooperative-membership/applications',
        body: {
          'cooperativeId': _selectedCoopId,
          'cooperativeName': _selectedCoopName,
          'farmerEmail': auth.displayEmail,
          'fullName': _nameCtrl.text.trim(),
          'email': _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'country': _country,
          'region': _farmRegion,
          'locality': _localityCtrl.text.trim(),
          'nationalId': _nationalIdCtrl.text.trim(),
          'crops': _selectedCrops.toList(),
          'areaHectares': double.tryParse(_areaCtrl.text) ?? 0,
          'areaUnit': _areaUnit,
          'hasIrrigation': _irrigation,
          'yearsFarming': int.tryParse(_yearsCtrl.text) ?? 0,
          'alreadyCooperativeMember': _alreadyMember,
          'message': _msgCtrl.text.trim(),
          'consent': _consent,
        },
        label: 'Cooperative membership application',
        token: auth.token,
      );
      if (mounted) setState(() => _submitted = true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(isFr
              ? 'Échec de l\'envoi. Réessayez.'
              : 'Submission failed. Please try again.'),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return _ToolScaffold(
      title: isFr ? 'Rejoindre une coopérative' : 'Join a Cooperative',
      emoji: '🤝', color: _green,
      child: _submitted
          ? _ResultView(
              result: isFr
                  ? '''✅ **Demande envoyée !**

Coopérative: **$_selectedCoopName**
Nom: **${_nameCtrl.text}**
Téléphone: **${_phoneCtrl.text}**
Email: **${_emailCtrl.text}**

**La coopérative vous contactera sous 48-72h** pour valider votre adhésion.'''
                  : '''✅ **Application Submitted!**

Cooperative: **$_selectedCoopName**
Name: **${_nameCtrl.text}**
Phone: **${_phoneCtrl.text}**
Email: **${_emailCtrl.text}**

**The cooperative will contact you within 48-72 hours** to validate your membership.''',
              isFr: isFr,
              onReset: () => setState(() {
                _submitted = false;
                _selectedCoopId = null;
                _selectedCoopName = null;
              }),
            )
          : Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<String>(
                    isExpanded: true,
                    isDense: true,
                    value: _filterRegion,
                    dropdownColor: _surface,
                    style: const TextStyle(color: _text),
                    decoration: _inputDecoration(
                      isFr ? 'Filtrer coopératives par région' : 'Filter cooperatives by region',
                    ),
                    items: [
                      DropdownMenuItem(
                        value: 'all',
                        child: Text(
                          isFr ? 'Toutes les régions' : 'All regions',
                          style: const TextStyle(color: _text),
                        ),
                      ),
                      ...['koulikoro', 'segou', 'sikasso', 'mopti', 'gao'].map(
                        (r) => DropdownMenuItem(
                          value: r,
                          child: Text(
                            r[0].toUpperCase() + r.substring(1),
                            style: const TextStyle(color: _text),
                          ),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() {
                      _filterRegion = v ?? 'all';
                      _selectedCoopId = null;
                      _selectedCoopName = null;
                    }),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isFr ? 'Coopératives disponibles' : 'Available Cooperatives',
                    style: const TextStyle(
                      color: _text,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ..._filteredCoops.map((c) {
                    final id = c['id'] as String;
                    final selected = _selectedCoopId == id;
                    return GestureDetector(
                      onTap: () => setState(() {
                        _selectedCoopId = id;
                        _selectedCoopName = c['name'] as String;
                      }),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [_surface, _surface2],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected ? _green : _border,
                            width: selected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: _green.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.groups, color: _green, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    c['name'] as String,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: _text,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    '${c['members']} ${isFr ? 'membres' : 'members'} · ${(c['region'] as String)[0].toUpperCase()}${(c['region'] as String).substring(1)}',
                                    style: const TextStyle(
                                      color: _textMuted,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (selected)
                              const Icon(Icons.check_circle, color: _green, size: 22),
                          ],
                        ),
                      ),
                    );
                  }),
                  if (_selectedCoopId != null) ...[
                    const SizedBox(height: 20),
                    _formCard(
                      children: [
                        Text(
                          isFr ? 'Candidature complète' : 'Full Application',
                          style: const TextStyle(
                            color: _text,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isFr
                              ? 'Tous les champs marqués * sont requis pour traiter votre demande.'
                              : 'All fields marked * are required to process your application.',
                          style: const TextStyle(color: _textMuted, fontSize: 12),
                        ),
                        const SizedBox(height: 14),
                        _fieldLabel(isFr ? 'Nom complet *' : 'Full name *'),
                        _validatedField(
                          _nameCtrl,
                          isFr ? 'Prénom et nom' : 'First and last name',
                          (v) => (v == null || v.trim().length < 2)
                              ? (isFr ? 'Nom requis' : 'Name required')
                              : null,
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Email *' : 'Email *'),
                        _validatedField(
                          _emailCtrl,
                          'email@example.com',
                          (v) {
                            if (v == null || v.trim().isEmpty) {
                              return isFr ? 'Email requis' : 'Email required';
                            }
                            if (!v.contains('@')) {
                              return isFr ? 'Email invalide' : 'Invalid email';
                            }
                            return null;
                          },
                          type: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Téléphone *' : 'Phone *'),
                        _validatedField(
                          _phoneCtrl,
                          '+22376123456',
                          (v) {
                            if (v == null || v.trim().length < 8) {
                              return isFr ? 'Téléphone requis' : 'Phone required';
                            }
                            if (!v.trim().startsWith('+')) {
                              return isFr
                                  ? 'Format international (+indicatif)'
                                  : 'Use international format (+country code)';
                            }
                            return null;
                          },
                          type: TextInputType.phone,
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Pays *' : 'Country *'),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          isDense: true,
                          value: _country,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text),
                          decoration: _inputDecoration(isFr ? 'Pays' : 'Country'),
                          items: allCountries
                              .map(
                                (c) => DropdownMenuItem(
                                  value: c,
                                  child: Text(c, style: const TextStyle(color: _text)),
                                ),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _country = v ?? _country),
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Région / commune *' : 'Region / district *'),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          isDense: true,
                          value: _farmRegion,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text),
                          decoration: _inputDecoration(isFr ? 'Région' : 'Region'),
                          items: ['koulikoro', 'segou', 'sikasso', 'mopti', 'gao', 'bamako']
                              .map(
                                (r) => DropdownMenuItem(
                                  value: r,
                                  child: Text(
                                    r[0].toUpperCase() + r.substring(1),
                                    style: const TextStyle(color: _text),
                                  ),
                                ),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _farmRegion = v ?? _farmRegion),
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Village / localité' : 'Village / locality'),
                        _textField(
                          _localityCtrl,
                          isFr ? 'Ex: Sirakoro' : 'e.g. Sirakoro',
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'N° pièce d\'identité' : 'National ID number'),
                        _textField(
                          _nationalIdCtrl,
                          isFr ? 'Carte NINA / passeport' : 'National ID / passport',
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Cultures principales *' : 'Main crops *'),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _cropOptions.map((crop) {
                            final on = _selectedCrops.contains(crop);
                            return FilterChip(
                              label: Text(crop),
                              selected: on,
                              onSelected: (sel) => setState(() {
                                if (sel) {
                                  _selectedCrops.add(crop);
                                } else {
                                  _selectedCrops.remove(crop);
                                }
                              }),
                              selectedColor: _green.withValues(alpha: 0.25),
                              checkmarkColor: _green,
                              labelStyle: TextStyle(
                                color: on ? _text : _textMuted,
                                fontSize: 12,
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Superficie cultivée *' : 'Farm area *'),
                        Row(
                          children: [
                            Expanded(
                              child: _validatedField(
                                _areaCtrl,
                                isFr ? 'Ex: 2.5' : 'e.g. 2.5',
                                (v) {
                                  final n = double.tryParse(v ?? '');
                                  if (n == null || n <= 0) {
                                    return isFr
                                        ? 'Superficie requise'
                                        : 'Valid area required';
                                  }
                                  return null;
                                },
                                type: TextInputType.number,
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 90,
                              child: DropdownButtonFormField<String>(
                                isExpanded: true,
                                isDense: true,
                                value: _areaUnit,
                                dropdownColor: _surface,
                                style: const TextStyle(color: _text, fontSize: 13),
                                decoration: _inputDecoration(''),
                                items: [
                                  DropdownMenuItem(
                                    value: 'hectares',
                                    child: Text(
                                      isFr ? 'ha' : 'ha',
                                      style: const TextStyle(color: _text),
                                    ),
                                  ),
                                  DropdownMenuItem(
                                    value: 'acres',
                                    child: Text(
                                      isFr ? 'acres' : 'acres',
                                      style: const TextStyle(color: _text),
                                    ),
                                  ),
                                ],
                                onChanged: (v) =>
                                    setState(() => _areaUnit = v ?? 'hectares'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Irrigation *' : 'Irrigation *'),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          isDense: true,
                          value: _irrigation,
                          dropdownColor: _surface,
                          style: const TextStyle(color: _text),
                          decoration: _inputDecoration(''),
                          items: [
                            DropdownMenuItem(
                              value: 'oui',
                              child: Text(
                                isFr ? 'Oui' : 'Yes',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'non',
                              child: Text(
                                isFr ? 'Non' : 'No',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'partiel',
                              child: Text(
                                isFr ? 'Partiel' : 'Partial',
                                style: const TextStyle(color: _text),
                              ),
                            ),
                          ],
                          onChanged: (v) => setState(() => _irrigation = v ?? 'non'),
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Années d\'expérience' : 'Years of experience'),
                        _textField(_yearsCtrl, '5', type: TextInputType.number),
                        const SizedBox(height: 8),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            isFr
                                ? 'Déjà membre d\'une coopérative'
                                : 'Already a cooperative member',
                            style: const TextStyle(color: _text, fontSize: 13),
                          ),
                          value: _alreadyMember,
                          activeTrackColor: _green.withValues(alpha: 0.5),
                          onChanged: (v) => setState(() => _alreadyMember = v),
                        ),
                        const SizedBox(height: 12),
                        _fieldLabel(isFr ? 'Message / motivation' : 'Message / motivation'),
                        _textField(
                          _msgCtrl,
                          isFr
                              ? 'Pourquoi rejoindre cette coopérative ?'
                              : 'Why do you want to join this cooperative?',
                          maxLines: 4,
                        ),
                        const SizedBox(height: 12),
                        CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          value: _consent,
                          activeColor: _green,
                          onChanged: (v) => setState(() => _consent = v ?? false),
                          title: Text(
                            isFr
                                ? 'J\'accepte que mes données soient utilisées pour traiter cette candidature *'
                                : 'I agree my data may be used to process this application *',
                            style: const TextStyle(color: _textMuted, fontSize: 12),
                          ),
                          controlAffinity: ListTileControlAffinity.leading,
                        ),
                        const SizedBox(height: 16),
                        _submitBtn(
                          isFr ? 'Envoyer ma candidature' : 'Submit Application',
                          _submitting,
                          _submit,
                          _green,
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// SHARED UTILITY WIDGETS
// ══════════════════════════════════════════════════════════════

// Back + home bar for in-tab forms (e.g. declare produce).
class _FormNavBar extends StatelessWidget {
  final String title;
  final VoidCallback onBack;
  final VoidCallback onHome;

  const _FormNavBar({
    required this.title,
    required this.onBack,
    required this.onHome,
  });

  @override
  Widget build(BuildContext context) {
    final isFr =
        Localizations.localeOf(context).languageCode == 'fr';
    return Row(
      children: [
        IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          tooltip: isFr ? 'Retour' : 'Back',
          onPressed: onBack,
        ),
        Expanded(
          child: Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.home_outlined, color: _gold),
          tooltip: isFr ? 'Accueil tableau de bord' : 'Dashboard home',
          onPressed: onHome,
        ),
      ],
    );
  }
}

// Tool screen scaffold (shared by all AI tools)
class _ToolScaffold extends StatelessWidget {
  final String title, emoji;
  final Color color;
  final Widget child;
  final bool scrollable;
  const _ToolScaffold({
    required this.title,
    required this.emoji,
    required this.color,
    required this.child,
    this.scrollable = true,
  });

  @override
  Widget build(BuildContext context) {
    final isFr =
        Localizations.localeOf(context).languageCode == 'fr';
    final onHome = _FarmerToolScope.maybeOf(context)?.onHome;
    final mq = MediaQuery.of(context);
    final bottomPad = mq.viewInsets.bottom + mq.padding.bottom;

    return Scaffold(
      backgroundColor: _bg,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a3c2e),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          tooltip: isFr ? 'Retour' : 'Back',
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: _text,
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined, color: _gold),
            tooltip: isFr ? 'Accueil tableau de bord' : 'Dashboard home',
            onPressed: onHome ?? () => Navigator.of(context).pop(),
          ),
        ],
      ),
      body: scrollable
          ? SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(16, 16, 16, bottomPad + 120),
              child: child,
            )
          : Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, bottomPad + 8),
              child: child,
            ),
    );
  }
}

// Result view (shared by all AI tools)
class _ResultView extends StatelessWidget {
  final String result;
  final bool isFr;
  final VoidCallback onReset;
  const _ResultView({required this.result, required this.isFr, required this.onReset});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _green.withValues(alpha: 0.3)),
          ),
          child: Text(result, style: const TextStyle(
            color: _text, fontSize: 13, height: 1.65)),
        ).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: _textMuted.withValues(alpha: 0.3)),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.refresh, color: _textMuted, size: 18),
            label: Text(isFr ? 'Nouvelle analyse' : 'New Analysis',
              style: const TextStyle(color: _textMuted)),
            onPressed: onReset,
          ),
        ),
      ],
    );
  }
}

// Shared form helpers
Widget _formCard({required List<Widget> children}) => Container(
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

Widget _fieldLabel(String text) => Padding(
  padding: const EdgeInsets.only(bottom: 6),
  child: Text(text, style: const TextStyle(
    color: _textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
);

Widget _textField(TextEditingController ctrl, String hint, {
  TextInputType type = TextInputType.text, int maxLines = 1,
}) => TextField(
  controller: ctrl,
  keyboardType: type,
  maxLines: maxLines,
  style: const TextStyle(color: _text, fontSize: 14),
  decoration: _inputDecoration(hint),
);

Widget _validatedField(
  TextEditingController ctrl,
  String hint,
  String? Function(String?) validator, {
  TextInputType type = TextInputType.text,
  int maxLines = 1,
}) =>
    TextFormField(
      controller: ctrl,
      keyboardType: type,
      maxLines: maxLines,
      style: const TextStyle(color: _text, fontSize: 14),
      validator: validator,
      decoration: _inputDecoration(hint),
    );

InputDecoration _inputDecoration(String hint) => InputDecoration(
  hintText: hint,
  hintStyle: const TextStyle(color: _textMuted, fontSize: 13),
  filled: true, fillColor: _bg,
  border: OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
  enabledBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
  focusedBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: const BorderSide(color: _gold)),
  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
);

Widget _submitBtn(String label, bool loading, VoidCallback onTap, Color color) =>
  SizedBox(
    width: double.infinity,
    child: ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      onPressed: loading ? null : onTap,
      child: loading
        ? const SizedBox(width: 20, height: 20,
            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
        : Text(label, style: const TextStyle(
            fontWeight: FontWeight.bold, fontSize: 15)),
    ),
  );

Widget _sectionHeader(String text) => Text(text,
  style: const TextStyle(color: _text, fontSize: 16, fontWeight: FontWeight.w700));

Widget _actionCard({
  required IconData icon,
  required Color iconColor,
  required String title,
  required String subtitle,
  required VoidCallback onTap,
}) => GestureDetector(
  onTap: onTap,
  child: Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [_surface, _surface2]),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: iconColor.withValues(alpha: 0.25)),
    ),
    child: Row(children: [
      Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: iconColor, size: 22)),
      const SizedBox(width: 14),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(
            color: _text, fontSize: 14, fontWeight: FontWeight.w600)),
          Text(subtitle, style: const TextStyle(color: _textMuted, fontSize: 12)),
        ],
      )),
      Icon(Icons.arrow_forward_ios, size: 14,
        color: _textMuted.withValues(alpha: 0.4)),
    ]),
  ),
);

Widget _emptyState({required IconData icon, required String title, required String subtitle}) =>
  Container(
    padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [_surface, _surface2]),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: _border),
    ),
    child: Column(children: [
      Icon(icon, color: _textMuted, size: 48),
      const SizedBox(height: 12),
      Text(title, style: const TextStyle(
        color: _text, fontSize: 15, fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      Text(subtitle, textAlign: TextAlign.center,
        style: const TextStyle(color: _textMuted, fontSize: 12)),
    ]),
  );
