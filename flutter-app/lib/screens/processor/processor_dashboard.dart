import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/dashboard_account_nav_header.dart';
import '../../widgets/dashboard_sign_out_button.dart';
import '../../widgets/offline_banner.dart';

class ProcessorDashboard extends StatefulWidget {
  const ProcessorDashboard({super.key});

  @override
  State<ProcessorDashboard> createState() => _ProcessorDashboardState();
}

class _ProcessorDashboardState extends State<ProcessorDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _processor;
  List<Map<String, dynamic>> _farmers = [];
  final List<_ProcBatch> _batches = [];
  final List<_ScheduleEntry> _schedule = [];
  bool _loading = true;

  static const _bg = Color(0xFF1a1200);
  static const _headerStart = Color(0xFF2d1f00);
  static const _headerEnd = Color(0xFF3d2800);
  static const _accent = Color(0xFFF59E0B);
  static const _cardStart = Color(0xFF2a1a00);
  static const _cardEnd = Color(0xFF1f1200);

  bool get _hasPortal => _processor != null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthState>();
      final token = auth.token;
      if (token != null && token.isNotEmpty) {
        final results = await Future.wait([
          ApiService.getProcessorPortal(
            token,
            country:
                auth.displayCountry.isNotEmpty ? auth.displayCountry : null,
          ),
          ApiService.getPublicStats(),
        ]);
        final portal = results[0];
        final farmersData = results[1];
        final raw = portal['processor'];
        final map = raw is Map ? Map<String, dynamic>.from(raw) : null;
        final recent = farmersData['recent'];
        final farmers = <Map<String, dynamic>>[];
        if (recent is List) {
          for (final f in recent) {
            if (f is Map) farmers.add(Map<String, dynamic>.from(f));
          }
        }
        if (mounted) {
          setState(() {
            _processor = map;
            _farmers = farmers;
            _seedBatchesAndSchedule(
              map,
              context.read<LanguageProvider>(),
            );
            _loading = false;
          });
        }
      } else {
        if (mounted) setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _seedBatchesAndSchedule(Map<String, dynamic>? p, LanguageProvider lp) {
    _batches.clear();
    _schedule.clear();
    final active = (p?['activeLots'] as num?)?.toInt() ?? 0;
    final certified = (p?['certifiedBatches'] as num?)?.toInt() ?? 0;
    final now = DateTime.now();
    for (var i = 0; i < active; i++) {
      _batches.add(
        _ProcBatch(
          id: 'LOT-${now.year}-${i + 1}',
          crop: i.isEven
              ? lp.t('Shea nuts', 'Noix de karité')
              : lp.t('Sesame', 'Sésame'),
          quantityKg: 800 + i * 120,
          status: _BatchStatus.active,
          startedAt: now.subtract(Duration(days: i + 1)),
        ),
      );
    }
    for (var i = 0; i < certified; i++) {
      _batches.add(
        _ProcBatch(
          id: 'CERT-${now.year}-${i + 1}',
          crop: i.isEven
              ? lp.t('Cashew', 'Cajou')
              : lp.t('Shea butter', 'Beurre de karité'),
          quantityKg: 500 + i * 80,
          status: _BatchStatus.completed,
          startedAt: now.subtract(Duration(days: 10 + i)),
        ),
      );
    }
    _schedule.addAll([
      _ScheduleEntry(
        date: now.add(const Duration(days: 1)),
        title: lp.t('Shea intake — Lot A', 'Réception karité — Lot A'),
        type: _ScheduleType.processing,
      ),
      _ScheduleEntry(
        date: now.add(const Duration(days: 3)),
        title: lp.t('Quality training — HACCP', 'Formation qualité — HACCP'),
        type: _ScheduleType.training,
      ),
      _ScheduleEntry(
        date: now.add(const Duration(days: 5)),
        title: lp.t('Sesame drying line', 'Ligne séchage sésame'),
        type: _ScheduleType.processing,
      ),
    ]);
  }

  void _addBatch(_ProcBatch batch) {
    setState(() => _batches.insert(0, batch));
  }

  void _addSchedule(_ScheduleEntry entry) {
    setState(() => _schedule.add(entry));
  }

  String get _rawMaterials =>
      _loading ? '…' : '${_processor?['activeLots'] ?? _activeBatchCount}';

  String get _processed =>
      _loading ? '…' : '${_processor?['certifiedBatches'] ?? _completedCount}';

  String get _outputReady => _loading
      ? '…'
      : (_processor?['capacity']?.toString() ?? '$_completedCount t');

  String get _revenue => _loading ? '…' : '—';

  int get _activeBatchCount =>
      _batches.where((b) => b.status == _BatchStatus.active).length;

  int get _completedCount =>
      _batches.where((b) => b.status == _BatchStatus.completed).length;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();
    final name = auth.displayName.isNotEmpty
        ? auth.displayName
        : (_processor?['name']?.toString() ??
            lp.t('Processing Center', 'Centre de traitement'));
    final location = (_processor?['location'] ?? auth.displayCountry).toString();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
        backgroundColor: _bg,
        body: Column(
          children: [
            const OfflineBanner(),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_headerStart, _headerEnd],
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: -40,
                    right: -40,
                    child: Container(
                      width: 170,
                      height: 170,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _accent.withValues(alpha: 0.07),
                      ),
                    ),
                  ),
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                lp.t('Processing Center', 'Centre de traitement'),
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.65),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.8,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (location.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  location,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.55),
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              _headerStat(
                                lp.t('Raw in', 'Entrée brute'),
                                _rawMaterials,
                              ),
                              const SizedBox(width: 8),
                              _headerStat(
                                lp.t('Processed', 'Traités'),
                                _processed,
                              ),
                              const SizedBox(width: 8),
                              _headerStat(
                                lp.t('Output', 'Sortie'),
                                _outputReady,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: _accent),
                    )
                  : RefreshIndicator(
                      color: _accent,
                      onRefresh: _load,
                      child: IndexedStack(
                        index: _tab,
                        children: [
                          _HomeTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            raw: _rawMaterials,
                            processed: _processed,
                            output: _outputReady,
                            revenue: _revenue,
                            onTabChange: (i) => setState(() => _tab = i),
                            onMarketPrices: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    lp.t(
                                      'Shea 450 XOF/kg · Sesame 380 · '
                                      'Cashew 920 (reference).',
                                      'Karité 450 XOF/kg · Sésame 380 · '
                                      'Cajou 920 (référence).',
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                          _SupplyTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            farmers: _farmers,
                            hasPortal: _hasPortal,
                            onRequestSupply: () =>
                                _showRequestSupplySheet(context),
                          ),
                          _ProcessingTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            batches: _batches,
                            onLogBatch: () => _showLogBatchSheet(context),
                          ),
                          _ScheduleTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            schedule: _schedule,
                            onBookTraining: () =>
                                _showBookTrainingSheet(context),
                          ),
                          _AccountTab(
                            accent: _accent,
                            cardStart: _cardStart,
                            cardEnd: _cardEnd,
                            onBackToDashboard: () => setState(() => _tab = 0),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF120c00),
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
              selectedItemColor: _accent,
              unselectedItemColor: Colors.white30,
              type: BottomNavigationBarType.fixed,
              selectedLabelStyle: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(fontSize: 10),
              currentIndex: _tab,
              onTap: (i) => setState(() => _tab = i),
              items: [
                BottomNavigationBarItem(
                  icon: const Icon(Icons.home_outlined),
                  activeIcon: const Icon(Icons.home),
                  label: lp.t('Home', 'Accueil'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.local_shipping_outlined),
                  activeIcon: const Icon(Icons.local_shipping),
                  label: lp.t('Supply', 'Approvisionnement'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.precision_manufacturing_outlined),
                  activeIcon: const Icon(Icons.precision_manufacturing),
                  label: lp.t('Processing', 'Traitement'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.calendar_month_outlined),
                  activeIcon: const Icon(Icons.calendar_month),
                  label: lp.t('Schedule', 'Calendrier'),
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.manage_accounts_outlined),
                  activeIcon: const Icon(Icons.manage_accounts),
                  label: lp.t('Account', 'Compte'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _headerStat(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
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
  }

  void _showRequestSupplySheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF2a1a00),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _RequestSupplySheet(
        accent: _accent,
        onSubmit: () {
          Navigator.pop(ctx);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.read<LanguageProvider>().t(
                  'Supply request sent to farmers.',
                  'Demande d’approvisionnement envoyée aux agriculteurs.',
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showLogBatchSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF2a1a00),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _LogBatchSheet(
        accent: _accent,
        onSubmit: (crop, qty) {
          Navigator.pop(ctx);
          _addBatch(
            _ProcBatch(
              id: 'LOT-${DateTime.now().millisecondsSinceEpoch}',
              crop: crop,
              quantityKg: qty,
              status: _BatchStatus.active,
              startedAt: DateTime.now(),
            ),
          );
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.read<LanguageProvider>().t(
                  'Batch logged on processing floor.',
                  'Lot enregistré sur le plancher de traitement.',
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showBookTrainingSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF2a1a00),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _BookTrainingSheet(
        accent: _accent,
        onSubmit: (name, date, topic) {
          Navigator.pop(ctx);
          _addSchedule(
            _ScheduleEntry(
              date: date,
              title: context.read<LanguageProvider>().t(
                'Training — $topic ($name)',
                'Formation — $topic ($name)',
              ),
              type: _ScheduleType.training,
            ),
          );
          showDialog<void>(
            context: context,
            builder: (dCtx) {
              final lp = context.read<LanguageProvider>();
              return AlertDialog(
                backgroundColor: const Color(0xFF2a1a00),
                title: Text(
                  lp.t('Request received', 'Demande reçue'),
                  style: const TextStyle(color: Colors.white),
                ),
                content: Text(
                  lp.t(
                    'Our team will contact you to confirm your $topic session.',
                    'Notre équipe vous contactera pour confirmer votre session $topic.',
                  ),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.75),
                    height: 1.4,
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dCtx),
                    child: const Text('OK', style: TextStyle(color: _accent)),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

enum _BatchStatus { active, completed }

class _ProcBatch {
  _ProcBatch({
    required this.id,
    required this.crop,
    required this.quantityKg,
    required this.status,
    required this.startedAt,
  });

  final String id;
  final String crop;
  final int quantityKg;
  final _BatchStatus status;
  final DateTime startedAt;
}

enum _ScheduleType { processing, training }

class _ScheduleEntry {
  _ScheduleEntry({
    required this.date,
    required this.title,
    required this.type,
  });

  final DateTime date;
  final String title;
  final _ScheduleType type;
}

// ———————————————————————————————————————————————————————————— Home
class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.raw,
    required this.processed,
    required this.output,
    required this.revenue,
    required this.onTabChange,
    required this.onMarketPrices,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final String raw;
  final String processed;
  final String output;
  final String revenue;
  final ValueChanged<int> onTabChange;
  final VoidCallback onMarketPrices;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('Operations snapshot', 'Aperçu des opérations'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _metric(
              lp.t('Raw materials', 'Matières premières'),
              raw,
              Icons.inventory_2_outlined,
            ),
            const SizedBox(width: 10),
            _metric(
              lp.t('Batches processed', 'Lots traités'),
              processed,
              Icons.factory_outlined,
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _metric(
              lp.t('Output ready', 'Sortie prête'),
              output,
              Icons.local_shipping_outlined,
            ),
            const SizedBox(width: 10),
            _metric(
              lp.t('Revenue', 'Revenus'),
              revenue,
              Icons.payments_outlined,
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          lp.t('Quick actions', 'Actions rapides'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        _action(
          Icons.shopping_basket_outlined,
          lp.t('Source produce', 'S’approvisionner'),
          lp.t(
            'Find farmers and request intake',
            'Trouver des agriculteurs et demander une réception',
          ),
          () => onTabChange(1),
        ),
        const SizedBox(height: 8),
        _action(
          Icons.playlist_add_outlined,
          lp.t('Log batch', 'Enregistrer un lot'),
          lp.t(
            'Register a new processing lot',
            'Enregistrer un nouveau lot de traitement',
          ),
          () => onTabChange(2),
        ),
        const SizedBox(height: 8),
        _action(
          Icons.calendar_month_outlined,
          lp.t('View schedule', 'Voir le calendrier'),
          lp.t(
            'Processing runs and training',
            'Cycles de traitement et formations',
          ),
          () => onTabChange(3),
        ),
        const SizedBox(height: 8),
        _action(
          Icons.price_change_outlined,
          lp.t('Market prices', 'Prix du marché'),
          lp.t(
            'Commodity reference benchmarks',
            'Références des matières premières',
          ),
          onMarketPrices,
        ),
      ],
    );
  }

  Widget _metric(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [cardStart, cardEnd]),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: accent, size: 20),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _action(IconData icon, String title, String sub, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [cardStart, cardEnd]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Row(
            children: [
              Icon(icon, color: accent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      sub,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.white.withValues(alpha: 0.25),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ———————————————————————————————————————————————————————————— Supply
class _SupplyTab extends StatelessWidget {
  const _SupplyTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.farmers,
    required this.hasPortal,
    required this.onRequestSupply,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<Map<String, dynamic>> farmers;
  final bool hasPortal;
  final VoidCallback onRequestSupply;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: accent,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.add_shopping_cart_outlined),
            label: Text(
              lp.t('Request supply', 'Demander un approvisionnement'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: onRequestSupply,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          lp.t('Available farmers', 'Agriculteurs disponibles'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        if (!hasPortal)
          _empty(
            Icons.lock_outline,
            lp.t(
              'Sign in to source from the farmer network.',
              'Connectez-vous pour vous approvisionner auprès du réseau.',
            ),
          )
        else if (farmers.isEmpty)
          _empty(
            Icons.agriculture_outlined,
            lp.t('No farmers listed yet.', 'Aucun agriculteur listé pour l’instant.'),
          )
        else
          ...farmers.take(20).map((f) {
            final name = f['nom']?.toString() ?? lp.t('Farmer', 'Agriculteur');
            final crops =
                (f['cultures'] as List?)?.map((e) => e.toString()).join(', ') ??
                    '—';
            final qty = f['superficie'] != null
                ? '${f['superficie']} ha'
                : lp.t('Available', 'Disponible');
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [cardStart, cardEnd]),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: accent.withValues(alpha: 0.2),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          crops,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    qty,
                    style: TextStyle(
                      color: accent,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _empty(IconData icon, String msg) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [cardStart, cardEnd]),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white38, size: 40),
          const SizedBox(height: 10),
          Text(
            msg,
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
          ),
        ],
      ),
    );
  }
}

class _RequestSupplySheet extends StatefulWidget {
  const _RequestSupplySheet({
    required this.accent,
    required this.onSubmit,
  });

  final Color accent;
  final VoidCallback onSubmit;

  @override
  State<_RequestSupplySheet> createState() => _RequestSupplySheetState();
}

class _RequestSupplySheetState extends State<_RequestSupplySheet> {
  final _crop = TextEditingController();
  final _qty = TextEditingController();
  final _date = TextEditingController();
  final _notes = TextEditingController();

  @override
  void dispose() {
    _crop.dispose();
    _qty.dispose();
    _date.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _handle(),
            const SizedBox(height: 16),
            Text(
              lp.t('Request supply', 'Demander un approvisionnement'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _field(_crop, lp.t('Crop type', 'Type de culture')),
            const SizedBox(height: 12),
            _field(
              _qty,
              lp.t('Quantity needed (kg)', 'Quantité requise (kg)'),
              keyboard: TextInputType.number,
            ),
            const SizedBox(height: 12),
            _field(_date, lp.t('Delivery date', 'Date de livraison')),
            const SizedBox(height: 12),
            _field(_notes, lp.t('Notes', 'Notes'), maxLines: 3),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.accent,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: widget.onSubmit,
              child: Text(
                lp.t('Submit request', 'Envoyer la demande'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    int maxLines = 1,
    TextInputType? keyboard,
  }) {
    return TextField(
      controller: c,
      maxLines: maxLines,
      keyboardType: keyboard,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: widget.accent),
        ),
      ),
    );
  }

  Widget _handle() => Center(
        child: Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.white24,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      );
}

// ———————————————————————————————————————————————————————————— Processing
class _ProcessingTab extends StatelessWidget {
  const _ProcessingTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.batches,
    required this.onLogBatch,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<_ProcBatch> batches;
  final VoidCallback onLogBatch;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final active =
        batches.where((b) => b.status == _BatchStatus.active).toList();
    final history =
        batches.where((b) => b.status == _BatchStatus.completed).toList();

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4CAF50),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.add_circle_outline),
            label: Text(
              lp.t('Log new batch', 'Enregistrer un nouveau lot'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: onLogBatch,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          lp.t('Active batches', 'Lots actifs'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        if (active.isEmpty)
          _batchEmpty(
            lp.t(
              'No active batches on the floor.',
              'Aucun lot actif sur le plancher.',
            ),
          )
        else
          ...active.map(
            (b) => _batchCard(b, accent, cardStart, cardEnd, true, lp),
          ),
        const SizedBox(height: 16),
        Text(
          lp.t('Batch history', 'Historique des lots'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        if (history.isEmpty)
          _batchEmpty(
            lp.t(
              'Completed batches will appear here.',
              'Les lots terminés apparaîtront ici.',
            ),
          )
        else
          ...history.map(
            (b) => _batchCard(b, accent, cardStart, cardEnd, false, lp),
          ),
      ],
    );
  }

  static Widget _batchEmpty(String msg) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        msg,
        style: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
      ),
    );
  }

  static Widget _batchCard(
    _ProcBatch b,
    Color accent,
    Color start,
    Color end,
    bool active,
    LanguageProvider lp,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [start, end]),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: active ? accent.withValues(alpha: 0.35) : Colors.white12,
        ),
      ),
      child: Row(
        children: [
          Icon(
            active ? Icons.precision_manufacturing : Icons.verified_outlined,
            color: accent,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  b.id,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                Text(
                  '${b.crop} · ${b.quantityKg} kg',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: (active ? Colors.orange : Colors.green)
                  .withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              active ? lp.t('Active', 'Actif') : lp.t('Done', 'Terminé'),
              style: TextStyle(
                color: active ? Colors.orange : Colors.green,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LogBatchSheet extends StatefulWidget {
  const _LogBatchSheet({
    required this.accent,
    required this.onSubmit,
  });

  final Color accent;
  final void Function(String crop, int qty) onSubmit;

  @override
  State<_LogBatchSheet> createState() => _LogBatchSheetState();
}

class _LogBatchSheetState extends State<_LogBatchSheet> {
  final _crop = TextEditingController();
  final _qty = TextEditingController();

  @override
  void dispose() {
    _crop.dispose();
    _qty.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            lp.t('Log processing batch', 'Enregistrer un lot de traitement'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _crop,
            style: const TextStyle(color: Colors.white),
            decoration: _decoration(lp.t('Crop / product', 'Culture / produit')),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _qty,
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.white),
            decoration: _decoration(lp.t('Quantity (kg)', 'Quantité (kg)')),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: widget.accent,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () {
              final crop = _crop.text.trim().isEmpty
                  ? lp.t('Mixed', 'Mixte')
                  : _crop.text.trim();
              final qty = int.tryParse(_qty.text.trim()) ?? 0;
              widget.onSubmit(crop, qty);
            },
            child: Text(
              lp.t('Submit batch', 'Enregistrer le lot'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _decoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: widget.accent),
      ),
    );
  }
}

// ———————————————————————————————————————————————————————————— Schedule
class _ScheduleTab extends StatelessWidget {
  const _ScheduleTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.schedule,
    required this.onBookTraining,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final List<_ScheduleEntry> schedule;
  final VoidCallback onBookTraining;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final sorted = [...schedule]..sort((a, b) => a.date.compareTo(b.date));
    final now = DateTime.now();
    final weekStart = DateTime(now.year, now.month, now.day);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          lp.t('Processing calendar', 'Calendrier de traitement'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          lp.t(
            'Next 7 days — runs and training (in-app only).',
            '7 prochains jours — cycles et formations (dans l’app uniquement).',
          ),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 12),
        ...List.generate(7, (i) {
          final day = weekStart.add(Duration(days: i));
          final dayEvents = sorted.where((e) {
            return e.date.year == day.year &&
                e.date.month == day.month &&
                e.date.day == day.day;
          }).toList();
          final dayLabel = _dayLabel(day, now, lp);
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cardStart, cardEnd]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dayLabel,
                  style: TextStyle(
                    color: accent,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                if (dayEvents.isEmpty)
                  Text(
                    lp.t('No events scheduled', 'Aucun événement planifié'),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 12,
                    ),
                  )
                else
                  ...dayEvents.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          Icon(
                            e.type == _ScheduleType.training
                                ? Icons.school_outlined
                                : Icons.factory_outlined,
                            color: accent,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              e.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
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
        }),
        const SizedBox(height: 16),
        Text(
          lp.t('Training sessions', 'Sessions de formation'),
          style: TextStyle(
            color: accent,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [cardStart, cardEnd]),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: accent.withValues(alpha: 0.25)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                lp.t(
                  'On-site quality & safety training',
                  'Formation qualité et sécurité sur site',
                ),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                lp.t(
                  'Book HACCP, equipment, or traceability workshops — '
                  'confirmed by our extension team.',
                  'Réserver ateliers HACCP, équipement ou traçabilité — '
                  'confirmé par notre équipe de vulgarisation.',
                ),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: accent,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.school_outlined),
                  label: Text(
                    lp.t('Book training session', 'Réserver une formation'),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  onPressed: onBookTraining,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _dayLabel(DateTime day, DateTime now, LanguageProvider lp) {
    final days = [
      lp.t('Mon', 'Lun'),
      lp.t('Tue', 'Mar'),
      lp.t('Wed', 'Mer'),
      lp.t('Thu', 'Jeu'),
      lp.t('Fri', 'Ven'),
      lp.t('Sat', 'Sam'),
      lp.t('Sun', 'Dim'),
    ];
    final name = days[day.weekday - 1];
    if (day.year == now.year &&
        day.month == now.month &&
        day.day == now.day) {
      return lp.t(
        'Today · $name ${day.day}/${day.month}',
        'Aujourd’hui · $name ${day.day}/${day.month}',
      );
    }
    return '$name ${day.day}/${day.month}';
  }
}

class _BookTrainingSheet extends StatefulWidget {
  const _BookTrainingSheet({
    required this.accent,
    required this.onSubmit,
  });

  final Color accent;
  final void Function(String name, DateTime date, String topic) onSubmit;

  @override
  State<_BookTrainingSheet> createState() => _BookTrainingSheetState();
}

class _BookTrainingSheetState extends State<_BookTrainingSheet> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  String _topicEn = 'HACCP basics';
  DateTime _date = DateTime.now().add(const Duration(days: 7));

  static const _topics = [
    ('HACCP basics', 'Bases HACCP'),
    ('Quality control', 'Contrôle qualité'),
    ('Equipment maintenance', 'Maintenance équipement'),
    ('Traceability & certification', 'Traçabilité et certification'),
  ];

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final topicLabel = _topics
        .firstWhere((t) => t.$1 == _topicEn, orElse: () => _topics.first);
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              lp.t('Book training session', 'Réserver une formation'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _name,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration(lp.t('Your name', 'Votre nom')),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _topicEn,
              dropdownColor: const Color(0xFF2a1a00),
              style: const TextStyle(color: Colors.white),
              decoration: _decoration(lp.t('Topic', 'Thème')),
              items: _topics
                  .map(
                    (t) => DropdownMenuItem(
                      value: t.$1,
                      child: Text(lp.t(t.$1, t.$2)),
                    ),
                  )
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _topicEn = v);
              },
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(
                lp.t(
                  'Preferred date: ${_date.day}/${_date.month}/${_date.year}',
                  'Date souhaitée : ${_date.day}/${_date.month}/${_date.year}',
                ),
                style: const TextStyle(color: Colors.white),
              ),
              trailing: Icon(Icons.calendar_today, color: widget.accent),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                  builder: (ctx, child) => Theme(
                    data: ThemeData.dark().copyWith(
                      colorScheme: ColorScheme.dark(
                        primary: widget.accent,
                        surface: const Color(0xFF2a1a00),
                      ),
                    ),
                    child: child!,
                  ),
                );
                if (picked != null) setState(() => _date = picked);
              },
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: Colors.white),
              decoration: _decoration(lp.t('Phone', 'Téléphone')),
            ),
            const SizedBox(height: 8),
            Text(
              lp.t(
                'Our team will contact you to confirm.',
                'Notre équipe vous contactera pour confirmer.',
              ),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 12,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.accent,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () {
                final name = _name.text.trim().isEmpty
                    ? lp.t('Processor', 'Processeur')
                    : _name.text.trim();
                widget.onSubmit(name, _date, lp.t(topicLabel.$1, topicLabel.$2));
              },
              child: Text(
                lp.t('Submit booking', 'Envoyer la réservation'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _decoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: widget.accent),
      ),
    );
  }
}

// ———————————————————————————————————————————————————————————— Account
class _AccountTab extends StatelessWidget {
  const _AccountTab({
    required this.accent,
    required this.cardStart,
    required this.cardEnd,
    required this.onBackToDashboard,
  });

  final Color accent;
  final Color cardStart;
  final Color cardEnd;
  final VoidCallback onBackToDashboard;

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: dashboardAccountScrollBottom(context),
      ),
      children: [
        DashboardAccountNavHeader(
          accent: accent,
          cardStart: cardStart,
          cardEnd: cardEnd,
          onBackToDashboard: onBackToDashboard,
        ),
        _section(lp.t('Profile', 'Profil'), [
          _tile(
            context,
            Icons.person_outline,
            AppColors.gold,
            lp.t('Edit Profile', 'Modifier le profil'),
            lp.t('Update your details', 'Mettre à jour vos informations'),
            () => context.go('/profile/edit'),
          ),
          _tile(
            context,
            Icons.language_outlined,
            const Color(0xFF9C27B0),
            lp.t('Language', 'Langue'),
            lp.t('English / Français', 'English / Français'),
            () => context.go('/profile/language'),
          ),
          _tile(
            context,
            Icons.notifications_outlined,
            const Color(0xFFFF9800),
            lp.t('Notifications', 'Notifications'),
            lp.t('Manage alerts', 'Gérer les alertes'),
            () => context.go('/profile/notifications'),
          ),
        ]),
        const SizedBox(height: 16),
        _section(lp.t('Account management', 'Gestion du compte'), [
          _tile(
            context,
            Icons.email_outlined,
            accent,
            lp.t('Update email', 'Modifier l’e-mail'),
            lp.t('Change contact email', 'Changer l’e-mail de contact'),
            () => context.go('/profile/change-email'),
          ),
          _tile(
            context,
            Icons.phone_outlined,
            accent,
            lp.t('Update phone', 'Modifier le téléphone'),
            lp.t('Change contact phone', 'Changer le téléphone de contact'),
            () => context.go('/profile/change-phone'),
          ),
          _tile(
            context,
            Icons.delete_outline,
            Colors.red,
            lp.t('Delete account', 'Supprimer le compte'),
            lp.t(
              'Permanently remove processor account',
              'Supprimer définitivement le compte processeur',
            ),
            () => context.go('/profile/delete-account'),
          ),
        ]),
        const SizedBox(height: 16),
        _section(lp.t('Support', 'Support'), [
          _tile(
            context,
            Icons.help_outline,
            accent,
            lp.t('Help Center', 'Centre d’aide'),
            lp.t('FAQs and guides', 'FAQ et guides'),
            () => context.go('/help'),
          ),
          _tile(
            context,
            Icons.gavel_outlined,
            Colors.white54,
            lp.t('Terms of Service', 'Conditions d’utilisation'),
            lp.t('View terms', 'Voir les conditions'),
            () => context.push('/terms?view=1'),
          ),
          _tile(
            context,
            Icons.privacy_tip_outlined,
            Colors.white54,
            lp.t('Privacy Policy', 'Politique de confidentialité'),
            lp.t('View privacy', 'Voir la confidentialité'),
            () => context.push('/terms?view=1'),
          ),
        ]),
        const DashboardSignOutButton(
          dialogBackground: Color(0xFF1a1200),
        ),
      ],
    );
  }

  Widget _section(String title, List<Widget> items) {
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
            gradient: LinearGradient(colors: [cardStart, cardEnd]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
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
                      indent: 56,
                      color: Colors.white.withValues(alpha: 0.06),
                    ),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _tile(
    BuildContext ctx,
    IconData icon,
    Color color,
    String title,
    String sub,
    VoidCallback onTap,
  ) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(9),
        ),
        child: Icon(icon, color: color, size: 17),
      ),
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        sub,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.45),
          fontSize: 12,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 13,
        color: Colors.white.withValues(alpha: 0.25),
      ),
    );
  }
}
