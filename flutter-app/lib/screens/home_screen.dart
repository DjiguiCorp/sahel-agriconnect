import 'dart:ui';

import 'package:flutter/material.dart';
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
  const HomeScreen({super.key});

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

class _HomeScreenState extends State<HomeScreen> {
  /// Active bottom-nav tab. 0 = Home, 1 = Discover, 2 = Favorites, 3 = Profile.
  int _navIndex = 0;

  /// Active category on the Home tab.
  int _selectedCategory = 0;

  /// Tracks which category preview panels have been built at least once so
  /// inactive panels stay cheap on first render (lazy loading).
  final Set<int> _loadedPreviews = <int>{0};

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

  void _selectCategory(int index) {
    if (index == _selectedCategory) return;
    setState(() {
      _selectedCategory = index;
      _loadedPreviews.add(index);
    });
  }

  void _selectTab(int index) {
    if (index == _navIndex) return;
    setState(() => _navIndex = index);
  }

  /// Sends the user to the role chooser to sign in for a specific category.
  /// If [loginRoute] is provided we jump directly to that login form;
  /// otherwise we fall back to the role selection screen.
  void _goSignIn(String? loginRoute) {
    context.read<AuthState>().exitGuestMode();
    context.go(loginRoute ?? '/role');
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
                      lp.t('Sign in to unlock', 'Connectez-vous pour débloquer'),
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
                          lp.t('Sign in or sign up', "S'inscrire ou se connecter"),
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

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();

    return Scaffold(
      extendBody: true,
      backgroundColor: AppColors.darkBg,
      bottomNavigationBar: _buildBottomNav(lp),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1a3c2e), Color(0xFF0d1f17)],
          ),
        ),
        child: Stack(
          children: [
            // Decorative ambient glows — purely visual.
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
            SafeArea(
              bottom: false,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 320),
                switchInCurve: Curves.easeOut,
                switchOutCurve: Curves.easeIn,
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.015),
                      end: Offset.zero,
                    ).animate(anim),
                    child: child,
                  ),
                ),
                child: KeyedSubtree(
                  key: ValueKey<int>(_navIndex),
                  child: _buildTab(lp, auth),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(LanguageProvider lp, AuthState auth) {
    switch (_navIndex) {
      case 1:
        return _buildDiscoverTab(lp);
      case 2:
        return _buildFavoritesTab(lp, auth);
      case 3:
        return _buildProfileTab(lp, auth);
      case 0:
      default:
        return _buildHomeTab(lp, auth);
    }
  }

  // ───────────────────────────── Home tab ──────────────────────────────

  Widget _buildHomeTab(LanguageProvider lp, AuthState auth) {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(child: _buildTopBar(lp, auth)),
        SliverToBoxAdapter(child: _buildHero(lp, auth)),
        SliverToBoxAdapter(child: _buildCategoryCarousel(lp)),
        SliverToBoxAdapter(child: _buildPreviewPanel(lp, auth)),
        // Bottom padding so the floating nav doesn't overlap content.
        const SliverToBoxAdapter(child: SizedBox(height: 110)),
      ],
    );
  }

  Widget _buildTopBar(LanguageProvider lp, AuthState auth) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          const _Logo(size: 36)
              .animate()
              .fadeIn(duration: 600.ms)
              .scale(
                begin: const Offset(0.8, 0.8),
                duration: 800.ms,
                curve: Curves.elasticOut,
              ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Sahel AgriConnect',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.3,
              ),
            ),
          ),
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(
                  Icons.notifications_outlined,
                  color: Colors.white,
                  size: 26,
                ),
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
            onPressed: () {
              final authState = context.read<AuthState>();
              if (authState.isGuest) {
                showModalBottomSheet(
                  context: context,
                  backgroundColor: const Color(0xFF1a3c2e),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(20),
                    ),
                  ),
                  builder: (_) => Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          '🔔 Sign in for notifications',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Get real-time alerts on market prices, '
                          'cooperative updates and more.',
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
                              Navigator.pop(context);
                              context.go('/home');
                            },
                            child: const Text(
                              'Sign In',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                );
              } else {
                context.go('/notifications');
              }
            },
          ),
          if (auth.isLoggedIn)
            _PillButton(
              label: lp.t('Profile', 'Profil'),
              icon: Icons.person_outline_rounded,
              onTap: () => context.go('/profile'),
            )
          else
            _PillButton(
              label: lp.t('Sign in', 'Connexion'),
              icon: Icons.login_rounded,
              isPrimary: true,
              onTap: () => _goSignIn(null),
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
                  onPressed: () => _selectTab(1),
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
                  onTap: () => _selectCategory(i),
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
                          onPressed: () => _selectTab(1),
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

  // ─────────────────────────── Discover tab ────────────────────────────

  Widget _buildDiscoverTab(LanguageProvider lp) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle(
            title: lp.t('Discover', 'Découvrir'),
            subtitle: lp.t(
              'Explore crops, regions and live activity.',
              'Explorez cultures, régions et activité.',
            ),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: GridView.builder(
              physics: const BouncingScrollPhysics(),
              gridDelegate:
                  const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.05,
              ),
              itemCount: _categories.length,
              itemBuilder: (context, i) {
                final c = _categories[i];
                return GlassCard(
                  borderColor: c.accent.withValues(alpha: 0.35),
                  backgroundColor: c.accent.withValues(alpha: 0.08),
                  onTap: () {
                    setState(() {
                      _selectedCategory = i;
                      _loadedPreviews.add(i);
                      _navIndex = 0;
                    });
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(c.emoji, style: const TextStyle(fontSize: 26)),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lp.t(c.titleEn, c.titleFr),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            lp.t(c.descEn, c.descFr),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.55),
                              fontSize: 11,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                )
                    .animate(delay: Duration(milliseconds: 60 * i))
                    .fadeIn(duration: 350.ms);
              },
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────── Favorites tab ───────────────────────────

  Widget _buildFavoritesTab(LanguageProvider lp, AuthState auth) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle(
            title: lp.t('Favorites', 'Favoris'),
            subtitle: lp.t(
              'Save crops, lots and cooperatives to revisit later.',
              'Enregistrez cultures, lots et coopératives pour plus tard.',
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: Center(
              child: GlassCard(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
                borderColor: AppColors.gold.withValues(alpha: 0.25),
                backgroundColor: Colors.white.withValues(alpha: 0.04),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.35),
                        ),
                      ),
                      child: const Icon(
                        Icons.favorite_outline_rounded,
                        color: AppColors.gold,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      auth.isLoggedIn
                          ? lp.t('No favorites yet', 'Aucun favori pour l\'instant')
                          : lp.t(
                              'Sign in to save favorites',
                              'Connectez-vous pour enregistrer vos favoris',
                            ),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      lp.t(
                        'Tap the bookmark on any crop, lot or cooperative to keep track of it.',
                        'Touchez le marque-page sur une culture, un lot ou une coopérative.',
                      ),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 18),
                    if (!auth.isLoggedIn)
                      SizedBox(
                        height: 44,
                        child: ElevatedButton(
                          onPressed: () => _goSignIn(null),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: AppColors.forestGreen,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 18),
                            child: Text(
                              lp.t('Sign in', 'Se connecter'),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.04, end: 0),
            ),
          ),
        ],
      ),
    );
  }

  // ──────────────────────────── Profile tab ────────────────────────────

  Widget _buildProfileTab(LanguageProvider lp, AuthState auth) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle(
            title: lp.t('Profile', 'Profil'),
            subtitle: auth.isLoggedIn
                ? lp.t('Manage your account.', 'Gérez votre compte.')
                : lp.t(
                    'Sign in to manage your account.',
                    'Connectez-vous pour gérer votre compte.',
                  ),
          ),
          const SizedBox(height: 16),
          if (auth.isLoggedIn) ...[
            GlassCard(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.35),
                      ),
                    ),
                    child: const Icon(
                      Icons.person_rounded,
                      color: AppColors.gold,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          auth.displayName.isEmpty
                              ? lp.t('Welcome back', 'Bon retour')
                              : auth.displayName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
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
                  IconButton(
                    onPressed: () => context.go('/profile'),
                    icon: const Icon(
                      Icons.chevron_right_rounded,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            GlassCard(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
              borderColor: AppColors.gold.withValues(alpha: 0.25),
              backgroundColor: Colors.white.withValues(alpha: 0.04),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    lp.t('You are browsing as guest', 'Vous explorez en visiteur'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    lp.t(
                      'Create an account to unlock saving, declaring produce, investing and your cooperative portal.',
                      'Créez un compte pour enregistrer, déclarer des produits, investir et ouvrir votre portail coopérative.',
                    ),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 12,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 46,
                    child: ElevatedButton(
                      onPressed: () => _goSignIn(null),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: AppColors.forestGreen,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        lp.t('Sign in or sign up', "S'inscrire ou se connecter"),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 400.ms),
          ],
          const SizedBox(height: 14),
          GlassCard(
            child: Column(
              children: [
                _ProfileLink(
                  icon: Icons.translate_rounded,
                  label: lp.t('Language', 'Langue'),
                  trailing: lp.lang.toUpperCase(),
                  onTap: () =>
                      lp.setLang(lp.isFr ? 'en' : 'fr'),
                ),
                _Divider(),
                _ProfileLink(
                  icon: Icons.help_outline_rounded,
                  label: lp.t('Help', 'Aide'),
                  onTap: () => context.go('/help'),
                ),
                _Divider(),
                _ProfileLink(
                  icon: Icons.info_outline_rounded,
                  label: lp.t('About', 'À propos'),
                  onTap: () => context.go('/about-app'),
                ),
              ],
            ),
          ).animate(delay: 100.ms).fadeIn(duration: 400.ms),
        ],
      ),
    );
  }

  // ────────────────────────── Bottom navigation ────────────────────────

  Widget _buildBottomNav(LanguageProvider lp) {
    final items = <(IconData, String, String)>[
      (Icons.home_outlined, 'Home', 'Accueil'),
      (Icons.explore_outlined, 'Discover', 'Découvrir'),
      (Icons.favorite_outline_rounded, 'Favorites', 'Favoris'),
      (Icons.person_outline_rounded, 'Profile', 'Profil'),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF0d1f17).withValues(alpha: 0.78),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.08),
                width: 0.5,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(items.length, (i) {
                final selected = i == _navIndex;
                final (icon, en, fr) = items[i];
                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => _selectTab(i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      curve: Curves.easeOut,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.gold.withValues(alpha: 0.16)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: selected
                              ? AppColors.gold.withValues(alpha: 0.4)
                              : Colors.transparent,
                          width: 0.5,
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            icon,
                            color: selected
                                ? AppColors.gold
                                : Colors.white.withValues(alpha: 0.55),
                            size: 22,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            lp.t(en, fr),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: selected
                                  ? AppColors.gold
                                  : Colors.white.withValues(alpha: 0.55),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
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

class _SectionTitle extends StatelessWidget {
  final String title;
  final String subtitle;
  const _SectionTitle({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 12,
            height: 1.4,
          ),
        ),
      ],
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
