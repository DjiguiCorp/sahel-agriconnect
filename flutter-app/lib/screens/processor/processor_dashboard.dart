import 'package:flutter/material.dart';
import '../../core/safe_insets.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/glass.dart';
import '../../core/language_provider.dart';
import '../../core/responsive.dart';
import '../../core/theme.dart';
import '../../widgets/portal_tablet_shell.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import 'processor_certification_flow.dart';

const _bg      = Color(0xFF1a1200);
const _surface = Color(0xFF2a1a00);
const _surface2 = Color(0xFF1f1200);
const _amber   = Color(0xFFF59E0B);
const _gold    = AppColors.gold;
const _green   = Color(0xFF1D9E75);
const _blue    = Color(0xFF3B82F6);
const _border  = Color(0x14FFFFFF);
const _text    = Colors.white;
const _muted   = Color(0x99FFFFFF);

// ══════════════════════════════════════════════════════════════
// MAIN PROCESSOR DASHBOARD
// ══════════════════════════════════════════════════════════════
class ProcessorDashboard extends StatefulWidget {
  const ProcessorDashboard({super.key});
  @override State<ProcessorDashboard> createState() =>
    _ProcessorDashboardState();
}

class _ProcessorDashboardState extends State<ProcessorDashboard> {
  int _tab = 0;
  Map<String, dynamic>? _data;
  bool _loading = true;

  // State lists — always show demo data
  final List<Map<String, dynamic>> _batches = [
    {'id': 'BAT-001', 'crop': 'Shea Butter', 'rawKg': 2400,
     'outputKg': 960, 'status': 'processing', 'quality': 'A',
     'startDate': 'May 12, 2026', 'processor': 'Unit 1',
     'certified': false},
    {'id': 'BAT-002', 'crop': 'Sesame', 'rawKg': 1800,
     'outputKg': 1440, 'status': 'certified', 'quality': 'A',
     'startDate': 'May 8, 2026', 'processor': 'Unit 2',
     'certified': true},
    {'id': 'BAT-003', 'crop': 'Cashew', 'rawKg': 3200,
     'outputKg': 0, 'status': 'pending', 'quality': 'B',
     'startDate': 'May 15, 2026', 'processor': 'Unit 1',
     'certified': false},
  ];

  final List<Map<String, dynamic>> _supplyRequests = [
    {'id': 'SUP-001', 'crop': 'Shea Butter', 'qtyKg': 5000,
     'quality': 'A', 'source': 'Ségou Region', 'status': 'confirmed',
     'deliveryDate': 'May 20, 2026'},
    {'id': 'SUP-002', 'crop': 'Sesame', 'qtyKg': 3000,
     'quality': 'A', 'source': 'Sikasso Region', 'status': 'pending',
     'deliveryDate': 'May 25, 2026'},
  ];

  final List<Map<String, dynamic>> _schedule = [
    {'type': 'pickup', 'crop': 'Shea Butter', 'quantity': '2,000 kg',
     'partner': 'Coop Karité Ségou', 'date': 'May 19, 2026',
     'time': '08:00', 'location': 'Ségou, Mali', 'status': 'confirmed'},
    {'type': 'delivery', 'crop': 'Sesame Oil', 'quantity': '800 L',
     'partner': 'Export Mali SA', 'date': 'May 21, 2026',
     'time': '10:00', 'location': 'Bamako, Mali', 'status': 'scheduled'},
    {'type': 'pickup', 'crop': 'Cashew', 'quantity': '3,200 kg',
     'partner': 'Union Cajou Sikasso', 'date': 'May 23, 2026',
     'time': '07:30', 'location': 'Sikasso, Mali', 'status': 'pending'},
  ];

