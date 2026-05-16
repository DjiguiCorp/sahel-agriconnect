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
import '../../services/offline_queue.dart';
import '../../widgets/offline_banner.dart';
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

  static final List<Map<String, Object>> tools = [
    {
      'icon': '🌱',
      'title': 'Soil diagnosis',
      'desc': 'Analyze your soil',
      'bg': const Color(0xFF1e4535),
      'url': 'https://sahelagriconnect.com/diagnostic-sol',
      'webTitle': 'Soil Diagnostic',
    },
    {
      'icon': '🔬',
      'title': 'Disease detect',
      'desc': 'Photo analysis',
      'bg': const Color(0xFF243d32),
      'url': 'https://sahelagriconnect.com/detection-maladies',
      'webTitle': 'Disease Detection',
    },
    {
      'icon': '🧠',
      'title': 'Think Tank',
      'desc': 'AI advisor',
      'bg': const Color(0xFF1a3540),
      'url': 'https://sahelagriconnect.com/think-tank',
      'webTitle': 'AI Advisor',
    },
    {
      'icon': '💧',
      'title': 'Irrigation',
      'desc': 'Water planning',
      'bg': const Color(0xFF1e3545),
      'url': 'https://sahelagriconnect.com/irrigation',
      'webTitle': 'Irrigation Planning',
    },
    {
      'icon': '📊',
      'title': 'Production optimizer',
      'desc': 'Gemini AI planning',
      'bg': const Color(0xFF1e4535),
      'url': 'https://sahelagriconnect.com/optimisation-production',
      'webTitle': 'Production Optimizer',
    },
    {
      'icon': '🔍',
      'title': 'Traceability',
      'desc': 'Track your produce lot',
      'bg': const Color(0xFF2a3820),
      'url': 'https://sahelagriconnect.com/traceabilite',
      'webTitle': 'Traceability',
      'comingSoon': true,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadFarmer();
  }

  String _greetingLine(bool isFr) {
    final h = DateTime.now().hour;
    if (isFr) {
      if (h < 12) return 'Bonjour,';
      if (h < 17) return 'Bon après-midi,';
      return 'Bonsoir,';
    }
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
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

  Widget _buildMainHeader(String displayName, LanguageProvider lp) {
    final isFr = lp.locale.languageCode == 'fr';
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1a3c2e),
            Color(0xFF2d6a4f),
            Color(0xFF1a3c2e),
          ],
          stops: [0.0, 0.5, 1.0],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.05),
              ),
            ),
          ),
          Positioned(
            top: 20,
            right: 60,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.03),
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
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _greetingLine(isFr),
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            displayName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
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
                      _GlassStatCard(
                        label: lp.t('Total area', 'Superficie totale'),
                        value: _farmer != null
                            ? '${_farmer!['superficie'] ?? '—'} ha'
                            : '—',
                      ),
                      const SizedBox(width: 10),
                      _GlassStatCard(
                        label: lp.t('Crops listed', 'Cultures déclarées'),
                        value: _farmer != null
                            ? '${(_farmer!['cultures'] as List?)?.length ?? 0}'
                            : '—',
                      ),
                      const SizedBox(width: 10),
                      _GlassStatCard(
                        label: lp.t('Status', 'Statut'),
                        value: _farmer?['statut'] == 'Actif'
                            ? lp.t('Active', 'Actif')
                            : (_farmer?['statut'] ?? '—').toString(),
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

  Widget _buildTab(int tab) {
    switch (tab) {
      case 1:
        return _ProduceTab(
          loadingFarmer: _loadingFarmer,
          cultures: _cultures,
          produceRow: _produceRow,
        );
      case 2:
        return _AiToolsTab(tools: tools);
      case 3:
        return const _BenefitsTab();
      default:
        return _HomeTab(
          cultures: _cultures,
          loadingFarmer: _loadingFarmer,
          tools: tools,
          produceRow: _produceRow,
          onSeeAllAiTools: () {
            AuthService.resetActivity();
            setState(() => _tab = 2);
          },
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final displayName = auth.displayName.isNotEmpty
        ? auth.displayName
        : (_farmer?['nom'] ?? 'Farmer').toString();

    return Consumer<LanguageProvider>(
      builder: (context, langProvider, _) {
        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, result) {
            if (!didPop) context.go('/home');
          },
          child: Scaffold(
          resizeToAvoidBottomInset: true,
          backgroundColor: const Color(0xFF0f2318),
          body: Column(
            children: [
              const OfflineBanner(),
              if (_tab != 4 && _tab != 5)
                _buildMainHeader(displayName, langProvider),
              Expanded(
                child: _tab == 5
                    ? const _AccountSettingsTab()
                    : _tab == 4
                        ? const _FarmerUpdatesTab()
                        : _buildTab(_tab),
              ),
              _bottomNav(langProvider),
            ],
          ),
        ),
        );
      },
    );
  }

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
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
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

  Widget _bottomNav(LanguageProvider lp) {
    final isFr = lp.locale.languageCode == 'fr';
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF152923),
        border: Border(
          top: BorderSide(
            color: Colors.white.withValues(alpha: 0.08),
            width: 0.5,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            _navIconItem(
              Icons.home_outlined,
              Icons.home,
              isFr ? 'Accueil' : 'Home',
              0,
            ),
            _navIconItem(
              Icons.grass_outlined,
              Icons.grass,
              isFr ? 'Production' : 'Produce',
              1,
            ),
            _navIconItem(
              Icons.psychology_outlined,
              Icons.psychology,
              isFr ? 'Outils IA' : 'AI Tools',
              2,
            ),
            _navIconItem(
              Icons.card_giftcard_outlined,
              Icons.card_giftcard,
              isFr ? 'Avantages' : 'Benefits',
              3,
            ),
            _navIconItem(
              Icons.campaign_outlined,
              Icons.campaign,
              isFr ? 'Mises à jour' : 'Updates',
              4,
            ),
            _navIconItem(
              Icons.manage_accounts_outlined,
              Icons.manage_accounts,
              isFr ? 'Compte' : 'Account',
              5,
            ),
          ],
        ),
      ),
    );
  }

  Widget _navIconItem(
    IconData icon,
    IconData activeIcon,
    String label,
    int index,
  ) =>
      Expanded(
        child: GestureDetector(
          onTap: () {
            AuthService.resetActivity();
            if (index == 0) {
              context.go('/home');
              return;
            }
            setState(() => _tab = index);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              children: [
                Icon(
                  _tab == index ? activeIcon : icon,
                  size: 22,
                  color: _tab == index
                      ? AppColors.gold
                      : Colors.white.withValues(alpha: 0.35),
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight:
                        _tab == index ? FontWeight.w700 : FontWeight.w400,
                    color: _tab == index
                        ? AppColors.gold
                        : Colors.white.withValues(alpha: 0.4),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      );
}

/// Top-level so both dashboard and grid can use it.
void showFarmerComingSoonSheet(
  BuildContext context, {
  required String title,
  required String body,
  String emoji = '✨',
}) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: const Color(0xFF1a3c2e),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetCtx) => Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () => Navigator.pop(sheetCtx),
              child: const Text(
                'Got it',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    ),
  );
}

