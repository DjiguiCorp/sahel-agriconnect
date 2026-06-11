import 'package:flutter/material.dart';
import '../../core/safe_insets.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/glass.dart';
import '../../core/language_provider.dart';
import '../../core/responsive.dart';
import '../../core/theme.dart';
import '../../widgets/portal_dashboard_nav.dart';
import '../../widgets/portal_tablet_shell.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import 'investor_portal_content.dart';

const _bg = Color(0xFF0A1628);
const _surface = Color(0xFF1a2744);
const _surface2 = Color(0xFF0f1a33);
const _gold = AppColors.gold;
const _border = Color(0x14FFFFFF);
const _text = Colors.white;
const _muted = Color(0x80FFFFFF);

List<Map<String, dynamic>> _parseList(dynamic raw) {
  final list = <Map<String, dynamic>>[];
  if (raw is! List) return list;
  for (final e in raw) {
    if (e is Map) list.add(Map<String, dynamic>.from(e));
  }
  return list;
}

double _oppProgress(Map<String, dynamic> opp) {
  final funded = num.tryParse(opp['amountFunded']?.toString() ?? '') ??
      num.tryParse(opp['amountRaised']?.toString() ?? '') ??
      0;
  final target = num.tryParse(opp['amountTarget']?.toString() ?? '') ??
      num.tryParse(opp['amountSought']?.toString() ?? '') ??
      1;
  if (target <= 0) return 0;
  return (funded / target.toDouble()).clamp(0.0, 1.0);
}

int _oppMinInvestment(Map<String, dynamic> opp) {
  return (num.tryParse(opp['minimumInvestmentUSD']?.toString() ?? '') ??
          num.tryParse(opp['minimumInvestment']?.toString() ?? '') ??
          num.tryParse(opp['minInvestment']?.toString() ?? '') ??
          0)
      .toInt();
}

double _oppReturnRate(Map<String, dynamic> opp) {
  final single = num.tryParse(opp['expectedROIPercent']?.toString() ?? '');
  if (single != null) return single.toDouble();
  final min = num.tryParse(opp['expectedROIMin']?.toString() ?? '') ?? 12;
  final max = num.tryParse(opp['expectedROIMax']?.toString() ?? '') ?? 25;
  return ((min + max) / 2).toDouble();
}

String _oppTitle(Map<String, dynamic> opp, bool isFr) =>
    opp['centerName']?.toString() ??
    opp['title']?.toString() ??
    (isFr ? 'Opportunité' : 'Opportunity');

String _oppSubtitle(Map<String, dynamic> opp) =>
    opp['commodity']?.toString() ?? opp['description']?.toString() ?? '';

// ══════════════════════════════════════════════════════════════
// MAIN INVESTOR DASHBOARD
// ══════════════════════════════════════════════════════════════
class InvestorDashboard extends StatefulWidget {
  const InvestorDashboard({super.key});

  @override
  State<InvestorDashboard> createState() => _InvestorDashboardState();
}

class _InvestorDashboardState extends State<InvestorDashboard> {
  int _tab = 0;
  List<Map<String, dynamic>> _investments = [];
  List<Map<String, dynamic>> _opportunities = [];
  Map<String, dynamic>? _kycStatus;
  bool _loading = true;

  double get _totalDeployed => _investments.fold<double>(
        0,
        (s, i) =>
            s +
            (num.tryParse(i['amountDeployed']?.toString() ?? '0') ?? 0)
                .toDouble(),
      );

