import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';

abstract final class _Ngo {
  static const Color bg = Color(0xFF0d1f0d);
  static const Color accent = Color(0xFF7BC67E);
  static const LinearGradient headerGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1a3a0a), Color(0xFF243d12)],
  );
  static const LinearGradient cardGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF152818), Color(0xFF0f1f0f)],
  );
}

class NgoDashboard extends StatefulWidget {
  const NgoDashboard({super.key});

  @override
  State<NgoDashboard> createState() => _NgoDashboardState();
}

class _NgoDashboardState extends State<NgoDashboard> {
  int _tab = 0;
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<void> _reload() async {
    setState(() => _future = _load());
    await _future;
  }

  Future<Map<String, dynamic>> _load() async {
    final auth = context.read<AuthState>();
    final token = auth.token;
    if (token != null && token.isNotEmpty) {
      final country = auth.displayCountry.isNotEmpty ? auth.displayCountry : null;
      return ApiService.getGovDashboard(token, country: country);
    }
    return ApiService.getPublicStats();
  }

  bool _isPortal(Map<String, dynamic> d) =>
      d.containsKey('stats') && d.containsKey('country');

  static String _flagEmoji(String? code) {
    if (code == null || code.length != 2) return '🌍';
    final u = code.toUpperCase();
    final a = u.codeUnitAt(0);
    final b = u.codeUnitAt(1);
    if (a < 65 || a > 90 || b < 65 || b > 90) return '🌍';
    const base = 0x1F1E6;
    return String.fromCharCode(base + a - 65) + String.fromCharCode(base + b - 65);
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
      backgroundColor: _Ngo.bg,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: FutureBuilder<Map<String, dynamic>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: _Ngo.accent),
                  );
                }
                if (snap.hasError) {
                  return Center(
                    child: Text(
                      '${snap.error}',
                      style: const TextStyle(color: Colors.white54),
                      textAlign: TextAlign.center,
                    ),
                  );
                }
                final data = snap.data ?? {};
                return _NgoTabBody(
                  tab: _tab,
                  data: data,
                  isPortal: _isPortal(data),
                  onRefresh: _reload,
                  lp: lp,
                  flagEmoji: _flagEmoji(
                    _isPortal(data) ? data['countryCode']?.toString() : null,
                  ),
                );
              },
            ),
          ),
          _NgoBottomNav(
            tab: _tab,
            lp: lp,
            onChanged: (i) {
              AuthService.resetActivity();
              if (i == 0) {
                context.go('/home');
                return;
              }
              setState(() => _tab = i);
            },
          ),
        ],
      ),
    ),
    );
  }
}

class _NgoTabBody extends StatelessWidget {
  const _NgoTabBody({
    required this.tab,
    required this.data,
    required this.isPortal,
    required this.onRefresh,
    required this.lp,
    required this.flagEmoji,
  });

  final int tab;
  final Map<String, dynamic> data;
  final bool isPortal;
  final Future<void> Function() onRefresh;
  final LanguageProvider lp;
  final String flagEmoji;

  @override
  Widget build(BuildContext context) {
    switch (tab) {
      case 1:
        return _NgoProgramsTab(data: data, isPortal: isPortal, lp: lp);
      case 2:
        return _NgoPartnersTab(data: data, isPortal: isPortal, lp: lp);
      case 3:
        return _NgoAccountTab(lp: lp);
      default:
        return _NgoHomeTab(
          data: data,
          isPortal: isPortal,
          onRefresh: onRefresh,
          lp: lp,
          flagEmoji: flagEmoji,
        );
    }
  }
}

class _NgoHomeTab extends StatelessWidget {
  const _NgoHomeTab({
    required this.data,
    required this.isPortal,
    required this.onRefresh,
    required this.lp,
    required this.flagEmoji,
  });