Widget _farmerToolGrid(BuildContext context, List<Map<String, Object>> tools) {
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
    itemBuilder: (ctx, i) {
      final comingSoon = tools[i]['comingSoon'] == true;
      return Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            if (comingSoon) {
              showFarmerComingSoonSheet(
                context,
                title: tools[i]['webTitle'] as String,
                emoji: tools[i]['icon'] as String,
                body: 'Track your produce lot from farm to market. '
                    'This feature is coming soon.',
              );
              return;
            }
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => InAppWebViewScreen(
                  title: tools[i]['webTitle'] as String,
                  url: tools[i]['url'] as String,
                ),
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF1e4535),
                  Color(0xFF162e24),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.08),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
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
                    color: Colors.white,
                  ),
                ),
                Text(
                  tools[i]['desc'] as String,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
                ),
              ],
            ),
          ),
        ),
      )
          .animate(delay: Duration(milliseconds: 80 * i))
          .fadeIn(duration: 300.ms)
          .slideY(begin: 0.1);
    },
  );
}

class _GlassStatCard extends StatelessWidget {
  const _GlassStatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white.withValues(alpha: 0.12),
              Colors.white.withValues(alpha: 0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.cultures,
    required this.loadingFarmer,
    required this.tools,
    required this.produceRow,
    required this.onSeeAllAiTools,
  });

  final List<String> cultures;
  final bool loadingFarmer;
  final List<Map<String, Object>> tools;
  final VoidCallback onSeeAllAiTools;
  final Widget Function(
    String name,
    String sub,
    String status,
    Color statusText,
    Color statusBg,
  ) produceRow;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                lp.t('AI Agricultural Tools', 'Outils agricoles IA'),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.3,
                ),
              ),
              GestureDetector(
                onTap: onSeeAllAiTools,
                child: Text(
                  lp.t('See all', 'Voir tout'),
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _farmerToolGrid(context, tools),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
          child: Text(
            lp.t('My produce pipeline', 'Ma filière produits'),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 18,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.3,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF1e4535),
                  Color(0xFF162e24),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
            child: Column(
              children: [
                if (loadingFarmer)
                  const Padding(
                    padding: EdgeInsets.all(20),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: AppColors.gold,
                      ),
                    ),
                  )
                else if (cultures.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      lp.t('No crops declared yet', 'Aucune culture déclarée'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.45),
                        fontSize: 13,
                      ),
                    ),
                  )
                else
                  ...cultures.asMap().entries.map(
                        (e) => Column(
                          children: [
                            if (e.key > 0)
                              Divider(
                                height: 1,
                                color: Colors.white.withValues(alpha: 0.06),
                              ),
                            produceRow(
                              lp.t(
                                '${e.value} · declared',
                                '${e.value} · déclarée',
                              ),
                              lp.t('Crop on file', 'Culture enregistrée'),
                              lp.t('On file', 'Enregistré'),
                              AppColors.gold,
                              AppColors.gold.withValues(alpha: 0.15),
                            ),
                          ],
                        ),
                      ),
              ],
            ),
          ),
        ).animate(delay: 200.ms).fadeIn(duration: 300.ms),
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
    final lp = context.watch<LanguageProvider>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('My declared produce', 'Mes cultures déclarées'),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.9),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1e4535),
                Color(0xFF162e24),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
          child: Column(
            children: [
              if (loadingFarmer)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.gold),
                  ),
                )
              else if (cultures.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    lp.t('No crops declared yet', 'Aucune culture déclarée'),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontSize: 13,
                    ),
                  ),
                )
              else
                ...cultures.asMap().entries.map(
                      (e) => Column(
                        children: [
                          if (e.key > 0)
                            Divider(
                              height: 1,
                              color: Colors.white.withValues(alpha: 0.06),
                            ),
                          produceRow(
                            lp.t(
                              '${e.value} · declared',
                              '${e.value} · déclarée',
                            ),
                            lp.t('Crop on file', 'Culture enregistrée'),
                            lp.t('On file', 'Enregistré'),
                            AppColors.gold,
                            AppColors.gold.withValues(alpha: 0.15),
                          ),
                        ],
                      ),
                    ),
            ],
          ),
        ),
        ListTile(
          leading: const Icon(Icons.add_circle_outline, color: AppColors.gold),
          title: Text(
            lp.t('Declare new produce', 'Déclarer une production'),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
          ),
          onTap: () async {
            final queue = context.read<OfflineQueue>();
            final auth = context.read<AuthState>();
            if (!queue.isOnline) {
              await queue.enqueue(
                path: '/api/produce',
                body: {
                  'farmerEmail': auth.displayEmail,
                  'declared': true,
                },
                label: lp.t('Produce declaration', 'Déclaration de production'),
                token: auth.token,
              );
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    lp.t(
                      'Saved offline — will sync when connected',
                      'Enregistré hors ligne — synchronisation à la reconnexion',
                    ),
                  ),
                  backgroundColor: const Color(0xFF3B6D11),
                ),
              );
            } else {
              await Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => InAppWebViewScreen(
                    title: lp.t('Declare produce', 'Déclarer une production'),
                    url: 'https://sahelagriconnect.com/dashboard',
                  ),
                ),
              );
            }
          },
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
    final lp = context.watch<LanguageProvider>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('AI tools', 'Outils IA'),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.9),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        _farmerToolGrid(context, tools),
        const SizedBox(height: 24),
        Text(
          lp.t('More tools', 'Autres outils'),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.9),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        ListTile(
          leading: const Icon(Icons.school_outlined, color: AppColors.gold),
          title: Text(
            lp.t('Training booking', 'Réservation de formation'),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
          ),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => InAppWebViewScreen(
                  title: lp.t('Training', 'Formation'),
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
    final lp = context.watch<LanguageProvider>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('My benefits & perks', 'Mes avantages'),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.9),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1e4535),
                Color(0xFF162e24),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(
                  Icons.agriculture_outlined,
                  color: AppColors.gold,
                ),
                title: Text(
                  lp.t('Request equipment', 'Demander du matériel'),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                ),
                onTap: () => _open(
                  context,
                  lp.t('Request equipment', 'Demander du matériel'),
                ),
              ),
              Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
              ListTile(
                leading: const Icon(
                  Icons.science_outlined,
                  color: AppColors.gold,
                ),
                title: Text(
                  lp.t('Request fertilizers', 'Demander des intrants'),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                ),
                onTap: () => _open(
                  context,
                  lp.t('Request fertilizers', 'Demander des intrants'),
                ),
              ),
              Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
              ListTile(
                leading: const Icon(
                  Icons.card_giftcard_outlined,
                  color: AppColors.gold,
                ),
                title: Text(
                  lp.t('Request training subsidy',
                      'Demander une bourse formation'),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                ),
                onTap: () => _open(
                  context,
                  lp.t(
                    'Request training subsidy',
                    'Demander une bourse formation',
                  ),
                ),
              ),
              Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
              ListTile(
                leading: const Icon(
                  Icons.verified_outlined,
                  color: AppColors.gold,
                ),
                title: Text(
                  lp.t('Certification program', 'Programme de certification'),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                ),
                subtitle: Text(
                  lp.t(
                    'Apply for quality certification',
                    'Postuler à une certification qualité',
                  ),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
                ),
                trailing: Icon(
                  Icons.open_in_browser,
                  size: 16,
                  color: Colors.white.withValues(alpha: 0.35),
                ),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => InAppWebViewScreen(
                      title: lp.t('Certification', 'Certification'),
                      url:
                          'https://sahelagriconnect.com/certification-agriculteurs',
                    ),
                  ),
                ),
              ),
              Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
              ListTile(
                leading: const Icon(
                  Icons.handshake_outlined,
                  color: AppColors.gold,
                ),
                title: Text(
                  lp.t('Join a cooperative', 'Rejoindre une coopérative'),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                ),
                subtitle: Text(
                  lp.t(
                    'Find and join a cooperative near you',
                    'Trouvez une coopérative près de chez vous',
                  ),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
                ),
                trailing: Icon(
                  Icons.open_in_browser,
                  size: 16,
                  color: Colors.white.withValues(alpha: 0.35),
                ),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => InAppWebViewScreen(
                      title:
                          lp.t('Join Cooperative', 'Rejoindre une coopérative'),
                      url: 'https://sahelagriconnect.com/join-cooperative',
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FarmerUpdatesTab extends StatelessWidget {
  const _FarmerUpdatesTab();

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Scaffold(
      backgroundColor: const Color(0xFF0f2318),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: const Color(0xFF1a3c2e),
            pinned: true,
            title: Text(
              lp.t('Updates & Alerts', 'Mises à jour et alertes'),
              style: const TextStyle(color: Colors.white),
            ),
          ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _FarmerAlertSection(
                    icon: '📈',
                    title: 'Market Alerts',
                    subtitle: 'Price changes for your crops',
                    items: [
                      _FarmerAlertItem(
                        title: 'Shea Butter +12%',
                        body: 'High demand in EU markets this week',
                        time: 'Today',
                        color: Color(0xFF4CAF50),
                      ),
                      _FarmerAlertItem(
                        title: 'Sesame +3%',
                        body: 'Stable export prices, good time to sell',
                        time: 'Yesterday',
                        color: Color(0xFF4CAF50),
                      ),
                      _FarmerAlertItem(
                        title: 'Cashew +8%',
                        body: 'Premium grade wanted by EU buyers',
                        time: '2 days ago',
                        color: Color(0xFF4CAF50),
                      ),
                    ],
                  ),
                  SizedBox(height: 20),
                  _FarmerAlertSection(
                    icon: '🌾',
                    title: 'Platform Updates',
                    subtitle: 'News from Sahel AgriConnect',
                    items: [
                      _FarmerAlertItem(
                        title: 'Welcome to Sahel AgriConnect',
                        body:
                            'Your account is active. Start declaring your produce to connect with buyers.',
                        time: 'Recently',
                        color: Color(0xFFB5850A),
                      ),
                    ],
                  ),
                  SizedBox(height: 20),
                  _FarmerAlertSection(
                    icon: '🤝',
                    title: 'Cooperative News',
                    subtitle: 'Updates from your network',
                    items: [
                      _FarmerAlertItem(
                        title: 'No cooperative yet',
                        body: 'Join a cooperative to receive updates here.',
                        time: '',
                        color: Colors.white38,
                      ),
                    ],
                  ),
                  SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FarmerAlertSection extends StatelessWidget {
  const _FarmerAlertSection({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.items,
  });

  final String icon;
  final String title;
  final String subtitle;
  final List<_FarmerAlertItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1e4535),
                Color(0xFF162e24),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
          child: Column(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                if (i > 0)
                  Divider(
                    height: 1,
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
                items[i],
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _FarmerAlertItem extends StatelessWidget {
  const _FarmerAlertItem({
    required this.title,
    required this.body,
    required this.time,
    required this.color,
  });

  final String title;
  final String body;
  final String time;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
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
                  ),
                ),
                if (time.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    time,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.35),
                      fontSize: 11,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AccountSettingsTab extends StatelessWidget {
  const _AccountSettingsTab();

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
        auth.displayName.isNotEmpty ? auth.displayName[0].toUpperCase() : 'F';

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          backgroundColor: const Color(0xFF1a3c2e),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF1a3c2e),
                    Color(0xFF2d6a4f),
                  ],
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFFB5850A),
                            Color(0xFFE8B84B),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.gold.withValues(alpha: 0.4),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          initial,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      auth.displayName.isNotEmpty ? auth.displayName : 'Farmer',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.4),
                        ),
                      ),
                      child: const Text(
                        '🌾 Farmer Account',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/farmer'),
          ),
          title: const Text(
            'Account Settings',
            style: TextStyle(color: Colors.white, fontSize: 18),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ListTile(
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.home_outlined,
                      color: Colors.green,
                      size: 18,
                    ),
                  ),
                  title: const Text(
                    'Back to Main Home',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    'Return to platform overview',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 12,
                    ),
                  ),
                  trailing: Icon(
                    Icons.arrow_forward_ios,
                    size: 14,
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                  onTap: () => context.go('/home'),
                ),
                const Divider(color: Colors.white12),
                if (auth.displayEmail.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      auth.displayEmail,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                      ),
                    ),
                  ),
                _AccountSection(
                  title: 'Navigation',
                  items: [
                    _AccountTile(
                      icon: Icons.insights_outlined,
                      iconColor: const Color(0xFF2196F3),
                      title: 'My Insights',
                      subtitle: 'Performance and analytics',
                      onTap: () {
                        showFarmerComingSoonSheet(
                          context,
                          title: 'My Insights',
                          emoji: '📊',
                          body:
                              'Performance and analytics for your farm are coming soon.',
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _AccountSection(
                  title: 'Profile',
                  items: [
                    _AccountTile(
                      icon: Icons.person_outline,
                      iconColor: AppColors.gold,
                      title: 'Edit Profile',
                      subtitle: 'Update your name and details',
                      onTap: () => context.go('/profile/edit'),
                    ),
                    _AccountTile(
                      icon: Icons.language_outlined,
                      iconColor: const Color(0xFF9C27B0),
                      title: 'Language',
                      subtitle: 'English / Français',
                      onTap: () => context.go('/profile/language'),
                    ),
                    _AccountTile(
                      icon: Icons.notifications_outlined,
                      iconColor: const Color(0xFFFF9800),
                      title: 'Notifications',
                      subtitle: 'Manage alerts and updates',
                      onTap: () => context.push('/notifications'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _AccountSection(
                  title: 'Security & Account',
                  items: [
                    _AccountTile(
                      icon: Icons.lock_outline,
                      iconColor: const Color(0xFF03A9F4),
                      title: 'Update Login Credentials',
                      subtitle: 'Change your email or phone',
                      trailing: const _WebBadge(),
                      onTap: () => _openWeb(),
                    ),
                    _AccountTile(
                      icon: Icons.delete_outline,
                      iconColor: Colors.red,
                      title: 'Delete Account',
                      subtitle: 'Permanently remove your data',
                      trailing: const _WebBadge(),
                      onTap: () => _openWeb(),
                      destructive: true,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _AccountSection(
                  title: 'Support',
                  items: [
                    _AccountTile(
                      icon: Icons.help_outline,
                      iconColor: const Color(0xFF4CAF50),
                      title: 'Help Center',
                      subtitle: 'FAQs and guides',
                      onTap: () => context.go('/help'),
                    ),
                    _AccountTile(
                      icon: Icons.gavel_outlined,
                      iconColor: Colors.white54,
                      title: 'Terms of Service',
                      subtitle: 'View terms and conditions',
                      onTap: () => context.push('/terms?view=1'),
                    ),
                    _AccountTile(
                      icon: Icons.privacy_tip_outlined,
                      iconColor: Colors.white54,
                      title: 'Privacy Policy',
                      subtitle: 'How we use your data',
                      onTap: () => context.push('/terms?view=1'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Center(
                  child: Column(
                    children: [
                      Text(
                        'Sahel AgriConnect v1.1.0',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.3),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '🌾 Produce. Sell. Earn.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.2),
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
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (dCtx) => AlertDialog(
                          backgroundColor: const Color(0xFF1a3c2e),
                          title: const Text(
                            'Sign out?',
                            style: TextStyle(color: Colors.white),
                          ),
                          content: Text(
                            'You will be returned to the home screen.',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(dCtx, false),
                              child: Text(
                                'Cancel',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.6),
                                ),
                              ),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pop(dCtx, true),
                              child: const Text(
                                'Sign out',
                                style: TextStyle(color: Colors.red),
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
                    icon: const Icon(Icons.logout, color: Colors.red),
                    label: const Text(
                      'Sign Out',
                      style: TextStyle(color: Colors.red),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: Colors.red.withValues(alpha: 0.4),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _AccountSection extends StatelessWidget {
  const _AccountSection({required this.title, required this.items});

  final String title;
  final List<Widget> items;

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
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1e4535),
                Color(0xFF162e24),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
            ),
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
}

class _AccountTile extends StatelessWidget {
  const _AccountTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.trailing,
    this.destructive = false,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 4,
      ),
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
        style: TextStyle(
          color: destructive ? Colors.red : Colors.white,
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
      trailing: trailing ??
          Icon(
            Icons.arrow_forward_ios,
            size: 14,
            color: Colors.white.withValues(alpha: 0.25),
          ),
    );
  }
}

class _WebBadge extends StatelessWidget {
  const _WebBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.3),
        ),
      ),
      child: const Text(
        'Web',
        style: TextStyle(
          color: AppColors.gold,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
