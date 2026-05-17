import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/auth_state.dart';
import '../core/glass.dart';
import '../core/language_provider.dart';
import '../core/theme.dart';

/// Public-facing entry point for Sahel AgriConnect.
///
/// The home screen replaces the role-only landing experience with a richer,
/// guest-friendly browsing surface. Visitors can preview content for each
/// audience (Farmers, Investors, Cooperatives, Markets) without an account
/// and only hit the auth wall when they try to do something that needs an
/// authenticated session.
///
/// Routing wiring (assigning `/` to this screen, removing the redirect to
/// `/role`) is intentionally left out of this file so it can be enabled
/// incrementally without breaking existing logged-in flows.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.initialGuestCategory});

  /// When set (via `/guest/...`), selects this audience on first frame.
  final int? initialGuestCategory;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

/// Lightweight metadata for a home-screen category. Each one renders a
/// quick-tap card and a lazy-loaded preview panel below the carousel.
class _Category {
  final String emoji;
  final IconData icon;
  final String titleEn;
  final String titleFr;
  final String descEn;
  final String descFr;
  final Color accent;

  /// Route to send the user to if they choose to sign in for this category.
  /// `null` means "no role-specific login" (e.g. the public Markets tab).
  final String? loginRoute;

  /// Sample teaser items displayed in the preview panel. Static for now —
  /// real API content can replace these once the preview endpoints exist.
  final List<({String label, String sublabel, String? meta})> previewItems;

  /// Localised label for the "do the thing" CTA that triggers the
  /// sign-in-required modal for guests.
  final String ctaEn;
  final String ctaFr;

  const _Category({
    required this.emoji,
    required this.icon,
    required this.titleEn,
    required this.titleFr,
    required this.descEn,
    required this.descFr,
    required this.accent,
    required this.loginRoute,
    required this.previewItems,
    required this.ctaEn,
    required this.ctaFr,
  });
}

class _MockNotification {
  const _MockNotification({required this.title, required this.subtitle});
  final String title;
  final String subtitle;
}

class _HomeScreenState extends State<HomeScreen> {
  static const List<String> _guestPaths = <String>[
    '/guest/farmer',
    '/guest/investor',
    '/guest/cooperative',
    '/guest/markets',
  ];

  /// Active bottom-nav tab. 0 = Home, 1 = Explore, 2 = Alerts, 3 = Profile.
  int _currentIndex = 0;

  bool _hasUnreadNotifications = false;

  /// Active category on the Home tab.
  int _selectedCategory = 0;

  /// Tracks which category preview panels have been built at least once so
  /// inactive panels stay cheap on first render (lazy loading).
  final Set<int> _loadedPreviews = <int>{0};

  int _exploreChip = 0;

  /// Categories surfaced on the Home tab. Order matches role_screen.dart
  /// where it overlaps so the experience feels consistent.
  static const List<_Category> _categories = <_Category>[
    _Category(
      emoji: '🌾',
      icon: Icons.spa_outlined,
      titleEn: 'Farmers',
      titleFr: 'Agriculteurs',
      descEn: 'Declare produce, AI tools, weather',
      descFr: 'Déclarer cultures, outils IA, météo',
      accent: Color(0xFF3B6D11),
      loginRoute: '/login/farmer',
      ctaEn: 'List my produce',
      ctaFr: 'Annoncer ma production',
      previewItems: [
        (label: 'Shea Butter', sublabel: 'High demand in EU', meta: '+12%'),
        (label: 'Sesame', sublabel: 'Stable export prices', meta: '+3%'),
        (label: 'Cashew', sublabel: 'Premium grade wanted', meta: '+8%'),
      ],
    ),
    _Category(
      emoji: '💰',
      icon: Icons.trending_up_rounded,
      titleEn: 'Investors',
      titleFr: 'Investisseurs',
      descEn: 'AfriYield Exchange — back African yields',
      descFr: 'AfriYield Exchange — financez les rendements',
      accent: AppColors.gold,
      loginRoute: '/login/investor',
      ctaEn: 'View live lots',
      ctaFr: 'Voir les lots',
      previewItems: [
        (
          label: 'Mali Shea Lot #214',
          sublabel: 'Target 14% yield · 6 mo',
          meta: 'OPEN',
        ),
        (
          label: 'Burkina Sesame Lot #198',
          sublabel: 'Target 11% yield · 9 mo',
          meta: 'OPEN',
        ),
        (
          label: 'Senegal Cashew Lot #176',
          sublabel: 'Target 16% yield · 12 mo',
          meta: 'FILLING',
        ),
      ],
    ),
    _Category(
      emoji: '🤝',
      icon: Icons.groups_outlined,
      titleEn: 'Cooperatives',
      titleFr: 'Coopératives',
      descEn: 'Coordinate members, sell at scale',
      descFr: 'Coordonner les membres, vendre à l\'échelle',
      accent: Color(0xFFB5850A),
      loginRoute: '/login/cooperative',
      ctaEn: 'Open my portal',
      ctaFr: 'Ouvrir mon portail',
      previewItems: [
        (
          label: 'Coop Sikasso Karité',
          sublabel: '420 members · Mali',
          meta: 'Certified',
        ),
        (
          label: 'Coop Bobo Sésame',
          sublabel: '215 members · Burkina Faso',
          meta: 'Organic',
        ),
        (
          label: 'Coop Casamance Cajou',
          sublabel: '380 members · Senegal',
          meta: 'Fairtrade',
        ),
      ],
    ),
    _Category(
      emoji: '📈',
      icon: Icons.show_chart_rounded,
      titleEn: 'Markets',
      titleFr: 'Marchés',
      descEn: 'Live prices across West Africa',
      descFr: 'Prix en direct en Afrique de l\'Ouest',
      accent: Color(0xFF185FA5),
      loginRoute: null,
      ctaEn: 'Set price alerts',
      ctaFr: 'Créer des alertes',
      previewItems: [
        (label: 'Shea (kg)', sublabel: 'Bamako · Mali', meta: 'CFA 1,250'),
        (label: 'Sesame (kg)', sublabel: 'Ouagadougou · BF', meta: 'CFA 980'),
        (label: 'Cashew (kg)', sublabel: 'Dakar · Senegal', meta: 'CFA 1,420'),
      ],
    ),
  ];