  int get _activeBatches => _batches
    .where((b) => b['status'] == 'processing').length;
  int get _certifiedBatches => _batches
    .where((b) => b['certified'] == true).length;
  double get _totalOutput => _batches.fold(0,
    (s, b) => s + (b['outputKg'] as int).toDouble());

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthState>();
    try {
      final res = await ApiService.getProcessorPortal(
        auth.token ?? '',
        country: auth.displayCountry.isNotEmpty
          ? auth.displayCountry : null);
      if (mounted) setState(() { _data = res; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goTab(int i) {
    AuthService.resetActivity();
    setState(() => _tab = i);
  }

  void _addBatch(Map<String, dynamic> b) =>
    setState(() => _batches.insert(0, b));
  void _addSupply(Map<String, dynamic> s) =>
    setState(() => _supplyRequests.insert(0, s));
  void _addSchedule(Map<String, dynamic> s) =>
    setState(() => _schedule.insert(0, s));

  Future<void> _onBackPressed() async {
    if (_tab != 0) {
      setState(() => _tab = 0);
      return;
    }
    final isFr =
        context.read<LanguageProvider>().locale.languageCode == 'fr';
    final exit = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: _surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16)),
        title: Text(isFr ? 'Quitter ?' : 'Exit?',
            style: const TextStyle(color: _text)),
        content: Text(
          isFr
              ? 'Voulez-vous quitter le centre de traitement ?'
              : 'Do you want to exit the processing center?',
          style: const TextStyle(color: _muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(isFr ? 'Rester' : 'Stay',
                style: const TextStyle(color: _muted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(isFr ? 'Quitter' : 'Exit',
                style: const TextStyle(color: _amber)),
          ),
        ],
      ),
    );
    if (exit == true && mounted) context.go('/home');
  }

  Widget _buildTabStack(bool isFr) => IndexedStack(
        index: _tab,
        children: [
          _HomeTab(
            batches: _batches,
            schedule: _schedule,
            isFr: isFr,
            onTabChange: _goTab,
          ),
          _SupplyTab(requests: _supplyRequests, isFr: isFr, onAdd: _addSupply),
          _ProcessingTab(batches: _batches, isFr: isFr, onAdd: _addBatch),
          _ScheduleTab(schedule: _schedule, isFr: isFr, onAdd: _addSchedule),
          _ProcessorAccountTab(isFr: isFr, onTabChange: _goTab),
        ],
      );

  Widget _buildPhoneLayout(bool isFr) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Scaffold(
          extendBody: false,
          backgroundColor: _bg,
          body: Column(
            children: [
              const OfflineBanner(),
              _ProcessorHeader(
                data: _data,
                loading: _loading,
                activeBatches: _activeBatches,
                certifiedBatches: _certifiedBatches,
                totalOutput: _totalOutput,
                isFr: isFr,
              ),
              Expanded(child: _buildTabStack(isFr)),
            ],
          ),
          bottomNavigationBar: GlassBottomNav(
            child: NavigationBar(
              backgroundColor: Colors.transparent,
              surfaceTintColor: Colors.transparent,
              elevation: 0,
              height: 64,
              selectedIndex: _tab,
              onDestinationSelected: _goTab,
              indicatorColor: _amber.withValues(alpha: 0.2),
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.home_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.home, color: _amber),
                  label: isFr ? 'Accueil' : 'Home',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.inventory_2_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.inventory_2, color: _amber),
                  label: isFr ? 'Approvisionnement' : 'Supply',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.factory_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.factory, color: _amber),
                  label: isFr ? 'Traitement' : 'Processing',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.calendar_month_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.calendar_month, color: _amber),
                  label: isFr ? 'Planning' : 'Schedule',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.manage_accounts_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.manage_accounts, color: _amber),
                  label: isFr ? 'Compte' : 'Account',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabletLayout(bool isFr) {
    return PortalTabletShell(
      backgroundColor: _bg,
      sidebarColor: _surface2,
      accentColor: _amber,
      topBanner: const OfflineBanner(),
      sidebarHeader: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFr ? 'Centre de traitement' : 'Processing Center',
            style: TextStyle(
              color: _text,
              fontSize: Responsive.fontSize(context, 18),
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            'Sahel AgriConnect',
            style: TextStyle(
              color: _muted,
              fontSize: Responsive.fontSize(context, 13),
            ),
          ),
        ],
      ),
      stats: [
        PortalSidebarStat(
          label: isFr ? 'Lots actifs' : 'Active batches',
          value: '$_activeBatches',
          accentColor: _amber,
        ),
        PortalSidebarStat(
          label: isFr ? 'Certifiés' : 'Certified',
          value: '$_certifiedBatches',
          accentColor: _green,
        ),
        PortalSidebarStat(
          label: isFr ? 'Production (kg)' : 'Output (kg)',
          value: _totalOutput.toStringAsFixed(0),
          accentColor: _gold,
        ),
      ],
      navItems: [
        PortalSidebarNavItem(
          icon: Icons.home_outlined,
          selectedIcon: Icons.home,
          label: isFr ? 'Accueil' : 'Home',
        ),
        PortalSidebarNavItem(
          icon: Icons.inventory_2_outlined,
          selectedIcon: Icons.inventory_2,
          label: isFr ? 'Approvisionnement' : 'Supply',
        ),
        PortalSidebarNavItem(
          icon: Icons.factory_outlined,
          selectedIcon: Icons.factory,
          label: isFr ? 'Traitement' : 'Processing',
        ),
        PortalSidebarNavItem(
          icon: Icons.calendar_month_outlined,
          selectedIcon: Icons.calendar_month,
          label: isFr ? 'Planning' : 'Schedule',
        ),
        PortalSidebarNavItem(
          icon: Icons.manage_accounts_outlined,
          selectedIcon: Icons.manage_accounts,
          label: isFr ? 'Compte' : 'Account',
        ),
      ],
      selectedIndex: _tab,
      onNavSelected: _goTab,
      content: _buildTabStack(isFr),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isFr =
        context.watch<LanguageProvider>().locale.languageCode == 'fr';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBackPressed();
      },
      child: Responsive.builder(
        context: context,
        phone: _buildPhoneLayout(isFr),
        tablet: _buildTabletLayout(isFr),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════
class _ProcessorHeader extends StatelessWidget {
  final Map<String, dynamic>? data;
  final bool loading, isFr;
  final int activeBatches, certifiedBatches;
  final double totalOutput;
  const _ProcessorHeader({required this.data, required this.loading,
    required this.activeBatches, required this.certifiedBatches,
    required this.totalOutput, required this.isFr});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = auth.displayName.isNotEmpty
      ? auth.displayName : (isFr ? 'Centre de traitement'
        : 'Processing Center');
    final location = auth.displayCountry.isNotEmpty
      ? auth.displayCountry : (data?['location']?.toString() ?? '—');

    return GlassPortalHeader(
      gradientColors: const [
        Color(0xFF2d1f00),
        Color(0xFF3d2800),
        Color(0xFF2d1f00),
      ],
      accentColor: _amber,
      titleRow: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.factory_outlined,
                        color: _amber, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      isFr ? 'Centre de traitement' : 'Processing Center',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  style: const TextStyle(
                    color: _text,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                Text(location,
                    style: const TextStyle(color: _muted, fontSize: 12)),
              ],
            ),
          ),
          GlassHeaderIconButton(
            icon: Icons.home_outlined,
            accentColor: _amber,
            circular: false,
            label: isFr ? 'Accueil' : 'Home',
            onTap: () => context.go('/home'),
          ),
        ],
      ),
      statsRow: Row(
        children: [
          GlassStatTile(
            value: '$activeBatches',
            label: isFr ? 'Lots actifs' : 'Active Lots',
            accentColor: _amber,
            icon: Icons.factory_outlined,
          ),
          const SizedBox(width: 8),
          GlassStatTile(
            value: '$certifiedBatches',
            label: isFr ? 'Certifiés' : 'Certified',
            accentColor: _amber,
            icon: Icons.verified_outlined,
          ),
          const SizedBox(width: 8),
          GlassStatTile(
            value: '${totalOutput.toStringAsFixed(0)} kg',
            label: isFr ? 'Production' : 'Output',
            accentColor: _amber,
            icon: Icons.scale_outlined,
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 0: HOME — unique from tabs, adds real value
// ══════════════════════════════════════════════════════════════
class _HomeTab extends StatelessWidget {
  final List<Map<String, dynamic>> batches, schedule;
  final bool isFr;
  final Function(int) onTabChange;
  const _HomeTab({required this.batches, required this.schedule,
    required this.isFr, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        // Market intelligence — unique to home tab
        _secTitle(isFr ? 'Intelligence marché' : 'Market Intelligence'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: _cardDeco(),
          child: Column(children: [
            _marketRow(isFr ? '🌰 Beurre de karité brut'
              : '🌰 Raw Shea Butter',
              isFr ? 'Acheter à:' : 'Buy at:',
              '280 XOF/kg',
              isFr ? 'Vendre à:' : 'Sell at:',
              '450 XOF/kg', '+61%'),
            const Divider(color: _border, height: 16),
            _marketRow(isFr ? '🌿 Sésame brut' : '🌿 Raw Sesame',
              isFr ? 'Acheter à:' : 'Buy at:',
              '220 XOF/kg',
              isFr ? 'Vendre à:' : 'Sell at:',
              '380 XOF/kg', '+73%'),
            const Divider(color: _border, height: 16),
            _marketRow(isFr ? '🥜 Noix cajou brut' : '🥜 Raw Cashew',
              isFr ? 'Acheter à:' : 'Buy at:',
              '540 XOF/kg',
              isFr ? 'Vendre à:' : 'Sell at:',
              '920 XOF/kg', '+70%'),
          ])).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 20),

        // Quick actions — DIFFERENT from tabs (strategic decisions)
        _secTitle(isFr ? 'Actions rapides' : 'Quick Actions'),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10,
          childAspectRatio: 1.3,
          children: [
            _QA(emoji: '📦',
              title: isFr ? 'Demander approvisionnement'
                : 'Request Supply',
              subtitle: isFr ? 'Acheter chez agriculteurs'
                : 'Source from farmers',
              color: _amber, onTap: () => onTabChange(1)),
            _QA(emoji: '⚙️',
              title: isFr ? 'Nouveau lot' : 'New Batch',
              subtitle: isFr ? 'Lancer le traitement'
                : 'Start processing',
              color: const Color(0xFF10B981),
              onTap: () => onTabChange(2)),
            _QA(emoji: '📅',
              title: isFr ? 'Planifier livraison'
                : 'Schedule Delivery',
              subtitle: isFr ? 'Pickup & livraison'
                : 'Pickup & delivery',
              color: _blue, onTap: () => onTabChange(3)),
            _QA(emoji: '✅',
              title: isFr ? 'Demander certification'
                : 'Request Certification',
              subtitle: isFr ? 'Qualité & normes'
                : 'Quality & standards',
              color: const Color(0xFF7B61FF),
              onTap: () => ProcessorCertificationFlow.show(
                context,
                isFr: isFr,
              )),
          ]),
        const SizedBox(height: 20),

        // Batch overview — different level of detail from Processing tab
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _secTitle(isFr ? 'Lots récents' : 'Recent Batches'),
            GestureDetector(onTap: () => onTabChange(2),
              child: const Text('See all',
                style: TextStyle(color: _gold, fontSize: 12))),
          ]),
        const SizedBox(height: 12),
        ...batches.take(2).map((b) =>
          _BatchPreviewCard(b: b, isFr: isFr)),
        const SizedBox(height: 20),

        // Today's schedule — different from Schedule tab
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _secTitle(isFr ? 'Planning du jour' : 'Today\'s Schedule'),
            GestureDetector(onTap: () => onTabChange(3),
              child: const Text('View all',
                style: TextStyle(color: _gold, fontSize: 12))),
          ]),
        const SizedBox(height: 12),
        ...schedule.take(2).map((s) =>
          _SchedulePreviewCard(s: s, isFr: isFr)),
        const SizedBox(height: 20),

        // Processing performance — unique insight
        _secTitle(isFr ? 'Performance de traitement'
          : 'Processing Performance'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: _cardDeco(),
          child: Column(children: [
            _perfRow(isFr ? 'Taux de conversion moyen'
              : 'Average Conversion Rate',
              '42%', 0.42, _amber),
            const SizedBox(height: 12),
            _perfRow(isFr ? 'Lots certifiés ce mois'
              : 'Certified Batches This Month',
              '3/5', 0.60, _green),
            const SizedBox(height: 12),
            _perfRow(isFr ? 'Capacité utilisée'
              : 'Capacity Utilization',
              '78%', 0.78, _blue),
          ])),
      ]);
  }

  Widget _marketRow(String crop, String buyL, String buy,
    String sellL, String sell, String margin) =>
    Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(crop, style: const TextStyle(color: _text,
            fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Row(children: [
            Text('$buyL ', style: const TextStyle(color: _muted,
              fontSize: 10)),
            Text(buy, style: const TextStyle(color: _text,
              fontSize: 11, fontWeight: FontWeight.w600)),
          ]),
          Row(children: [
            Text('$sellL ', style: const TextStyle(color: _muted,
              fontSize: 10)),
            Text(sell, style: const TextStyle(color: _green,
              fontSize: 11, fontWeight: FontWeight.w600)),
          ]),
        ])),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: _green.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8)),
        child: Column(children: [
          Text(margin, style: const TextStyle(color: _green,
            fontSize: 13, fontWeight: FontWeight.bold)),
          Text(isFr ? 'marge' : 'margin',
            style: const TextStyle(color: _green, fontSize: 9)),
        ])),
    ]);

  Widget _perfRow(String label, String val, double pct, Color col) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Text(label, style: const TextStyle(
          color: _text, fontSize: 12, fontWeight: FontWeight.w600))),
        Text(val, style: TextStyle(color: col,
          fontWeight: FontWeight.bold)),
      ]),
      const SizedBox(height: 6),
      ClipRRect(borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: pct, color: col,
          backgroundColor: Colors.white.withValues(alpha: 0.08),
          minHeight: 5)),
    ]);
}

