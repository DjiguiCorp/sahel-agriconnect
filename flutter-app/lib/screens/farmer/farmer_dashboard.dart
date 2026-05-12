import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../widgets/web_action_tile.dart';

class FarmerDashboard extends StatefulWidget {
  const FarmerDashboard({super.key});

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  int _tab = 0;

  static const tools = [
    {
      'icon': '🌱',
      'title': 'Soil diagnosis',
      'desc': 'Analyze your soil',
      'bg': Color(0xFFEAF3DE),
    },
    {
      'icon': '🔬',
      'title': 'Disease detect',
      'desc': 'Photo analysis',
      'bg': Color(0xFFFEF3C7),
    },
    {
      'icon': '🧠',
      'title': 'Think Tank',
      'desc': 'AI advisor',
      'bg': Color(0xFFEDE9FE),
    },
    {
      'icon': '💧',
      'title': 'Irrigation',
      'desc': 'Water planning',
      'bg': Color(0xFFE0F2FE),
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      body: Column(
        children: [
          // Header with gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.forestGreen, AppColors.sage],
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Good morning,',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Amadou Coulibaly',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _statCard('12 ha', 'Total area'),
                        const SizedBox(width: 10),
                        _statCard('3', 'Crops listed'),
                        const SizedBox(width: 10),
                        _statCard('68%', 'Benefits'),
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
                  'AI Agricultural Tools',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.6,
                  ),
                  itemCount: tools.length,
                  itemBuilder: (ctx, i) => Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color:
                            AppColors.forestGreen.withValues(alpha: 0.08),
                        width: 0.5,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: tools[i]['bg'] as Color,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              tools[i]['icon'] as String,
                              style: const TextStyle(fontSize: 18),
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          tools[i]['title'] as String,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.forestGreen,
                          ),
                        ),
                        Text(
                          tools[i]['desc'] as String,
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  )
                      .animate(delay: Duration(milliseconds: 80 * i))
                      .fadeIn(duration: 300.ms)
                      .slideY(begin: 0.1),
                ),

                const SizedBox(height: 20),
                Text(
                  'My produce pipeline',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.forestGreen.withValues(alpha: 0.08),
                      width: 0.5,
                    ),
                  ),
                  child: Column(
                    children: [
                      _produceRow(
                        'Shea Butter · 200 kg',
                        'Declared to cooperative',
                        'Pending',
                        Colors.amber.shade700,
                        Colors.amber.shade50,
                      ),
                      const Divider(height: 1, color: Color(0xFFf0f0f0)),
                      _produceRow(
                        'Sesame · 80 kg',
                        'Cooperative approved',
                        'Approved',
                        Colors.green.shade700,
                        Colors.green.shade50,
                      ),
                    ],
                  ),
                ).animate(delay: 200.ms).fadeIn(duration: 300.ms),

                const SizedBox(height: 20),
                Text(
                  'Account & web',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.forestGreen.withValues(alpha: 0.08),
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
                      ),
                      Divider(height: 1),
                      WebActionTile(
                        title: 'Change password',
                        description:
                            'Update your login credentials securely',
                        action: 'account/security',
                        icon: Icons.lock_outline,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom nav
          _bottomNav(),
        ],
      ),
    );
  }

  Widget _statCard(String val, String label) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.15),
              width: 0.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                val,
                style: const TextStyle(
                  color: AppColors.gold,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 9,
                ),
              ),
            ],
          ),
        ),
      );

  Widget _produceRow(
    String name,
    String sub,
    String status,
    Color statusText,
    Color statusBg,
  ) =>
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.forestGreen,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub,
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusBg,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                status,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: statusText,
                ),
              ),
            ),
          ],
        ),
      );

  Widget _bottomNav() => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Colors.grey.shade200, width: 0.5),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              _navItem('🏠', 'Home', 0),
              _navItem('🌾', 'Produce', 1),
              _navItem('🧠', 'AI Tools', 2),
              _navItem('🎁', 'Benefits', 3),
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
                        ? null
                        : const Color(0xFFcccccc),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: _tab == index
                        ? FontWeight.w700
                        : FontWeight.w400,
                    color: _tab == index
                        ? AppColors.forestGreen
                        : const Color(0xFFaaaaaa),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
