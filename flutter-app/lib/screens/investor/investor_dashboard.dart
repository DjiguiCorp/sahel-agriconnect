import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import '../../widgets/web_action_tile.dart';
import '../shared/webview_screen.dart';

typedef _OppCardBuilder = Widget Function({
  required LanguageProvider lp,
  required String title,
  required String subtitle,
  required double progress,
  required int delay,
  required String opportunityId,
  required String roiLabel,
});

/// AfriYield investor experience — deep navy, gold accents.
abstract final class _Inv {
  static const Color bg = Color(0xFF0A1628);
  static const Color gold = Color(0xFFB5850A);
  static const LinearGradient headerGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1a2744), Color(0xFF243358)],
  );
  static const LinearGradient cardGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1a2744), Color(0xFF0f1a33)],
  );
}

class InvestorDashboard extends StatefulWidget {
  const InvestorDashboard({super.key});

  @override
  State<InvestorDashboard> createState() => _InvestorDashboardState();
}

class _InvestorDashboardState extends State<InvestorDashboard> {
  int _tab = 0;
  List<Map<String, dynamic>> _investments = [];
  List<Map<String, dynamic>> _opportunities = [];
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

  String _formatEuroThousands(double v) {
    final s = v.round().toString();
    return s.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
  }

  String _oppRoiRange(Map<String, dynamic> opp) {
    final min =
        num.tryParse(opp['expectedROIMin']?.toString() ?? '') ?? 12;
    final max =
        num.tryParse(opp['expectedROIMax']?.toString() ?? '') ?? 25;
    return '${min.toStringAsFixed(0)}–${max.toStringAsFixed(0)}%';
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    final email = auth.displayEmail;
    try {
      final results = await Future.wait([
        if (email.isNotEmpty)
          ApiService.get(
            '/api/investments/investor/${Uri.encodeComponent(email)}',
            token: token,
          )
        else
          Future.value(<String, dynamic>{}),
        ApiService.getOpportunities(token: token),
      ]);
      if (!mounted) return;
      final invRaw = results[0]['investments'];
      final invList = <Map<String, dynamic>>[];
      if (invRaw is List) {
        for (final e in invRaw) {
          if (e is Map) invList.add(Map<String, dynamic>.from(e));
        }
      }
      final oppRaw = results[1]['opportunities'];
      final oppList = <Map<String, dynamic>>[];
      if (oppRaw is List) {
        for (final e in oppRaw) {
          if (e is Map) oppList.add(Map<String, dynamic>.from(e));
        }
      }
      setState(() {
        _investments = invList;
        _opportunities = oppList;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  double _fundedFraction(Map<String, dynamic> opp) {
    final sought = num.tryParse(opp['amountSought']?.toString() ?? '0') ?? 0;
    final raised = num.tryParse(opp['amountRaised']?.toString() ?? '0') ?? 0;
    if (sought <= 0) return 0;
    return (raised / sought.toDouble()).clamp(0.0, 1.0);
  }

  String _oppTitle(Map<String, dynamic> opp) =>
      opp['centerName']?.toString() ??
      opp['title']?.toString() ??
      'Opportunity';

  String _oppSubtitle(Map<String, dynamic> opp) =>
      opp['commodity']?.toString() ?? '';

  String _oppId(Map<String, dynamic> opp) =>
      opp['_id']?.toString() ?? opp['id']?.toString() ?? '';

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final balanceLabel = _loading
        ? '…'
        : '€ ${_formatEuroThousands(_totalDeployed)}';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: _Inv.bg,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: _tab == 0
                ? RefreshIndicator(
                    color: _Inv.gold,
                    backgroundColor: const Color(0xFF1a2744),
                    onRefresh: _load,
                    child: CustomScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      slivers: [
                        SliverToBoxAdapter(
                          child: _InvestorHomeHeader(
                            lp: lp,
                            portfolioValue: balanceLabel,
                            returnsPct: _loading
                                ? '—'
                                : '${_avgRoi.toStringAsFixed(1)}%',
                            positions: _loading
                                ? '—'
                                : '${_investments.length}',
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: _InvestorHomeBody(
                            lp: lp,
                            loading: _loading,
                            opportunities: _opportunities,
                            investments: _investments,
                            opportunityCard: _opportunityCard,
                            fundedFraction: _fundedFraction,
                            oppTitle: _oppTitle,
                            oppSubtitle: _oppSubtitle,
                            oppId: _oppId,
                            oppRoiRange: _oppRoiRange,
                          ),
                        ),
                      ],
                    ),
                  )
                : _buildSecondaryTab(_tab, lp),
          ),
        ],
      ),
      bottomNavigationBar: _InvestorBottomNav(
        tab: _tab,
        lp: lp,
        onChanged: (i) {
          AuthService.resetActivity();
          setState(() => _tab = i);
        },
      ),
    ),
    );
  }

  Widget _buildSecondaryTab(int tab, LanguageProvider lp) {
    switch (tab) {
      case 1:
        return _DealsTab(
          opportunities: _opportunities,
          loading: _loading,
          opportunityCard: _opportunityCard,
          fundedFraction: _fundedFraction,
          oppTitle: _oppTitle,
          oppSubtitle: _oppSubtitle,
          oppId: _oppId,
          oppRoiRange: _oppRoiRange,
        );
      case 2:
        return _PortfolioInvestmentsTab(
          investments: _investments,
          loading: _loading,
          lp: lp,
        );
      case 3:
        return _InvestorAccountTab(lp: lp);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _opportunityCard({
    required LanguageProvider lp,
    required String title,
    required String subtitle,
    required double progress,
    required int delay,
    required String opportunityId,
    required String roiLabel,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: _Inv.cardGrad,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
          width: 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _Inv.gold.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _Inv.gold.withValues(alpha: 0.35),
                  ),
                ),
                child: Text(
                  roiLabel,
                  style: const TextStyle(
                    color: _Inv.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.45),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              valueColor: const AlwaysStoppedAnimation<Color>(_Inv.gold),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${(progress * 100).round()}% ${lp.t('funded', 'financé')}',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.35),
              fontSize: 10,
            ),
          ),
          const Divider(height: 24, color: Color(0x22FFFFFF)),
          WebActionTile(
            title: 'Invest in this opportunity',
            description: 'Complete your investment on our secure platform',
            action: 'invest',
            opportunityId: opportunityId,
            icon: Icons.trending_up,
            titleColor: Colors.white,
            subtitleColor: Colors.white70,
          ),
        ],
      ),
    )
        .animate(delay: Duration(milliseconds: delay))
        .fadeIn(duration: 300.ms)
        .slideY(begin: 0.06);
  }
}