class _BatchPreviewCard extends StatelessWidget {
  final Map<String, dynamic> b;
  final bool isFr;
  const _BatchPreviewCard({required this.b, required this.isFr});

  Color _statusColor(String s) => s == 'certified'
    ? _green : s == 'processing' ? _amber : _blue;
  String _statusLabel(String s, bool isFr) => isFr
    ? (s == 'certified' ? 'Certifié'
      : s == 'processing' ? 'En traitement' : 'En attente')
    : (s == 'certified' ? 'Certified'
      : s == 'processing' ? 'Processing' : 'Pending');

  @override
  Widget build(BuildContext context) {
    final status = b['status'] as String;
    final col = _statusColor(status);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: _cardDeco(),
      child: Row(children: [
        Container(width: 40, height: 40,
          decoration: BoxDecoration(
            color: col.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.inventory_2_outlined, color: col, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${b['id']} · ${b['crop']}',
            style: const TextStyle(color: _text, fontSize: 13,
              fontWeight: FontWeight.w700)),
          Text('${b['rawKg']} kg → ${b['outputKg']} kg output',
            style: const TextStyle(color: _muted, fontSize: 11)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: col.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8)),
          child: Text(_statusLabel(status, isFr),
            style: TextStyle(color: col, fontSize: 10,
              fontWeight: FontWeight.bold))),
      ]));
  }
}

class _SchedulePreviewCard extends StatelessWidget {
  final Map<String, dynamic> s;
  final bool isFr;
  const _SchedulePreviewCard({required this.s, required this.isFr});

  @override
  Widget build(BuildContext context) {
    final isPickup = s['type'] == 'pickup';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: _cardDeco(),
      child: Row(children: [
        Container(width: 40, height: 40,
          decoration: BoxDecoration(
            color: (isPickup ? _amber : _blue).withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10)),
          child: Icon(
            isPickup ? Icons.arrow_downward_outlined
              : Icons.arrow_upward_outlined,
            color: isPickup ? _amber : _blue, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(isFr
            ? (isPickup ? 'Collecte · ${s['crop']}'
              : 'Livraison · ${s['crop']}')
            : (isPickup ? 'Pickup · ${s['crop']}'
              : 'Delivery · ${s['crop']}'),
            style: const TextStyle(color: _text, fontSize: 13,
              fontWeight: FontWeight.w700)),
          Text('${s['date']} ${s['time']} · ${s['quantity']}',
            style: const TextStyle(color: _muted, fontSize: 11)),
          Text(s['partner'] as String,
            style: const TextStyle(color: _muted, fontSize: 10)),
        ])),
      ]));
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 1: SUPPLY — source from farmers & cooperatives
// ══════════════════════════════════════════════════════════════
class _SupplyTab extends StatefulWidget {
  final List<Map<String, dynamic>> requests;
  final bool isFr;
  final Function(Map<String, dynamic>) onAdd;
  const _SupplyTab({required this.requests, required this.isFr,
    required this.onAdd});
  @override State<_SupplyTab> createState() => _SupplyTabState();
}

class _SupplyTabState extends State<_SupplyTab> {
  bool _showForm = false;
  final _cropCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _sourceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _quality = 'A';
  DateTime? _deliveryDate;
  bool _submitting = false;

