import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';

abstract final class _Proc {
  static const Color bg = Color(0xFF1a1200);
  static const Color accent = Color(0xFFF59E0B);
  static const LinearGradient headerGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2d1f00), Color(0xFF3d2800)],
  );
  static const LinearGradient cardGrad = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2a1a00), Color(0xFF1f1200)],
  );
}

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
    final lp = context.watch<LanguageProvider>();
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
      backgroundColor: _Proc.bg,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: _ProcTabBody(
              tab: _tab,
              lp: lp,
              auth: auth,
              data: _data,
              loading: _loading,
              onRefresh: _load,
            ),
          ),
          _ProcBottomNav(
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

class _ProcTabBody extends StatelessWidget {
  const _ProcTabBody({
    required this.tab,
    required this.lp,
    required this.auth,
    required this.data,
    required this.loading,
    required this.onRefresh,
  });

  final int tab;
  final LanguageProvider lp;
  final AuthState auth;
  final Map<String, dynamic>? data;
  final bool loading;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    switch (tab) {
      case 1:
        return _ProcSupplyTab(lp: lp, loading: loading);
      case 2:
        return _ProcProcessingTab(lp: lp, data: data, loading: loading);
      case 3:
        return _ProcAccountTab(lp: lp);
      default:
        return _ProcHomeTab(
          lp: lp,
          auth: auth,
          data: data,
          loading: loading,
          onRefresh: onRefresh,
        );
    }
  }
}

class _ProcHomeTab extends StatelessWidget {
  const _ProcHomeTab({
    required this.lp,
    required this.auth,
    required this.data,
    required this.loading,
    required this.onRefresh,
  });

  final LanguageProvider lp;
  final AuthState auth;
  final Map<String, dynamic>? data;
  final bool loading;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final name = auth.displayName.isNotEmpty
        ? auth.displayName
        : (data?['name'] ?? 'Processor').toString();
    final loc = (data?['location'] ?? auth.displayCountry).toString();
    final lots = data?['activeLots'];
    final certified = data?['certifiedBatches'];
    final capacity = (data?['capacity'] ?? '—').toString();
    final lotsStr = loading ? '…' : '${lots ?? 0}';
    final certStr = loading ? '…' : '${certified ?? 0}';
    final connectedFarmers = loading ? '…' : '—';