class _InvestorHomeHeader extends StatelessWidget {
  const _InvestorHomeHeader({
    required this.lp,
    required this.portfolioValue,
    required this.returnsPct,
    required this.positions,
  });

  final LanguageProvider lp;
  final String portfolioValue;
  final String returnsPct;
  final String positions;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: _Inv.headerGrad),
      child: Stack(
        children: [
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _Inv.gold.withValues(alpha: 0.06),
              ),
            ),
          ),
          Positioned(
            bottom: -40,
            left: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _Inv.gold.withValues(alpha: 0.04),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lp.t('AfriYield Exchange', 'AfriYield Exchange'),
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            lp.t('Investor Portal', 'Portail investisseur'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      GestureDetector(
                        onTap: () => context.go('/home'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
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
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      _InvestorStatCard(
                        label: lp.t('Portfolio', 'Portefeuille'),
                        value: portfolioValue,
                        icon: Icons.account_balance_wallet_outlined,
                      ),
                      const SizedBox(width: 10),
                      _InvestorStatCard(
                        label: lp.t('Returns', 'Rendement'),
                        value: returnsPct,
                        icon: Icons.trending_up,
                      ),
                      const SizedBox(width: 10),
                      _InvestorStatCard(
                        label: lp.t('Positions', 'Positions'),
                        value: positions,
                        icon: Icons.pie_chart_outline,
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
}

class _InvestorStatCard extends StatelessWidget {
  const _InvestorStatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          gradient: _Inv.cardGrad,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: _Inv.gold.withValues(alpha: 0.85), size: 18),
            const SizedBox(height: 8),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w800,
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

class _InvestorHomeBody extends StatelessWidget {
  const _InvestorHomeBody({
    required this.lp,
    required this.loading,
    required this.opportunities,
    required this.investments,
    required this.opportunityCard,
    required this.fundedFraction,
    required this.oppTitle,
    required this.oppSubtitle,
    required this.oppId,
    required this.oppRoiRange,
  });

  final LanguageProvider lp;
  final bool loading;
  final List<Map<String, dynamic>> opportunities;
  final List<Map<String, dynamic>> investments;
  final _OppCardBuilder opportunityCard;
  final double Function(Map<String, dynamic>) fundedFraction;
  final String Function(Map<String, dynamic>) oppTitle;
  final String Function(Map<String, dynamic>) oppSubtitle;
  final String Function(Map<String, dynamic>) oppId;
  final String Function(Map<String, dynamic>) oppRoiRange;

  @override
  Widget build(BuildContext context) {
    final featured = opportunities.take(4).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _invSectionTitle(
            lp.t('Featured opportunities', 'Opportunités à la une'),
          ),
          const SizedBox(height: 12),
          if (loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: CircularProgressIndicator(color: _Inv.gold),
              ),
            )
          else if (featured.isEmpty)
            Text(
              lp.t(
                'No open opportunities at this time. Check the Exchange tab.',
                'Aucune opportunité pour le moment. Voir l’onglet Bourse.',
              ),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 13,
              ),
            )
          else
            ...featured.asMap().entries.map((e) {
              final opp = e.value;
              final funded = fundedFraction(opp);
              return Padding(
                padding: EdgeInsets.only(bottom: e.key < featured.length - 1 ? 12 : 0),
                child: opportunityCard(
                  lp: lp,
                  title: oppTitle(opp),
                  subtitle: oppSubtitle(opp),
                  progress: funded.clamp(0.0, 1.0),
                  delay: e.key * 80,
                  opportunityId: oppId(opp),
                  roiLabel: oppRoiRange(opp),
                ),
              );
            }),
          const SizedBox(height: 28),
          _invSectionTitle(
            lp.t('How AfriYield works', 'Comment fonctionne AfriYield'),
          ),
          const SizedBox(height: 12),
          _howStep(
            lp,
            '1',
            lp.t('Discover vetted opportunities', 'Découvrir des opportunités validées'),
            lp.t(
              'Browse cooperatives and commodities with transparent funding targets.',
              'Parcourez coopératives et produits avec des objectifs clairs.',
            ),
          ),
          const SizedBox(height: 10),
          _howStep(
            lp,
            '2',
            lp.t('Invest on the secure web platform', 'Investir sur la plateforme web sécurisée'),
            lp.t(
              'Complete KYC and payments with escrow-protected milestones.',
              'Complétez la vérification et les paiements avec séquestre par étapes.',
            ),
          ),
          const SizedBox(height: 10),
          _howStep(
            lp,
            '3',
            lp.t('Track payouts & impact', 'Suivre les paiements et l’impact'),
            lp.t(
              'Follow schedules, alerts, and market updates in this app.',
              'Suivez échéances, alertes et actualités marché dans cette app.',
            ),
          ),
          const SizedBox(height: 28),
          _invSectionTitle(
            lp.t('My investments', 'Mes investissements'),
          ),
          const SizedBox(height: 12),
          if (investments.isEmpty)
            _invGlassCard(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _Inv.gold.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.savings_outlined,
                      color: _Inv.gold.withValues(alpha: 0.9),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lp.t('No positions yet', 'Aucune position'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          lp.t(
                            'Start with Featured opportunities or open the Exchange tab.',
                            'Commencez par les opportunités à la une ou l’onglet Bourse.',
                          ),
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else
            ...investments.take(3).map((inv) {
              final name =
                  inv['investorName']?.toString() ?? lp.t('Investment', 'Investissement');
              final amt =
                  num.tryParse(inv['amountDeployed']?.toString() ?? '0') ?? 0;
              final cur = inv['currency']?.toString() ?? 'EUR';
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _invGlassCard(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    subtitle: Text(
                      '€ ${amt.toStringAsFixed(0)} · $cur',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 12,
                      ),
                    ),
                    trailing: Icon(
                      Icons.chevron_right,
                      color: _Inv.gold.withValues(alpha: 0.6),
                    ),
                  ),
                ),
              );
            }),
          const SizedBox(height: 28),
          _invSectionTitle(
            lp.t('Updates & alerts', 'Mises à jour et alertes'),
          ),
          const SizedBox(height: 12),
          _UpdateGlassCard(
            icon: Icons.notifications_active_outlined,
            title: lp.t('Investment alerts', 'Alertes investissement'),
            subtitle: lp.t(
              'Milestones, payouts, and opportunity status — configure on the web portal.',
              'Jalons, paiements et statut des opportunités — sur le portail web.',
            ),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => InAppWebViewScreen(
                  title: lp.t('Investor portal', 'Portail investisseur'),
                  url: 'https://sahelagriconnect.com/afri-yield/investor-portal',
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          _UpdateGlassCard(
            icon: Icons.show_chart,
            title: lp.t('Market movements', 'Mouvements de marché'),
            subtitle: lp.t(
              'Shea, sesame, cashew benchmarks and diaspora demand signals.',
              'Références karité, sésame, cajou et demande diaspora.',
            ),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const InAppWebViewScreen(
                  title: 'AfriYield Exchange',
                  url: 'https://sahelagriconnect.com/afri-yield/marketplace',
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          _UpdateGlassCard(
            icon: Icons.campaign_outlined,
            title: lp.t('Platform news', 'Actualités plateforme'),
            subtitle: lp.t(
              'Roadmap, partner announcements, and compliance updates.',
              'Feuille de route, partenaires et conformité.',
            ),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => InAppWebViewScreen(
                  title: lp.t('Investor updates', 'Actualités investisseurs'),
                  url: 'https://sahelagriconnect.com/afri-yield/investor-updates',
                ),
              ),
            ),
          ),
          const SizedBox(height: 28),
          _invSectionTitle(lp.t('Risk disclaimer', 'Avertissement sur les risques')),
          const SizedBox(height: 8),
          Text(
            lp.t(
              'Investments in agricultural value chains carry risk including crop failure, '
              'currency fluctuation, and counterparty default. Past performance does not '
              'guarantee future returns. Review all documents on the web platform and '
              'consult independent advisors before investing.',
              'Les investissements agricoles comportent des risques (récolte, devise, contrepartie). '
              'Les résultats passés ne préjugent pas des gains futurs. Consultez les documents '
              'sur le web et des conseillers indépendants avant d’investir.',
            ),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.35),
              fontSize: 11,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _howStep(
    LanguageProvider lp,
    String step,
    String title,
    String body,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: _Inv.cardGrad,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: _Inv.gold.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              step,
              style: const TextStyle(
                color: _Inv.gold,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
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
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _invSectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: _Inv.gold,
        fontSize: 16,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.2,
      ),
    );
  }

  Widget _invGlassCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF1a2744).withValues(alpha: 0.85),
            const Color(0xFF0f1a33).withValues(alpha: 0.95),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
          ),
        ],
      ),
      child: child,
    );
  }
}