  @override
  void dispose() {
    _cropCtrl.dispose(); _qtyCtrl.dispose(); _priceCtrl.dispose();
    _sourceCtrl.dispose(); _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_cropCtrl.text.isEmpty || _qtyCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Culture et quantité sont requis'
          : 'Crop and quantity are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _submitting = true);
    final supply = {
      'id': 'SUP-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      'crop': _cropCtrl.text.trim(),
      'qtyKg': int.tryParse(_qtyCtrl.text) ?? 0,
      'quality': _quality,
      'source': _sourceCtrl.text.trim(),
      'priceOffered': double.tryParse(_priceCtrl.text) ?? 0,
      'deliveryDate': _deliveryDate != null
        ? '${_deliveryDate!.day}/${_deliveryDate!.month}/${_deliveryDate!.year}'
        : (widget.isFr ? 'À confirmer' : 'TBD'),
      'status': 'pending',
      'notes': _notesCtrl.text.trim(),
    };
    await Future.delayed(const Duration(milliseconds: 800));
    widget.onAdd(supply);
    if (mounted) {
      setState(() { _submitting = false; _showForm = false;
        _cropCtrl.clear(); _qtyCtrl.clear(); _priceCtrl.clear();
        _sourceCtrl.clear(); _notesCtrl.clear(); _deliveryDate = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Demande d\'approvisionnement envoyée !'
          : '✅ Supply request sent!'),
        backgroundColor: _amber));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        if (!_showForm)
          _primaryBtn(
            isFr ? 'Demander un approvisionnement'
              : 'Request New Supply',
            Icons.add_circle_outline, _amber,
            () => setState(() => _showForm = true)),

        if (_showForm) ...[
          Row(children: [
            IconButton(icon: const Icon(Icons.arrow_back, color: _text),
              onPressed: () => setState(() => _showForm = false)),
            Text(isFr ? 'Demande d\'approvisionnement'
              : 'Supply Request',
              style: const TextStyle(color: _text, fontSize: 17,
                fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          _card(children: [
            _secLabel(isFr ? '🌾 Produit recherché'
              : '🌾 Required Product'),
            _lbl(isFr ? 'Type de culture *' : 'Crop Type *'),
            _tf(_cropCtrl, isFr ? 'Ex: Karité, Sésame, Cajou'
              : 'e.g. Shea, Sesame, Cashew'),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl(isFr ? 'Quantité (kg) *' : 'Quantity (kg) *'),
                _tf(_qtyCtrl, isFr ? 'Ex: 5000' : 'e.g. 5000',
                  type: TextInputType.number),
              ])),
              const SizedBox(width: 10),
              SizedBox(
                width: 90,
                child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl(isFr ? 'Qualité' : 'Quality'),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  isDense: true,
                  value: _quality, dropdownColor: _surface,
                  style: const TextStyle(color: _text),
                  decoration: _dec(''),
                  items: ['A', 'B', 'C'].map((q) => DropdownMenuItem(
                    value: q, child: Text('Grade $q',
                      style: const TextStyle(color: _text)))).toList(),
                  onChanged: (v) => setState(() => _quality = v ?? 'A')),
                ],
              ),
            ),
            ]),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Prix offert (XOF/kg)' : 'Offered Price (XOF/kg)'),
            _tf(_priceCtrl, isFr ? 'Ex: 280' : 'e.g. 280',
              type: TextInputType.number),
            const SizedBox(height: 16),
            _secLabel(isFr ? '📍 Source & livraison'
              : '📍 Source & Delivery'),
            _lbl(isFr ? 'Région/Source souhaitée' : 'Preferred Source Region'),
            _tf(_sourceCtrl,
              isFr ? 'Ex: Ségou, Sikasso, Mali'
                   : 'e.g. Segou, Sikasso, Mali'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Date de livraison souhaitée'
              : 'Preferred Delivery Date'),
            _dateField(context,
              isFr ? 'Choisir une date' : 'Choose a date',
              _deliveryDate,
              (d) => setState(() => _deliveryDate = d)),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Notes supplémentaires' : 'Additional Notes'),
            _tf(_notesCtrl,
              isFr ? 'Exigences particulières...'
                   : 'Special requirements...',
              maxLines: 3),
            const SizedBox(height: 20),
            _btn(isFr ? 'Soumettre la demande' : 'Submit Request',
              _submitting, _submit, _amber),
          ]),
        ],

        const SizedBox(height: 20),
        _secTitle('${isFr ? 'Demandes en cours' : 'Active Supply Requests'} '
          '(${widget.requests.length})'),
        const SizedBox(height: 12),
        widget.requests.isEmpty
          ? _empty(Icons.inventory_2_outlined,
              isFr ? 'Aucune demande' : 'No supply requests',
              isFr ? 'Créez votre première demande ci-dessus'
                   : 'Create your first request above')
          : Column(children: widget.requests.asMap().entries.map((e) {
              final r = e.value;
              final status = r['status'] as String;
              final col = status == 'confirmed' ? _green
                : status == 'pending' ? _amber : _blue;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: _cardDeco(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                  Row(children: [
                    Container(width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: col.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.inventory_2_outlined,
                        color: _amber, size: 18)),
                    const SizedBox(width: 10),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                      Text('${r['id']} · ${r['crop']}',
                        style: const TextStyle(color: _text,
                          fontSize: 13, fontWeight: FontWeight.w700)),
                      Text('${r['qtyKg']} kg · Grade ${r['quality']}',
                        style: const TextStyle(color: _muted,
                          fontSize: 11)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: col.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8)),
                      child: Text(
                        isFr ? (status == 'confirmed' ? 'Confirmé'
                          : 'En attente')
                          : (status == 'confirmed' ? 'Confirmed'
                          : 'Pending'),
                        style: TextStyle(color: col, fontSize: 10,
                          fontWeight: FontWeight.bold))),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.location_on_outlined,
                      color: _muted, size: 12),
                    const SizedBox(width: 4),
                    Text('${r['source']}',
                      style: const TextStyle(color: _muted,
                        fontSize: 11)),
                    const Spacer(),
                    const Icon(Icons.calendar_today_outlined,
                      color: _muted, size: 12),
                    const SizedBox(width: 4),
                    Text('${r['deliveryDate']}',
                      style: const TextStyle(color: _muted,
                        fontSize: 11)),
                  ]),
                ])).animate(delay: Duration(milliseconds: 50 * e.key))
                  .fadeIn(duration: 300.ms);
            }).toList()),
      ]);
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 2: PROCESSING — batch management & QC
// ══════════════════════════════════════════════════════════════
class _ProcessingTab extends StatefulWidget {
  final List<Map<String, dynamic>> batches;
  final bool isFr;
  final Function(Map<String, dynamic>) onAdd;
  const _ProcessingTab({required this.batches, required this.isFr,
    required this.onAdd});
  @override State<_ProcessingTab> createState() => _ProcessingTabState();
}

class _ProcessingTabState extends State<_ProcessingTab> {
  bool _showForm = false;
  final _cropCtrl = TextEditingController();
  final _rawCtrl = TextEditingController();
  final _methodCtrl = TextEditingController();
  final _unitCtrl = TextEditingController();
  String _quality = 'A';
  String _processorUnit = 'Unit 1';
  DateTime? _startDate;
  bool _submitting = false;

