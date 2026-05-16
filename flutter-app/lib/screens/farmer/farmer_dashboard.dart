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
import '../../widgets/dashboard_account_nav_header.dart';
import '../../widgets/dashboard_sign_out_button.dart';
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

  List<Map<String, Object>> _farmerTools(LanguageProvider lp) => [
        {
          'icon': '🌱',
          'title': lp.t('Soil diagnosis', 'Diagnostic du sol'),
          'desc': lp.t('Analyze your soil', 'Analyser votre sol'),
          'bg': const Color(0xFF1e4535),
          'url': 'https://sahelagriconnect.com/diagnostic-sol',
          'webTitle': lp.t('Soil Diagnostic', 'Diagnostic du sol'),
        },
        {
          'icon': '🔬',
          'title': lp.t('Disease detect', 'Détection maladies'),
          'desc': lp.t('Photo analysis', 'Analyse photo'),
          'bg': const Color(0xFF243d32),
          'url': 'https://sahelagriconnect.com/detection-maladies',
          'webTitle': lp.t('Disease Detection', 'Détection des maladies'),
        },
        {
          'icon': '🧠',
          'title': lp.t('Think Tank', 'Think Tank'),
          'desc': lp.t('AI advisor', 'Conseiller IA'),
          'bg': const Color(0xFF1a3540),
          'url': 'https://sahelagriconnect.com/think-tank',
          'webTitle': lp.t('AI Advisor', 'Conseiller IA'),
        },
        {
          'icon': '💧',
          'title': lp.t('Irrigation', 'Irrigation'),
          'desc': lp.t('Water planning', 'Planification hydrique'),
          'bg': const Color(0xFF1e3545),
          'url': 'https://sahelagriconnect.com/irrigation',
          'webTitle': lp.t('Irrigation Planning', 'Planification irrigation'),
        },
        {
          'icon': '📊',
          'title': lp.t('Production optimizer', 'Optimiseur production'),
          'desc': lp.t('Gemini AI planning', 'Planification IA Gemini'),
          'bg': const Color(0xFF1e4535),
          'url': 'https://sahelagriconnect.com/optimisation-production',
          'webTitle': lp.t('Production Optimizer', 'Optimiseur de production'),
        },
        {
          'icon': '🔍',
          'title': lp.t('Traceability', 'Traçabilité'),
          'desc': lp.t('Track your produce lot', 'Suivre votre lot'),
          'bg': const Color(0xFF2a3820),
          'url': 'https://sahelagriconnect.com/traceabilite',
          'webTitle': lp.t('Traceability', 'Traçabilité'),
          'comingSoon': true,
        },
      ];

  @override
  void initState() {
    super.initState();
    _loadFarmer();
  }

  String _greetingLine(LanguageProvider lp) {
    final h = DateTime.now().hour;
    if (h < 12) return lp.t('Good morning,', 'Bonjour,');
    if (h < 17) return lp.t('Good afternoon,', 'Bon après-midi,');
    return lp.t('Good evening,', 'Bonsoir,');
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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _greetingLine(lp),
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

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    return Consumer<LanguageProvider>(
      builder: (context, langProvider, _) {
        final displayName = auth.displayName.isNotEmpty
            ? auth.displayName
            : (_farmer?['nom'] ??
                    langProvider.t('Farmer', 'Agriculteur'))
                .toString();
        final tools = _farmerTools(langProvider);

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
                child: IndexedStack(
                  index: _tab,
                  children: [
                    _HomeTab(
                      cultures: _cultures,
                      loadingFarmer: _loadingFarmer,
                      tools: tools,
                      produceRow: _produceRow,
                      onSeeAllAiTools: () {
                        AuthService.resetActivity();
                        setState(() => _tab = 2);
                      },
                    ),
                    _ProduceTab(
                      loadingFarmer: _loadingFarmer,
                      cultures: _cultures,
                      produceRow: _produceRow,
                    ),
                    _AiToolsTab(tools: tools),
                    const _BenefitsTab(),
                    const _FarmerUpdatesTab(),
                    _AccountSettingsTab(
                      onBackToDashboard: () => setState(() => _tab = 0),
                    ),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: _buildBottomNavigationBar(langProvider),
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

  Widget _buildBottomNavigationBar(LanguageProvider lp) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF152923),
        border: Border(
          top: BorderSide(
            color: Colors.white.withValues(alpha: 0.08),
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: BottomNavigationBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          currentIndex: _tab,
          selectedItemColor: AppColors.gold,
          unselectedItemColor: Colors.white38,
          selectedFontSize: 10,
          unselectedFontSize: 9,
          onTap: (index) {
            AuthService.resetActivity();
            setState(() => _tab = index);
          },
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: lp.t('Home', 'Accueil'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.grass_outlined),
              activeIcon: const Icon(Icons.grass),
              label: lp.t('Produce', 'Production'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.psychology_outlined),
              activeIcon: const Icon(Icons.psychology),
              label: lp.t('AI Tools', 'Outils IA'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.card_giftcard_outlined),
              activeIcon: const Icon(Icons.card_giftcard),
              label: lp.t('Benefits', 'Avantages'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.campaign_outlined),
              activeIcon: const Icon(Icons.campaign),
              label: lp.t('Updates', 'Mises à jour'),
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
    builder: (sheetCtx) {
      final lp = sheetCtx.watch<LanguageProvider>();
      return Padding(
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
                child: Text(
                  lp.t('Got it', 'Compris'),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      );
    },
  );
}

Widget _farmerToolGrid(BuildContext context, List<Map<String, Object>> tools) {
  final lp = context.watch<LanguageProvider>();
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
                body: lp.t(
                  'Track your produce lot from farm to market. '
                      'This feature is coming soon.',
                  'Suivez votre lot de la ferme au marché. '
                      'Cette fonctionnalité arrive bientôt.',
                ),
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
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _FarmerAlertSection(
                    icon: '📈',
                    title: lp.t('Market Alerts', 'Alertes marché'),
                    subtitle: lp.t(
                      'Price changes for your crops',
                      'Évolution des prix de vos cultures',
                    ),
                    items: [
                      _FarmerAlertItem(
                        title: lp.t('Shea Butter +12%', 'Beurre de karité +12 %'),
                        body: lp.t(
                          'High demand in EU markets this week',
                          'Forte demande sur les marchés UE cette semaine',
                        ),
                        time: lp.t('Today', 'Aujourd\'hui'),
                        color: const Color(0xFF4CAF50),
                      ),
                      _FarmerAlertItem(
                        title: lp.t('Sesame +3%', 'Sésame +3 %'),
                        body: lp.t(
                          'Stable export prices, good time to sell',
                          'Prix export stables, bon moment pour vendre',
                        ),
                        time: lp.t('Yesterday', 'Hier'),
                        color: const Color(0xFF4CAF50),
                      ),
                      _FarmerAlertItem(
                        title: lp.t('Cashew +8%', 'Cajou +8 %'),
                        body: lp.t(
                          'Premium grade wanted by EU buyers',
                          'Qualité premium recherchée par les acheteurs UE',
                        ),
                        time: lp.t('2 days ago', 'Il y a 2 jours'),
                        color: const Color(0xFF4CAF50),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _FarmerAlertSection(
                    icon: '🌾',
                    title: lp.t('Platform Updates', 'Actualités plateforme'),
                    subtitle: lp.t(
                      'News from Sahel AgriConnect',
                      'Nouvelles de Sahel AgriConnect',
                    ),
                    items: [
                      _FarmerAlertItem(
                        title: lp.t(
                          'Welcome to Sahel AgriConnect',
                          'Bienvenue sur Sahel AgriConnect',
                        ),
                        body: lp.t(
                          'Your account is active. Start declaring your produce to connect with buyers.',
                          'Votre compte est actif. Déclarez vos productions pour trouver des acheteurs.',
                        ),
                        time: lp.t('Recently', 'Récemment'),
                        color: const Color(0xFFB5850A),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _FarmerAlertSection(
                    icon: '🤝',
                    title: lp.t('Cooperative News', 'Actualités coopérative'),
                    subtitle: lp.t(
                      'Updates from your network',
                      'Nouvelles de votre réseau',
                    ),
                    items: [
                      _FarmerAlertItem(
                        title: lp.t('No cooperative yet', 'Pas encore de coopérative'),
                        body: lp.t(
                          'Join a cooperative to receive updates here.',
                          'Rejoignez une coopérative pour recevoir des mises à jour ici.',
                        ),
                        time: '',
                        color: Colors.white38,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
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
  const _AccountSettingsTab({required this.onBackToDashboard});

  final VoidCallback onBackToDashboard;

  static const _cardStart = Color(0xFF1a3c2e);
  static const _cardEnd = Color(0xFF2d6a4f);

  Future<void> _openWeb() async {
    final uri = Uri.parse('https://sahelagriconnect.com');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final lp = context.watch<LanguageProvider>();
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
                      auth.displayName.isNotEmpty
                          ? auth.displayName
                          : lp.t('Farmer', 'Agriculteur'),
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
                      child: Text(
                        lp.t('🌾 Farmer Account', '🌾 Compte agriculteur'),
                        style: const TextStyle(
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
            onPressed: onBackToDashboard,
          ),
          title: Text(
            lp.t('Account Settings', 'Paramètres du compte'),
            style: const TextStyle(color: Colors.white, fontSize: 18),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              16,
              16,
              16,
              dashboardAccountScrollBottom(context),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DashboardAccountNavHeader(
                  accent: AppColors.gold,
                  cardStart: _cardStart,
                  cardEnd: _cardEnd,
                  onBackToDashboard: onBackToDashboard,
                ),
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
                  title: lp.t('Navigation', 'Navigation'),
                  items: [
                    _AccountTile(
                      icon: Icons.insights_outlined,
                      iconColor: const Color(0xFF2196F3),
                      title: lp.t('My Insights', 'Mes indicateurs'),
                      subtitle: lp.t(
                        'Performance and analytics',
                        'Performance et analyses',
                      ),
                      onTap: () {
                        showFarmerComingSoonSheet(
                          context,
                          title: lp.t('My Insights', 'Mes indicateurs'),
                          emoji: '📊',
                          body: lp.t(
                            'Performance and analytics for your farm are coming soon.',
                            'Les indicateurs et analyses de votre exploitation arrivent bientôt.',
                          ),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _AccountSection(
                  title: lp.t('Profile', 'Profil'),
                  items: [
                    _AccountTile(
                      icon: Icons.person_outline,
                      iconColor: AppColors.gold,
                      title: lp.t('Edit Profile', 'Modifier le profil'),
                      subtitle: lp.t(
                        'Update your name and details',
                        'Mettre à jour votre nom et vos informations',
                      ),
                      onTap: () => context.go('/profile/edit'),
                    ),
                    _AccountTile(
                      icon: Icons.language_outlined,
                      iconColor: const Color(0xFF9C27B0),
                      title: lp.t('Language', 'Langue'),
                      subtitle: lp.t('English / Français', 'Anglais / Français'),
                      onTap: () => context.go('/profile/language'),
                    ),
                    _AccountTile(
                      icon: Icons.notifications_outlined,
                      iconColor: const Color(0xFFFF9800),
                      title: lp.t('Notifications', 'Notifications'),
                      subtitle: lp.t(
                        'Manage alerts and updates',
                        'Gérer les alertes et mises à jour',
                      ),
                      onTap: () => context.push('/notifications'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _AccountSection(
                  title: lp.t('Security & Account', 'Sécurité et compte'),
                  items: [
                    _AccountTile(
                      icon: Icons.lock_outline,
                      iconColor: const Color(0xFF03A9F4),
                      title: lp.t(
                        'Update Login Credentials',
                        'Mettre à jour les identifiants',
                      ),
                      subtitle: lp.t(
                        'Change your email or phone',
                        'Modifier votre e-mail ou téléphone',
                      ),
                      trailing: _WebBadge(lp: lp),
                      onTap: () => _openWeb(),
                    ),
                    _AccountTile(
                      icon: Icons.delete_outline,
                      iconColor: Colors.red,
                      title: lp.t('Delete Account', 'Supprimer le compte'),
                      subtitle: lp.t(
                        'Permanently remove your data',
                        'Supprimer définitivement vos données',
                      ),
                      trailing: _WebBadge(lp: lp),
                      onTap: () => _openWeb(),
                      destructive: true,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _AccountSection(
                  title: lp.t('Support', 'Support'),
                  items: [
                    _AccountTile(
                      icon: Icons.help_outline,
                      iconColor: const Color(0xFF4CAF50),
                      title: lp.t('Help Center', 'Centre d\'aide'),
                      subtitle: lp.t('FAQs and guides', 'FAQ et guides'),
                      onTap: () => context.go('/help'),
                    ),
                    _AccountTile(
                      icon: Icons.gavel_outlined,
                      iconColor: Colors.white54,
                      title: lp.t('Terms of Service', 'Conditions d\'utilisation'),
                      subtitle: lp.t(
                        'View terms and conditions',
                        'Consulter les conditions',
                      ),
                      onTap: () => context.push('/terms?view=1'),
                    ),
                    _AccountTile(
                      icon: Icons.privacy_tip_outlined,
                      iconColor: Colors.white54,
                      title: lp.t('Privacy Policy', 'Politique de confidentialité'),
                      subtitle: lp.t(
                        'How we use your data',
                        'Comment nous utilisons vos données',
                      ),
                      onTap: () => context.push('/terms?view=1'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Center(
                  child: Column(
                    children: [
                      Text(
                        lp.t(
                          'Sahel AgriConnect v1.1.0',
                          'Sahel AgriConnect v1.1.0',
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.3),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        lp.t(
                          '🌾 Produce. Sell. Earn.',
                          '🌾 Produire. Vendre. Gagner.',
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.2),
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ),
                const DashboardSignOutButton(
                  dialogBackground: Color(0xFF1a3c2e),
                ),
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
  const _WebBadge({required this.lp});

  final LanguageProvider lp;

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
      child: Text(
        lp.t('Web', 'Web'),
        style: const TextStyle(
          color: AppColors.gold,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