class _UpdateGlassCard extends StatelessWidget {
  const _UpdateGlassCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF1a2744).withValues(alpha: 0.9),
                const Color(0xFF0f1a33).withValues(alpha: 0.95),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _Inv.gold.withValues(alpha: 0.15),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _Inv.gold.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: _Inv.gold, size: 22),
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
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.open_in_new,
                size: 16,
                color: Colors.white.withValues(alpha: 0.35),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InvestorBottomNav extends StatelessWidget {
  const _InvestorBottomNav({
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
        color: _Inv.bg,
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
          currentIndex: tab.clamp(0, 3),
          onTap: onChanged,
          type: BottomNavigationBarType.fixed,
          backgroundColor: _Inv.bg,
          selectedItemColor: AppColors.gold,
          unselectedItemColor: Colors.white38,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: lp.t('Home', 'Accueil'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.trending_up_outlined),
              activeIcon: const Icon(Icons.trending_up),
              label: lp.t('Exchange', 'Bourse'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.pie_chart_outline),
              activeIcon: const Icon(Icons.pie_chart),
              label: lp.t('Portfolio', 'Portefeuille'),
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

class _DealsTab extends StatelessWidget {
  const _DealsTab({
    required this.opportunities,
    required this.loading,
    required this.opportunityCard,
    required this.fundedFraction,
    required this.oppTitle,
    required this.oppSubtitle,
    required this.oppId,
    required this.oppRoiRange,
  });

  final List<Map<String, dynamic>> opportunities;
  final bool loading;
  final _OppCardBuilder opportunityCard;
  final double Function(Map<String, dynamic>) fundedFraction;
  final String Function(Map<String, dynamic>) oppTitle;
  final String Function(Map<String, dynamic>) oppSubtitle;
  final String Function(Map<String, dynamic>) oppId;
  final String Function(Map<String, dynamic>) oppRoiRange;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    if (loading) {
      return const Center(
        child: CircularProgressIndicator(color: _Inv.gold),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        if (opportunities.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Center(
              child: Text(
                lp.t(
                  'No open opportunities right now.',
                  'Aucune opportunité pour le moment.',
                ),
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ...opportunities.asMap().entries.map((entry) {
          final i = entry.key;
          final opp = entry.value;
          final funded = fundedFraction(opp);
          return Padding(
            padding: EdgeInsets.only(
              bottom: i < opportunities.length - 1 ? 12 : 0,
            ),
            child: opportunityCard(
              lp: lp,
              title: oppTitle(opp),
              subtitle: oppSubtitle(opp),
              progress: funded.clamp(0.0, 1.0),
              delay: i * 60,
              opportunityId: oppId(opp),
              roiLabel: oppRoiRange(opp),
            ),
          );
        }),
        Padding(
          padding: const EdgeInsets.only(top: 16),
          child: GestureDetector(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const InAppWebViewScreen(
                  title: 'AfriYield Exchange',
                  url: 'https://sahelagriconnect.com/afri-yield/marketplace',
                ),
              ),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(
                  color: _Inv.gold.withValues(alpha: 0.4),
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.open_in_browser,
                    size: 16,
                    color: _Inv.gold.withValues(alpha: 0.95),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    lp.t('Open full marketplace', 'Ouvrir la place de marché'),
                    style: const TextStyle(
                      color: _Inv.gold,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PortfolioInvestmentsTab extends StatelessWidget {
  const _PortfolioInvestmentsTab({
    required this.investments,
    required this.loading,
    required this.lp,
  });

  final List<Map<String, dynamic>> investments;
  final bool loading;
  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: _Inv.gold));
    }
    if (investments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            lp.t(
              'No investment activity yet. Visit the Exchange tab to deploy capital.',
              'Aucun investissement pour l’instant. Onglet Bourse pour investir.',
            ),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 14,
            ),
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: investments.length,
      itemBuilder: (ctx, i) {
        final inv = investments[i];
        final name =
            inv['investorName']?.toString() ?? lp.t('Investment', 'Investissement');
        final amt = num.tryParse(inv['amountDeployed']?.toString() ?? '0') ?? 0;
        final cur = inv['currency']?.toString() ?? 'EUR';
        final schedule = inv['payoutSchedule'];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: _Inv.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '€ ${amt.toStringAsFixed(0)} ${lp.t('deployed', 'déployés')} · $cur',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  fontSize: 12,
                ),
              ),
              if (schedule is List && schedule.isNotEmpty) ...[
                const SizedBox(height: 10),
                ...schedule.map((p) {
                  if (p is! Map) return const SizedBox.shrink();
                  final m = Map<String, dynamic>.from(p);
                  final status = m['status']?.toString() ?? '';
                  final dateStr = m['payoutDate']?.toString() ?? '';
                  final isPaid = status == 'paid';
                  final isScheduled = status == 'scheduled';
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            dateStr,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 11,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: isPaid
                                ? Colors.green.withValues(alpha: 0.2)
                                : isScheduled
                                    ? Colors.amber.withValues(alpha: 0.2)
                                    : Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: isPaid
                                  ? Colors.greenAccent
                                  : isScheduled
                                      ? Colors.amber.shade200
                                      : Colors.white70,
                            ),
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
      },
    );
  }
}

class _InvestorAccountTab extends StatelessWidget {
  const _InvestorAccountTab({required this.lp});

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
          expandedHeight: 188,
          pinned: true,
          backgroundColor: const Color(0xFF1a2744),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/investor'),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: _Inv.headerGrad),
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
                            _Inv.gold,
                            _Inv.gold.withValues(alpha: 0.65),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _Inv.gold.withValues(alpha: 0.35),
                            blurRadius: 18,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          initial,
                          style: const TextStyle(
                            color: Color(0xFF0A1628),
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      auth.displayName.isNotEmpty ? auth.displayName : 'Investor',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 19,
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
                        color: _Inv.gold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _Inv.gold.withValues(alpha: 0.35),
                        ),
                      ),
                      child: Text(
                        lp.t('💼 AfriYield Investor', '💼 Investisseur AfriYield'),
                        style: const TextStyle(
                          color: _Inv.gold,
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
                _InvAccountSection(
                  title: lp.t('Navigation', 'Navigation'),
                  children: [
                    _InvAccountTile(
                      icon: Icons.home_outlined,
                      iconColor: _Inv.gold,
                      title: lp.t('Back to Main Home', 'Retour à l’accueil'),
                      subtitle: lp.t(
                        'Platform overview & guest discovery',
                        'Découverte et aperçu de la plateforme',
                      ),
                      onTap: () => context.go('/home'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _InvAccountSection(
                  title: lp.t('Profile', 'Profil'),
                  children: [
                    _InvAccountTile(
                      icon: Icons.person_outline,
                      iconColor: _Inv.gold,
                      title: lp.t('Edit Profile', 'Modifier le profil'),
                      subtitle: lp.t(
                        'Name and public details',
                        'Nom et informations publiques',
                      ),
                      onTap: () => context.push('/profile/edit'),
                    ),
                    _InvAccountTile(
                      icon: Icons.language_outlined,
                      iconColor: const Color(0xFF7E9CCF),
                      title: lp.t('Language', 'Langue'),
                      subtitle: lp.t('English / Français', 'Anglais / Français'),
                      onTap: () => context.push('/profile/language'),
                    ),
                    _InvAccountTile(
                      icon: Icons.notifications_outlined,
                      iconColor: const Color(0xFFFFB74D),
                      title: lp.t('Notifications', 'Notifications'),
                      subtitle: lp.t('Alerts and email preferences', 'Alertes et e-mail'),
                      onTap: () => context.push('/profile/notifications'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _InvAccountSection(
                  title: lp.t('Security & account', 'Sécurité et compte'),
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        gradient: _Inv.cardGrad,
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
                              'Permanently remove your investor data',
                              'Supprimer définitivement vos données investisseur',
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
                            title: lp.t('Update credentials', 'Mettre à jour les identifiants'),
                            description: lp.t(
                              'Change password on the secure web portal',
                              'Changer le mot de passe sur le portail web',
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
                _InvAccountSection(
                  title: lp.t('Support', 'Support'),
                  children: [
                    _InvAccountTile(
                      icon: Icons.help_outline,
                      iconColor: const Color(0xFF81C784),
                      title: lp.t('Help Center', 'Centre d’aide'),
                      subtitle: lp.t('FAQs for investors', 'FAQ investisseurs'),
                      onTap: () => context.push('/help'),
                    ),
                    _InvAccountTile(
                      icon: Icons.gavel_outlined,
                      iconColor: Colors.white54,
                      title: lp.t('Terms of Service', 'Conditions d’utilisation'),
                      subtitle: lp.t('Legal terms', 'Mentions légales'),
                      onTap: () => context.push('/terms?view=1'),
                    ),
                    _InvAccountTile(
                      icon: Icons.privacy_tip_outlined,
                      iconColor: Colors.white54,
                      title: lp.t('Privacy Policy', 'Confidentialité'),
                      subtitle: lp.t('How we use your data', 'Traitement des données'),
                      onTap: () => context.push('/terms?view=1'),
                    ),
                    _InvAccountTile(
                      icon: Icons.language,
                      iconColor: const Color(0xFF64B5F6),
                      title: lp.t('Visit web portal', 'Portail web'),
                      subtitle: 'sahelagriconnect.com',
                      trailing: const _InvWebBadge(),
                      onTap: _openWeb,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Center(
                  child: Text(
                    lp.t('AfriYield Exchange', 'AfriYield Exchange'),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.25),
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final ok = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: const Color(0xFF1a2744),
                          title: Text(
                            lp.t('Sign out?', 'Déconnexion ?'),
                            style: const TextStyle(color: Colors.white),
                          ),
                          content: Text(
                            lp.t(
                              'Return to role selection.',
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
                              child: Text(
                                lp.t('Sign out', 'Déconnexion'),
                                style: const TextStyle(color: Colors.red),
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

class _InvAccountSection extends StatelessWidget {
  const _InvAccountSection({
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
            gradient: _Inv.cardGrad,
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

class _InvAccountTile extends StatelessWidget {
  const _InvAccountTile({
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
      trailing:
          trailing ?? Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.25)),
    );
  }
}

class _InvWebBadge extends StatelessWidget {
  const _InvWebBadge();

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