  @override
  void dispose() {
    _cropCtrl.dispose(); _rawCtrl.dispose();
    _methodCtrl.dispose(); _unitCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_cropCtrl.text.isEmpty || _rawCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Culture et quantité brute sont requis'
          : 'Crop and raw quantity are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _submitting = true);
    final rawKg = int.tryParse(_rawCtrl.text) ?? 0;
    final batch = {
      'id': 'BAT-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      'crop': _cropCtrl.text.trim(),
      'rawKg': rawKg,
      'outputKg': 0,
      'status': 'processing',
      'quality': _quality,
      'startDate': _startDate != null
        ? '${_startDate!.day}/${_startDate!.month}/${_startDate!.year}'
        : 'Today',
      'processor': _processorUnit,
      'method': _methodCtrl.text.trim(),
      'certified': false,
    };
    await Future.delayed(const Duration(milliseconds: 800));
    widget.onAdd(batch);
    if (mounted) {
      setState(() { _submitting = false; _showForm = false;
        _cropCtrl.clear(); _rawCtrl.clear();
        _methodCtrl.clear(); _startDate = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Lot de traitement créé !'
          : '✅ Processing batch created!'),
        backgroundColor: _green));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        if (!_showForm)
          _primaryBtn(isFr ? 'Créer un nouveau lot' : 'Log New Batch',
            Icons.add_circle_outline, _green,
            () => setState(() => _showForm = true)),

        if (_showForm) ...[
          Row(children: [
            IconButton(icon: const Icon(Icons.arrow_back, color: _text),
              onPressed: () => setState(() => _showForm = false)),
            Text(isFr ? 'Nouveau lot de traitement' : 'New Processing Batch',
              style: const TextStyle(color: _text, fontSize: 17,
                fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          _card(children: [
            _secLabel(isFr ? '🌾 Matière première' : '🌾 Raw Material'),
            _lbl(isFr ? 'Type de culture *' : 'Crop Type *'),
            _tf(_cropCtrl, isFr ? 'Ex: Karité, Sésame, Cajou'
              : 'e.g. Shea, Sesame, Cashew'),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl(isFr ? 'Quantité brute (kg) *'
                  : 'Raw Quantity (kg) *'),
                _tf(_rawCtrl, isFr ? 'Ex: 2400' : 'e.g. 2400',
                  type: TextInputType.number),
              ])),
              const SizedBox(width: 10),
              SizedBox(
                width: 90,
                child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl(isFr ? 'Qualité' : 'Quality'),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  isDense: true,
                  value: _quality, dropdownColor: _surface,
                  style: const TextStyle(color: _text),
                  decoration: _dec(''),
                  items: ['A', 'B', 'C'].map((q) => DropdownMenuItem(
                    value: q, child: Text('Grade $q',
                      style: const TextStyle(color: _text)))).toList(),
                  onChanged: (v) => setState(() => _quality = v ?? 'A')),
                ],
              ),
            ),
            ]),
            const SizedBox(height: 16),
            _secLabel(isFr ? '⚙️ Paramètres de traitement'
              : '⚙️ Processing Parameters'),
            _lbl(isFr ? 'Méthode de traitement' : 'Processing Method'),
            _tf(_methodCtrl,
              isFr ? 'Ex: Extraction à froid, pressage, raffinage'
                   : 'e.g. Cold extraction, pressing, refining'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Unité de production' : 'Production Unit'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              isDense: true,
              value: _processorUnit, dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _dec(''),
              items: ['Unit 1', 'Unit 2', 'Unit 3']
                .map((u) => DropdownMenuItem(value: u,
                  child: Text(u, style: const TextStyle(color: _text))))
                .toList(),
              onChanged: (v) =>
                setState(() => _processorUnit = v ?? 'Unit 1')),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Date de début' : 'Start Date'),
            _dateField(context,
              isFr ? 'Choisir une date' : 'Choose date',
              _startDate, (d) => setState(() => _startDate = d)),
            const SizedBox(height: 20),
            _btn(isFr ? 'Lancer le traitement' : 'Start Processing',
              _submitting, _submit, _green),
          ]),
        ],

        const SizedBox(height: 20),
        _secTitle('${isFr ? 'Tous les lots' : 'All Batches'} '
          '(${widget.batches.length})'),
        const SizedBox(height: 12),
        ...widget.batches.asMap().entries.map((e) {
          final b = e.value;
          final status = b['status'] as String;
          final col = status == 'certified' ? _green
            : status == 'processing' ? _amber : _blue;
          final rawKg = b['rawKg'] as int;
          final outKg = b['outputKg'] as int;
          final pct = rawKg > 0 ? outKg / rawKg : 0.0;
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: _cardDeco(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(width: 40, height: 40,
                decoration: BoxDecoration(
                  color: col.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10)),
                child: Icon(Icons.factory_outlined, color: col, size: 20)),
              const SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${b['id']} · ${b['crop']}',
                  style: const TextStyle(color: _text, fontSize: 14,
                    fontWeight: FontWeight.w700)),
                Text('${b['processor']} · ${b['startDate']}',
                  style: const TextStyle(color: _muted, fontSize: 11)),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: col.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8)),
                child: Text(
                  isFr ? (status == 'certified' ? 'Certifié'
                    : status == 'processing' ? 'En cours' : 'En attente')
                    : (status == 'certified' ? 'Certified'
                    : status == 'processing' ? 'Processing' : 'Pending'),
                  style: TextStyle(color: col, fontSize: 10,
                    fontWeight: FontWeight.bold))),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              _batchStat('$rawKg kg',
                isFr ? 'Matière brute' : 'Raw Input', _amber),
              _batchStat('→', '', Colors.transparent),
              _batchStat('$outKg kg',
                isFr ? 'Production' : 'Output', _green),
              _batchStat('Grade ${b['quality']}',
                isFr ? 'Qualité' : 'Quality', _blue),
            ]),
            if (status == 'processing') ...[
              const SizedBox(height: 10),
              ClipRRect(borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (pct > 0 ? pct : 0.45).clamp(0.0, 1.0),
                  backgroundColor: Colors.white.withValues(alpha: 0.08),
                  color: _amber, minHeight: 5)),
              const SizedBox(height: 4),
              Text(isFr
                ? 'Traitement: ${((pct > 0 ? pct : 0.45) * 100).round()}% complété'
                : 'Processing: ${((pct > 0 ? pct : 0.45) * 100).round()}% complete',
                style: const TextStyle(color: _muted, fontSize: 10)),
            ],
            if (!(b['certified'] as bool) && status != 'pending') ...[
              const SizedBox(height: 10),
              SizedBox(width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(
                      color: _green.withValues(alpha: 0.4)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8))),
                  icon: const Icon(Icons.verified_outlined,
                    color: _green, size: 16),
                  label: Text(
                    isFr ? 'Demander certification'
                         : 'Request Certification',
                    style: const TextStyle(color: _green,
                      fontSize: 12, fontWeight: FontWeight.w600)),
                  onPressed: () => ProcessorCertificationFlow.show(
                    context,
                    isFr: isFr,
                    batch: b,
                  ))),
            ],
          ])).animate(delay: Duration(milliseconds: 50 * e.key))
            .fadeIn(duration: 300.ms);
        }),
      ]);
  }

  Widget _batchStat(String val, String label, Color col) => Expanded(
    child: Column(children: [
      Text(val, style: TextStyle(color: col == Colors.transparent
        ? _muted : col, fontWeight: FontWeight.bold, fontSize: 12)),
      if (label.isNotEmpty)
        Text(label, style: const TextStyle(color: _muted, fontSize: 9)),
    ]));
}

