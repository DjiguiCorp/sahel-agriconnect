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
import '../../widgets/web_action_tile.dart';
import '../shared/webview_screen.dart';

typedef _OppCardBuilder = Widget Function({
  required String title,
  required String subtitle,
  required double progress,
  required int delay,
  required String opportunityId,
});

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

  String get _nextPayout {
    final dates = <DateTime>[];
    for (final i in _investments) {
      final raw = i['payoutSchedule'];
      if (raw is! List) continue;
      for (final p in raw) {
        if (p is! Map) continue;
        final m = Map<String, dynamic>.from(p);
        if (m['status']?.toString() != 'scheduled') continue;
        final d = DateTime.tryParse(m['payoutDate']?.toString() ?? '');
        if (d != null) dates.add(d);
      }
    }
    dates.sort();
    if (dates.isEmpty) return '—';
    final d = dates.first;
    return '${_monthAbbr(d.month)} ${d.day}';
  }

  String _monthAbbr(int m) {
    final idx = (m.clamp(1, 12) as num).toInt() - 1;
    return const [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][idx];
  }

  String _formatEuroThousands(double v) {
    final s = v.round().toString();
    return s.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
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
    final auth = context.watch<AuthState>();
    final lp = context.watch<LanguageProvider>();
    final balanceLabel =
        _loading ? '...' : '€ ${_formatEuroThousands(_totalDeployed)}';
    final premiumLabel = (auth.user?['status'] ?? 'Standard').toString();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: AppColors.darkBg,
      body: Column(
        children: [
          const OfflineBanner(),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF111e17),
                  AppColors.darkBg,
                ],
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Portfolio balance',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.45),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      balanceLabel,
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'AfriYield Exchange · live',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.35),
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        _statCard(
                          '${_avgRoi.toStringAsFixed(1)}%',
                          'Avg return',
                        ),
                        const SizedBox(width: 10),
                        _statCard(_nextPayout, 'Next payout'),
                        const SizedBox(width: 10),
                        _statCard(premiumLabel, 'Premium status'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(child: _buildTab(_tab)),
          _bottomNav(lp),
        ],
      ),
    );
  }

  Widget _buildTab(int tab) {
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
        );
      case 2:
        return _ActivityTab(investments: _investments);
      case 3:
        return const _AlertsTab();
      case 4:
        return const _InvestorProfileTab();
      default:
        return _PortfolioTab(
          opportunities: _opportunities.take(3).toList(),
          loading: _loading,
          opportunityCard: _opportunityCard,
          fundedFraction: _fundedFraction,
          oppTitle: _oppTitle,
          oppSubtitle: _oppSubtitle,
          oppId: _oppId,
        );
    }
  }

  Widget _statCard(String value, String label) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
              width: 0.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: AppColors.gold,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 9,
                ),
              ),
            ],
          ),
        ),
      );

  Widget _opportunityCard({
    required String title,
    required String subtitle,
    required double progress,
    required int delay,
    required String opportunityId,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
          width: 0.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
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
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${(progress * 100).round()}% funded',
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

  Widget _bottomNav(LanguageProvider lp) => Container(
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          border: Border(
            top: BorderSide(
              color: Colors.white.withValues(alpha: 0.06),
              width: 0.5,
            ),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              _navItem('💼', lp.t('Portfolio', 'Portefeuille'), 0),
              _navItem('🔭', lp.t('Deals', 'Offres'), 1),
              _navItem('📊', lp.t('Activity', 'Activité'), 2),
              _navItem('🔔', lp.t('Alerts', 'Alertes'), 3),
              _navItem('👤', lp.t('Profile', 'Profil'), 4),
            ],
          ),
        ),
      );

  Widget _navItem(String emoji, String label, int index) => Expanded(
        child: GestureDetector(
          onTap: () {
            AuthService.resetActivity();
            setState(() => _tab = index);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              children: [
                Text(
                  emoji,
                  style: TextStyle(
                    fontSize: 20,
                    color: _tab == index
                        ? AppColors.gold
                        : Colors.white.withValues(alpha: 0.28),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight:
                        _tab == index ? FontWeight.w700 : FontWeight.w400,
                    color: _tab == index
                        ? AppColors.gold
                        : Colors.white.withValues(alpha: 0.35),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}

class _PortfolioTab extends StatelessWidget {
  const _PortfolioTab({
    required this.opportunities,
    required this.loading,
    required this.opportunityCard,
    required this.fundedFraction,
    required this.oppTitle,
    required this.oppSubtitle,
    required this.oppId,
  });

  final List<Map<String, dynamic>> opportunities;
  final bool loading;
  final _OppCardBuilder opportunityCard;
  final double Function(Map<String, dynamic>) fundedFraction;
  final String Function(Map<String, dynamic>) oppTitle;
  final String Function(Map<String, dynamic>) oppSubtitle;
  final String Function(Map<String, dynamic>) oppId;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Opportunities',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.gold,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 12),
        if (loading)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: CircularProgressIndicator(color: Color(0xFFB5850A)),
            ),
          )
        else if (opportunities.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Text(
              'No open opportunities at this time.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.4),
                fontSize: 13,
              ),
            ),
          )
        else
          ...opportunities.asMap().entries.map((e) {
            final opp = e.value;
            final funded = fundedFraction(opp);
            return Padding(
              padding: EdgeInsets.only(
                bottom: e.key < opportunities.length - 1 ? 10 : 0,
              ),
              child: opportunityCard(
                title: oppTitle(opp),
                subtitle: oppSubtitle(opp),
                progress: funded.clamp(0.0, 1.0),
                delay: e.key * 80,
                opportunityId: oppId(opp),
              ),
            );
          }),
        const SizedBox(height: 24),
        Text(
          'Account & security',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.gold,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
              width: 0.5,
            ),
          ),
          child: const Column(
            children: [
              WebActionTile(
                title: 'Delete my account',
                description: 'Permanently remove your data from the platform',
                action: 'delete-account',
                icon: Icons.delete_outline,
                isDangerous: true,
                titleColor: Colors.white,
                subtitleColor: Colors.white70,
              ),
              Divider(height: 1, color: Color(0x22FFFFFF)),
              WebActionTile(
                title: 'Change password',
                description: 'Update your login credentials securely',
                action: 'account/security',
                icon: Icons.lock_outline,
                titleColor: Colors.white,
                subtitleColor: Colors.white70,
              ),
            ],
          ),
        ),
      ],
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
  });

  final List<Map<String, dynamic>> opportunities;
  final bool loading;
  final _OppCardBuilder opportunityCard;
  final double Function(Map<String, dynamic>) fundedFraction;
  final String Function(Map<String, dynamic>) oppTitle;
  final String Function(Map<String, dynamic>) oppSubtitle;
  final String Function(Map<String, dynamic>) oppId;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFB5850A)),
      );
    }
    final emptyState = opportunities.isEmpty
        ? Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(
                'No open opportunities right now.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 14,
                ),
              ),
            ),
          )
        : null;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (emptyState != null) emptyState,
        ...opportunities.asMap().entries.map((entry) {
          final i = entry.key;
          final opp = entry.value;
          final funded = fundedFraction(opp);
          return Padding(
            padding: EdgeInsets.only(
              bottom: i < opportunities.length - 1 ? 12 : 0,
            ),
            child: opportunityCard(
              title: oppTitle(opp),
              subtitle: oppSubtitle(opp),
              progress: funded.clamp(0.0, 1.0),
              delay: i * 60,
              opportunityId: oppId(opp),
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
                  color: const Color(0xFFB5850A).withValues(alpha: 0.4),
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.open_in_browser,
                    size: 16,
                    color: Color(0xFFB5850A),
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Open full marketplace',
                    style: TextStyle(
                      color: Color(0xFFB5850A),
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

class _ActivityTab extends StatelessWidget {
  const _ActivityTab({required this.investments});

  final List<Map<String, dynamic>> investments;

  @override
  Widget build(BuildContext context) {
    if (investments.isEmpty) {
      return Center(
        child: Text(
          'No investment activity yet.',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 14,
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: investments.length,
      itemBuilder: (ctx, i) {
        final inv = investments[i];
        final name = inv['investorName']?.toString() ?? 'Investment';
        final amt = num.tryParse(inv['amountDeployed']?.toString() ?? '0') ?? 0;
        final cur = inv['currency']?.toString() ?? 'EUR';
        final schedule = inv['payoutSchedule'];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
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
                '€ ${amt.toStringAsFixed(0)} deployed · $cur',
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

class _AlertsTab extends StatelessWidget {
  const _AlertsTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(0, 0, 0, 16),
          child: Text(
            'Price alerts',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
        ListTile(
          tileColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: BorderSide(color: Colors.grey.shade200, width: 0.5),
          ),
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFFAEEDA),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.notifications_active_outlined,
              color: Color(0xFF854F0B),
              size: 20,
            ),
          ),
          title: const Text(
            'Manage price alerts',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          subtitle: const Text(
            'Set alerts when shea, sesame, or cashew prices move',
            style: TextStyle(fontSize: 12),
          ),
          trailing: const Icon(
            Icons.open_in_browser,
            size: 16,
            color: Colors.grey,
          ),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const InAppWebViewScreen(
                title: 'Price Alerts',
                url: 'https://sahelagriconnect.com/afri-yield/investor-portal',
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        ListTile(
          tileColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: BorderSide(color: Colors.grey.shade200, width: 0.5),
          ),
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFE6F1FB),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.article_outlined,
              color: Color(0xFF185FA5),
              size: 20,
            ),
          ),
          title: const Text(
            'Investor updates',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          subtitle: const Text(
            'Latest news and platform reports',
            style: TextStyle(fontSize: 12),
          ),
          trailing: const Icon(
            Icons.open_in_browser,
            size: 16,
            color: Colors.grey,
          ),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const InAppWebViewScreen(
                title: 'Investor Updates',
                url: 'https://sahelagriconnect.com/afri-yield/investor-updates',
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _InvestorProfileTab extends StatelessWidget {
  const _InvestorProfileTab();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final initial =
        auth.displayName.isNotEmpty ? auth.displayName[0].toUpperCase() : '?';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ListTile(
          leading: CircleAvatar(
            backgroundColor: AppColors.gold.withValues(alpha: 0.3),
            child: Text(
              initial,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          title: Text(
            auth.displayName.isNotEmpty ? auth.displayName : 'Investor',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w600),
          ),
          subtitle: Text(
            auth.displayEmail,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
          ),
        ),
        Divider(color: Colors.white.withValues(alpha: 0.12)),
        ListTile(
          leading: Icon(Icons.edit_outlined,
              color: Colors.white.withValues(alpha: 0.8)),
          title:
              const Text('Edit profile', style: TextStyle(color: Colors.white)),
          onTap: () => context.go('/profile/edit'),
        ),
        ListTile(
          leading:
              Icon(Icons.language, color: Colors.white.withValues(alpha: 0.8)),
          title: const Text('Language', style: TextStyle(color: Colors.white)),
          onTap: () => context.go('/profile/language'),
        ),
        ListTile(
          leading: Icon(Icons.notifications_outlined,
              color: Colors.white.withValues(alpha: 0.8)),
          title: const Text('Notifications',
              style: TextStyle(color: Colors.white)),
          onTap: () => context.go('/profile/notifications'),
        ),
        ListTile(
          leading: Icon(Icons.help_outline,
              color: Colors.white.withValues(alpha: 0.8)),
          title: const Text('Help', style: TextStyle(color: Colors.white)),
          onTap: () => context.go('/help'),
        ),
        ListTile(
          leading: const Icon(Icons.logout, color: Color(0xFFFF6B6B)),
          title: const Text('Sign out',
              style: TextStyle(color: Color(0xFFFF6B6B))),
          onTap: () async {
            await context.read<AuthState>().logout();
            if (context.mounted) context.go('/role');
          },
        ),
      ],
    );
  }
}