  final Map<String, dynamic> data;
  final bool isPortal;
  final Future<void> Function() onRefresh;
  final LanguageProvider lp;
  final String flagEmoji;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final stats = Map<String, dynamic>.from(data['stats'] as Map? ?? {});
    final farmers = isPortal
        ? (stats['farmers'] as num?)?.toInt() ?? 0
        : (data['total'] as num?)?.toInt() ?? 0;
    final cooperatives = isPortal ? (stats['cooperatives'] as num?)?.toInt() ?? 0 : 0;
    final programs = isPortal ? (stats['activeProjects'] as num?)?.toInt() ?? 0 : 0;
    final beneficiaries =
        isPortal ? (stats['totalResponses'] as num?)?.toInt() ?? 0 : (data['active'] as num?)?.toInt() ?? 0;

    final country = isPortal
        ? (data['country']?.toString() ?? auth.displayCountry)
        : lp.t('Regional partnership', 'Partenariat régional');

    void toast(String msg) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }

    return RefreshIndicator(
      color: _Ngo.accent,
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _NgoHeader(
              lp: lp,
              flagEmoji: flagEmoji,
              countryName: country,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(
                  lp.t('Program overview', 'Aperçu des programmes'),
                  style: const TextStyle(
                    color: _Ngo.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _dashCell(
                      '$programs',
                      lp.t('Active programs', 'Programmes actifs'),
                    ),
                    const SizedBox(width: 10),
                    _dashCell(
                      '$beneficiaries',
                      lp.t('Beneficiaries reached', 'Bénéficiaires'),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  lp.t('Partner network', 'Réseau partenaires'),
                  style: const TextStyle(
                    color: _Ngo.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _dashCell(
                      '$cooperatives',
                      lp.t('Cooperatives', 'Coopératives'),
                    ),
                    const SizedBox(width: 10),
                    _dashCell(
                      '$farmers',
                      lp.t('Farmers in network', 'Agriculteurs'),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  lp.t('Impact metrics', 'Indicateurs d’impact'),
                  style: const TextStyle(
                    color: _Ngo.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 10),
                _impactCard(
                  lp.t(
                    'Farmers supported through bundled services (training + inputs).',
                    'Agriculteurs accompagnés (formation + intrants).',
                  ),
                ),
                const SizedBox(height: 8),
                _impactCard(
                  lp.t(
                    'Yield improvement tracking will combine satellite + field audits.',
                    'Le gain de rendement combinera satellite et audits terrain.',
                  ),
                ),
                const SizedBox(height: 22),
                Text(
                  lp.t('Quick actions', 'Actions rapides'),
                  style: const TextStyle(
                    color: _Ngo.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 10),
                _qa(
                  context,
                  lp,
                  Icons.add_box_outlined,
                  lp.t('Create program', 'Créer un programme'),
                  () => toast(lp.t(
                    'Program builder opens from the web console.',
                    'Le créateur de programme s’ouvre depuis la console web.',
                  )),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.person_add_outlined,
                  lp.t('Add beneficiary', 'Ajouter un bénéficiaire'),
                  () => toast(lp.t(
                    'Beneficiary intake syncs with national farmer registry checks.',
                    'L’ajout vérifie le registre national des agriculteurs.',
                  )),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.assignment_outlined,
                  lp.t('Generate report', 'Générer un rapport'),
                  () => toast(lp.t(
                    'Scheduled PDF exports will appear under Programs.',
                    'Les exports PDF programmés seront sous Programmes.',
                  )),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.sms_outlined,
                  lp.t('Contact farmers', 'Contacter les agriculteurs'),
                  () => toast(lp.t(
                    'Broadcasts respect agronomic quiet hours by default.',
                    'Les diffusions respectent les heures calmes par défaut.',
                  )),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dashCell(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: _Ngo.cardGrad,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 11,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _impactCard(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: _Ngo.cardGrad,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _Ngo.accent.withValues(alpha: 0.22)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.82),
          fontSize: 13,
          height: 1.4,
        ),
      ),
    );
  }

  Widget _qa(
    BuildContext context,
    LanguageProvider lp,
    IconData icon,
    String title,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            gradient: _Ngo.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Row(
            children: [
              Icon(icon, color: _Ngo.accent),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.3)),
            ],
          ),
        ),
      ),
    );
  }
}