// ══════════════════════════════════════════════════════════════
// TAB 3: SCHEDULE — pickup & delivery management
// ══════════════════════════════════════════════════════════════
class _ScheduleTab extends StatefulWidget {
  final List<Map<String, dynamic>> schedule;
  final bool isFr;
  final Function(Map<String, dynamic>) onAdd;
  const _ScheduleTab({required this.schedule, required this.isFr,
    required this.onAdd});
  @override State<_ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<_ScheduleTab> {
  bool _showForm = false;
  final _partnerCtrl = TextEditingController();
  final _cropCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  String _type = 'pickup';
  DateTime? _date;
  bool _submitting = false;

  @override
  void dispose() {
    _partnerCtrl.dispose(); _cropCtrl.dispose();
    _qtyCtrl.dispose(); _locationCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_partnerCtrl.text.isEmpty || _cropCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Partenaire et produit sont requis'
          : 'Partner and crop are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _submitting = true);
    final entry = {
      'type': _type,
      'crop': _cropCtrl.text.trim(),
      'quantity': '${_qtyCtrl.text} kg',
      'partner': _partnerCtrl.text.trim(),
      'date': _date != null
        ? '${_date!.day}/${_date!.month}/${_date!.year}'
        : (widget.isFr ? 'À confirmer' : 'TBD'),
      'time': '08:00',
      'location': _locationCtrl.text.trim(),
      'status': 'scheduled',
    };
    await Future.delayed(const Duration(milliseconds: 600));
    widget.onAdd(entry);
    if (mounted) {
      setState(() { _submitting = false; _showForm = false;
        _partnerCtrl.clear(); _cropCtrl.clear();
        _qtyCtrl.clear(); _locationCtrl.clear(); _date = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Entrée de planning ajoutée !'
          : '✅ Schedule entry added!'),
        backgroundColor: _blue));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    final pickups = widget.schedule
      .where((s) => s['type'] == 'pickup').toList();
    final deliveries = widget.schedule
      .where((s) => s['type'] == 'delivery').toList();

    return ListView(
      padding: SafeInsets.listBottom(context),
      children: [
        if (!_showForm)
          _primaryBtn(isFr ? 'Ajouter une entrée de planning'
            : 'Add Schedule Entry',
            Icons.add_circle_outline, _blue,
            () => setState(() => _showForm = true)),

        if (_showForm) ...[
          Row(children: [
            IconButton(icon: const Icon(Icons.arrow_back, color: _text),
              onPressed: () => setState(() => _showForm = false)),
            Text(isFr ? 'Nouvelle entrée de planning'
              : 'New Schedule Entry',
              style: const TextStyle(color: _text, fontSize: 17,
                fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          _card(children: [
            _lbl(isFr ? 'Type d\'opération' : 'Operation Type'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              isDense: true,
              value: _type, dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _dec(''),
              items: [
                DropdownMenuItem(value: 'pickup',
                  child: Text(isFr ? '🚛 Collecte (Pickup)'
                    : '🚛 Pickup from supplier',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'delivery',
                  child: Text(isFr ? '📦 Livraison (Delivery)'
                    : '📦 Delivery to buyer',
                    style: const TextStyle(color: _text))),
              ],
              onChanged: (v) => setState(() => _type = v ?? 'pickup')),
            const SizedBox(height: 12),
            _lbl(isFr
              ? (_type == 'pickup' ? 'Nom du fournisseur/coopérative'
                : 'Nom de l\'acheteur')
              : (_type == 'pickup' ? 'Supplier/Cooperative Name'
                : 'Buyer Name')),
            _tf(_partnerCtrl,
              isFr ? 'Ex: Coop Karité Ségou' : 'e.g. Karité Coop Segou'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Produit *' : 'Product *'),
            _tf(_cropCtrl,
              isFr ? 'Ex: Karité brut, Huile sésame'
                   : 'e.g. Raw shea, Sesame oil'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Quantité estimée' : 'Estimated Quantity'),
            _tf(_qtyCtrl, isFr ? 'Ex: 2000' : 'e.g. 2000',
              type: TextInputType.number),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Lieu' : 'Location'),
            _tf(_locationCtrl,
              isFr ? 'Ex: Ségou, Mali' : 'e.g. Segou, Mali'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Date' : 'Date'),
            _dateField(context,
              isFr ? 'Choisir une date' : 'Choose date',
              _date, (d) => setState(() => _date = d)),
            const SizedBox(height: 20),
            _btn(isFr ? 'Confirmer l\'entrée' : 'Confirm Entry',
              _submitting, _submit, _blue),
          ]),
        ],

        const SizedBox(height: 20),
        // Pickups section
        _secTitle('🚛 ${isFr ? 'Collectes planifiées' : 'Planned Pickups'} '
          '(${pickups.length})'),
        const SizedBox(height: 12),
        pickups.isEmpty
          ? _empty(Icons.arrow_downward_outlined,
              isFr ? 'Aucune collecte planifiée' : 'No pickups scheduled',
              isFr ? 'Ajoutez une collecte ci-dessus'
                   : 'Add a pickup above')
          : Column(children: pickups.map((s) =>
              _ScheduleCard(s: s, isFr: isFr)).toList()),
        const SizedBox(height: 20),

        // Deliveries section
        _secTitle('📦 ${isFr ? 'Livraisons planifiées' : 'Planned Deliveries'} '
          '(${deliveries.length})'),
        const SizedBox(height: 12),
        deliveries.isEmpty
          ? _empty(Icons.arrow_upward_outlined,
              isFr ? 'Aucune livraison planifiée' : 'No deliveries scheduled',
              isFr ? 'Ajoutez une livraison ci-dessus'
                   : 'Add a delivery above')
          : Column(children: deliveries.map((s) =>
              _ScheduleCard(s: s, isFr: isFr)).toList()),
      ]);
  }
}

class _ScheduleCard extends StatelessWidget {
  final Map<String, dynamic> s;
  final bool isFr;
  const _ScheduleCard({required this.s, required this.isFr});

  @override
  Widget build(BuildContext context) {
    final isPickup = s['type'] == 'pickup';
    final status = s['status'] as String;
    final col = status == 'confirmed' ? _green
      : status == 'scheduled' ? _blue : _amber;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: _cardDeco(),
      child: Row(children: [
        Container(width: 44, height: 44,
          decoration: BoxDecoration(
            color: (isPickup ? _amber : _blue).withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12)),
          child: Column(mainAxisAlignment: MainAxisAlignment.center,
            children: [
            Icon(isPickup ? Icons.arrow_downward_outlined
              : Icons.arrow_upward_outlined,
              color: isPickup ? _amber : _blue, size: 18),
            Text(s['time'] as String,
              style: TextStyle(color: isPickup ? _amber : _blue,
                fontSize: 8, fontWeight: FontWeight.bold)),
          ])),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(s['partner'] as String,
            style: const TextStyle(color: _text, fontSize: 13,
              fontWeight: FontWeight.w700)),
          Text('${s['crop']} · ${s['quantity']}',
            style: const TextStyle(color: _muted, fontSize: 11)),
          Text('${s['date']} · ${s['location']}',
            style: const TextStyle(color: _muted, fontSize: 10)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
          decoration: BoxDecoration(
            color: col.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8)),
          child: Text(
            isFr ? (status == 'confirmed' ? 'Confirmé'
              : status == 'scheduled' ? 'Planifié' : 'En attente')
              : (status == 'confirmed' ? 'Confirmed'
              : status == 'scheduled' ? 'Scheduled' : 'Pending'),
            style: TextStyle(color: col, fontSize: 9,
              fontWeight: FontWeight.bold))),
      ])).animate().fadeIn(duration: 300.ms);
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 4: ACCOUNT
// ══════════════════════════════════════════════════════════════
class _ProcessorAccountTab extends StatelessWidget {
  final bool isFr;
  final Function(int) onTabChange;
  const _ProcessorAccountTab({required this.isFr, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = auth.displayName.isNotEmpty
      ? auth.displayName : (isFr ? 'Centre de traitement'
        : 'Processing Center');
    final initial = name[0].toUpperCase();

    return ListView(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 100),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft, end: Alignment.bottomRight,
              colors: [Color(0xFF2d1f00), Color(0xFF3d2800)]),
            borderRadius: BorderRadius.circular(20)),
          child: Row(children: [
            Container(width: 56, height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [_amber, Color(0xFFD97706)]),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(
                  color: _amber.withValues(alpha: 0.4), blurRadius: 12)]),
              child: Center(child: Text(initial, style: const TextStyle(
                color: Colors.white, fontSize: 22,
                fontWeight: FontWeight.bold)))),
            const SizedBox(width: 14),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: const TextStyle(color: _text,
                fontSize: 17, fontWeight: FontWeight.bold)),
              Text(auth.displayEmail,
                style: const TextStyle(color: _muted, fontSize: 12)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: _amber.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _amber.withValues(alpha: 0.4))),
                child: Text(isFr ? '🏭 Transformateur agro'
                  : '🏭 Agro-Processor',
                  style: const TextStyle(color: _amber, fontSize: 11,
                    fontWeight: FontWeight.w600))),
            ])),
          ])),
        const SizedBox(height: 20),

        _sec(isFr ? 'NAVIGATION' : 'NAVIGATION', [
          _tile(context, Icons.home_outlined, _amber,
            isFr ? 'Retour au tableau de bord' : 'Back to Dashboard',
            isFr ? 'Vue principale du centre'
                 : 'Main processing center view',
            () => onTabChange(0)),
          _tile(context, Icons.exit_to_app_outlined, _muted,
            isFr ? 'Quitter vers l\'accueil' : 'Exit to Main Home',
            isFr ? 'Page principale de la plateforme'
                 : 'Main platform home page',
            () => context.go('/home')),
        ]),
        const SizedBox(height: 14),

        _sec(isFr ? 'MON ENTREPRISE' : 'MY COMPANY', [
          _tile(context, Icons.business_outlined, _gold,
            isFr ? 'Profil de l\'entreprise' : 'Company Profile',
            isFr ? 'Infos, capacités & certifications'
                 : 'Info, capacity & certifications',
            () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => _ProcessorEditProfileScreen(isFr: isFr)))),
          _tile(context, Icons.language_outlined,
            const Color(0xFF9C27B0),
            isFr ? 'Langue' : 'Language', 'English / Français',
            () => context.push('/profile/language')),
          _tile(context, Icons.notifications_outlined,
            const Color(0xFFFF9800),
            isFr ? 'Notifications' : 'Notifications',
            isFr ? 'Alertes et mises à jour' : 'Alerts and updates',
            () => context.push('/profile/notifications')),
        ]),
        const SizedBox(height: 14),

        _sec(isFr ? 'SÉCURITÉ' : 'SECURITY', [
          _tile(context, Icons.phone_outlined, _blue,
            isFr ? 'Mettre à jour le téléphone' : 'Update Phone',
            isFr ? 'Numéro de contact' : 'Contact number',
            () => context.push('/profile/change-phone')),
          _tile(context, Icons.email_outlined, _blue,
            isFr ? 'Mettre à jour l\'email' : 'Update Email',
            isFr ? 'Email professionnel' : 'Business email',
            () => context.push('/profile/change-email')),
        ]),
        const SizedBox(height: 14),

        _sec('SUPPORT', [
          _tile(context, Icons.help_outline, _green,
            isFr ? 'Centre d\'aide' : 'Help Center',
            isFr ? 'FAQ et guides' : 'FAQs and guides',
            () => context.go('/help')),
          _tile(context, Icons.gavel_outlined, _muted,
            isFr ? 'Conditions d\'utilisation' : 'Terms of Service',
            isFr ? 'Voir les conditions' : 'View terms',
            () => context.push('/terms?view=1&tab=0')),
          _tile(context, Icons.privacy_tip_outlined, _muted,
            isFr ? 'Politique de confidentialité' : 'Privacy Policy',
            isFr ? 'Vos données' : 'Your data',
            () => context.push('/terms?view=1&tab=1')),
        ]),
        const SizedBox(height: 16),

        Center(child: Column(children: [
          Text('Sahel AgriConnect — Processor v1.1.0',
            style: TextStyle(color: _muted.withValues(alpha: 0.4),
              fontSize: 12)),
          const SizedBox(height: 2),
          Text('🏭 Source. Process. Deliver.',
            style: TextStyle(color: _muted.withValues(alpha: 0.25),
              fontSize: 11, fontStyle: FontStyle.italic)),
        ])),
        const SizedBox(height: 16),

        SizedBox(width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.red.withValues(alpha: 0.5)),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12))),
            icon: const Icon(Icons.logout, color: Colors.red, size: 18),
            label: Text(isFr ? 'Se déconnecter' : 'Sign Out',
              style: const TextStyle(color: Colors.red,
                fontWeight: FontWeight.bold, fontSize: 15)),
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  backgroundColor: _surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                  title: Text(isFr ? 'Se déconnecter ?' : 'Sign out?',
                    style: const TextStyle(color: _text)),
                  content: Text(isFr
                    ? 'Vous serez redirigé vers l\'accueil.'
                    : 'You will be returned to the home screen.',
                    style: const TextStyle(color: _muted)),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: Text(isFr ? 'Annuler' : 'Cancel',
                        style: const TextStyle(color: _muted))),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: Text(isFr ? 'Se déconnecter' : 'Sign out',
                        style: const TextStyle(color: Colors.red))),
                  ]));
              if (confirm == true && context.mounted) {
                await context.read<AuthState>().logout();
              }
            })),
      ]);
  }

  Widget _sec(String title, List<Widget> items) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.only(left: 4, bottom: 8),
        child: Text(title, style: TextStyle(
          color: _muted.withValues(alpha: 0.55), fontSize: 11,
          fontWeight: FontWeight.w700, letterSpacing: 1.2))),
      Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [_surface, _surface2]),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _border)),
        child: Column(
          children: items.asMap().entries.map((e) => Column(children: [
            e.value,
            if (e.key < items.length - 1)
              const Divider(height: 1, color: _border, indent: 56),
          ])).toList())),
    ]);

  Widget _tile(BuildContext ctx, IconData icon, Color iconColor,
    String title, String subtitle, VoidCallback onTap) =>
    ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(width: 34, height: 34,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(9)),
        child: Icon(icon, color: iconColor, size: 17)),
      title: Text(title, style: const TextStyle(color: _text,
        fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: const TextStyle(
        color: _muted, fontSize: 12)),
      trailing: Icon(Icons.arrow_forward_ios, size: 13,
        color: _muted.withValues(alpha: 0.3)));
}