  @override
  void initState() {
    super.initState();
    final g = widget.initialGuestCategory;
    if (g != null && g >= 0 && g < _guestPaths.length) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        setState(() {
          _selectedCategory = g;
          _loadedPreviews.add(g);
          _currentIndex = 0;
        });
      });
    }
  }

  /// Sends the user to the role chooser to sign in for a specific category.
  /// If [loginRoute] is provided we jump directly to that login form;
  /// otherwise we fall back to the role selection screen.
  void _goSignIn(String? loginRoute) {
    context.read<AuthState>().exitGuestMode();
    context.go(loginRoute ?? '/home');
  }

  /// Logged-in users open their role dashboard; guests return to role hub.
  void _goRoleDashboard(AuthState auth) {
    if (!auth.isLoggedIn) {
      context.go('/home');
      return;
    }
    final route = _dashboardRouteForRole(auth.role);
    if (route != null) {
      context.go(route);
    } else {
      context.go('/home');
    }
  }

  int? _categoryIndexForRole(AuthRole role) {
    switch (role) {
      case AuthRole.farmer:
        return 0;
      case AuthRole.investor:
        return 1;
      case AuthRole.cooperative:
        return 2;
      default:
        return null;
    }
  }

  String? _dashboardRouteForRole(AuthRole role) {
    switch (role) {
      case AuthRole.farmer:
        return '/farmer';
      case AuthRole.investor:
        return '/investor';
      case AuthRole.cooperative:
        return '/cooperative';
      case AuthRole.government:
        return '/government';
      case AuthRole.ngo:
        return '/ngo';
      case AuthRole.processor:
        return '/processor';
      default:
        return null;
    }
  }

  List<({String title, String subtitle, Color accent})> _exploreInsights(
    LanguageProvider lp,
    int chip,
  ) {
    switch (chip) {
      case 1:
        return [
          (
            title: lp.t('West Africa spot prices', 'Prix spot Afrique de l\'Ouest'),
            subtitle: lp.t(
              'Shea, cashew and sesame benchmarks updated weekly.',
              'Références karité, cajou et sésame mises à jour chaque semaine.',
            ),
            accent: const Color(0xFF185FA5),
          ),
          (
            title: lp.t('Bamako wholesale index', 'Indice gros Bamako'),
            subtitle: lp.t(
              'Grain and legume prices from cooperative depots.',
              'Prix céréales et légumineuses aux dépôts coopératifs.',
            ),
            accent: const Color(0xFF2d6a4f),
          ),
        ];
      case 2:
        return [
          (
            title: lp.t('Kati women\'s cooperative', 'Coopérative féminine de Kati'),
            subtitle: lp.t(
              'Shea processing — 240 members, export-ready traceability.',
              'Transformation karité — 240 membres, traçabilité export.',
            ),
            accent: const Color(0xFF7B61FF),
          ),
          (
            title: lp.t('Sikasso sesame union', 'Union sésame Sikasso'),
            subtitle: lp.t(
              'Collective bargaining and shared cold storage.',
              'Négociation collective et stockage frigorifique partagé.',
            ),
            accent: const Color(0xFF3B6D11),
          ),
        ];
      case 3:
        return [
          (
            title: lp.t('AfriYield — live lots', 'AfriYield — lots en direct'),
            subtitle: lp.t(
              'Track sesame and shea cycles across Mali & Burkina.',
              'Suivez le sésame et le karité au Mali et au Burkina.',
            ),
            accent: AppColors.gold,
          ),
          (
            title: lp.t('Impact fund pipeline', 'Pipeline fonds à impact'),
            subtitle: lp.t(
              'Agri-SME deals in vetting — avg. ticket €45k.',
              'Opérations PME agro en vérification — ticket moy. 45 k€.',
            ),
            accent: const Color(0xFF185FA5),
          ),
        ];
      case 0:
      default:
        return [
          (
            title: lp.t('Millet — Sahel outlook', 'Millet — perspectives Sahel'),
            subtitle: lp.t(
              'Rain-fed yields trending +6% vs. last season in Mali south.',
              'Rendements pluviaux +6 % vs saison passée au sud Mali.',
            ),
            accent: const Color(0xFF3B6D11),
          ),
          (
            title: lp.t('Shea flowering alert', 'Alerte floraison karité'),
            subtitle: lp.t(
              'Peak harvest window in Burkina Faso: 6–8 weeks.',
              'Fenêtre de récolte pic Burkina Faso : 6–8 semaines.',
            ),
            accent: AppColors.gold,
          ),
        ];
    }
  }

  String _exploreTrendsTitle(LanguageProvider lp, int chip) {
    switch (chip) {
      case 1:
        return lp.t('Price trends', 'Tendances des prix');
      case 2:
        return lp.t('Cooperative activity', 'Activité coopérative');
      case 3:
        return lp.t('Investment flow', 'Flux d\'investissement');
      case 0:
      default:
        return lp.t('Crop trends', 'Tendances cultures');
    }
  }

  void _openCategory(int index, AuthState auth) {
    if (auth.isLoggedIn &&
        _categoryIndexForRole(auth.role) == index) {
      final route = _dashboardRouteForRole(auth.role);
      if (route != null) {
        context.go(route);
        return;
      }
    }
    context.go(_guestPaths[index]);
  }

  /// Shown when a guest tries to perform a protected action. Keeps the
  /// guest browsing flow intact while making the value of signing in clear.
  Future<void> _showSignInRequiredModal({
    required String featureEn,
    required String featureFr,
    String? loginRoute,
  }) async {
    final lp = context.read<LanguageProvider>();
    await showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (dialogContext) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 32),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: Container(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
                decoration: BoxDecoration(
                  color: const Color(0xFF14352a).withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.25),
                    width: 0.5,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.35),
                        ),
                      ),
                      child: const Icon(
                        Icons.lock_outline_rounded,
                        color: AppColors.gold,
                        size: 26,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      lp.t(
                          'Sign in to unlock', 'Connectez-vous pour débloquer'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      lp.t(featureEn, featureFr),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 22),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(dialogContext).pop();
                          _goSignIn(loginRoute);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: AppColors.forestGreen,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          lp.t('Sign in or sign up',
                              "S'inscrire ou se connecter"),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: () => Navigator.of(dialogContext).pop(),
                      child: Text(
                        lp.t('Keep browsing', 'Continuer à explorer'),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showGuestAlertsSheet() {
    final lp = context.read<LanguageProvider>();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: const Color(0xFF1a3c2e),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
          24,
          24,
          24,
          24 + MediaQuery.paddingOf(sheetContext).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              lp.t(
                '🔔 Sign in for notifications',
                '🔔 Connectez-vous pour les notifications',
              ),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              lp.t(
                'Get real-time alerts on prices and updates.',
                'Recevez en temps réel des alertes sur les prix et les nouvelles.',
              ),
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
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: () {
                  Navigator.pop(sheetContext);
                  _goSignIn(null);
                },
                child: Text(
                  lp.t('Sign In', 'Connexion'),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  void _onHomeAppBarBell(AuthState auth) {
    if (auth.isGuest) {
      _showGuestAlertsSheet();
    } else {
      setState(() => _currentIndex = 2);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_currentIndex != 0) {
          setState(() => _currentIndex = 0);
          return;
        }
        showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            backgroundColor: const Color(0xFF1a3c2e),
            title: const Text(
              'Exit app?',
              style: TextStyle(color: Colors.white),
            ),
            content: const Text(
              'Do you want to exit Sahel AgriConnect?',
              style: TextStyle(color: Colors.white70),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext, false),
                child: const Text(
                  'Stay',
                  style: TextStyle(color: Colors.white70),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.pop(dialogContext, true),
                child: const Text(
                  'Exit',
                  style: TextStyle(color: AppColors.gold),
                ),
              ),
            ],
          ),
        ).then((shouldExit) {
          if (shouldExit == true && context.mounted) {
            SystemNavigator.pop();
          }
        });
      },
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Scaffold(
        resizeToAvoidBottomInset: true,
        extendBody: true,
        backgroundColor: AppColors.darkBg,
        bottomNavigationBar: BottomNavigationBar(
          backgroundColor: const Color(0xFF1a3c2e),
          selectedItemColor: AppColors.gold,
          unselectedItemColor: Colors.white38,
          type: BottomNavigationBarType.fixed,
          currentIndex: _currentIndex,
          elevation: 0,
          onTap: (index) {
            if (index == 3) {
              final a = context.read<AuthState>();
              if (a.isLoggedIn) {
                _goRoleDashboard(a);
                return;
              }
            }
            setState(() => _currentIndex = index);
            switch (index) {
              case 0:
                break;
              case 1:
                break;
              case 2:
                final a = context.read<AuthState>();
                if (a.isGuest) {
                  _showGuestAlertsSheet();
                }
                break;
              case 3:
                break;
            }
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.explore_outlined),
              activeIcon: Icon(Icons.explore),
              label: 'Explore',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_outlined),
              activeIcon: Icon(Icons.notifications),
              label: 'Alerts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
        body: IndexedStack(
          index: _currentIndex,
          children: [
            _buildHomeTab(lp, auth),
            _buildExploreTab(lp, auth),
            _buildAlertsTab(lp, auth),
            _buildProfileTab(lp, auth),
          ],
        ),
          ),
        ),
      ),
    );
  }

  Widget _buildHomeTab(LanguageProvider lp, AuthState auth) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1a3c2e), Color(0xFF0d1f17)],
        ),
      ),
      child: Stack(
        children: [
          const Positioned(
            top: -80,
            right: -60,
            child: _Glow(color: AppColors.gold, size: 220),
          ),
          const Positioned(
            bottom: -100,
            left: -80,
            child: _Glow(color: AppColors.sage, size: 260),
          ),
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                pinned: true,
                floating: false,
                backgroundColor: const Color(0xFF1a3c2e),
                surfaceTintColor: Colors.transparent,
                leading: Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: const _Logo(size: 34)
                        .animate()
                        .fadeIn(duration: 600.ms)
                        .scale(
                          begin: const Offset(0.8, 0.8),
                          duration: 800.ms,
                          curve: Curves.elasticOut,
                        ),
                  ),
                ),
                leadingWidth: 52,
                title: const Text(
                  'Sahel AgriConnect',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
                actions: [
                  IconButton(
                    icon: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        const Icon(
                          Icons.notifications_outlined,
                          color: Colors.white,
                          size: 24,
                        ),
                        if (_hasUnreadNotifications)
                          Positioned(
                            right: -2,
                            top: -2,
                            child: Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                    onPressed: () {
                      setState(() => _hasUnreadNotifications = false);
                      _onHomeAppBarBell(auth);
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Center(
                      child: auth.isLoggedIn
                          ? _PillButton(
                              label: lp.t('Profile', 'Profil'),
                              icon: Icons.person_outline_rounded,
                              onTap: () => _goRoleDashboard(auth),
                            )
                          : _PillButton(
                              label: lp.t('Sign in', 'Connexion'),
                              icon: Icons.login_rounded,
                              isPrimary: true,
                              onTap: () => _goSignIn(null),
                            ),
                    ),
                  ),
                ],
              ),
              SliverToBoxAdapter(child: _buildHero(lp, auth)),
              SliverToBoxAdapter(child: _buildCategoryCarousel(lp)),
              SliverToBoxAdapter(child: _buildPreviewPanel(lp, auth)),
              const SliverToBoxAdapter(child: SizedBox(height: 110)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHero(LanguageProvider lp, AuthState auth) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            lp.t(
              'Welcome to a connected harvest',
              'Bienvenue dans une récolte connectée',
            ),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.45),
              fontSize: 12,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            lp.t(
              'Produce together.\nSell further. Earn more.',
              'Produire ensemble.\nVendre plus loin. Gagner plus.',
            ),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              height: 1.15,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: 500.ms)
              .slideY(begin: 0.3, duration: 500.ms, curve: Curves.easeOut),
          const SizedBox(height: 6),
          Text(
            lp.t(
              'A pan-African platform for farmers, cooperatives and investors.',
              'Une plateforme panafricaine pour agriculteurs, coopératives et investisseurs.',
            ),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 13,
              height: 1.5,
            ),
          )
              .animate()
              .fadeIn(delay: 350.ms, duration: 500.ms)
              .slideY(begin: 0.3, duration: 500.ms, curve: Curves.easeOut),
          const SizedBox(height: 18),
          Row(
            children: [
              if (!auth.isLoggedIn && !auth.isGuest)
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () =>
                          context.read<AuthState>().continueAsGuest(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: AppColors.forestGreen,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        lp.t('Explore as guest', 'Explorer en visiteur'),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                )
              else
                Expanded(
                  child: GlassCard(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                    borderColor: AppColors.gold.withValues(alpha: 0.25),
                    backgroundColor: AppColors.gold.withValues(alpha: 0.08),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.explore_outlined,
                          color: AppColors.gold,
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            auth.isLoggedIn
                                ? lp.t(
                                    'You are signed in. Tap any card for full access.',
                                    'Vous êtes connecté. Touchez une carte pour y accéder.',
                                  )
                                : lp.t(
                                    'Browsing as guest. Sign in anytime to unlock more.',
                                    'En mode visiteur. Connectez-vous pour débloquer plus.',
                                  ),
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 12,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(width: 10),
              SizedBox(
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _currentIndex = 1),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.2),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: const Icon(Icons.search_rounded, size: 18),
                  label: Text(
                    lp.t('Discover', 'Découvrir'),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          )
              .animate()
              .fadeIn(delay: 600.ms, duration: 400.ms)
              .slideY(begin: 0.2, duration: 400.ms, curve: Curves.easeOut),
        ],
      ),
    );
  }

  Widget _buildCategoryCarousel(LanguageProvider lp) {
    final auth = context.watch<AuthState>();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  lp.t('Browse by audience', 'Explorer par audience'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  lp.t('Tap to preview', 'Toucher pour aperçu'),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 132,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                final c = _categories[i];
                final selected = i == _selectedCategory;
                return _CategoryCard(
                  category: c,
                  selected: selected,
                  isFr: lp.isFr,
                  onTap: () {
                    setState(() {
                      _selectedCategory = i;
                      _loadedPreviews.add(i);
                    });
                    _openCategory(i, auth);
                  },
                )
                    .animate()
                    .fadeIn(
                      delay: Duration(milliseconds: 100 * i),
                      duration: 400.ms,
                    )
                    .slideX(
                      begin: 0.2,
                      duration: 400.ms,
                      curve: Curves.easeOut,
                    );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewPanel(LanguageProvider lp, AuthState auth) {
    final cat = _categories[_selectedCategory];
    // Lazy-load: only build preview content for categories we've actually
    // visited. AnimatedSwitcher handles the cross-fade between panels.
    final shouldRender = _loadedPreviews.contains(_selectedCategory);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeOut,
        transitionBuilder: (child, anim) => FadeTransition(
          opacity: anim,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.04),
              end: Offset.zero,
            ).animate(anim),
            child: child,
          ),
        ),
        child: shouldRender
            ? GlassCard(
                key: ValueKey<int>(_selectedCategory),
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                borderColor: cat.accent.withValues(alpha: 0.35),
                backgroundColor: cat.accent.withValues(alpha: 0.06),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: cat.accent.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            cat.emoji,
                            style: const TextStyle(fontSize: 18),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                lp.t(cat.titleEn, cat.titleFr),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                lp.t(cat.descEn, cat.descFr),
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.55),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    ...cat.previewItems.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _PreviewRow(
                          label: item.label,
                          sublabel: item.sublabel,
                          meta: item.meta,
                          accent: cat.accent,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 44,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                if (auth.isLoggedIn) {
                                  final route =
                                      _dashboardRouteForRole(auth.role);
                                  if (route != null &&
                                      _categoryIndexForRole(auth.role) ==
                                          _selectedCategory) {
                                    context.go(route);
                                    return;
                                  }
                                  _goSignIn(cat.loginRoute);
                                  return;
                                }
                                _showSignInRequiredModal(
                                  featureEn:
                                      'Sign up or log in to use ${cat.titleEn.toLowerCase()} tools and save your work.',
                                  featureFr:
                                      'Inscrivez-vous pour utiliser les outils ${cat.titleFr.toLowerCase()} et sauvegarder votre travail.',
                                  loginRoute: cat.loginRoute,
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: cat.accent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: Icon(cat.icon, size: 16),
                              label: Text(
                                lp.t(cat.ctaEn, cat.ctaFr),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        TextButton(
                          onPressed: () => setState(() => _currentIndex = 1),
                          child: Text(
                            lp.t('See more', 'Voir plus'),
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              )
            : const SizedBox.shrink(),
      ),
    );
  }

  // ─────────────────────────── Explore tab ─────────────────────────────

  Widget _buildExploreTab(LanguageProvider lp, AuthState auth) {
    final chips = <(String, IconData)>[
      (lp.t('Crops', 'Cultures'), Icons.eco_outlined),
      (lp.t('Markets', 'Marchés'), Icons.show_chart_rounded),
      (lp.t('Cooperatives', 'Coopératives'), Icons.groups_outlined),
      (lp.t('Investors', 'Investisseurs'), Icons.trending_up_rounded),
    ];

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF152922), Color(0xFF0a1612)],
        ),
      ),
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            floating: false,
            backgroundColor: const Color(0xFF152922),
            surfaceTintColor: Colors.transparent,
            title: Text(
              lp.t('Discover', 'Découvrir'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.search_rounded, color: Colors.white),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        lp.t('Search coming soon', 'Recherche bientôt'),
                      ),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            sliver: SliverToBoxAdapter(
              child: TextField(
                style: const TextStyle(color: Colors.white, fontSize: 14),
                cursorColor: AppColors.gold,
                decoration: InputDecoration(
                  hintText: lp.t(
                    'Search crops, regions, cooperatives…',
                    'Rechercher cultures, régions, coopératives…',
                  ),
                  hintStyle: TextStyle(
                    color: Colors.white.withValues(alpha: 0.35),
                    fontSize: 13,
                  ),
                  prefixIcon: Icon(
                    Icons.search_rounded,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.06),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 72,
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                scrollDirection: Axis.horizontal,
                itemCount: chips.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final sel = i == _exploreChip;
                  return GestureDetector(
                    onTap: () => setState(() => _exploreChip = i),
                    child: SizedBox(
                      width: 140,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: sel
                              ? AppColors.gold.withValues(alpha: 0.2)
                              : Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: sel
                                ? AppColors.gold.withValues(alpha: 0.5)
                                : Colors.white.withValues(alpha: 0.12),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              chips[i].$2,
                              size: 16,
                              color: sel ? AppColors.gold : Colors.white70,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                chips[i].$1,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: sel ? AppColors.gold : Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  height: 1.25,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            sliver: SliverToBoxAdapter(
              child: Text(
                lp.t('Featured', 'À la une'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            sliver: SliverToBoxAdapter(
              child: Column(
                key: ValueKey<int>(_exploreChip),
                children: [
                  for (final item in _exploreInsights(lp, _exploreChip)) ...[
                    GlassCard(
                      padding: const EdgeInsets.all(12),
                      borderColor: item.accent.withValues(alpha: 0.4),
                      backgroundColor: item.accent.withValues(alpha: 0.08),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.subtitle,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
            sliver: SliverToBoxAdapter(
              child: Text(
                _exploreTrendsTitle(lp, _exploreChip),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: GlassCard(
                padding: const EdgeInsets.fromLTRB(12, 20, 12, 12),
                child: SizedBox(
                  height: 200,
                  child: BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: 100,
                      gridData: const FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        show: true,
                        topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 28,
                            getTitlesWidget: (v, m) => Text(
                              '${v.toInt()}',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.35),
                                fontSize: 9,
                              ),
                            ),
                          ),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (v, m) {
                              const labels = ['S', 'O', 'N', 'D', 'J', 'F'];
                              final i = v.toInt();
                              if (i < 0 || i >= labels.length) {
                                return const SizedBox.shrink();
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  labels[i],
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.45),
                                    fontSize: 10,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      barGroups: [
                        for (int i = 0; i < 6; i++)
                          BarChartGroupData(
                            x: i,
                            barRods: [
                              BarChartRodData(
                                toY: [62, 55, 71, 48, 80, 66][i].toDouble(),
                                width: 14,
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(4),
                                  topRight: Radius.circular(4),
                                ),
                                color: AppColors.gold,
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 110)),
        ],
      ),
    );
  }

  // ─────────────────────────── Alerts tab ──────────────────────────────

  Widget _buildAlertsTab(LanguageProvider lp, AuthState auth) {
    const bg = Color(0xFF0c1814);

    if (!auth.isLoggedIn) {
      return ColoredBox(
        color: bg,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: bg,
              surfaceTintColor: Colors.transparent,
              title: Text(
                lp.t('Alerts', 'Alertes'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 110),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.notifications_active_outlined,
                      color: AppColors.gold,
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      lp.t(
                        'Sign in for alerts',
                        'Connectez-vous pour les alertes',
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      lp.t(
                        'Get prices, vetting updates and cooperative news in real time.',
                        'Recevez prix, validations et nouvelles des coopératives en temps réel.',
                      ),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 13,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () => _goSignIn(null),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: AppColors.forestGreen,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          lp.t('Sign in or sign up',
                              "S'inscrire ou se connecter"),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    const notifications = <_MockNotification>[];

    return ColoredBox(
      color: bg,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: bg,
            surfaceTintColor: Colors.transparent,
            title: Text(
              lp.t('Alerts', 'Alertes'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          if (notifications.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(32, 0, 32, 110),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.notifications_none_rounded,
                      size: 64,
                      color: Colors.white.withValues(alpha: 0.25),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      lp.t(
                        'No notifications yet',
                        'Aucune notification pour l\'instant',
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      lp.t(
                        'We will notify you about prices, lots and messages.',
                        'Nous vous préviendrons pour les prix, lots et messages.',
                      ),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    final n = notifications[i];
                    return ListTile(
                      title: Text(n.title,
                          style: const TextStyle(color: Colors.white)),
                      subtitle: Text(
                        n.subtitle,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 12,
                        ),
                      ),
                    );
                  },
                  childCount: notifications.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ─────────────────────────── Profile tab ───────────────────────────

  Widget _buildProfileTab(LanguageProvider lp, AuthState auth) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF1a3c2e), Color(0xFF0d1a15)],
        ),
      ),
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            floating: false,
            backgroundColor: const Color(0xFF1a3c2e),
            surfaceTintColor: Colors.transparent,
            title: Text(
              lp.t('Profile', 'Profil'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          if (!auth.isLoggedIn) ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              sliver: SliverToBoxAdapter(
                child: GlassCard(
                  padding: const EdgeInsets.all(20),
                  borderColor: AppColors.gold.withValues(alpha: 0.35),
                  backgroundColor: Colors.white.withValues(alpha: 0.05),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        lp.t(
                          'Unlock the full platform',
                          'Débloquez toute la plateforme',
                        ),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 14),
                      _benefitRow(
                        lp,
                        lp.t(
                          'Declare produce and use AI tools',
                          'Déclarez vos produits et outils IA',
                        ),
                      ),
                      _benefitRow(
                        lp,
                        lp.t(
                          'Invest on AfriYield Exchange',
                          'Investir sur AfriYield Exchange',
                        ),
                      ),
                      _benefitRow(
                        lp,
                        lp.t(
                          'Manage your cooperative portal',
                          'Gérez le portail de votre coopérative',
                        ),
                      ),
                      _benefitRow(
                        lp,
                        lp.t(
                          'Price alerts and secure messaging',
                          'Alertes prix et messages sécurisés',
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () => _goSignIn(null),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: AppColors.forestGreen,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Text(
                            lp.t('Sign in or sign up',
                                "S'inscrire ou se connecter"),
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ] else ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              sliver: SliverToBoxAdapter(
                child: GlassCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppColors.gold.withValues(alpha: 0.2),
                        child: const Icon(
                          Icons.person_rounded,
                          color: AppColors.gold,
                          size: 30,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              auth.displayName.isEmpty
                                  ? lp.t('Member', 'Membre')
                                  : auth.displayName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (auth.displayEmail.isNotEmpty)
                              Text(
                                auth.displayEmail,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.55),
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
            sliver: SliverToBoxAdapter(
              child: GlassCard(
                child: Column(
                  children: [
                    if (auth.isLoggedIn) ...[
                      _ProfileLink(
                        icon: Icons.settings_outlined,
                        label: lp.t('Account & settings', 'Compte et réglages'),
                        onTap: () => _goRoleDashboard(auth),
                      ),
                      _Divider(),
                    ],
                    _ProfileLink(
                      icon: Icons.translate_rounded,
                      label: lp.t('Language', 'Langue'),
                      trailing: lp.lang.toUpperCase(),
                      onTap: () => lp.setLang(lp.isFr ? 'en' : 'fr'),
                    ),
                    _Divider(),
                    _ProfileLink(
                      icon: Icons.description_outlined,
                      label:
                          lp.t('Terms of Service', 'Conditions d\'utilisation'),
                      onTap: () => context.push('/terms?view=1&tab=0'),
                    ),
                    _Divider(),
                    _ProfileLink(
                      icon: Icons.privacy_tip_outlined,
                      label: lp.t(
                          'Privacy Policy', 'Politique de confidentialité'),
                      onTap: () => context.push('/terms?view=1&tab=1'),
                    ),
                    if (auth.isLoggedIn) ...[
                      _Divider(),
                      _ProfileLink(
                        icon: Icons.edit_outlined,
                        label: lp.t('Edit profile', 'Modifier le profil'),
                        onTap: () => context.push('/profile/edit'),
                      ),
                    ],
                    _Divider(),
                    _ProfileLink(
                      icon: Icons.help_outline_rounded,
                      label: lp.t('Help', 'Aide'),
                      onTap: () => context.push('/help'),
                    ),
                    _Divider(),
                    _ProfileLink(
                      icon: Icons.info_outline_rounded,
                      label: lp.t('About', 'À propos'),
                      onTap: () => context.push('/about'),
                    ),
                    if (auth.isLoggedIn) ...[
                      _Divider(),
                      _ProfileLink(
                        icon: Icons.logout_rounded,
                        label: lp.t('Sign out', 'Déconnexion'),
                        onTap: () => _confirmLogout(lp),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _benefitRow(LanguageProvider lp, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 18,
            color: AppColors.gold.withValues(alpha: 0.9),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 13,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(LanguageProvider lp) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1a3c2e),
        title: Text(
          lp.t('Sign out?', 'Déconnexion ?'),
          style: const TextStyle(color: Colors.white),
        ),
        content: Text(
          lp.t(
            'You will return to browsing as a guest on this device.',
            'Vous reviendrez en navigation invité sur cet appareil.',
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
              style: const TextStyle(color: AppColors.gold),
            ),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await context.read<AuthState>().logout();
    }
  }
}

// ═════════════════════════════════════════════════════════════════════
//                          Helper widgets
// ═════════════════════════════════════════════════════════════════════

/// Renders the brand logo with a graceful fallback if `logo.png` hasn't
/// been added to the assets bundle yet — never breaks the layout.
class _Logo extends StatelessWidget {
  final double size;
  const _Logo({this.size = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.25),
        child: Image.asset(
          'assets/images/logo.png',
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _LogoFallback(size: size),
        ),
      ),
    );
  }
}

class _LogoFallback extends StatelessWidget {
  final double size;
  const _LogoFallback({required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.forestGreen, AppColors.sage],
        ),
        borderRadius: BorderRadius.circular(size * 0.25),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.45),
          width: 0.8,
        ),
      ),
      child: Text(
        'SA',
        style: TextStyle(
          color: AppColors.gold,
          fontSize: size * 0.42,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  final Color color;
  final double size;
  const _Glow({required this.color, required this.size});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withValues(alpha: 0.18),
              color.withValues(alpha: 0),
            ],
          ),
        ),
      ),
    );
  }
}

class _PillButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const _PillButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isPrimary
              ? AppColors.gold.withValues(alpha: 0.18)
              : Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isPrimary
                ? AppColors.gold.withValues(alpha: 0.45)
                : Colors.white.withValues(alpha: 0.15),
            width: 0.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isPrimary ? AppColors.gold : Colors.white,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isPrimary ? AppColors.gold : Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final _Category category;
  final bool selected;
  final bool isFr;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.category,
    required this.selected,
    required this.isFr,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
      width: 160,
      child: GlassCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        borderColor: selected
            ? category.accent.withValues(alpha: 0.6)
            : Colors.white.withValues(alpha: 0.1),
        backgroundColor: selected
            ? category.accent.withValues(alpha: 0.14)
            : Colors.white.withValues(alpha: 0.04),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: category.accent.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(category.emoji, style: const TextStyle(fontSize: 18)),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isFr ? category.titleFr : category.titleEn,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isFr ? category.descFr : category.descEn,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 10.5,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PreviewRow extends StatelessWidget {
  final String label;
  final String sublabel;
  final String? meta;
  final Color accent;

  const _PreviewRow({
    required this.label,
    required this.sublabel,
    required this.meta,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.06),
          width: 0.5,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  sublabel,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          if (meta != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: accent.withValues(alpha: 0.35),
                  width: 0.5,
                ),
              ),
              child: Text(
                meta!,
                style: TextStyle(
                  color: Color.lerp(accent, Colors.white, 0.55),
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ProfileLink extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? trailing;
  final VoidCallback onTap;

  const _ProfileLink({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: Colors.white.withValues(alpha: 0.75), size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (trailing != null) ...[
              Text(
                trailing!,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 6),
            ],
            Icon(
              Icons.chevron_right_rounded,
              color: Colors.white.withValues(alpha: 0.35),
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 0.5,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: Colors.white.withValues(alpha: 0.06),
    );
  }
}
