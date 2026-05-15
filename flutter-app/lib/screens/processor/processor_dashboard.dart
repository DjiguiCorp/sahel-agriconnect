import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/offline_banner.dart';
import '../shared/webview_screen.dart';

class ProcessorDashboard extends StatefulWidget {
  const ProcessorDashboard({super.key});

  @override
  State<ProcessorDashboard> createState() => _ProcessorDashboardState();
}

class _ProcessorDashboardState extends State<ProcessorDashboard> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    if (token == null || token.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    final country = auth.displayCountry;
    try {
      final res = await ApiService.getProcessorPortal(
        token,
        country: country.isNotEmpty ? country : null,
      );
      if (!mounted) return;
      final raw = res['processor'];
      final map = raw is Map ? Map<String, dynamic>.from(raw) : null;
      setState(() {
        _data = map;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: AppColors.cream,
      body: Column(
        children: [
          const OfflineBanner(),
          Container(
            color: AppColors.forestGreen,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Processing centre',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      auth.displayName.isNotEmpty
                          ? auth.displayName
                          : (_data?['name'] ?? 'Processor').toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      (_data?['location'] ?? auth.displayCountry).toString(),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _stat(
                          _loading ? '…' : (_data?['activeLots']?.toString() ?? '0'),
                          'Active lots',
                        ),
                        const SizedBox(width: 10),
                        _stat(
                          _loading
                              ? '…'
                              : (_data?['certifiedBatches']?.toString() ?? '0'),
                          'Certified',
                        ),
                        const SizedBox(width: 10),
                        _stat(
                          _loading ? '…' : (_data?['capacity'] ?? '—').toString(),
                          'Capacity',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: _tab == 0 ? _buildHome() : _buildProfile(auth),
          ),
          _buildNav(),
        ],
      ),
    );
  }

  Widget _buildHome() {
    final actions = [
      {
        'icon': Icons.inventory_2_outlined,
        'title': 'Manage lots',
        'desc': 'View and certify produce batches',
        'url': 'https://sahelagriconnect.com/dashboard',
      },
      {
        'icon': Icons.qr_code_scanner_outlined,
        'title': 'Scan traceability',
        'desc': 'Look up a produce lot by QR code',
        'url': 'https://sahelagriconnect.com/traceabilite',
      },
      {
        'icon': Icons.verified_outlined,
        'title': 'Certification',
        'desc': 'Submit for quality certification',
        'url': 'https://sahelagriconnect.com/certification',
      },
      {
        'icon': Icons.local_shipping_outlined,
        'title': 'Logistics',
        'desc': 'View pickup and delivery schedule',
        'url': 'https://sahelagriconnect.com/dashboard',
      },
    ];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Actions', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        ...actions.map(
          (a) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: BorderSide(color: Colors.grey.shade200, width: 0.5),
              ),
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.forestGreen.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  a['icon']! as IconData,
                  color: AppColors.forestGreen,
                  size: 20,
                ),
              ),
              title: Text(
                a['title']! as String,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                a['desc']! as String,
                style: const TextStyle(fontSize: 12),
              ),
              trailing: const Icon(Icons.open_in_browser, size: 18, color: Colors.grey),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => InAppWebViewScreen(
                    title: a['title']! as String,
                    url: a['url']! as String,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfile(AuthState auth) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ListTile(
          tileColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          leading: CircleAvatar(
            backgroundColor: AppColors.forestGreen,
            child: Text(
              auth.displayName.isNotEmpty
                  ? auth.displayName[0].toUpperCase()
                  : 'P',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          title: Text(
            auth.displayName.isNotEmpty ? auth.displayName : 'Processor',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          subtitle: Text(auth.displayEmail),
        ),
        const SizedBox(height: 12),
        ListTile(
          leading: const Icon(Icons.language_outlined),
          title: const Text('Language'),
          onTap: () => context.go('/profile/language'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          tileColor: Colors.white,
        ),
        const SizedBox(height: 6),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('Sign out', style: TextStyle(color: Colors.red)),
          onTap: () async {
            await context.read<AuthState>().logout();
            if (!mounted) return;
            context.go('/role');
          },
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          tileColor: Colors.white,
        ),
      ],
    );
  }

  Widget _stat(String val, String label) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 0.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                val,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
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

  Widget _buildNav() => Container(
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
              _navItem(Icons.home_outlined, 'Home', 0),
              _navItem(Icons.person_outline, 'Profile', 1),
            ],
          ),
        ),
      );

  Widget _navItem(IconData icon, String label, int index) => Expanded(
        child: GestureDetector(
          onTap: () => setState(() => _tab = index),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: _tab == index
                      ? AppColors.forestGreen
                      : Colors.grey.shade400,
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight:
                        _tab == index ? FontWeight.w700 : FontWeight.w400,
                    color: _tab == index
                        ? AppColors.forestGreen
                        : Colors.grey.shade400,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