// ══════════════════════════════════════════════════════════════
// PROCESSOR EDIT PROFILE — company-level, comprehensive
// ══════════════════════════════════════════════════════════════
class _ProcessorEditProfileScreen extends StatefulWidget {
  final bool isFr;
  const _ProcessorEditProfileScreen({required this.isFr});
  @override State<_ProcessorEditProfileScreen> createState() =>
    _ProcessorEditProfileScreenState();
}

class _ProcessorEditProfileScreenState
    extends State<_ProcessorEditProfileScreen> {
  late TextEditingController _companyCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _countryCtrl;
  late TextEditingController _regionCtrl;
  late TextEditingController _licenseCtrl;
  late TextEditingController _regNumCtrl;
  late TextEditingController _capacityCtrl;
  late TextEditingController _productsCtrl;
  late TextEditingController _equipCtrl;
  late TextEditingController _contactNameCtrl;
  late TextEditingController _contactTitleCtrl;
  late TextEditingController _addressCtrl;
  String _companyType = 'processor';
  final List<String> _certifications = [];
  bool _saving = false;

  final _availableCerts = [
    'ISO 9001', 'ISO 22000', 'Organic (EU)',
    'Fair Trade', 'HACCP', 'Halal', 'Kosher',
  ];

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthState>();
    _companyCtrl = TextEditingController(text: auth.displayName);
    _emailCtrl = TextEditingController(text: auth.displayEmail);
    _phoneCtrl = TextEditingController(text: auth.displayPhone);
    _countryCtrl = TextEditingController(text: auth.displayCountry);
    _regionCtrl = TextEditingController();
    _licenseCtrl = TextEditingController();
    _regNumCtrl = TextEditingController();
    _capacityCtrl = TextEditingController();
    _productsCtrl = TextEditingController();
    _equipCtrl = TextEditingController();
    _contactNameCtrl = TextEditingController();
    _contactTitleCtrl = TextEditingController();
    _addressCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _companyCtrl.dispose(); _emailCtrl.dispose(); _phoneCtrl.dispose();
    _countryCtrl.dispose(); _regionCtrl.dispose(); _licenseCtrl.dispose();
    _regNumCtrl.dispose(); _capacityCtrl.dispose(); _productsCtrl.dispose();
    _equipCtrl.dispose(); _contactNameCtrl.dispose();
    _contactTitleCtrl.dispose(); _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_companyCtrl.text.isEmpty || _emailCtrl.text.isEmpty ||
        _licenseCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Nom de l\'entreprise, email et numéro de licence sont requis'
          : 'Company name, email and license number are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _saving = true);
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Profil entreprise mis à jour !'
          : '✅ Company profile updated!'),
        backgroundColor: _amber));
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF2d1f00), elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          onPressed: () => Navigator.pop(context)),
        title: Text(isFr ? 'Profil de l\'entreprise' : 'Company Profile',
          style: const TextStyle(color: _text, fontSize: 17,
            fontWeight: FontWeight.w600))),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          16, 16, 16, SafeInsets.bottom(context, extra: 100)),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _amber.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _amber.withValues(alpha: 0.2))),
            child: Row(children: [
              const Icon(Icons.factory_outlined, color: _amber, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(
                isFr
                  ? 'Ce profil représente votre centre de traitement sur la plateforme. Il est visible par les coopératives, agriculteurs et acheteurs.'
                  : 'This profile represents your processing center on the platform. It is visible to cooperatives, farmers and buyers.',
                style: const TextStyle(color: _amber, fontSize: 11,
                  height: 1.4))),
            ])),
          const SizedBox(height: 16),
          _card(children: [
            _secLabel(isFr ? '🏭 Identité de l\'entreprise'
              : '🏭 Company Identity'),
            _lbl(isFr ? 'Nom de l\'entreprise *' : 'Company Name *'),
            _tf(_companyCtrl, isFr ? 'Ex: Sahel Butter Processing SARL'
              : 'e.g. Sahel Butter Processing LLC'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Type d\'entreprise' : 'Company Type'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              isDense: true,
              value: _companyType, dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _dec(''),
              items: [
                DropdownMenuItem(value: 'processor',
                  child: Text(isFr ? 'Transformateur' : 'Processor',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'exporter',
                  child: Text(isFr ? 'Exportateur' : 'Exporter',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'processor_exporter',
                  child: Text(isFr ? 'Transformateur-Exportateur'
                    : 'Processor-Exporter',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'industrial',
                  child: Text(isFr ? 'Industrie agroalimentaire'
                    : 'Food Industry',
                    style: const TextStyle(color: _text))),
              ],
              onChanged: (v) =>
                setState(() => _companyType = v ?? 'processor')),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Numéro de licence opérationnelle *'
              : 'Operating License Number *'),
            _tf(_licenseCtrl,
              isFr ? 'Numéro de licence officiel'
                   : 'Official license number'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Numéro d\'enregistrement commercial'
              : 'Commercial Registration Number'),
            _tf(_regNumCtrl,
              isFr ? 'RCCM ou équivalent' : 'RCCM or equivalent'),
            const SizedBox(height: 20),

            _secLabel(isFr ? '⚙️ Capacités de traitement'
              : '⚙️ Processing Capabilities'),
            _lbl(isFr ? 'Capacité journalière (tonnes/jour)'
              : 'Daily Capacity (tons/day)'),
            _tf(_capacityCtrl, isFr ? 'Ex: 10' : 'e.g. 10',
              type: TextInputType.number),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Produits transformés'
              : 'Products Processed'),
            _tf(_productsCtrl,
              isFr ? 'Ex: Beurre de karité, Huile sésame, Noix cajou'
                   : 'e.g. Shea butter, Sesame oil, Cashew nuts',
              maxLines: 2),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Équipements principaux' : 'Main Equipment'),
            _tf(_equipCtrl,
              isFr ? 'Ex: Presse hydraulique, extracteur, réfrigérateur'
                   : 'e.g. Hydraulic press, extractor, cold storage',
              maxLines: 2),
            const SizedBox(height: 16),

            _secLabel(isFr ? '📋 Certifications' : '📋 Certifications'),
            Text(isFr ? 'Sélectionnez vos certifications :'
              : 'Select your certifications:',
              style: const TextStyle(color: _muted, fontSize: 12)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8,
              children: _availableCerts.map((c) {
                final has = _certifications.contains(c);
                return GestureDetector(
                  onTap: () => setState(() {
                    if (has) _certifications.remove(c);
                    else _certifications.add(c);
                  }),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: has ? _amber.withValues(alpha: 0.2)
                        : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: has ? _amber : _border)),
                    child: Text(c, style: TextStyle(
                      color: has ? _amber : _muted,
                      fontSize: 12, fontWeight: has
                        ? FontWeight.w600 : FontWeight.w400))));
              }).toList()),
            const SizedBox(height: 20),

            _secLabel(isFr ? '📞 Contact & localisation'
              : '📞 Contact & Location'),
            _lbl(isFr ? 'Email professionnel *' : 'Business Email *'),
            _tf(_emailCtrl, 'contact@entreprise.com',
              type: TextInputType.emailAddress),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Téléphone' : 'Phone'),
            _tf(_phoneCtrl, '+223...',
              type: TextInputType.phone),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Adresse complète' : 'Full Address'),
            _tf(_addressCtrl,
              isFr ? 'Adresse, ville, pays'
                   : 'Address, city, country',
              maxLines: 2),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Pays' : 'Country'),
            _tf(_countryCtrl,
              isFr ? 'Ex: Mali, Sénégal, Burkina Faso'
                   : 'e.g. Mali, Senegal, Burkina Faso'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Région' : 'Region'),
            _tf(_regionCtrl,
              isFr ? 'Ex: Ségou, Koulikoro' : 'e.g. Segou, Koulikoro'),
            const SizedBox(height: 20),

            _secLabel(isFr ? '👤 Responsable principal'
              : '👤 Primary Contact Person'),
            _lbl(isFr ? 'Nom du responsable' : 'Contact Name'),
            _tf(_contactNameCtrl,
              isFr ? 'Prénom et nom' : 'First and last name'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Titre / Poste' : 'Title / Position'),
            _tf(_contactTitleCtrl,
              isFr ? 'Ex: Directeur, Gérant, Responsable production'
                   : 'e.g. Director, Manager, Production Lead'),
            const SizedBox(height: 20),
            _btn(isFr ? 'Enregistrer le profil' : 'Save Profile',
              _saving, _save, _amber),
          ]),
        ])));
  }
}

