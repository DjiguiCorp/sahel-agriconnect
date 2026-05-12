import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../widgets/web_action_tile.dart';

class InvestorDashboard extends StatefulWidget {
  const InvestorDashboard({super.key});

  @override
  State<InvestorDashboard> createState() => _InvestorDashboardState();
}

class _InvestorDashboardState extends State<InvestorDashboard> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: Column(
        children: [
          // Header gradient
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
                    const Text(
                      '€ 128,400',
                      style: TextStyle(
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
                        _statCard('12.4%', 'Avg return'),
                        const SizedBox(width: 10),
                        _statCard('Mar 28', 'Next payout'),
                        const SizedBox(width: 10),
                        _statCard('Gold', 'Premium status'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          Expanded(
            child: ListView(
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
                _opportunityCard(
                  title: 'Shea cooperative · Mali',
                  subtitle: 'Equipment & traceability',
                  progress: 0.72,
                  delay: 0,
                  opportunityId: 'shea-mali',
                ),
                const SizedBox(height: 10),
                _opportunityCard(
                  title: 'Irrigation cluster · Burkina',
                  subtitle: 'Climate-smart water',
                  progress: 0.41,
                  delay: 80,
                  opportunityId: 'irrigation-bf',
                ),
                const SizedBox(height: 10),
                _opportunityCard(
                  title: 'Export logistics hub',
                  subtitle: 'Regional aggregation',
                  progress: 0.88,
                  delay: 160,
                  opportunityId: 'logistics-hub',
                ),
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
                        description:
                            'Permanently remove your data from the platform',
                        action: 'delete-account',
                        icon: Icons.delete_outline,
                        isDangerous: true,
                        titleColor: Colors.white,
                        subtitleColor: Colors.white70,
                      ),
                      Divider(height: 1, color: Color(0x22FFFFFF)),
                      WebActionTile(
                        title: 'Change password',
                        description:
                            'Update your login credentials securely',
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
          ),

          _bottomNav(),
        ],
      ),
    );
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
            description:
                'Complete your investment on our secure platform',
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

  Widget _bottomNav() => Container(
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
              _navItem('💼', 'Portfolio', 0),
              _navItem('🔭', 'Deals', 1),
              _navItem('📊', 'Activity', 2),
              _navItem('🔔', 'Alerts', 3),
              _navItem('👤', 'Profile', 4),
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