  double get _avgRoi => _investments.isEmpty
      ? 0
      : _investments.fold<double>(
            0,
            (s, i) =>
                s +
                (num.tryParse(i['expectedROIPercent']?.toString() ?? '0') ?? 0)
                    .toDouble(),
          ) /
          _investments.length;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthState>();
    try {
      final email = auth.displayEmail;
      final results = await Future.wait([
        ApiService.getInvestorPortal(auth.token ?? '', email: email),
        ApiService.getKycStatus(email),
      ]);
      final res = results[0];
      final kyc = results[1];
      if (!mounted) return;
      setState(() {
        _investments = _parseList(res['investments']);
        _opportunities = _parseList(res['opportunities']);
        if (kyc['success'] == true) {
          _kycStatus = Map<String, dynamic>.from(kyc);
        }
        _loading = false;
      });
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
    final isFr = context.read<LanguageProvider>().locale.languageCode == 'fr';
    final exit = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: _surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          isFr ? 'Quitter ?' : 'Exit?',
          style: const TextStyle(color: _text),
        ),
        content: Text(
          isFr
              ? 'Voulez-vous quitter AfriYield ?'
              : 'Do you want to exit AfriYield?',
          style: const TextStyle(color: _muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(
              isFr ? 'Rester' : 'Stay',
              style: const TextStyle(color: _muted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
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

  Widget _buildTabStack(bool isFr) {
    final displayName = context.watch<AuthState>().displayName;
    return IndexedStack(
      index: _tab,
      sizing: StackFit.expand,
      children: [
        _PortfolioTab(
          investments: _investments,
          opportunities: _opportunities,
          loading: _loading,
          isFr: isFr,
          displayName: displayName,
          onTabChange: _goTab,
          onRefresh: _load,
        ),
        _ExchangeTab(
          opportunities: _opportunities,
          loading: _loading,
          isFr: isFr,
          onRefresh: _load,
        ),
        _ActivityTab(
          investments: _investments,
          isFr: isFr,
        ),
        _UpdatesTab(isFr: isFr),
        _InvestorAccountTab(
          isFr: isFr,
          kycStatus: _kycStatus,
          hasInvestments: _investments.isNotEmpty,
          onTabChange: _goTab,
        ),
      ],
    );
  }

  List<NavigationDestination> _navDestinations(bool isFr) => [
        NavigationDestination(
          icon: const Icon(Icons.account_balance_wallet_outlined, color: _muted),
          selectedIcon: const Icon(Icons.account_balance_wallet, color: _gold),
          label: isFr ? 'Portefeuille' : 'Portfolio',
        ),
        NavigationDestination(
          icon: const Icon(Icons.trending_up_outlined, color: _muted),
          selectedIcon: const Icon(Icons.trending_up, color: _gold),
          label: isFr ? 'Marchés' : 'Markets',
        ),
        NavigationDestination(
          icon: const Icon(Icons.receipt_long_outlined, color: _muted),
          selectedIcon: const Icon(Icons.receipt_long, color: _gold),
          label: isFr ? 'Activité' : 'Activity',
        ),
        NavigationDestination(
          icon: const Icon(Icons.campaign_outlined, color: _muted),
          selectedIcon: const Icon(Icons.campaign, color: _gold),
          label: isFr ? 'Actualités' : 'News',
        ),
        NavigationDestination(
          icon: const Icon(Icons.manage_accounts_outlined, color: _muted),
          selectedIcon: const Icon(Icons.manage_accounts, color: _gold),
          label: isFr ? 'Compte' : 'Account',
        ),
      ];

  List<PortalSidebarNavItem> _sidebarNavItems(bool isFr) => [
        PortalSidebarNavItem(
          icon: Icons.account_balance_wallet_outlined,
          selectedIcon: Icons.account_balance_wallet,
          label: isFr ? 'Portefeuille' : 'Portfolio',
        ),
        PortalSidebarNavItem(
          icon: Icons.trending_up_outlined,
          selectedIcon: Icons.trending_up,
          label: isFr ? 'Marchés' : 'Markets',
        ),
        PortalSidebarNavItem(
          icon: Icons.receipt_long_outlined,
          selectedIcon: Icons.receipt_long,
          label: isFr ? 'Activité' : 'Activity',
        ),
        PortalSidebarNavItem(
          icon: Icons.campaign_outlined,
          selectedIcon: Icons.campaign,
          label: isFr ? 'Actualités' : 'News',
        ),
        PortalSidebarNavItem(
          icon: Icons.manage_accounts_outlined,
          selectedIcon: Icons.manage_accounts,
          label: isFr ? 'Compte' : 'Account',
        ),
      ];

  Widget _buildPhoneLayout(bool isFr) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Scaffold(
          extendBody: false,
          resizeToAvoidBottomInset: true,
          backgroundColor: _bg,
          body: Column(
            children: [
              const OfflineBanner(),
              _InvestorHeader(
                totalDeployed: _totalDeployed,
                avgRoi: _avgRoi,
                investmentCount: _investments.length,
                isFr: isFr,
              ),
              Expanded(child: _buildTabStack(isFr)),
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
              destinations: _navDestinations(isFr),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabletLayout(bool isFr) {
    final auth = context.watch<AuthState>();
    return PortalTabletShell(
      backgroundColor: _bg,
      sidebarColor: _surface2,
      accentColor: _gold,
      topBanner: const OfflineBanner(),
      sidebarHeader: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'AfriYield Exchange',
            style: TextStyle(
              color: _text,
              fontSize: Responsive.fontSize(context, 18),
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            isFr ? 'Portail investisseur' : 'Investor Portal',
            style: TextStyle(
              color: _muted,
              fontSize: Responsive.fontSize(context, 13),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            auth.displayName,
            style: TextStyle(
              color: _text,
              fontSize: Responsive.fontSize(context, 16),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      stats: [
        PortalSidebarStat(
          label: isFr ? 'Déployé' : 'Deployed',
          value: '\$${_totalDeployed.toStringAsFixed(0)}',
          accentColor: _gold,
        ),
        PortalSidebarStat(
          label: isFr ? 'Rendement moy.' : 'Avg return',
          value: '${_avgRoi.toStringAsFixed(1)}%',
          accentColor: _gold,
        ),
        PortalSidebarStat(
          label: isFr ? 'Positions' : 'Positions',
          value: '${_investments.length}',
          accentColor: _gold,
        ),
      ],
      navItems: _sidebarNavItems(isFr),
      selectedIndex: _tab,
      onNavSelected: _goTab,
      content: LayoutBuilder(
        builder: (context, constraints) {
          // Portfolio tab: main feed + market sidebar when content area is wide enough.
          if (_tab == 0 && constraints.maxWidth >= 560) {
            final marketWidth =
                (constraints.maxWidth * 0.34).clamp(280.0, 380.0);
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _PortfolioTab(
                    investments: _investments,
                    opportunities: _opportunities,
                    loading: _loading,
                    isFr: isFr,
                    displayName: auth.displayName,
                    onTabChange: _goTab,
                    onRefresh: _load,
                  ),
                ),
                const SizedBox(width: 16),
                SizedBox(
                  width: marketWidth,
                  child: _ExchangeTab(
                    opportunities: _opportunities,
                    loading: _loading,
                    isFr: isFr,
                    onRefresh: _load,
                  ),
                ),
              ],
            );
          }
          return _buildTabStack(isFr);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isFr = context.watch<LanguageProvider>().locale.languageCode == 'fr';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _onBackPressed();
      },
      child: Responsive.builder(
        context: context,
        phone: _buildPhoneLayout(isFr),
        tablet: _buildTabletLayout(isFr),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════
class _InvestorHeader extends StatelessWidget {
  const _InvestorHeader({
    required this.totalDeployed,
    required this.avgRoi,
    required this.investmentCount,
    required this.isFr,
  });

  final double totalDeployed;
  final double avgRoi;
  final int investmentCount;
  final bool isFr;

  @override
  Widget build(BuildContext context) {
    return GlassPortalHeader(
      gradientColors: const [
        Color(0xFF1a2744),
        Color(0xFF243358),
        Color(0xFF1a2744),
      ],
      accentColor: _gold,
      titleRow: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AfriYield Exchange',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                ),
              ),
              Text(
                isFr ? 'Portail investisseur' : 'Investor Portal',
                style: const TextStyle(
                  color: _text,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          const PortalGlassHeaderActions(accentColor: _gold),
        ],
      ),
      statsRow: Row(
        children: [
          GlassStatTile(
            value: '\$${totalDeployed.toStringAsFixed(0)}',
            label: isFr ? 'Investi' : 'Deployed',
            accentColor: _gold,
          ),
          const SizedBox(width: 8),
          GlassStatTile(
            value: '${avgRoi.toStringAsFixed(1)}%',
            label: isFr ? 'Retour moy.' : 'Avg return',
            accentColor: _gold,
          ),
          const SizedBox(width: 8),
          GlassStatTile(
            value: '$investmentCount',
            label: isFr ? 'Positions' : 'Positions',
            accentColor: _gold,
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 0: PORTFOLIO
// ══════════════════════════════════════════════════════════════
class _PortfolioTab extends StatelessWidget {
  const _PortfolioTab({
    required this.investments,
    required this.opportunities,
    required this.loading,
    required this.isFr,
    required this.displayName,
    required this.onTabChange,
    required this.onRefresh,
  });

  final List<Map<String, dynamic>> investments;
  final List<Map<String, dynamic>> opportunities;
  final bool loading;
  final bool isFr;
  final String displayName;
  final ValueChanged<int> onTabChange;
  final Future<void> Function() onRefresh;

  List<Widget> _staticOpportunities() => [
        _OpportunityCard(
          title: isFr ? 'Coopérative Karité Mali' : 'Mali Shea Cooperative',
          subtitle: isFr
              ? 'Beurre de karité certifié bio'
              : 'Certified organic shea butter',
          returnRate: 15.0,
          minInvestment: 500,
          progress: 0.65,
          isFr: isFr,
        ),
        const SizedBox(height: 10),
        _OpportunityCard(
          title: isFr ? 'Union Sésame Sahel' : 'Sahel Sesame Union',
          subtitle: isFr
              ? 'Export sésame Europe & Asie'
              : 'Sesame export Europe & Asia',
          returnRate: 12.5,
          minInvestment: 1000,
          progress: 0.42,
          isFr: isFr,
        ),
        const SizedBox(height: 10),
        _OpportunityCard(
          title: isFr ? 'Projet Noix Cajou Sikasso' : 'Sikasso Cashew Project',
          subtitle: isFr
              ? 'Transformation locale noix de cajou'
              : 'Local cashew processing',
          returnRate: 18.0,
          minInvestment: 2500,
          progress: 0.28,
          isFr: isFr,
        ),
      ];

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: _gold,
      backgroundColor: _surface,
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: SafeInsets.listBottom(context),
        children: [
          InvestorGreetingHeader(isFr: isFr, displayName: displayName),
          const SizedBox(height: 16),
          if (!loading && investments.isEmpty) ...[
            InvestorOnboardingCard(
              isFr: isFr,
              onCta: () => onTabChange(1),
            ),
            const SizedBox(height: 16),
          ],
          InvestorActivityFeed(isFr: isFr),
          const SizedBox(height: 16),
          InvestorHotOpportunityBanner(
            isFr: isFr,
            onCta: () => onTabChange(1),
          ),
          const SizedBox(height: 16),
          InvestorPaymentNoticeCard(isFr: isFr),
          const SizedBox(height: 16),
          _AboutAfriYieldCard(isFr: isFr),
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
            childAspectRatio: 1.4,
            children: [
              _QA(
                emoji: '💰',
                title: isFr ? 'Voir les marchés' : 'Browse Markets',
                color: _gold,
                onTap: () => onTabChange(1),
              ),
              _QA(
                emoji: '📊',
                title: isFr ? 'Mon activité' : 'My Activity',
                color: const Color(0xFF2196F3),
                onTap: () => onTabChange(2),
              ),
              _QA(
                emoji: '📢',
                title: isFr ? 'Actualités' : 'Updates',
                color: const Color(0xFF10B981),
                onTap: () => onTabChange(3),
              ),
              _QA(
                emoji: '⚙️',
                title: isFr ? 'Compte' : 'Account',
                color: const Color(0xFF9C27B0),
                onTap: () => onTabChange(4),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isFr ? 'Mes investissements' : 'My Investments',
                style: const TextStyle(
                  color: _text,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              GestureDetector(
                onTap: () => onTabChange(2),
                child: Text(
                  isFr ? 'Tout voir' : 'View all',
                  style: const TextStyle(color: _gold, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: CircularProgressIndicator(color: _gold),
              ),
            )
          else if (investments.isEmpty)
            InvestorPortfolioEmptyBlock(
              isFr: isFr,
              onChoose: () => onTabChange(1),
            )
          else
            ...investments.take(3).map((inv) {
              final status = inv['status']?.toString() ?? 'active';
              final step = status == 'completed'
                  ? 3
                  : status == 'active'
                      ? 2
                      : 1;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InvestmentCard(inv: inv, isFr: isFr),
                    const SizedBox(height: 8),
                    InvestorJourneyProgress(isFr: isFr, currentStep: step),
                  ],
                ),
              );
            }),
          const SizedBox(height: 20),
          Text(
            isFr ? 'Opportunités vedettes' : 'Featured Opportunities',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          if (loading)
            const SizedBox.shrink()
          else if (opportunities.isEmpty)
            ..._staticOpportunities()
          else
            ...opportunities.take(3).map((opp) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _OpportunityCard(
                  title: _oppTitle(opp, isFr),
                  subtitle: _oppSubtitle(opp),
                  returnRate: _oppReturnRate(opp),
                  minInvestment: _oppMinInvestment(opp),
                  progress: _oppProgress(opp),
                  isFr: isFr,
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _AboutAfriYieldCard extends StatefulWidget {
  const _AboutAfriYieldCard({required this.isFr});

  final bool isFr;

  @override
  State<_AboutAfriYieldCard> createState() => _AboutAfriYieldCardState();
}

class _AboutAfriYieldCardState extends State<_AboutAfriYieldCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _gold.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: _gold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text('💰', style: TextStyle(fontSize: 22)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'AfriYield Exchange',
                          style: TextStyle(
                            color: _text,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          isFr
                              ? 'Investir dans l\'agriculture africaine'
                              : 'Invest in African agriculture',
                          style: const TextStyle(color: _muted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: _gold,
                  ),
                ],
              ),
            ),
          ),
          if (_expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(color: _border, height: 1),
                  const SizedBox(height: 12),
                  Text(
                    isFr
                        ? 'AfriYield Exchange est la plateforme d\'investissement agricole de Sahel AgriConnect. Elle permet aux membres de la diaspora et aux investisseurs du monde entier de financer des coopératives agricoles certifiées en Afrique de l\'Ouest et de recevoir des rendements attractifs.\n\n'
                            '• Investissez à partir de \$500\n'
                            '• Rendements projetés: 10-20% par an (historique coopératives)\n'
                            '• Résultats non garantis. Risque de perte en capital.\n'
                            '• Coopératives certifiées et vérifiées\n'
                            '• Transparence totale sur l\'utilisation des fonds\n'
                            '• Impact direct sur les communautés rurales'
                        : 'AfriYield Exchange is the agricultural investment platform of Sahel AgriConnect. It enables diaspora members and global investors to fund certified West African farming cooperatives and receive attractive returns.\n\n'
                            '• Invest from \$500\n'
                            '• Projected returns: 10-20% annually (cooperative historical)\n'
                            '• Results not guaranteed. Capital loss risk exists.\n'
                            '• Certified and vetted cooperatives\n'
                            '• Full transparency on fund use\n'
                            '• Direct impact on rural communities',
                    style: const TextStyle(
                      color: _muted,
                      fontSize: 13,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _infoPill('🌍', isFr ? 'Pan-africain' : 'Pan-African'),
                      _infoPill('📈', isFr ? '10-20% proj.' : '10-20% proj.'),
                      _infoPill('✅', isFr ? 'Certifié' : 'Certified'),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _infoPill(String emoji, String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: _gold.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _gold.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 12)),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                color: _gold,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
}

class _InvestmentCard extends StatelessWidget {
  const _InvestmentCard({required this.inv, required this.isFr});

  final Map<String, dynamic> inv;
  final bool isFr;

  @override
  Widget build(BuildContext context) {
    final amount = num.tryParse(inv['amountDeployed']?.toString() ?? '0') ?? 0;
    final roi = num.tryParse(inv['expectedROIPercent']?.toString() ?? '0') ?? 0;
    final name = inv['opportunityName']?.toString() ??
        inv['cooperativeName']?.toString() ??
        inv['investorName']?.toString() ??
        (isFr ? 'Investissement' : 'Investment');
    final status = inv['status']?.toString() ?? 'active';

    return Container(
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
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _gold.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.trending_up, color: _gold, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: _text,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '\$$amount deployed · $roi% ROI',
                  style: const TextStyle(color: _muted, fontSize: 11),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status == 'active' ? (isFr ? 'Actif' : 'Active') : status,
              style: const TextStyle(
                color: Colors.green,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OpportunityCard extends StatefulWidget {
  const _OpportunityCard({
    required this.title,
    required this.subtitle,
    required this.returnRate,
    required this.minInvestment,
    required this.progress,
    required this.isFr,
  });

  final String title;
  final String subtitle;
  final double returnRate;
  final int minInvestment;
  final double progress;
  final bool isFr;

  @override
  State<_OpportunityCard> createState() => _OpportunityCardState();
}

class _OpportunityCardState extends State<_OpportunityCard> {
  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_surface, _surface2],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.2)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '~${widget.returnRate.toStringAsFixed(1)}% proj.',
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              widget.subtitle,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: widget.progress,
                backgroundColor: Colors.white.withValues(alpha: 0.1),
                color: AppColors.gold,
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${(widget.progress * 100).toInt()}% ${isFr ? 'financé' : 'funded'}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 10,
                  ),
                ),
                Text(
                  'Min: \$${widget.minInvestment}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.08),
                ),
              ),
              child: Text(
                isFr
                    ? '⚠️ Rendement projeté basé sur les performances historiques. Les investissements comportent des risques. Les performances passées ne garantissent pas les résultats futurs.'
                    : '⚠️ Projected return based on historical cooperative performance. Investments carry risk. Past performance does not guarantee future results.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: Text(
                  isFr ? 'Investir sur AfriYield.com' : 'Invest on AfriYield.com',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                onPressed: () => _showInvestmentModal(context),
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.lock_outline,
                    color: Colors.white.withValues(alpha: 0.4),
                    size: 12,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      isFr
                          ? 'Paiement exclusivement sur afriyieldexchange.com'
                          : 'Payment exclusively on afriyieldexchange.com',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.4),
                        fontSize: 10,
                      ),
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

  void _showInvestmentModal(BuildContext context) {
    final isFr = widget.isFr;
    showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      backgroundColor: const Color(0xFF1a2744),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.24),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isFr ? '💰 Procéder à l\'investissement' : '💰 Proceed to Invest',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isFr ? '📋 Résumé de l\'opportunité' : '📋 Opportunity Summary',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _summaryRow(
                    isFr ? 'Opportunité' : 'Opportunity',
                    widget.title,
                  ),
                  _summaryRow(
                    isFr ? 'Rendement projeté' : 'Projected Return',
                    '~${widget.returnRate.toStringAsFixed(1)}%',
                  ),
                  _summaryRow(
                    isFr ? 'Investissement minimum' : 'Minimum investment',
                    '\$${widget.minInvestment}',
                  ),
                  _summaryRow(
                    isFr ? 'Financement actuel' : 'Current funding',
                    '${(widget.progress * 100).toInt()}%',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '⚠️ AVIS LÉGAL / LEGAL NOTICE',
                    style: TextStyle(
                      color: Color(0xFFF59E0B),
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isFr
                        ? 'AfriYield Exchange est une plateforme de facilitation d\'investissement exploitée par Djigui Corporation. Nous ne sommes pas une institution financière agréée. Les investissements comportent des risques, y compris la perte du capital investi. Les rendements projetés sont basés sur les performances historiques des coopératives et ne constituent pas une garantie. Consultez un conseiller financier avant d\'investir. Le traitement des paiements s\'effectue exclusivement via le portail web sécurisé.'
                        : 'AfriYield Exchange is an investment facilitation platform operated by Djigui Corporation. We are not a licensed financial institution or broker-dealer. Investments carry risk, including potential loss of invested capital. Projected returns are based on historical cooperative performance and do not constitute a guarantee. Consult a financial advisor before investing. Payment processing occurs exclusively through the secure web portal.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 11,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.open_in_browser, size: 18),
                label: Text(
                  isFr
                      ? 'Continuer sur afriyieldexchange.com'
                      : 'Continue on afriyieldexchange.com',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                onPressed: () async {
                  Navigator.pop(sheetContext);
                  final uri = Uri.parse('https://afriyieldexchange.com/invest');
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(
                      uri,
                      mode: LaunchMode.externalApplication,
                    );
                  }
                },
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.pop(sheetContext),
              child: Text(
                isFr ? 'Annuler' : 'Cancel',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 12,
                ),
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      );
}

class _QA extends StatelessWidget {
  const _QA({
    required this.emoji,
    required this.title,
    required this.color,
    required this.onTap,
  });

  final String emoji;
  final String title;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
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
}

// ══════════════════════════════════════════════════════════════
// TAB 1: EXCHANGE
// ══════════════════════════════════════════════════════════════
class _ExchangeTab extends StatelessWidget {
  const _ExchangeTab({
    required this.opportunities,
    required this.loading,
    required this.isFr,
    required this.onRefresh,
  });

  final List<Map<String, dynamic>> opportunities;
  final bool loading;
  final bool isFr;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final commodities = [
      {
        'name': isFr ? 'Beurre de karité' : 'Shea Butter',
        'price': '450 XOF/kg',
        'change': '+12%',
        'up': true,
      },
      {
        'name': isFr ? 'Sésame' : 'Sesame',
        'price': '380 XOF/kg',
        'change': '+3%',
        'up': true,
      },
      {
        'name': isFr ? 'Noix de cajou' : 'Cashew',
        'price': '920 XOF/kg',
        'change': '+8%',
        'up': true,
      },
      {
        'name': isFr ? 'Arachides' : 'Groundnuts',
        'price': '280 XOF/kg',
        'change': '-1%',
        'up': false,
      },
      {
        'name': isFr ? 'Coton' : 'Cotton',
        'price': '265 XOF/kg',
        'change': '+5%',
        'up': true,
      },
      {
        'name': isFr ? 'Mil' : 'Millet',
        'price': '185 XOF/kg',
        'change': '+2%',
        'up': true,
      },
    ];

    return RefreshIndicator(
      color: _gold,
      backgroundColor: _surface,
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: SafeInsets.listBottom(context),
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1a2744), Color(0xFF0f1a33)],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final narrow = constraints.maxWidth < 300;
                final title = isFr
                    ? 'Accédez au portail complet'
                    : 'Access Full Portal';
                final subtitle = isFr
                    ? 'Investissez, gérez et suivez vos retours sur afriyieldexchange.com'
                    : 'Invest, manage and track your returns on afriyieldexchange.com';
                final note = isFr
                    ? 'Détails complets et paiement sur afriyieldexchange.com'
                    : 'Full details and payment on afriyieldexchange.com';
                final openButton = GestureDetector(
                  onTap: () async {
                    final uri = Uri.parse('https://afriyieldexchange.com');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.gold,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isFr ? 'Ouvrir' : 'Open',
                      style: const TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                );
                final copy = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      note,
                      style: TextStyle(
                        color: AppColors.gold.withValues(alpha: 0.85),
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                );
                if (narrow) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('💻', style: TextStyle(fontSize: 24)),
                      const SizedBox(height: 10),
                      copy,
                      const SizedBox(height: 12),
                      openButton,
                    ],
                  );
                }
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('💻', style: TextStyle(fontSize: 24)),
                    const SizedBox(width: 12),
                    Expanded(child: copy),
                    const SizedBox(width: 8),
                    openButton,
                  ],
                );
              },
            ),
          ),
          Text(
            isFr ? 'Mouvements du marché' : 'Market Movement',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isFr
                ? 'Prix des matières premières africaines — mis à jour quotidiennement'
                : 'African commodity prices — updated daily',
            style: const TextStyle(color: _muted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          ...commodities.map((c) {
            final up = c['up'] as bool;
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
                  const Icon(
                    Icons.eco_outlined,
                    color: Color(0xFF10B981),
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      c['name'] as String,
                      style: const TextStyle(
                        color: _text,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    c['price'] as String,
                    style: const TextStyle(color: _muted, fontSize: 12),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
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
                ],
              ),
            );
          }),
          const SizedBox(height: 20),
          Text(
            isFr
                ? 'Opportunités d\'investissement'
                : 'Investment Opportunities',
            style: const TextStyle(
              color: _text,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          if (loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: CircularProgressIndicator(color: _gold),
              ),
            )
          else if (opportunities.isEmpty) ...[
            _OpportunityCard(
              title: isFr ? 'Coopérative Karité Mali' : 'Mali Shea Cooperative',
              subtitle: isFr
                  ? 'Beurre de karité certifié bio'
                  : 'Certified organic shea butter',
              returnRate: 15.0,
              minInvestment: 500,
              progress: 0.65,
              isFr: isFr,
            ),
            const SizedBox(height: 10),
            _OpportunityCard(
              title: isFr ? 'Union Sésame Sahel' : 'Sahel Sesame Union',
              subtitle: isFr
                  ? 'Export sésame Europe & Asie'
                  : 'Sesame export Europe & Asia',
              returnRate: 12.5,
              minInvestment: 1000,
              progress: 0.42,
              isFr: isFr,
            ),
            const SizedBox(height: 10),
            _OpportunityCard(
              title:
                  isFr ? 'Projet Noix Cajou Sikasso' : 'Sikasso Cashew Project',
              subtitle: isFr
                  ? 'Transformation locale noix de cajou'
                  : 'Local cashew processing',
              returnRate: 18.0,
              minInvestment: 2500,
              progress: 0.28,
              isFr: isFr,
            ),
          ] else
            ...opportunities.map((opp) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _OpportunityCard(
                  title: _oppTitle(opp, isFr),
                  subtitle: _oppSubtitle(opp),
                  returnRate: _oppReturnRate(opp),
                  minInvestment: _oppMinInvestment(opp),
                  progress: _oppProgress(opp),
                  isFr: isFr,
                ),
              );
            }),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 2: ACTIVITY
// ══════════════════════════════════════════════════════════════
class _ActivityTab extends StatelessWidget {
  const _ActivityTab({
    required this.investments,
    required this.isFr,
  });

  final List<Map<String, dynamic>> investments;
  final bool isFr;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        Text(
          isFr ? 'Mon activité' : 'My Activity',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (investments.isEmpty)
          _emptyState(
            Icons.receipt_long_outlined,
            isFr ? 'Aucune activité' : 'No activity yet',
            isFr
                ? 'Vos investissements apparaîtront ici'
                : 'Your investments will appear here',
          )
        else
          ...investments.map((inv) {
            final name = inv['opportunityName']?.toString() ??
                inv['cooperativeName']?.toString() ??
                (isFr ? 'Investissement' : 'Investment');
            final schedule = inv['payoutSchedule'];
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
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
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(
                            color: _text,
                            fontSize: 14,
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
                          color: Colors.green.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          isFr ? 'Actif' : 'Active',
                          style: const TextStyle(
                            color: Colors.green,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _invStat(
                        '\$${inv['amountDeployed'] ?? 0}',
                        isFr ? 'Déployé' : 'Deployed',
                      ),
                      const SizedBox(width: 16),
                      _invStat(
                        '${inv['expectedROIPercent'] ?? 0}%',
                        isFr ? 'ROI attendu' : 'Expected ROI',
                      ),
                      const SizedBox(width: 16),
                      _invStat(
                        inv['deploymentDate']?.toString().split('T').first ??
                            '—',
                        isFr ? 'Déploiement' : 'Deployed',
                      ),
                    ],
                  ),
                  if (schedule is List && schedule.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      isFr ? 'Échéancier' : 'Payout schedule',
                      style: const TextStyle(
                        color: _muted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    ...schedule.map((p) {
                      if (p is! Map) return const SizedBox.shrink();
                      final m = Map<String, dynamic>.from(p);
                      final status = m['status']?.toString() ?? '';
                      final dateStr =
                          m['payoutDate']?.toString().split('T').first ?? '';
                      final isPaid = status == 'paid';
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                dateStr,
                                style: const TextStyle(
                                  color: _muted,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                            Text(
                              isPaid
                                  ? (isFr ? 'payé' : 'paid')
                                  : (isFr ? 'prévu' : 'scheduled'),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: isPaid ? Colors.greenAccent : _gold,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _invStat(String val, String label) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            val,
            style: const TextStyle(
              color: _gold,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(label, style: const TextStyle(color: _muted, fontSize: 10)),
        ],
      );
}

// ══════════════════════════════════════════════════════════════
// TAB 3: UPDATES
// ══════════════════════════════════════════════════════════════
class _UpdatesTab extends StatefulWidget {
  const _UpdatesTab({required this.isFr});

  final bool isFr;

  @override
  State<_UpdatesTab> createState() => _UpdatesTabState();
}

class _UpdatesTabState extends State<_UpdatesTab> {
  bool _alertsEnabled = false;
  final _alertPriceCtrl = TextEditingController();
  String _alertCrop = 'shea';

  @override
  void dispose() {
    _alertPriceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    final news = [
      {
        'emoji': '📈',
        'title': isFr
            ? 'AfriYield atteint 1000 investisseurs'
            : 'AfriYield reaches 1,000 investors',
        'body': isFr
            ? 'La plateforme AfriYield Exchange a franchi le cap des 1000 investisseurs actifs, avec 5,2M\$ déployés dans les coopératives d\'Afrique de l\'Ouest.'
            : 'The AfriYield Exchange platform has surpassed 1,000 active investors, with \$5.2M deployed across West African cooperatives.',
        'date': isFr ? 'Il y a 2 jours' : '2 days ago',
        'color': _gold,
      },
      {
        'emoji': '🌾',
        'title': isFr
            ? 'Saison karité 2026 — Perspectives'
            : 'Shea Season 2026 — Outlook',
        'body': isFr
            ? 'Les prévisions de production de beurre de karité pour 2026 indiquent une hausse de 15% en Mali et au Burkina Faso.'
            : 'Shea butter production forecasts for 2026 show a 15% increase in Mali and Burkina Faso.',
        'date': isFr ? 'Il y a 5 jours' : '5 days ago',
        'color': const Color(0xFF10B981),
      },
      {
        'emoji': '🤝',
        'title': isFr
            ? 'Nouveau partenariat — Union Européenne'
            : 'New Partnership — European Union',
        'body': isFr
            ? 'Sahel AgriConnect a signé un accord avec l\'UE pour certifier les coopératives partenaires selon les standards bio européens.'
            : 'Sahel AgriConnect has signed an agreement with the EU to certify partner cooperatives to European organic standards.',
        'date': isFr ? 'Il y a 1 semaine' : '1 week ago',
        'color': const Color(0xFF2196F3),
      },
      {
        'emoji': '💰',
        'title': isFr
            ? 'Paiements Q1 2026 — Confirmés'
            : 'Q1 2026 Payouts — Confirmed',
        'body': isFr
            ? 'Les paiements du premier trimestre 2026 ont été confirmés pour les investisseurs actifs.'
            : 'Q1 2026 payouts have been confirmed for active investors.',
        'date': isFr ? 'Il y a 2 semaines' : '2 weeks ago',
        'color': const Color(0xFF7B61FF),
      },
    ];

    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        Text(
          isFr ? 'Alertes de prix' : 'Price Alerts',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _border),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.notifications_active_outlined,
                    color: _gold,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      isFr
                          ? 'Activer les alertes de prix'
                          : 'Enable price alerts',
                      style: const TextStyle(
                        color: _text,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Switch(
                    value: _alertsEnabled,
                    activeTrackColor: _gold.withValues(alpha: 0.5),
                    thumbColor: WidgetStateProperty.resolveWith(
                      (states) => states.contains(WidgetState.selected) ? _gold : null,
                    ),
                    onChanged: (v) => setState(() => _alertsEnabled = v),
                  ),
                ],
              ),
              if (_alertsEnabled) ...[
                const Divider(color: _border),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _alertCrop,
                  dropdownColor: _surface,
                  style: const TextStyle(color: _text),
                  decoration: InputDecoration(
                    labelText: isFr ? 'Produit' : 'Commodity',
                    labelStyle: const TextStyle(color: _muted),
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
                      value: 'shea',
                      child: Text(
                        isFr ? 'Beurre de karité' : 'Shea Butter',
                        style: const TextStyle(color: _text),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'sesame',
                      child: Text(
                        isFr ? 'Sésame' : 'Sesame',
                        style: const TextStyle(color: _text),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'cashew',
                      child: Text(
                        isFr ? 'Noix de cajou' : 'Cashew',
                        style: const TextStyle(color: _text),
                      ),
                    ),
                  ],
                  onChanged: (v) => setState(() => _alertCrop = v ?? 'shea'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _alertPriceCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: _text),
                  decoration: InputDecoration(
                    labelText: isFr
                        ? 'Alerte si prix > (XOF/kg)'
                        : 'Alert when price > (XOF/kg)',
                    labelStyle: const TextStyle(color: _muted),
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
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _gold,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            isFr ? '✅ Alerte enregistrée !' : '✅ Alert saved!',
                          ),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    child: Text(
                      isFr ? 'Enregistrer l\'alerte' : 'Save Alert',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          isFr ? 'Actualités de la plateforme' : 'Platform News',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        ...news.map((n) {
          final color = n['color'] as Color;
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_surface, _surface2]),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 5),
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        n['title'] as String,
                        style: const TextStyle(
                          color: _text,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        n['body'] as String,
                        style: const TextStyle(
                          color: _muted,
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        n['date'] as String,
                        style: TextStyle(
                          color: _muted.withValues(alpha: 0.5),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

class _KycAccountStatusCard extends StatelessWidget {
  const _KycAccountStatusCard({
    required this.kyc,
    required this.hasInvestments,
    required this.isFr,
  });

  final Map<String, dynamic> kyc;
  final bool hasInvestments;
  final bool isFr;

  String _line(String key, String en, String fr) {
    final status = kyc['status']?.toString() ?? 'not_started';
    final paid = kyc['paymentVerified'] == true;
    switch (key) {
      case 'kyc':
        if (status == 'approved') return isFr ? '✓ KYC approuvé' : '✓ KYC approved';
        if (['pending_review', 'pending_kyc', 'african_pending_review']
            .contains(status)) {
          return isFr ? '⏳ KYC en cours d\'examen' : '⏳ KYC under review';
        }
        if (status == 'rejected') {
          return isFr ? '✗ KYC refusé' : '✗ KYC declined';
        }
        return isFr ? '○ KYC à compléter' : '○ KYC pending';
      case 'payment':
        return paid
            ? (isFr ? '✓ Paiement reçu' : '✓ Payment received')
            : (isFr ? '○ Paiement en attente' : '○ Payment pending');
      case 'investment':
        return hasInvestments
            ? (isFr ? '✓ Investissement actif' : '✓ Investment active')
            : (isFr ? '○ Investissement en traitement' : '○ Investment processing');
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _gold.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFr ? 'État de votre compte' : 'Your account status',
            style: const TextStyle(
              color: _gold,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isFr
                ? 'Votre investissement apparaît après paiement confirmé et KYC approuvé.'
                : 'Your investment appears after payment is confirmed and KYC is approved.',
            style: const TextStyle(color: _muted, fontSize: 11, height: 1.4),
          ),
          const SizedBox(height: 12),
          Text(_line('kyc', '', ''), style: const TextStyle(color: _text, fontSize: 13)),
          const SizedBox(height: 6),
          Text(_line('payment', '', ''), style: const TextStyle(color: _text, fontSize: 13)),
          const SizedBox(height: 6),
          Text(_line('investment', '', ''), style: const TextStyle(color: _text, fontSize: 13)),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 4: ACCOUNT
// ══════════════════════════════════════════════════════════════
class _InvestorAccountTab extends StatelessWidget {
  const _InvestorAccountTab({
    required this.isFr,
    required this.kycStatus,
    required this.hasInvestments,
    required this.onTabChange,
  });

  final bool isFr;
  final Map<String, dynamic>? kycStatus;
  final bool hasInvestments;
  final ValueChanged<int> onTabChange;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = auth.displayName.isNotEmpty ? auth.displayName : 'Investor';
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
              colors: [Color(0xFF1a2744), Color(0xFF243358)],
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
                    colors: [_gold, Color(0xFFE8B84B)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: _gold.withValues(alpha: 0.4),
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
                        color: _gold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _gold.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        isFr
                            ? '💰 Investisseur AfriYield'
                            : '💰 AfriYield Investor',
                        style: const TextStyle(
                          color: _gold,
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
        if (kycStatus != null && (!hasInvestments || kycStatus!['paymentVerified'] != true))
          _KycAccountStatusCard(
            kyc: kycStatus!,
            hasInvestments: hasInvestments,
            isFr: isFr,
          ),
        if (kycStatus != null && (!hasInvestments || kycStatus!['paymentVerified'] != true))
          const SizedBox(height: 16),
        _section(isFr ? 'NAVIGATION' : 'NAVIGATION', [
          _tile(
            context,
            Icons.account_balance_wallet_outlined,
            const Color(0xFF10B981),
            isFr ? 'Retour au portefeuille' : 'Back to Portfolio',
            isFr ? 'Vue principale investisseur' : 'Main investor view',
            () => onTabChange(0),
          ),
          _tile(
            context,
            Icons.exit_to_app_outlined,
            _muted,
            isFr ? 'Quitter vers l\'accueil' : 'Exit to Main Home',
            isFr
                ? 'Page principale de la plateforme'
                : 'Main platform home page',
            () => context.go('/home'),
          ),
        ]),
        const SizedBox(height: 14),
        _section(isFr ? 'MON PROFIL' : 'MY PROFILE', [
          _tile(
            context,
            Icons.person_outline,
            _gold,
            isFr ? 'Modifier le profil' : 'Edit Profile',
            isFr ? 'Nom, pays, préférences' : 'Name, country, preferences',
            () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => _EditProfileScreen(isFr: isFr),
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
        _section(isFr ? 'SÉCURITÉ' : 'SECURITY', [
          _tile(
            context,
            Icons.phone_outlined,
            const Color(0xFF2196F3),
            isFr ? 'Mettre à jour le téléphone' : 'Update Phone',
            isFr ? 'Changer votre numéro' : 'Change your number',
            () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => _UpdateCredentialScreen(
                  isFr: isFr,
                  type: 'phone',
                ),
              ),
            ),
          ),
          _tile(
            context,
            Icons.email_outlined,
            const Color(0xFF2196F3),
            isFr ? 'Mettre à jour l\'email' : 'Update Email',
            isFr ? 'Changer votre adresse email' : 'Change your email',
            () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => _UpdateCredentialScreen(
                  isFr: isFr,
                  type: 'email',
                ),
              ),
            ),
          ),
        ]),
        const SizedBox(height: 14),
        _section('SUPPORT', [
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
            isFr
                ? 'Comment nous utilisons vos données'
                : 'How we use your data',
            () => context.push('/terms?view=1&tab=1'),
          ),
        ]),
        const SizedBox(height: 16),
        Center(
          child: Column(
            children: [
              Text(
                'AfriYield Exchange v1.1.0',
                style: TextStyle(
                  color: _muted.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '💰 Invest. Grow. Impact.',
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
              side: BorderSide(color: Colors.red.withValues(alpha: 0.4)),
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
                builder: (dialogContext) => AlertDialog(
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
                      onPressed: () => Navigator.pop(dialogContext, false),
                      child: Text(
                        isFr ? 'Annuler' : 'Cancel',
                        style: const TextStyle(color: _muted),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(dialogContext, true),
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

  Widget _section(String title, List<Widget> items) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
      ]);

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

class _EditProfileScreen extends StatefulWidget {
  const _EditProfileScreen({required this.isFr});

  final bool isFr;

  @override
  State<_EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<_EditProfileScreen> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _countryCtrl;
  late final TextEditingController _phoneCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthState>();
    _nameCtrl = TextEditingController(text: auth.displayName);
    _countryCtrl = TextEditingController(text: auth.displayCountry);
    _phoneCtrl = TextEditingController(text: auth.displayPhone);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _countryCtrl.dispose();
    _phoneCtrl.dispose();
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
          widget.isFr
              ? '✅ Profil mis à jour avec succès'
              : '✅ Profile updated successfully',
        ),
        backgroundColor: Colors.green,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Scaffold(
      backgroundColor: _bg,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a2744),
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
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: EdgeInsets.fromLTRB(
          16,
          16,
          16,
          SafeInsets.bottom(context, extra: 100),
        ),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _lbl(isFr ? 'Nom complet' : 'Full Name'),
              _tf(_nameCtrl, isFr ? 'Votre nom' : 'Your name'),
              const SizedBox(height: 14),
              _lbl(isFr ? 'Pays' : 'Country'),
              _tf(_countryCtrl, isFr ? 'Votre pays' : 'Your country'),
              const SizedBox(height: 14),
              _lbl(isFr ? 'Téléphone' : 'Phone'),
              _tf(
                _phoneCtrl,
                '+1 / +33 / +223...',
                type: TextInputType.phone,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _gold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.black,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          isFr ? 'Enregistrer' : 'Save Changes',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _lbl(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(
          t,
          style: const TextStyle(
            color: _muted,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      );

  Widget _tf(
    TextEditingController c,
    String hint, {
    TextInputType type = TextInputType.text,
  }) =>
      TextField(
        controller: c,
        keyboardType: type,
        style: const TextStyle(color: _text, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: _muted, fontSize: 13),
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
            borderSide: const BorderSide(color: _gold),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
        ),
      );
}

class _UpdateCredentialScreen extends StatefulWidget {
  const _UpdateCredentialScreen({
    required this.isFr,
    required this.type,
  });

  final bool isFr;
  final String type;

  @override
  State<_UpdateCredentialScreen> createState() =>
      _UpdateCredentialScreenState();
}

class _UpdateCredentialScreenState extends State<_UpdateCredentialScreen> {
  final _newCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _otpSent = false;
  bool _saving = false;

  @override
  void dispose() {
    _newCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (_newCtrl.text.isEmpty) return;
    setState(() => _saving = true);
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _saving = false);
    setState(() => _otpSent = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          widget.isFr
              ? '📱 Code envoyé à ${_newCtrl.text}'
              : '📱 Code sent to ${_newCtrl.text}',
        ),
        backgroundColor: const Color(0xFF2196F3),
      ),
    );
  }

  Future<void> _confirm() async {
    if (_otpCtrl.text.length < 4) return;
    setState(() => _saving = true);
    final auth = context.read<AuthState>();
    if (widget.type == 'phone') {
      auth.updateLocalProfile(phone: _newCtrl.text.trim());
    } else {
      auth.updateLocalProfile(email: _newCtrl.text.trim());
    }
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          widget.isFr
              ? '✅ ${widget.type == 'phone' ? 'Téléphone' : 'Email'} mis à jour !'
              : '✅ ${widget.type == 'phone' ? 'Phone' : 'Email'} updated!',
        ),
        backgroundColor: Colors.green,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    final isPhone = widget.type == 'phone';
    return Scaffold(
      backgroundColor: _bg,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a2744),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isFr
              ? (isPhone
                  ? 'Mettre à jour le téléphone'
                  : 'Mettre à jour l\'email')
              : (isPhone ? 'Update Phone' : 'Update Email'),
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: EdgeInsets.fromLTRB(
          16,
          16,
          16,
          SafeInsets.bottom(context, extra: 100),
        ),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_surface, _surface2]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isFr
                    ? (isPhone
                        ? 'Nouveau numéro de téléphone'
                        : 'Nouvelle adresse email')
                    : (isPhone ? 'New Phone Number' : 'New Email Address'),
                style: const TextStyle(
                  color: _muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _newCtrl,
                enabled: !_otpSent,
                keyboardType:
                    isPhone ? TextInputType.phone : TextInputType.emailAddress,
                style: const TextStyle(color: _text),
                decoration: InputDecoration(
                  hintText:
                      isPhone ? '+1 / +33 / +223...' : 'email@example.com',
                  hintStyle: const TextStyle(color: _muted, fontSize: 13),
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
                    borderSide: const BorderSide(color: _gold),
                  ),
                ),
              ),
              if (!_otpSent) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _gold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _saving ? null : _sendOtp,
                    child: _saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.black,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            isFr ? 'Envoyer le code' : 'Send Code',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ] else ...[
                const SizedBox(height: 14),
                Text(
                  isFr ? 'Code de vérification' : 'Verification Code',
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _otpCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(
                    color: _text,
                    fontSize: 18,
                    letterSpacing: 4,
                  ),
                  decoration: InputDecoration(
                    hintText: '••••••',
                    hintStyle: const TextStyle(color: _muted),
                    filled: true,
                    fillColor: _bg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: _gold),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(
                        color: Colors.white.withValues(alpha: 0.15),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: _gold),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(
                            color: _muted.withValues(alpha: 0.3),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: () => setState(() => _otpSent = false),
                        child: Text(
                          isFr ? 'Changer' : 'Change',
                          style: const TextStyle(color: _muted),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _gold,
                          foregroundColor: Colors.black,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: _saving ? null : _confirm,
                        child: _saving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  color: Colors.black,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                isFr ? 'Confirmer' : 'Confirm',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

Widget _emptyState(IconData icon, String title, String subtitle) => Container(
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