// ══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════
BoxDecoration _cardDeco() => BoxDecoration(
  gradient: const LinearGradient(colors: [_surface, _surface2]),
  borderRadius: BorderRadius.circular(16),
  border: Border.all(color: _border));

Widget _card({required List<Widget> children}) => Container(
  width: double.infinity, padding: const EdgeInsets.all(20),
  decoration: _cardDeco(),
  child: Column(crossAxisAlignment: CrossAxisAlignment.start,
    children: children));

Widget _secTitle(String t) => Text(t, style: const TextStyle(
  color: _text, fontSize: 17, fontWeight: FontWeight.w700));

Widget _secLabel(String t) => Padding(
  padding: const EdgeInsets.only(bottom: 12),
  child: Text(t, style: const TextStyle(color: _text, fontSize: 14,
    fontWeight: FontWeight.w700)));

Widget _lbl(String t) => Padding(
  padding: const EdgeInsets.only(bottom: 6),
  child: Text(t, style: const TextStyle(color: _muted, fontSize: 13,
    fontWeight: FontWeight.w600)));

Widget _tf(TextEditingController c, String hint,
  {TextInputType type = TextInputType.text, int maxLines = 1}) =>
  TextField(controller: c, keyboardType: type, maxLines: maxLines,
    style: const TextStyle(color: _text, fontSize: 14),
    decoration: InputDecoration(hintText: hint,
      hintStyle: const TextStyle(color: _muted, fontSize: 13),
      filled: true, fillColor: _bg,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(
          color: Colors.white.withValues(alpha: 0.15))),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(
          color: Colors.white.withValues(alpha: 0.15))),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _amber)),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 12, vertical: 12)));

InputDecoration _dec(String hint) => InputDecoration(hintText: hint,
  hintStyle: const TextStyle(color: _muted),
  filled: true, fillColor: _bg,
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
    borderSide: const BorderSide(color: _amber)),
  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12));

Widget _btn(String label, bool loading, VoidCallback onTap, Color col) =>
  SizedBox(width: double.infinity,
    child: ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: col,
        foregroundColor: col == _amber ? Colors.black : Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12))),
      onPressed: loading ? null : onTap,
      child: loading
        ? SizedBox(width: 20, height: 20,
            child: CircularProgressIndicator(
              color: col == _amber ? Colors.black : Colors.white,
              strokeWidth: 2))
        : Text(label, style: const TextStyle(
            fontWeight: FontWeight.bold, fontSize: 15))));

Widget _primaryBtn(String label, IconData icon, Color col,
  VoidCallback onTap) =>
  SizedBox(width: double.infinity,
    child: ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: col,
        foregroundColor: col == _amber ? Colors.black : Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12))),
      icon: Icon(icon),
      label: Text(label, style: const TextStyle(
        fontWeight: FontWeight.bold, fontSize: 15)),
      onPressed: onTap));

Widget _dateField(BuildContext context, String hint, DateTime? val,
  Function(DateTime) onPick) =>
  InkWell(
    onTap: () async {
      final d = await showDatePicker(
        context: context,
        initialDate: DateTime.now(),
        firstDate: DateTime.now(),
        lastDate: DateTime(2028),
        builder: (_, child) => Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: _amber, surface: _surface)),
          child: child!));
      if (d != null) onPick(d);
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: _bg, borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.15))),
      child: Row(children: [
        const Icon(Icons.calendar_today_outlined, color: _muted, size: 16),
        const SizedBox(width: 8),
        Text(val != null
          ? '${val.day}/${val.month}/${val.year}'
          : hint,
          style: TextStyle(
            color: val != null ? _text : _muted, fontSize: 14)),
      ])));

Widget _empty(IconData icon, String title, String subtitle) =>
  Container(
    padding: const EdgeInsets.all(24), decoration: _cardDeco(),
    child: Column(children: [
      Icon(icon, color: _muted, size: 48),
      const SizedBox(height: 12),
      Text(title, style: const TextStyle(color: _text, fontSize: 15,
        fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      Text(subtitle, textAlign: TextAlign.center,
        style: const TextStyle(color: _muted, fontSize: 12)),
    ]));

class _QA extends StatelessWidget {
  final String emoji, title, subtitle;
  final Color color;
  final VoidCallback onTap;
  const _QA({required this.emoji, required this.title,
    required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Container(width: 36, height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10)),
          child: Center(child: Text(emoji,
            style: const TextStyle(fontSize: 18)))),
        const Spacer(),
        Text(title, style: TextStyle(color: color, fontSize: 11,
          fontWeight: FontWeight.w700)),
        Text(subtitle, style: const TextStyle(color: _muted,
          fontSize: 9)),
      ]))).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1);
}