class _NgoHeader extends StatelessWidget {
  const _NgoHeader({
    required this.lp,
    required this.flagEmoji,
    required this.countryName,
  });

  final LanguageProvider lp;
  final String flagEmoji;
  final String countryName;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: _Ngo.headerGrad),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 22),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lp.t(
                        'Partner & programs dashboard',
                        'Tableau partenaires & programmes',
                      ),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Text(flagEmoji, style: const TextStyle(fontSize: 28)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            countryName,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
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
        ),
      ),
    );
  }
}

class _NgoProgramsTab extends StatelessWidget {
  const _NgoProgramsTab({
    required this.data,
    required this.isPortal,
    required this.lp,
  });

  final Map<String, dynamic> data;
  final bool isPortal;
  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    if (!isPortal) {
      return _ngoEmpty(
        lp.t(
          'Programs require authentication.',
          'Les programmes nécessitent une authentification.',
        ),
      );
    }
    final projects = (data['projects'] as List?)
            ?.whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList() ??
        [];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text(
          lp.t('Field programs', 'Programmes de terrain'),
          style: const TextStyle(
            color: _Ngo.accent,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        if (projects.isEmpty)
          Text(
            lp.t('No published programs yet.', 'Aucun programme publié.'),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
          )
        else
          ...projects.map(
            (p) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: _Ngo.cardGrad,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: _Ngo.accent.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p['title']?.toString() ?? p['titleFr']?.toString() ?? '—',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if ((p['description'] ?? p['descriptionFr']) != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      '${p['description'] ?? p['descriptionFr']}',
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _NgoPartnersTab extends StatelessWidget {
  const _NgoPartnersTab({
    required this.data,
    required this.isPortal,
    required this.lp,
  });

  final Map<String, dynamic> data;
  final bool isPortal;
  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    if (!isPortal) {
      return _ngoEmpty(
        lp.t(
          'Network statistics appear after sign-in.',
          'Les statistiques réseau après connexion.',
        ),
      );
    }
    final s = Map<String, dynamic>.from(data['stats'] as Map? ?? {});
    final rows = <(String, String)>[
      (lp.t('Farmers', 'Agriculteurs'), '${s['farmers'] ?? 0}'),
      (lp.t('Cooperatives', 'Coopératives'), '${s['cooperatives'] ?? 0}'),
      (lp.t('Processors', 'Processeurs'), '${s['processors'] ?? 0}'),
      (lp.t('National projects', 'Projets nationaux'), '${s['projects'] ?? 0}'),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text(
          lp.t('Alliance footprint', 'Empreinte d’alliance'),
          style: const TextStyle(
            color: _Ngo.accent,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        ...rows.map(
          (r) {
            final label = r.$1;
            final value = r.$2;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: _Ngo.cardGrad,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(label, style: const TextStyle(color: Colors.white70)),
                  Text(
                    value,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _NgoBottomNav extends StatelessWidget {
  const _NgoBottomNav({
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
        color: _Ngo.bg,
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
        ),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
        ),
        child: BottomNavigationBar(
          currentIndex: tab.clamp(0, 3),
          type: BottomNavigationBarType.fixed,
          backgroundColor: _Ngo.bg,
          selectedItemColor: _Ngo.accent,
          unselectedItemColor: Colors.white38,
          onTap: onChanged,
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: lp.t('Home', 'Accueil'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.volunteer_activism_outlined),
              activeIcon: const Icon(Icons.volunteer_activism),
              label: lp.t('Programs', 'Programmes'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.groups_outlined),
              activeIcon: const Icon(Icons.groups),
              label: lp.t('Partners', 'Partenaires'),
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

class _NgoAccountTab extends StatelessWidget {
  const _NgoAccountTab({required this.lp});

  final LanguageProvider lp;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final initial =
        auth.displayName.isNotEmpty ? auth.displayName[0].toUpperCase() : '?';

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: const Color(0xFF1a3a0a),
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/ngo'),
          ),
          title: Text(
            lp.t('Account', 'Compte'),
            style: const TextStyle(color: Colors.white),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: _Ngo.headerGrad),
              alignment: Alignment.bottomCenter,
              padding: const EdgeInsets.only(bottom: 54, top: 48),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: _Ngo.accent.withValues(alpha: 0.35),
                    child: Text(
                      initial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    auth.displayName.isNotEmpty ? auth.displayName : 'Partner',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: _Ngo.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _Ngo.accent.withValues(alpha: 0.35)),
                    ),
                    child: Text(
                      lp.t('Development partner', 'Partenaire au développement'),
                      style: const TextStyle(
                        color: _Ngo.accent,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          expandedHeight: 220,
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              _acctSection(lp, lp.t('Navigation', 'Navigation'), [
                _acctTile(
                  Icons.home_outlined,
                  lp.t('Back to Main Home', 'Accueil principal'),
                  () => context.go('/home'),
                ),
              ]),
              const SizedBox(height: 16),
              _acctSection(lp, lp.t('Profile', 'Profil'), [
                _acctTile(
                  Icons.person_outline,
                  lp.t('Edit profile', 'Modifier le profil'),
                  () => context.push('/profile/edit'),
                ),
                _acctTile(
                  Icons.language_outlined,
                  lp.t('Language', 'Langue'),
                  () => context.push('/profile/language'),
                ),
                _acctTile(
                  Icons.notifications_outlined,
                  lp.t('Notifications', 'Notifications'),
                  () => context.push('/profile/notifications'),
                ),
              ]),
              const SizedBox(height: 16),
              _acctSection(lp, lp.t('Account management', 'Gestion du compte'), [
                _acctTile(
                  Icons.email_outlined,
                  lp.t('Update email', 'Modifier l’e-mail'),
                  () => context.push('/profile/change-email'),
                ),
                _acctTile(
                  Icons.phone_outlined,
                  lp.t('Update phone', 'Modifier le téléphone'),
                  () => context.push('/profile/change-phone'),
                ),
                _acctTile(
                  Icons.delete_outline,
                  lp.t('Delete account', 'Supprimer le compte'),
                  () => context.push('/profile/delete-account'),
                  danger: true,
                ),
              ]),
              const SizedBox(height: 16),
              _acctSection(lp, lp.t('Support', 'Support'), [
                _acctTile(
                  Icons.info_outline,
                  lp.t('About', 'À propos'),
                  () => context.push('/about'),
                ),
                _acctTile(
                  Icons.help_outline,
                  lp.t('Help', 'Aide'),
                  () => context.push('/help'),
                ),
                _acctTile(
                  Icons.gavel_outlined,
                  lp.t('Terms', 'Conditions'),
                  () => context.push('/terms?view=1'),
                ),
                _acctTile(
                  Icons.privacy_tip_outlined,
                  lp.t('Privacy', 'Confidentialité'),
                  () => context.push('/terms?view=1'),
                ),
              ]),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: const Color(0xFF152818),
                      title: Text(
                        lp.t('Sign out?', 'Déconnexion ?'),
                        style: const TextStyle(color: Colors.white),
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
                          child: const Text(
                            'OK',
                            style: TextStyle(color: Colors.red),
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
            ]),
          ),
        ),
      ],
    );
  }

  Widget _acctSection(LanguageProvider lp, String title, List<Widget> tiles) {
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
              letterSpacing: 1.1,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: _Ngo.cardGrad,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            children: [
              for (var i = 0; i < tiles.length; i++) ...[
                tiles[i],
                if (i < tiles.length - 1)
                  Divider(
                    height: 1,
                    indent: 56,
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _acctTile(
    IconData icon,
    String title,
    VoidCallback onTap, {
    bool danger = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: danger ? Colors.red : _Ngo.accent),
      title: Text(
        title,
        style: TextStyle(color: danger ? Colors.red : Colors.white),
      ),
      trailing: Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.25)),
      onTap: onTap,
    );
  }
}

Widget _ngoEmpty(String msg) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Text(
        msg,
        textAlign: TextAlign.center,
        style: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
      ),
    ),
  );
}