    void toast(String msg) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    }

    return RefreshIndicator(
      color: _Proc.accent,
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _ProcHeader(lp: lp, title: name, subtitle: loc)),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(
                  lp.t('Supply chain overview', 'Aperçu de la chaîne'),
                  style: const TextStyle(
                    color: _Proc.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _miniStat(
                      lp.t('Raw inbound', 'Approvisionnement'),
                      lotsStr,
                      lp.t('Lots tracked', 'Lots suivis'),
                    ),
                    const SizedBox(width: 10),
                    _miniStat(
                      lp.t('Processed', 'Transformé'),
                      certStr,
                      lp.t('Certified batches', 'Lots certifiés'),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _miniStat(
                      lp.t('Output capacity', 'Capacité'),
                      capacity,
                      lp.t('Nominal throughput', 'Débit nominal'),
                    ),
                    const SizedBox(width: 10),
                    _miniStat(
                      lp.t('Partner farmers', 'Agriculteurs liés'),
                      connectedFarmers,
                      lp.t('Connected producers', 'Producteurs connectés'),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  lp.t('Capacity utilization', 'Utilisation de capacité'),
                  style: const TextStyle(
                    color: _Proc.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 10),
                _utilCard(lp, data, loading),
                const SizedBox(height: 22),
                Text(
                  lp.t('Quick actions', 'Actions rapides'),
                  style: const TextStyle(
                    color: _Proc.accent,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 10),
                _qa(
                  context,
                  lp,
                  Icons.shopping_basket_outlined,
                  lp.t('Source produce', 'Approvisionnement'),
                  () => toast(lp.t(
                    'Lot sourcing will open from Supply.',
                    'L’approvisionnement sera géré dans l’onglet Approvisionnement.',
                  )),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.playlist_add_outlined,
                  lp.t('Log batch', 'Enregistrer un lot'),
                  () => toast(lp.t(
                    'Batch logging moves to Processing.',
                    'L’enregistrement des lots ira dans Transformation.',
                  )),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.handshake_outlined,
                  lp.t('Connect cooperative', 'Lier une coopérative'),
                  () => toast(lp.t(
                    'Cooperative linking launches from your back office.',
                    'La liaison coopérative se fait depuis votre espace.',
                  )),
                ),
                const SizedBox(height: 8),
                _qa(
                  context,
                  lp,
                  Icons.price_change_outlined,
                  lp.t('Market prices', 'Prix du marché'),
                  () => toast(lp.t(
                    'Connect pricing feeds to see live benchmarks.',
                    'Connectez le flux de prix pour les références temps réel.',
                  )),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String title, String value, String hint) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: _Proc.cardGrad,
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
                fontSize: 17,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              hint,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.35),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _utilCard(LanguageProvider lp, Map<String, dynamic>? data, bool loading) {
    final lots = (data?['activeLots'] as num?)?.toInt() ?? 0;
    final cert = (data?['certifiedBatches'] as num?)?.toInt() ?? 0;
    final score = loading ? 0.0 : ((lots * 12 + cert * 18).clamp(0, 100)) / 100.0;
    final label = score < 0.2
        ? lp.t('Planned downtime / low intake', 'Faible activité / arrêt')
        : lp.t('Operations within normal band', 'Activité dans la plage normale');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: _Proc.cardGrad,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _Proc.accent.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: loading ? null : score.clamp(0.05, 1.0),
              minHeight: 8,
              backgroundColor: Colors.black.withValues(alpha: 0.35),
              color: _Proc.accent,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13),
          ),
        ],
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
            gradient: _Proc.cardGrad,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Row(
            children: [
              Icon(icon, color: _Proc.accent),
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

class _ProcHeader extends StatelessWidget {
  const _ProcHeader({
    required this.lp,
    required this.title,
    required this.subtitle,
  });

  final LanguageProvider lp;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: _Proc.headerGrad),
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
                      lp.t('Processing facility', 'Unité de transformation'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => context.go('/home'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.22),
                    ),
                  ),
                  child: Row(
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

class _ProcSupplyTab extends StatelessWidget {
  const _ProcSupplyTab({required this.lp, required this.loading});

  final LanguageProvider lp;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text(
          lp.t('Inbound supply', 'Approvisionnement entrant'),
          style: const TextStyle(
            color: _Proc.accent,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        if (loading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(color: _Proc.accent),
            ),
          )
        else ...[
          _supplyCard(
            lp.t('No pending deliveries', 'Aucune livraison en attente'),
            lp.t(
              'Connect cooperatives to see scheduled intake.',
              'Liez des coopératives pour voir les livraisons.',
            ),
          ),
        ],
      ],
    );
  }

  Widget _supplyCard(String title, String body) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: _Proc.cardGrad,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 13,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProcProcessingTab extends StatelessWidget {
  const _ProcProcessingTab({
    required this.lp,
    required this.data,
    required this.loading,
  });

  final LanguageProvider lp;
  final Map<String, dynamic>? data;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final lots = (data?['activeLots'] as num?)?.toInt() ?? 0;
    final cert = (data?['certifiedBatches'] as num?)?.toInt() ?? 0;
    final cap = (data?['capacity'] ?? '—').toString();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text(
          lp.t('Processing floor', 'Ligne de transformation'),
          style: const TextStyle(
            color: _Proc.accent,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        if (loading)
          const Center(
            child: CircularProgressIndicator(color: _Proc.accent),
          )
        else ...[
          _rowMetric(lp.t('Active lots', 'Lots actifs'), '$lots'),
          _rowMetric(lp.t('Certified output', 'Sortie certifiée'), '$cert'),
          _rowMetric(lp.t('Rated capacity', 'Capacité nominale'), cap),
          const SizedBox(height: 16),
          Text(
            lp.t(
              'Calibration data from sensors and lab checks will surface here.',
              'Les données d’atelier et de laboratoire apparaîtront ici.',
            ),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.45),
              height: 1.4,
            ),
          ),
        ],
      ],
    );
  }

  Widget _rowMetric(String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: _Proc.cardGrad,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(k, style: const TextStyle(color: Colors.white70)),
            Text(
              v,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProcBottomNav extends StatelessWidget {
  const _ProcBottomNav({
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
        color: _Proc.bg,
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
          backgroundColor: _Proc.bg,
          selectedItemColor: _Proc.accent,
          unselectedItemColor: Colors.white38,
          onTap: onChanged,
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: lp.t('Home', 'Accueil'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.inventory_2_outlined),
              activeIcon: const Icon(Icons.inventory_2),
              label: lp.t('Supply', 'Approvisionnement'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.factory_outlined),
              activeIcon: const Icon(Icons.factory),
              label: lp.t('Processing', 'Transformation'),
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

class _ProcAccountTab extends StatelessWidget {
  const _ProcAccountTab({required this.lp});

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
          backgroundColor: const Color(0xFF2d1f00),
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.go('/processor'),
          ),
          title: Text(
            lp.t('Account', 'Compte'),
            style: const TextStyle(color: Colors.white),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: _Proc.headerGrad),
              alignment: Alignment.bottomCenter,
              padding: const EdgeInsets.only(bottom: 54, top: 48),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: _Proc.accent.withValues(alpha: 0.35),
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
                    auth.displayName.isNotEmpty ? auth.displayName : 'Processor',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          expandedHeight: 200,
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
                      backgroundColor: const Color(0xFF2a1a00),
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
                          child: const Text('OK', style: TextStyle(color: Colors.red)),
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
            gradient: _Proc.cardGrad,
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
      leading: Icon(icon, color: danger ? Colors.red : _Proc.accent),
      title: Text(
        title,
        style: TextStyle(color: danger ? Colors.red : Colors.white),
      ),
      trailing: Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.25)),
      onTap: onTap,
    );
  }
}
