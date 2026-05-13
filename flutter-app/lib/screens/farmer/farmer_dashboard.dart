import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/web_action_tile.dart';
import '../shared/webview_screen.dart';

class FarmerDashboard extends StatefulWidget {
  const FarmerDashboard({super.key});

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _farmer;
  bool _loadingFarmer = true;

  List<String> get _cultures =>
      (_farmer?['cultures'] as List?)?.map((e) => e.toString()).toList() ?? [];

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
  void initState() {
    super.initState();
    _loadFarmer();
  }

  Future<void> _loadFarmer() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    final email = auth.displayEmail;
    if (email.isEmpty) {
      if (mounted) setState(() => _loadingFarmer = false);
      return;
    }
    try {
      final res = await ApiService.get(
        '/api/farmers?email=${Uri.encodeComponent(email)}',
        token: token,
      );
      final f = res['farmer'];
      final map = f is Map ? Map<String, dynamic>.from(f) : null;
      if (mounted) {
        setState(() {
          _farmer = map;
          _loadingFarmer = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingFarmer = false);
    }
  }

  Widget _buildTab(int tab) {
    switch (tab) {
      case 1:
        return _ProduceTab(
          loadingFarmer: _loadingFarmer,
          cultures: _cultures,
          produceRow: _produceRow,
        );
      case 2:
        return const _AiToolsTab(tools: _FarmerDashboardState.tools);
      case 3:
        return const _BenefitsTab();
      case 4:
        return const _ProfileTab();
      default:
        return _HomeTab(
          cultures: _cultures,
          loadingFarmer: _loadingFarmer,
          tools: tools,
          produceRow: _produceRow,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final displayName = auth.displayName.isNotEmpty
        ? auth.displayName
        : (_farmer?['nom'] ?? 'Farmer').toString();

    return Scaffold(
      backgroundColor: AppColors.cream,
      body: Column(
        children: [
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
                    Text(
                      displayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _statCard(
                          _farmer != null
                              ? '${_farmer!['superficie'] ?? '—'} ha'
                              : '—',
                          'Total area',
                        ),
                        const SizedBox(width: 10),
                        _statCard(
                          _farmer != null
                              ? '${(_farmer!['cultures'] as List?)?.length ?? 0}'
                              : '—',
                          'Crops listed',
                        ),
                        const SizedBox(width: 10),
                        _statCard(
                          _farmer?['statut'] == 'Actif'
                              ? 'Active'
                              : (_farmer?['statut'] ?? '—').toString(),
                          'Status',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(child: _buildTab(_tab)),
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

Widget _farmerToolGrid(List<Map<String, Object>> tools) {
  return GridView.builder(
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
          color: AppColors.forestGreen.withValues(alpha: 0.08),
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
  );
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.cultures,
    required this.loadingFarmer,
    required this.tools,
    required this.produceRow,
  });

  final List<String> cultures;
  final bool loadingFarmer;
  final List<Map<String, Object>> tools;
  final Widget Function(
    String name,
    String sub,
    String status,
    Color statusText,
    Color statusBg,
  ) produceRow;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'AI Agricultural Tools',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        _farmerToolGrid(tools),
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
              if (loadingFarmer)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (cultures.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'No crops declared yet',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 13,
                    ),
                  ),
                )
              else
                ...cultures.asMap().entries.map(
                      (e) => Column(
                        children: [
                          if (e.key > 0)
                            const Divider(
                              height: 1,
                              color: Color(0xFFf0f0f0),
                            ),
                          produceRow(
                            '${e.value} · declared',
                            'Crop on file',
                            'On file',
                            Colors.blue.shade700,
                            Colors.blue.shade50,
                          ),
                        ],
                      ),
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
    );
  }
}

class _ProduceTab extends StatelessWidget {
  const _ProduceTab({
    required this.loadingFarmer,
    required this.cultures,
    required this.produceRow,
  });

  final bool loadingFarmer;
  final List<String> cultures;
  final Widget Function(
    String name,
    String sub,
    String status,
    Color statusText,
    Color statusBg,
  ) produceRow;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'My declared produce',
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
              if (loadingFarmer)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (cultures.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'No crops declared yet',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 13,
                    ),
                  ),
                )
              else
                ...cultures.asMap().entries.map(
                      (e) => Column(
                        children: [
                          if (e.key > 0)
                            const Divider(
                              height: 1,
                              color: Color(0xFFf0f0f0),
                            ),
                          produceRow(
                            '${e.value} · declared',
                            'Crop on file',
                            'On file',
                            Colors.blue.shade700,
                            Colors.blue.shade50,
                          ),
                        ],
                      ),
                    ),
            ],
          ),
        ),
        ListTile(
          leading: const Icon(Icons.add_circle_outline, color: AppColors.forestGreen),
          title: const Text('Declare new produce'),
          onTap: () => context.go('/farmer'),
        ),
      ],
    );
  }
}

class _AiToolsTab extends StatelessWidget {
  const _AiToolsTab({required this.tools});

  final List<Map<String, Object>> tools;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _farmerToolGrid(tools),
        const SizedBox(height: 24),
        Text(
          'More tools',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        ListTile(
          leading: const Icon(Icons.school_outlined, color: AppColors.forestGreen),
          title: const Text('Training booking'),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const InAppWebViewScreen(
                  title: 'Training',
                  url: 'https://sahelagriconnect.com/dashboard',
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _BenefitsTab extends StatelessWidget {
  const _BenefitsTab();

  static const _url = 'https://sahelagriconnect.com/demander-avantage';

  void _open(BuildContext context, String title) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => InAppWebViewScreen(
          title: title,
          url: _url,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'My benefits & perks',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        ListTile(
          leading: const Icon(Icons.agriculture_outlined, color: AppColors.forestGreen),
          title: const Text('Request equipment'),
          onTap: () => _open(context, 'Request equipment'),
        ),
        ListTile(
          leading: const Icon(Icons.science_outlined, color: AppColors.forestGreen),
          title: const Text('Request fertilizers'),
          onTap: () => _open(context, 'Request fertilizers'),
        ),
        ListTile(
          leading: const Icon(Icons.card_giftcard_outlined, color: AppColors.forestGreen),
          title: const Text('Request training subsidy'),
          onTap: () => _open(context, 'Request training subsidy'),
        ),
      ],
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final initial = auth.displayName.isNotEmpty
        ? auth.displayName[0].toUpperCase()
        : '?';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ListTile(
          leading: CircleAvatar(
            child: Text(initial),
          ),
          title: Text(auth.displayName.isNotEmpty ? auth.displayName : 'Farmer'),
          subtitle: Text(auth.displayEmail),
        ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.edit_outlined),
          title: const Text('Edit profile'),
          onTap: () => context.go('/profile/edit'),
        ),
        ListTile(
          leading: const Icon(Icons.language),
          title: const Text('Language'),
          onTap: () => context.go('/profile/language'),
        ),
        ListTile(
          leading: const Icon(Icons.notifications_outlined),
          title: const Text('Notifications'),
          onTap: () => context.go('/profile/notifications'),
        ),
        ListTile(
          leading: const Icon(Icons.help_outline),
          title: const Text('Help'),
          onTap: () => context.go('/help'),
        ),
        ListTile(
          leading: const Icon(Icons.logout, color: Color(0xFFFF6B6B)),
          title: const Text('Sign out', style: TextStyle(color: Color(0xFFFF6B6B))),
          onTap: () async {
            await context.read<AuthState>().logout();
            if (context.mounted) context.go('/role');
          },
        ),
      ],
    );
  }
}
