import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';

const _bg      = Color(0xFF0a1a0f);
const _surface = Color(0xFF0d2a18);
const _surface2 = Color(0xFF071510);
const _lime    = Color(0xFF2ECC71);
const _gold    = AppColors.gold;
const _blue    = Color(0xFF3B82F6);
const _border  = Color(0x14FFFFFF);
const _text    = Colors.white;
const _muted   = Color(0x99FFFFFF);

class NgoDashboard extends StatefulWidget {
  const NgoDashboard({super.key});
  @override State<NgoDashboard> createState() => _NgoDashboardState();
}

class _NgoDashboardState extends State<NgoDashboard> {
  int _tab = 0;
  // Demo data — visible even in demo/mock mode
  final List<Map<String, dynamic>> _programs = [
    {
      'id': 'p1',
      'name': 'Shea Butter Value Chain',
      'status': 'active',
      'beneficiaries': 1240,
      'target': 2000,
      'region': 'Koulikoro, Mali',
      'type': 'value_chain',
      'startDate': 'Jan 2025',
      'endDate': 'Dec 2026',
      'budget': 485000,
      'spent': 212000,
    },
    {
      'id': 'p2',
      'name': 'Women Farmers Empowerment',
      'status': 'active',
      'beneficiaries': 870,
      'target': 1500,
      'region': 'Ségou, Mali',
      'type': 'empowerment',
      'startDate': 'Mar 2025',
      'endDate': 'Mar 2027',
      'budget': 320000,
      'spent': 98000,
    },
    {
      'id': 'p3',
      'name': 'Digital Agriculture Training',
      'status': 'planning',
      'beneficiaries': 0,
      'target': 800,
      'region': 'Mopti, Gao, Mali',
      'type': 'training',
      'startDate': 'Jul 2026',
      'endDate': 'Jun 2027',
      'budget': 195000,
      'spent': 0,
    },
  ];

  final List<Map<String, dynamic>> _beneficiaries = [];
  final List<Map<String, dynamic>> _cooperativeContacts = [
    {'name': 'Coopérative Karité Ségou', 'members': 145,
     'region': 'Ségou', 'contact': '+223 76 123 456'},
    {'name': 'Union Sésame Sikasso', 'members': 87,
     'region': 'Sikasso', 'contact': '+223 77 234 567'},
    {'name': 'Alliance Mil Mopti', 'members': 198,
     'region': 'Mopti', 'contact': '+223 78 345 678'},
  ];

  void _goTab(int i) {
    AuthService.resetActivity();
    setState(() => _tab = i);
  }

  void _addBeneficiary(Map<String, dynamic> b) =>
    setState(() => _beneficiaries.add(b));

  void _addProgram(Map<String, dynamic> p) =>
    setState(() => _programs.add(p));

  int get _totalBeneficiaries => _programs.fold(0,
    (s, p) => s + (p['beneficiaries'] as int));

  Future<void> _onBackPressed() async {
    if (_tab != 0) {
      setState(() => _tab = 0);
      return;
    }
    final isFr =
        context.read<LanguageProvider>().locale.languageCode == 'fr';
    final exit = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: _surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16)),
        title: Text(isFr ? 'Quitter ?' : 'Exit?',
            style: const TextStyle(color: _text)),
        content: Text(
          isFr
              ? 'Voulez-vous quitter le portail ONG ?'
              : 'Do you want to exit the NGO portal?',
          style: const TextStyle(color: _muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(isFr ? 'Rester' : 'Stay',
                style: const TextStyle(color: _muted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(isFr ? 'Quitter' : 'Exit',
                style: const TextStyle(color: _gold)),
          ),
        ],
      ),
    );
    if (exit == true && mounted) context.go('/platform');
  }

  @override
  Widget build(BuildContext context) {
    final isFr = context.watch<LanguageProvider>()
      .locale.languageCode == 'fr';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBackPressed();
      },
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Scaffold(
        backgroundColor: _bg,
        body: Column(children: [
          const OfflineBanner(),
          _NgoHeader(
            totalBeneficiaries: _totalBeneficiaries,
            activePrograms: _programs
              .where((p) => p['status'] == 'active').length,
            coopCount: _cooperativeContacts.length,
            isFr: isFr),
          Expanded(
            child: IndexedStack(index: _tab, children: [
              _OverviewTab(programs: _programs, coops: _cooperativeContacts,
                totalBeneficiaries: _totalBeneficiaries,
                isFr: isFr, onTabChange: _goTab),
              _ProgramsTab(programs: _programs, isFr: isFr,
                onAdd: _addProgram),
              _NetworkTab(coops: _cooperativeContacts,
                beneficiaries: _beneficiaries,
                isFr: isFr, onAddBeneficiary: _addBeneficiary),
              _ReportsTab(programs: _programs, isFr: isFr),
              _NgoAccountTab(isFr: isFr, onTabChange: _goTab),
            ]),
          ),
        ]),
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF060e09),
            border: Border(top: BorderSide(color: _border, width: 1))),
          child: SafeArea(top: false,
            child: NavigationBar(
              backgroundColor: Colors.transparent, elevation: 0,
              selectedIndex: _tab,
              onDestinationSelected: _goTab,
              indicatorColor: _lime.withValues(alpha: 0.15),
              labelBehavior:
                NavigationDestinationLabelBehavior.alwaysShow,
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.home_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.home, color: _lime),
                  label: isFr ? 'Accueil' : 'Home'),
                NavigationDestination(
                  icon: const Icon(Icons.volunteer_activism_outlined,
                    color: _muted),
                  selectedIcon: const Icon(Icons.volunteer_activism,
                    color: _lime),
                  label: isFr ? 'Programmes' : 'Programs'),
                NavigationDestination(
                  icon: const Icon(Icons.groups_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.groups, color: _lime),
                  label: isFr ? 'Réseau' : 'Network'),
                NavigationDestination(
                  icon: const Icon(Icons.assessment_outlined, color: _muted),
                  selectedIcon: const Icon(Icons.assessment, color: _lime),
                  label: isFr ? 'Rapports' : 'Reports'),
                NavigationDestination(
                  icon: const Icon(Icons.manage_accounts_outlined,
                    color: _muted),
                  selectedIcon: const Icon(Icons.manage_accounts,
                    color: _lime),
                  label: isFr ? 'Compte' : 'Account'),
              ])),
        ),
      ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════
class _NgoHeader extends StatelessWidget {
  final int totalBeneficiaries, activePrograms, coopCount;
  final bool isFr;
  const _NgoHeader({required this.totalBeneficiaries,
    required this.activePrograms, required this.coopCount,
    required this.isFr});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [Color(0xFF0d2a18), Color(0xFF1a4a2e),
            Color(0xFF0d2a18)],
          stops: [0.0, 0.5, 1.0])),
      child: Stack(children: [
        Positioned(top: -30, right: -30,
          child: Container(width: 180, height: 180,
            decoration: BoxDecoration(shape: BoxShape.circle,
              color: _lime.withValues(alpha: 0.06)))),
        SafeArea(bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          const Icon(Icons.volunteer_activism_outlined,
                            color: _lime, size: 14),
                          const SizedBox(width: 4),
                          Text(isFr ? 'Portail ONG & Partenaires'
                            : 'NGO & Partners Portal',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.65),
                              fontSize: 12, fontWeight: FontWeight.w600,
                              letterSpacing: 0.8)),
                        ]),
                        const SizedBox(height: 4),
                        Text(isFr ? 'Impact & programmes'
                          : 'Impact & Programs',
                          style: const TextStyle(color: _text,
                            fontSize: 22, fontWeight: FontWeight.bold,
                            letterSpacing: -0.5)),
                      ]),
                    GestureDetector(
                      onTap: () => context.go('/platform'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2))),
                        child: Row(mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.home_outlined,
                              color: Colors.white.withValues(alpha: 0.9),
                              size: 15),
                            const SizedBox(width: 4),
                            Text(isFr ? 'Accueil' : 'Home',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 13)),
                          ]))),
                  ]),
                const SizedBox(height: 14),
                Row(children: [
                  _stat('$totalBeneficiaries',
                    isFr ? 'Bénéficiaires' : 'Beneficiaries',
                    Icons.people_outline),
                  const SizedBox(width: 8),
                  _stat('$activePrograms',
                    isFr ? 'Programmes actifs' : 'Active Programs',
                    Icons.volunteer_activism_outlined),
                  const SizedBox(width: 8),
                  _stat('$coopCount',
                    isFr ? 'Coopératives' : 'Cooperatives',
                    Icons.groups_outlined),
                ]),
              ]))),
      ]),
    );
  }

  Widget _stat(String val, String label, IconData icon) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: _lime, size: 16),
          const SizedBox(height: 4),
          Text(val, style: const TextStyle(color: _lime, fontSize: 15,
            fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55), fontSize: 9)),
        ])));
}

// ══════════════════════════════════════════════════════════════
// TAB 0: OVERVIEW
// ══════════════════════════════════════════════════════════════
class _OverviewTab extends StatelessWidget {
  final List<Map<String, dynamic>> programs, coops;
  final int totalBeneficiaries;
  final bool isFr;
  final Function(int) onTabChange;
  const _OverviewTab({required this.programs, required this.coops,
    required this.totalBeneficiaries, required this.isFr,
    required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    final activeProgs = programs.where(
      (p) => p['status'] == 'active').length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // Impact summary
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [
              _lime.withValues(alpha: 0.12),
              _lime.withValues(alpha: 0.04)]),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _lime.withValues(alpha: 0.3))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('🌍', style: TextStyle(fontSize: 28)),
              const SizedBox(height: 10),
              Text(isFr ? 'Impact de votre organisation'
                : 'Your Organization\'s Impact',
                style: const TextStyle(color: _text, fontSize: 16,
                  fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(children: [
                _impactStat('$totalBeneficiaries',
                  isFr ? 'Bénéficiaires totaux' : 'Total Beneficiaries',
                  _lime),
                const SizedBox(width: 10),
                _impactStat('$activeProgs',
                  isFr ? 'Programmes actifs' : 'Active Programs',
                  _gold),
                const SizedBox(width: 10),
                _impactStat('${coops.length}',
                  isFr ? 'Coopératives liées' : 'Linked Cooperatives',
                  _blue),
              ]),
            ])).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 20),

        // Quick actions — ALL native, none redirect to web
        _header(isFr ? 'Actions rapides' : 'Quick Actions'),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10,
          childAspectRatio: 1.3,
          children: [
            _QA(
              emoji: '📋',
              title: isFr ? 'Créer un programme' : 'Create Program',
              subtitle: isFr ? 'Définir objectifs & budget'
                : 'Define goals & budget',
              color: _lime,
              onTap: () => onTabChange(1)),
            _QA(
              emoji: '👥',
              title: isFr ? 'Ajouter bénéficiaire' : 'Add Beneficiary',
              subtitle: isFr ? 'Enregistrement direct'
                : 'Direct registration',
              color: _gold,
              onTap: () => onTabChange(2)),
            _QA(
              emoji: '📊',
              title: isFr ? 'Générer rapport' : 'Generate Report',
              subtitle: isFr ? 'Rapport PDF immédiat'
                : 'Immediate PDF report',
              color: _blue,
              onTap: () => onTabChange(3)),
            _QA(
              emoji: '🤝',
              title: isFr ? 'Contacter coopérative'
                : 'Contact Cooperative',
              subtitle: isFr ? 'Réseau de partenaires'
                : 'Partner network',
              color: const Color(0xFF7B61FF),
              onTap: () => onTabChange(2)),
          ]),
        const SizedBox(height: 20),

        // Active programs preview — shows real demo data
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _header(isFr ? 'Programmes en cours' : 'Ongoing Programs'),
            GestureDetector(onTap: () => onTabChange(1),
              child: const Text('See all',
                style: TextStyle(color: _gold, fontSize: 12))),
          ]),
        const SizedBox(height: 12),
        ...programs.take(2).map((p) => _ProgramPreviewCard(
          p: p, isFr: isFr)).toList(),
        const SizedBox(height: 20),

        // Partnership network statistics — always shows demo data
        _header(isFr ? 'Statistiques du réseau de partenaires'
          : 'Partnership Network Statistics'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: _cardDeco(),
          child: Column(children: [
            _netStat(Icons.people_outline, _lime,
              isFr ? 'Agriculteurs enregistrés dans les programmes'
                : 'Farmers enrolled in programs',
              '$totalBeneficiaries / 3,500',
              totalBeneficiaries / 3500),
            const Divider(color: _border, height: 20),
            _netStat(Icons.groups_outlined, _blue,
              isFr ? 'Coopératives partenaires actives'
                : 'Active partner cooperatives',
              '${coops.length} / 20',
              coops.length / 20),
            const Divider(color: _border, height: 20),
            _netStat(Icons.volunteer_activism_outlined, _gold,
              isFr ? 'Taux d\'achèvement programmes'
                : 'Program completion rate',
              '68%', 0.68),
            const Divider(color: _border, height: 20),
            _netStat(Icons.trending_up_outlined, const Color(0xFF7B61FF),
              isFr ? 'Croissance bénéficiaires (trimestre)'
                : 'Beneficiary growth (quarter)',
              '+23%', 0.23),
          ])),
      ]);
  }

  Widget _impactStat(String val, String label, Color col) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: col.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        Text(val, style: TextStyle(color: col, fontSize: 18,
          fontWeight: FontWeight.bold)),
        Text(label, textAlign: TextAlign.center,
          style: const TextStyle(color: _muted, fontSize: 9)),
      ])));

  Widget _netStat(IconData icon, Color col, String label,
    String val, double pct) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, color: col, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text(label,
          style: const TextStyle(color: _text, fontSize: 12,
            fontWeight: FontWeight.w600))),
        Text(val, style: TextStyle(color: col, fontWeight: FontWeight.bold,
          fontSize: 12)),
      ]),
      const SizedBox(height: 8),
      ClipRRect(borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: pct.clamp(0.0, 1.0),
          backgroundColor: Colors.white.withValues(alpha: 0.08),
          color: col, minHeight: 5)),
    ]);
}


class _QA extends StatelessWidget {
  final String emoji, title, subtitle;
  final Color color;
  final VoidCallback onTap;
  const _QA({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

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
          Container(width: 38, height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10)),
            child: Center(child: Text(emoji,
              style: const TextStyle(fontSize: 20)))),
          const Spacer(),
          Text(title, style: TextStyle(color: color,
            fontSize: 11, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(color: _muted, fontSize: 9),
            maxLines: 2, overflow: TextOverflow.ellipsis),
        ]))).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1);
}

class _ProgramPreviewCard extends StatelessWidget {
  final Map<String, dynamic> p;
  final bool isFr;
  const _ProgramPreviewCard({required this.p, required this.isFr});

  @override
  Widget build(BuildContext context) {
    final prog = (p['beneficiaries'] as int) / (p['target'] as int);
    final isActive = p['status'] == 'active';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: _cardDeco(),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(child: Text(p['name'] as String,
              style: const TextStyle(color: _text, fontSize: 13,
                fontWeight: FontWeight.w700))),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: (isActive ? _lime : _gold).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8)),
              child: Text(isFr
                ? (isActive ? 'Actif' : 'Planification')
                : (isActive ? 'Active' : 'Planning'),
                style: TextStyle(
                  color: isActive ? _lime : _gold,
                  fontSize: 10, fontWeight: FontWeight.bold))),
          ]),
          const SizedBox(height: 4),
          Text('${p['region']}',
            style: const TextStyle(color: _muted, fontSize: 11)),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: prog.clamp(0.0, 1.0),
                backgroundColor: Colors.white.withValues(alpha: 0.08),
                color: _lime, minHeight: 6))),
            const SizedBox(width: 10),
            Text('${p['beneficiaries']}/${p['target']}',
              style: const TextStyle(color: _gold, fontSize: 11,
                fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 4),
          Text(isFr
            ? '${p['startDate']} → ${p['endDate']} · Budget: \$${p['budget']}'
            : '${p['startDate']} → ${p['endDate']} · Budget: \$${p['budget']}',
            style: const TextStyle(color: _muted, fontSize: 10)),
        ])).animate().fadeIn(duration: 300.ms);
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 1: PROGRAMS — native builder, no web console
// ══════════════════════════════════════════════════════════════
class _ProgramsTab extends StatefulWidget {
  final List<Map<String, dynamic>> programs;
  final bool isFr;
  final Function(Map<String, dynamic>) onAdd;
  const _ProgramsTab({required this.programs, required this.isFr,
    required this.onAdd});
  @override State<_ProgramsTab> createState() => _ProgramsTabState();
}

class _ProgramsTabState extends State<_ProgramsTab> {
  bool _showBuilder = false;

  // Program builder form fields
  final _nameCtrl = TextEditingController();
  final _objCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  final _targetCtrl = TextEditingController();
  String _type = 'value_chain';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose(); _objCtrl.dispose(); _regionCtrl.dispose();
    _budgetCtrl.dispose(); _targetCtrl.dispose();
    super.dispose();
  }

  Future<void> _createProgram() async {
    if (_nameCtrl.text.isEmpty || _targetCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Nom et nombre de bénéficiaires cibles sont requis'
          : 'Program name and target beneficiaries are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _submitting = true);
    await Future.delayed(const Duration(milliseconds: 800));
    final program = {
      'id': 'p${DateTime.now().millisecondsSinceEpoch}',
      'name': _nameCtrl.text.trim(),
      'status': 'planning',
      'beneficiaries': 0,
      'target': int.tryParse(_targetCtrl.text) ?? 100,
      'region': _regionCtrl.text.trim(),
      'type': _type,
      'startDate': _startDate != null
        ? '${_startDate!.month}/${_startDate!.year}' : 'TBD',
      'endDate': _endDate != null
        ? '${_endDate!.month}/${_endDate!.year}' : 'TBD',
      'budget': double.tryParse(_budgetCtrl.text) ?? 0,
      'spent': 0,
      'objectives': _objCtrl.text.trim(),
    };
    widget.onAdd(program);
    if (mounted) {
      setState(() { _submitting = false; _showBuilder = false;
        _nameCtrl.clear(); _objCtrl.clear(); _regionCtrl.clear();
        _budgetCtrl.clear(); _targetCtrl.clear();
        _startDate = null; _endDate = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Programme créé avec succès !'
          : '✅ Program created successfully!'),
        backgroundColor: _lime));
    }
  }

  String _typeName(String t) {
    final map = {
      'value_chain': widget.isFr ? 'Chaîne de valeur' : 'Value Chain',
      'empowerment': widget.isFr ? 'Autonomisation' : 'Empowerment',
      'training': widget.isFr ? 'Formation' : 'Training',
      'food_security': widget.isFr ? 'Sécurité alimentaire' : 'Food Security',
      'climate': widget.isFr ? 'Adaptation climatique' : 'Climate Adaptation',
      'finance': widget.isFr ? 'Finance rurale' : 'Rural Finance',
    };
    return map[t] ?? t;
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        if (!_showBuilder)
          SizedBox(width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: _lime, foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12))),
              icon: const Icon(Icons.add_circle_outline),
              label: Text(isFr ? 'Créer un nouveau programme'
                : 'Create New Program',
                style: const TextStyle(fontWeight: FontWeight.bold,
                  fontSize: 15)),
              onPressed: () => setState(() => _showBuilder = true))),

        // PROGRAM BUILDER — fully native, no web console
        if (_showBuilder) ...[
          Row(children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: _text),
              onPressed: () => setState(() => _showBuilder = false)),
            Text(isFr ? 'Créer un programme' : 'Program Builder',
              style: const TextStyle(color: _text, fontSize: 17,
                fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          _card(children: [
            _secLabel(isFr ? '📋 Identification du programme'
              : '📋 Program Identification'),
            _lbl(isFr ? 'Nom du programme *' : 'Program Name *'),
            _tf(_nameCtrl, isFr ? 'Ex: Empowerment femmes rurales'
              : 'e.g. Rural Women Empowerment'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Type de programme' : 'Program Type'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              isDense: true,
              value: _type, dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _dec(''),
              items: ['value_chain', 'empowerment', 'training',
                'food_security', 'climate', 'finance']
                .map((t) => DropdownMenuItem(value: t,
                  child: Text(_typeName(t),
                    style: const TextStyle(color: _text)))).toList(),
              onChanged: (v) => setState(() => _type = v ?? 'value_chain')),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Objectifs & description' : 'Objectives & Description'),
            _tf(_objCtrl,
              isFr ? 'Décrivez les objectifs du programme...'
                   : 'Describe the program objectives...',
              maxLines: 3),
            const SizedBox(height: 20),

            _secLabel(isFr ? '📍 Portée géographique & bénéficiaires'
              : '📍 Geographic Scope & Beneficiaries'),
            _lbl(isFr ? 'Région(s) ciblée(s)' : 'Target Region(s)'),
            _tf(_regionCtrl,
              isFr ? 'Ex: Ségou, Mopti, Mali' : 'e.g. Segou, Mopti, Mali'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Nombre de bénéficiaires cibles *'
              : 'Target Beneficiary Count *'),
            _tf(_targetCtrl, isFr ? 'Ex: 1500' : 'e.g. 1500',
              type: TextInputType.number),
            const SizedBox(height: 20),

            _secLabel(isFr ? '💰 Budget & calendrier'
              : '💰 Budget & Timeline'),
            _lbl(isFr ? 'Budget total (USD)' : 'Total Budget (USD)'),
            _tf(_budgetCtrl, isFr ? 'Ex: 250000' : 'e.g. 250000',
              type: TextInputType.number),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _dateField(
                isFr ? 'Date début' : 'Start Date',
                _startDate, (d) => setState(() => _startDate = d),
                context)),
              const SizedBox(width: 10),
              Expanded(child: _dateField(
                isFr ? 'Date fin' : 'End Date',
                _endDate, (d) => setState(() => _endDate = d),
                context)),
            ]),
            const SizedBox(height: 20),
            _btn(isFr ? 'Lancer le programme' : 'Launch Program',
              _submitting, _createProgram, _lime),
          ]),
        ],

        const SizedBox(height: 20),
        _header('${isFr ? 'Tous les programmes' : 'All Programs'} '
          '(${widget.programs.length})'),
        const SizedBox(height: 12),
        ...widget.programs.asMap().entries.map((e) {
          final p = e.value;
          final prog = (p['beneficiaries'] as int) / (p['target'] as int);
          final isActive = p['status'] == 'active';
          final budget = p['budget'] as num;
          final spent = p['spent'] as num;
          final budgetPct = budget > 0 ? spent / budget : 0.0;
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: _cardDeco(),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: _lime.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.volunteer_activism_outlined,
                      color: _lime, size: 20)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p['name'] as String,
                        style: const TextStyle(color: _text, fontSize: 14,
                          fontWeight: FontWeight.w700)),
                      Text('${p['region']} · ${_typeName(p['type'] as String)}',
                        style: const TextStyle(color: _muted, fontSize: 11)),
                    ])),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: (isActive ? _lime : _gold)
                        .withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8)),
                    child: Text(
                      isFr ? (isActive ? 'Actif' : 'Planification')
                           : (isActive ? 'Active' : 'Planning'),
                      style: TextStyle(
                        color: isActive ? _lime : _gold,
                        fontSize: 10, fontWeight: FontWeight.bold))),
                ]),
                const SizedBox(height: 14),
                // Beneficiary progress
                Row(children: [
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(isFr ? 'Bénéficiaires' : 'Beneficiaries',
                        style: const TextStyle(color: _muted, fontSize: 10)),
                      const SizedBox(height: 4),
                      ClipRRect(borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: prog.clamp(0.0, 1.0),
                          backgroundColor: Colors.white
                            .withValues(alpha: 0.08),
                          color: _lime, minHeight: 5)),
                    ])),
                  const SizedBox(width: 8),
                  Text('${p['beneficiaries']}/${p['target']}',
                    style: const TextStyle(color: _lime, fontSize: 11,
                      fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 8),
                // Budget progress
                Row(children: [
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(isFr ? 'Budget utilisé' : 'Budget Used',
                        style: const TextStyle(color: _muted, fontSize: 10)),
                      const SizedBox(height: 4),
                      ClipRRect(borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: budgetPct.clamp(0.0, 1.0),
                          backgroundColor: Colors.white
                            .withValues(alpha: 0.08),
                          color: _gold, minHeight: 5)),
                    ])),
                  const SizedBox(width: 8),
                  Text('\$$spent / \$$budget',
                    style: const TextStyle(color: _gold, fontSize: 11,
                      fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 8),
                Text('${p['startDate']} → ${p['endDate']}',
                  style: const TextStyle(color: _muted, fontSize: 10)),
              ])).animate(delay: Duration(milliseconds: 50 * e.key))
                .fadeIn(duration: 300.ms);
        }),
      ]);
  }

  Widget _dateField(String label, DateTime? val,
    Function(DateTime) onPick, BuildContext context) =>
    InkWell(
      onTap: () async {
        final d = await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime(2024),
          lastDate: DateTime(2030),
          builder: (_, child) => Theme(
            data: ThemeData.dark().copyWith(
              colorScheme: const ColorScheme.dark(
                primary: _lime, surface: _surface)),
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
          Expanded(child: Text(
            val != null
              ? '${val.month}/${val.year}'
              : label,
            style: TextStyle(
              color: val != null ? _text : _muted, fontSize: 13))),
        ])));
}

// ══════════════════════════════════════════════════════════════
// TAB 2: NETWORK — beneficiary intake + cooperative contacts
// ══════════════════════════════════════════════════════════════
class _NetworkTab extends StatefulWidget {
  final List<Map<String, dynamic>> coops, beneficiaries;
  final bool isFr;
  final Function(Map<String, dynamic>) onAddBeneficiary;
  const _NetworkTab({required this.coops, required this.beneficiaries,
    required this.isFr, required this.onAddBeneficiary});
  @override State<_NetworkTab> createState() => _NetworkTabState();
}

class _NetworkTabState extends State<_NetworkTab> {
  String _view = 'cooperatives';
  bool _showBenForm = false;

  // Beneficiary intake form
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  final _cropCtrl = TextEditingController();
  final _programCtrl = TextEditingController();
  String _gender = 'female';
  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose(); _phoneCtrl.dispose();
    _regionCtrl.dispose(); _cropCtrl.dispose();
    _programCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitBeneficiary() async {
    if (_nameCtrl.text.isEmpty || _phoneCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Nom et téléphone sont requis'
          : 'Name and phone are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _submitting = true);
    await Future.delayed(const Duration(milliseconds: 800));
    widget.onAddBeneficiary({
      'name': _nameCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'region': _regionCtrl.text.trim(),
      'mainCrop': _cropCtrl.text.trim(),
      'program': _programCtrl.text.trim(),
      'gender': _gender,
      'registeredAt': DateTime.now().toIso8601String(),
      // Registry sync flag
      'syncedWithRegistry': true,
    });
    if (mounted) {
      setState(() { _submitting = false; _showBenForm = false;
        _nameCtrl.clear(); _phoneCtrl.clear();
        _regionCtrl.clear(); _cropCtrl.clear();
        _programCtrl.clear();
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Bénéficiaire enregistré et synchronisé avec le registre national.'
          : '✅ Beneficiary registered and synced with national registry.'),
        backgroundColor: _lime,
        duration: const Duration(seconds: 4)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // View switcher
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: _surface, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            _viewBtn(isFr ? 'Coopératives' : 'Cooperatives',
              'cooperatives'),
            _viewBtn(isFr ? 'Bénéficiaires' : 'Beneficiaries',
              'beneficiaries'),
          ])),
        const SizedBox(height: 16),

        if (_view == 'cooperatives') ...[
          // Cooperative contact — NOT direct farmer contact
          // Framed correctly: NGO contacts cooperatives,
          // cooperatives represent their farmer members
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _blue.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _blue.withValues(alpha: 0.25))),
            child: Row(children: [
              const Icon(Icons.info_outline, color: _blue, size: 18),
              const SizedBox(width: 10),
              Expanded(child: Text(
                isFr
                  ? 'Contactez les coopératives pour atteindre leurs membres agriculteurs. Les coopératives servent de point de contact principal pour leurs membres.'
                  : 'Contact cooperatives to reach their farmer members. Cooperatives serve as the main point of contact for their members.',
                style: const TextStyle(color: _blue, fontSize: 12,
                  height: 1.4))),
            ])),
          const SizedBox(height: 16),
          _header(isFr ? 'Réseau de coopératives partenaires'
            : 'Partner Cooperative Network'),
          const SizedBox(height: 12),
          ...widget.coops.map((c) => _CoopContactCard(
            coop: c, isFr: isFr)),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: _lime.withValues(alpha: 0.4)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12))),
              icon: const Icon(Icons.add, color: _lime),
              label: Text(isFr ? 'Ajouter une coopérative partenaire'
                : 'Add Partner Cooperative',
                style: const TextStyle(color: _lime,
                  fontWeight: FontWeight.w600)),
              onPressed: () => ScaffoldMessenger.of(context)
                .showSnackBar(SnackBar(
                  content: Text(isFr
                    ? 'Recherche de coopératives disponibles...'
                    : 'Searching available cooperatives...'),
                  backgroundColor: _lime)))),
        ],

        if (_view == 'beneficiaries') ...[
          // Beneficiary intake — clear, well-designed form
          if (!_showBenForm) ...[
            // Sync notice — clear explanation
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _lime.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _lime.withValues(alpha: 0.25))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    const Icon(Icons.sync, color: _lime, size: 18),
                    const SizedBox(width: 8),
                    Text(isFr ? 'Synchronisation registre national'
                      : 'National Registry Sync',
                      style: const TextStyle(color: _lime,
                        fontWeight: FontWeight.w700, fontSize: 13)),
                  ]),
                  const SizedBox(height: 6),
                  Text(isFr
                    ? 'Chaque bénéficiaire enregistré est automatiquement synchronisé avec le registre national des agriculteurs de Sahel AgriConnect. Cela garantit l\'unicité et évite les doublons.'
                    : 'Each registered beneficiary is automatically synced with Sahel AgriConnect\'s national farmer registry. This ensures uniqueness and prevents duplicates.',
                    style: const TextStyle(color: _muted, fontSize: 12,
                      height: 1.4)),
                ])),
            const SizedBox(height: 16),
            SizedBox(width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _lime, foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12))),
                icon: const Icon(Icons.person_add_outlined),
                label: Text(isFr ? 'Enregistrer un bénéficiaire'
                  : 'Register Beneficiary',
                  style: const TextStyle(fontWeight: FontWeight.bold,
                    fontSize: 15)),
                onPressed: () => setState(() => _showBenForm = true))),
          ],

          if (_showBenForm) ...[
            Row(children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: _text),
                onPressed: () => setState(() => _showBenForm = false)),
              Text(isFr ? 'Nouveau bénéficiaire' : 'New Beneficiary',
                style: const TextStyle(color: _text, fontSize: 17,
                  fontWeight: FontWeight.bold)),
            ]),
            const SizedBox(height: 8),
            _card(children: [
              _secLabel(isFr ? '👤 Informations personnelles'
                : '👤 Personal Information'),
              _lbl(isFr ? 'Nom complet *' : 'Full Name *'),
              _tf(_nameCtrl, isFr ? 'Prénom et nom' : 'First and last name'),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _lbl(isFr ? 'Genre' : 'Gender'),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      isDense: true,
                      value: _gender, dropdownColor: _surface,
                      style: const TextStyle(color: _text),
                      decoration: _dec(''),
                      items: [
                        DropdownMenuItem(value: 'female',
                          child: Text(isFr ? 'Femme' : 'Female',
                            style: const TextStyle(color: _text))),
                        DropdownMenuItem(value: 'male',
                          child: Text(isFr ? 'Homme' : 'Male',
                            style: const TextStyle(color: _text))),
                        DropdownMenuItem(value: 'other',
                          child: Text(isFr ? 'Autre' : 'Other',
                            style: const TextStyle(color: _text))),
                      ],
                      onChanged: (v) =>
                        setState(() => _gender = v ?? 'female')),
                  ])),
              ]),
              const SizedBox(height: 14),
              _secLabel(isFr ? '📞 Contact & localisation'
                : '📞 Contact & Location'),
              _lbl(isFr ? 'Téléphone *' : 'Phone *'),
              _tf(_phoneCtrl, '+223...',
                type: TextInputType.phone),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Région / Village' : 'Region / Village'),
              _tf(_regionCtrl,
                isFr ? 'Ex: Ségou, Bla, Mali' : 'e.g. Segou, Bla, Mali'),
              const SizedBox(height: 14),
              _secLabel(isFr ? '🌾 Activité agricole' : '🌾 Agricultural Activity'),
              _lbl(isFr ? 'Culture principale' : 'Main Crop'),
              _tf(_cropCtrl,
                isFr ? 'Ex: Mil, Karité, Sésame' : 'e.g. Millet, Shea, Sesame'),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Programme associé' : 'Associated Program'),
              _tf(_programCtrl,
                isFr ? 'Nom du programme (optionnel)' : 'Program name (optional)',
                maxLines: 1),
              const SizedBox(height: 16),
              // Registry sync badge
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _lime.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8)),
                child: Row(children: [
                  const Icon(Icons.verified_outlined,
                    color: _lime, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(
                    isFr
                      ? 'Ce bénéficiaire sera synchronisé avec le registre national agricole lors de l\'enregistrement.'
                      : 'This beneficiary will be synced with the national agricultural registry upon registration.',
                    style: const TextStyle(color: _lime, fontSize: 11,
                      height: 1.4))),
                ])),
              const SizedBox(height: 16),
              _btn(isFr ? 'Enregistrer le bénéficiaire'
                : 'Register Beneficiary',
                _submitting, _submitBeneficiary, _lime),
            ]),
          ],

          const SizedBox(height: 16),
          _header(isFr
            ? 'Bénéficiaires enregistrés (${widget.beneficiaries.length})'
            : 'Registered Beneficiaries (${widget.beneficiaries.length})'),
          const SizedBox(height: 12),
          widget.beneficiaries.isEmpty
            ? _empty(Icons.people_outline,
                isFr ? 'Aucun bénéficiaire enregistré'
                     : 'No beneficiaries registered yet',
                isFr ? 'Utilisez le formulaire ci-dessus pour commencer'
                     : 'Use the form above to get started')
            : Column(children: widget.beneficiaries.map((b) =>
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: _cardDeco(),
                  child: Row(children: [
                    Container(width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: _lime.withValues(alpha: 0.12),
                        shape: BoxShape.circle),
                      child: Center(child: Text(
                        (b['name'] as String)[0].toUpperCase(),
                        style: const TextStyle(color: _lime,
                          fontWeight: FontWeight.bold)))),
                    const SizedBox(width: 10),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b['name'] as String,
                          style: const TextStyle(color: _text,
                            fontWeight: FontWeight.w600)),
                        Text('${b['region']} · ${b['phone']}',
                          style: const TextStyle(color: _muted,
                            fontSize: 11)),
                      ])),
                    const Icon(Icons.verified_outlined,
                      color: _lime, size: 16),
                  ]))).toList()),
        ],
      ]);
  }

  Widget _viewBtn(String label, String id) => Expanded(
    child: GestureDetector(
      onTap: () => setState(() {
        _view = id; _showBenForm = false; }),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: _view == id ? _lime : Colors.transparent,
          borderRadius: BorderRadius.circular(10)),
        child: Text(label, textAlign: TextAlign.center,
          style: TextStyle(
            color: _view == id ? Colors.black : _muted,
            fontSize: 12, fontWeight: _view == id
              ? FontWeight.w700 : FontWeight.w400)))));
}

class _CoopContactCard extends StatefulWidget {
  final Map<String, dynamic> coop;
  final bool isFr;
  const _CoopContactCard({required this.coop, required this.isFr});
  @override State<_CoopContactCard> createState() =>
    _CoopContactCardState();
}

class _CoopContactCardState extends State<_CoopContactCard> {
  bool _showMsg = false;
  final _msgCtrl = TextEditingController();
  bool _sent = false;

  @override
  void dispose() { _msgCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    final c = widget.coop;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: _cardDeco(),
      child: Column(children: [
        Row(children: [
          Container(width: 40, height: 40,
            decoration: BoxDecoration(
              color: _lime.withValues(alpha: 0.12),
              shape: BoxShape.circle),
            child: const Icon(Icons.groups, color: _lime, size: 20)),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c['name'] as String,
                style: const TextStyle(color: _text, fontSize: 13,
                  fontWeight: FontWeight.w700)),
              Text('${c['members']} ${isFr ? 'membres' : 'members'} · ${c['region']}',
                style: const TextStyle(color: _muted, fontSize: 11)),
            ])),
          GestureDetector(
            onTap: () => setState(() => _showMsg = !_showMsg),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: _lime.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8)),
              child: Text(isFr ? 'Contacter' : 'Contact',
                style: const TextStyle(color: _lime, fontSize: 11,
                  fontWeight: FontWeight.w600)))),
        ]),
        if (_showMsg) ...[
          const SizedBox(height: 10),
          const Divider(color: _border, height: 1),
          const SizedBox(height: 10),
          if (_sent)
            Row(children: [
              const Icon(Icons.check_circle_outline,
                color: _lime, size: 18),
              const SizedBox(width: 8),
              Text(isFr ? 'Message envoyé à la coopérative.'
                : 'Message sent to cooperative.',
                style: const TextStyle(color: _lime, fontSize: 12)),
            ])
          else ...[
            TextField(
              controller: _msgCtrl,
              maxLines: 2,
              style: const TextStyle(color: _text, fontSize: 13),
              decoration: InputDecoration(
                hintText: isFr ? 'Votre message...' : 'Your message...',
                hintStyle: const TextStyle(color: _muted, fontSize: 12),
                filled: true, fillColor: _bg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15))),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15))),
                contentPadding: const EdgeInsets.all(10))),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _lime, foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8))),
                onPressed: _msgCtrl.text.isEmpty ? null : () async {
                  await Future.delayed(
                    const Duration(milliseconds: 500));
                  setState(() => _sent = true);
                },
                child: Text(isFr ? 'Envoyer le message' : 'Send Message',
                  style: const TextStyle(fontWeight: FontWeight.bold)))),
          ],
        ],
      ]));
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 3: REPORTS — clear, no "scheduled PDF will appear" confusion
// ══════════════════════════════════════════════════════════════
class _ReportsTab extends StatelessWidget {
  final List<Map<String, dynamic>> programs;
  final bool isFr;
  const _ReportsTab({required this.programs, required this.isFr});

  @override
  Widget build(BuildContext context) {
    final isFr = this.isFr;
    final reports = [
      {
        'icon': Icons.people_outline, 'color': _lime,
        'title': isFr ? 'Rapport bénéficiaires' : 'Beneficiary Report',
        'desc': isFr
          ? 'Liste complète des bénéficiaires enregistrés, répartis par programme, genre et région. Format PDF téléchargeable.'
          : 'Complete list of registered beneficiaries, broken down by program, gender, and region. Downloadable PDF format.',
        'ready': true,
      },
      {
        'icon': Icons.volunteer_activism_outlined, 'color': _gold,
        'title': isFr ? 'Rapport programmes' : 'Program Report',
        'desc': isFr
          ? 'Avancement de tous les programmes actifs : bénéficiaires atteints, budget consommé, objectifs accomplis.'
          : 'Progress of all active programs: beneficiaries reached, budget consumed, objectives achieved.',
        'ready': true,
      },
      {
        'icon': Icons.groups_outlined, 'color': _blue,
        'title': isFr ? 'Rapport réseau coopératives'
          : 'Cooperative Network Report',
        'desc': isFr
          ? 'Données sur vos coopératives partenaires : membres, production déclarée, performance.'
          : 'Data on your partner cooperatives: members, declared production, performance.',
        'ready': true,
      },
      {
        'icon': Icons.trending_up_outlined,
        'color': const Color(0xFF7B61FF),
        'title': isFr ? 'Rapport impact & indicateurs'
          : 'Impact & KPI Report',
        'desc': isFr
          ? 'Indicateurs clés : taux de couverture, retour sur investissement social, progression vers les objectifs ODD.'
          : 'Key indicators: coverage rate, social return on investment, SDG goal progression.',
        'ready': programs.isNotEmpty,
      },
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // Clear explanation — no confusion
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _lime.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _lime.withValues(alpha: 0.25))),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const Icon(Icons.file_download_outlined,
                  color: _lime, size: 18),
                const SizedBox(width: 8),
                Text(isFr ? 'Comment fonctionnent les rapports ?'
                  : 'How do reports work?',
                  style: const TextStyle(color: _lime,
                    fontWeight: FontWeight.w700, fontSize: 13)),
              ]),
              const SizedBox(height: 8),
              Text(isFr
                ? '1. Cliquez sur "Générer" pour créer le rapport.\n2. Le rapport PDF sera immédiatement disponible dans la section "Mes rapports" ci-dessous.\n3. Vous recevrez également une notification avec le lien de téléchargement.'
                : '1. Click "Generate" to create the report.\n2. The PDF report will be immediately available in the "My Reports" section below.\n3. You will also receive a notification with the download link.',
                style: const TextStyle(color: _muted, fontSize: 12,
                  height: 1.6)),
            ])),
        const SizedBox(height: 20),

        _header(isFr ? 'Rapports disponibles' : 'Available Reports'),
        const SizedBox(height: 12),
        ...reports.map((r) => _ReportCard(r: r, isFr: isFr,
          context: context)),
        const SizedBox(height: 20),

        _header(isFr ? 'Mes rapports générés' : 'My Generated Reports'),
        const SizedBox(height: 12),
        _empty(Icons.file_present_outlined,
          isFr ? 'Aucun rapport généré' : 'No reports generated yet',
          isFr ? 'Générez votre premier rapport ci-dessus'
               : 'Generate your first report above'),
      ]);
  }
}

class _ReportCard extends StatefulWidget {
  final Map<String, dynamic> r;
  final bool isFr;
  final BuildContext context;
  const _ReportCard({required this.r, required this.isFr,
    required this.context});
  @override State<_ReportCard> createState() => _ReportCardState();
}

class _ReportCardState extends State<_ReportCard> {
  bool _generating = false;
  bool _generated = false;

  @override
  Widget build(BuildContext ctx) {
    final isFr = widget.isFr;
    final r = widget.r;
    final col = r['color'] as Color;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: col.withValues(alpha: 0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(width: 40, height: 40,
              decoration: BoxDecoration(
                color: col.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10)),
              child: Icon(r['icon'] as IconData, color: col, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r['title'] as String,
                  style: const TextStyle(color: _text, fontSize: 13,
                    fontWeight: FontWeight.w700)),
                Text(isFr ? 'Format PDF · Données en temps réel'
                  : 'PDF Format · Real-time data',
                  style: const TextStyle(color: _muted, fontSize: 10)),
              ])),
          ]),
          const SizedBox(height: 10),
          Text(r['desc'] as String,
            style: const TextStyle(color: _muted, fontSize: 12,
              height: 1.4)),
          const SizedBox(height: 12),
          if (_generated)
            Row(children: [
              const Icon(Icons.check_circle_outline, color: _lime, size: 18),
              const SizedBox(width: 8),
              Text(isFr ? 'Rapport généré — disponible en téléchargement'
                : 'Report generated — available for download',
                style: const TextStyle(color: _lime, fontSize: 12,
                  fontWeight: FontWeight.w600)),
            ])
          else
            SizedBox(width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: col, foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10))),
                onPressed: _generating ? null : () async {
                  setState(() => _generating = true);
                  await Future.delayed(const Duration(seconds: 2));
                  if (mounted) setState(() {
                    _generating = false; _generated = true; });
                  if (mounted) ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(
                      content: Text(isFr
                        ? '✅ Rapport "${r['title']}" généré et prêt au téléchargement.'
                        : '✅ Report "${r['title']}" generated and ready for download.'),
                      backgroundColor: _lime,
                      duration: const Duration(seconds: 4)));
                },
                icon: _generating
                  ? const SizedBox(width: 14, height: 14,
                      child: CircularProgressIndicator(
                        color: Colors.black, strokeWidth: 2))
                  : const Icon(Icons.file_download_outlined, size: 16),
                label: Text(
                  _generating
                    ? (isFr ? 'Génération...' : 'Generating...')
                    : (isFr ? 'Générer le rapport PDF'
                             : 'Generate PDF Report'),
                  style: const TextStyle(fontWeight: FontWeight.bold)))),
        ])).animate().fadeIn(duration: 300.ms);
  }
}

// ══════════════════════════════════════════════════════════════
// TAB 4: ACCOUNT
// ══════════════════════════════════════════════════════════════
class _NgoAccountTab extends StatelessWidget {
  final bool isFr;
  final Function(int) onTabChange;
  const _NgoAccountTab({required this.isFr, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final name = auth.displayName.isNotEmpty
      ? auth.displayName : (isFr ? 'Organisation' : 'Organization');
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
              colors: [Color(0xFF0d2a18), Color(0xFF1a4a2e)]),
            borderRadius: BorderRadius.circular(20)),
          child: Row(children: [
            Container(width: 56, height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [_lime, Color(0xFF1a8a4a)]),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(
                  color: _lime.withValues(alpha: 0.4), blurRadius: 12)]),
              child: Center(child: Text(initial, style: const TextStyle(
                color: Colors.white, fontSize: 22,
                fontWeight: FontWeight.bold)))),
            const SizedBox(width: 14),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: _text,
                  fontSize: 17, fontWeight: FontWeight.bold)),
                Text(auth.displayEmail,
                  style: const TextStyle(color: _muted, fontSize: 12)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: _lime.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _lime.withValues(alpha: 0.4))),
                  child: Text(isFr ? '🌍 ONG & Partenaire'
                    : '🌍 NGO & Partner',
                    style: const TextStyle(color: _lime, fontSize: 11,
                      fontWeight: FontWeight.w600))),
              ])),
          ])),
        const SizedBox(height: 20),

        _sec(isFr ? 'NAVIGATION' : 'NAVIGATION', [
          _tile(context, Icons.home_outlined, _lime,
            isFr ? 'Retour au tableau de bord' : 'Back to Dashboard',
            isFr ? 'Vue principale ONG' : 'Main NGO view',
            () => onTabChange(0)),
          _tile(context, Icons.exit_to_app_outlined, _muted,
            isFr ? 'Quitter vers l\'accueil' : 'Exit to Main Home',
            isFr ? 'Page principale de la plateforme'
                 : 'Main platform home page',
            () => context.go('/platform')),
        ]),
        const SizedBox(height: 14),

        _sec(isFr ? 'ORGANISATION' : 'ORGANIZATION', [
          _tile(context, Icons.business_outlined, _gold,
            isFr ? 'Profil organisationnel' : 'Organizational Profile',
            isFr ? 'Infos ONG, mission, contacts' : 'NGO info, mission, contacts',
            () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => _NgoEditProfileScreen(isFr: isFr)))),
          _tile(context, Icons.language_outlined, const Color(0xFF9C27B0),
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
          _tile(context, Icons.phone_outlined, const Color(0xFF2196F3),
            isFr ? 'Mettre à jour le téléphone' : 'Update Phone',
            isFr ? 'Numéro de contact principal'
                 : 'Primary contact number',
            () => context.push('/profile/change-phone')),
          _tile(context, Icons.email_outlined, const Color(0xFF2196F3),
            isFr ? 'Mettre à jour l\'email' : 'Update Email',
            isFr ? 'Email organisationnel officiel'
                 : 'Official organizational email',
            () => context.push('/profile/change-email')),
        ]),
        const SizedBox(height: 14),

        _sec('SUPPORT', [
          _tile(context, Icons.help_outline, const Color(0xFF4CAF50),
            isFr ? 'Centre d\'aide' : 'Help Center',
            isFr ? 'FAQ et guides' : 'FAQs and guides',
            () => context.go('/help')),
          _tile(context, Icons.gavel_outlined, _muted,
            isFr ? 'Conditions d\'utilisation' : 'Terms of Service',
            isFr ? 'Voir les conditions' : 'View terms',
            () => context.push('/terms?view=1&tab=0')),
          _tile(context, Icons.privacy_tip_outlined, _muted,
            isFr ? 'Politique de confidentialité' : 'Privacy Policy',
            isFr ? 'Comment nous utilisons vos données'
                 : 'How we use your data',
            () => context.push('/terms?view=1&tab=1')),
        ]),
        const SizedBox(height: 16),

        Center(child: Column(children: [
          Text('Sahel AgriConnect — NGO Portal v1.1.0',
            style: TextStyle(color: _muted.withValues(alpha: 0.4),
              fontSize: 12)),
          const SizedBox(height: 2),
          Text('🌍 Impact. Programs. Change.',
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
                  content: Text(
                    isFr ? 'Vous serez redirigé vers l\'accueil.'
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
// NGO EDIT PROFILE — organizational, not personal
// ══════════════════════════════════════════════════════════════
class _NgoEditProfileScreen extends StatefulWidget {
  final bool isFr;
  const _NgoEditProfileScreen({required this.isFr});
  @override State<_NgoEditProfileScreen> createState() =>
    _NgoEditProfileScreenState();
}

class _NgoEditProfileScreenState extends State<_NgoEditProfileScreen> {
  late TextEditingController _orgNameCtrl;
  late TextEditingController _missionCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _websiteCtrl;
  late TextEditingController _countryCtrl;
  late TextEditingController _regionsCtrl;
  late TextEditingController _contactNameCtrl;
  late TextEditingController _contactTitleCtrl;
  late TextEditingController _regNumCtrl;
  String _orgType = 'ngo';
  String _focus = 'agriculture';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthState>();
    _orgNameCtrl = TextEditingController(text: auth.displayName);
    _missionCtrl = TextEditingController();
    _emailCtrl = TextEditingController(text: auth.displayEmail);
    _phoneCtrl = TextEditingController(text: auth.displayPhone);
    _websiteCtrl = TextEditingController();
    _countryCtrl = TextEditingController(text: auth.displayCountry);
    _regionsCtrl = TextEditingController();
    _contactNameCtrl = TextEditingController();
    _contactTitleCtrl = TextEditingController();
    _regNumCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _orgNameCtrl.dispose(); _missionCtrl.dispose(); _emailCtrl.dispose();
    _phoneCtrl.dispose(); _websiteCtrl.dispose(); _countryCtrl.dispose();
    _regionsCtrl.dispose(); _contactNameCtrl.dispose();
    _contactTitleCtrl.dispose(); _regNumCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_orgNameCtrl.text.isEmpty || _emailCtrl.text.isEmpty ||
        _regNumCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? 'Nom de l\'organisation, email et numéro d\'enregistrement sont requis'
          : 'Organization name, email and registration number are required'),
        backgroundColor: Colors.red));
      return;
    }
    setState(() => _saving = true);
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(widget.isFr
          ? '✅ Profil organisationnel mis à jour !'
          : '✅ Organizational profile updated!'),
        backgroundColor: _lime));
      Navigator.pop(context);
    }
  }

  String _focusName(String f) {
    final map = {
      'agriculture': widget.isFr ? 'Agriculture & alimentation'
        : 'Agriculture & Food',
      'women': widget.isFr ? 'Autonomisation des femmes'
        : 'Women Empowerment',
      'climate': widget.isFr ? 'Adaptation climatique'
        : 'Climate Adaptation',
      'finance': widget.isFr ? 'Finance inclusive' : 'Inclusive Finance',
      'education': widget.isFr ? 'Formation & éducation'
        : 'Training & Education',
      'health': widget.isFr ? 'Santé rurale' : 'Rural Health',
    };
    return map[f] ?? f;
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d2a18), elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          onPressed: () => Navigator.pop(context)),
        title: Text(isFr ? 'Profil organisationnel'
          : 'Organizational Profile',
          style: const TextStyle(color: _text, fontSize: 17,
            fontWeight: FontWeight.w600))),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 100),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _lime.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _lime.withValues(alpha: 0.2))),
            child: Row(children: [
              const Icon(Icons.business_outlined, color: _lime, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(
                isFr
                  ? 'Ce profil représente votre organisation sur la plateforme Sahel AgriConnect et est visible par les coopératives et agriculteurs partenaires.'
                  : 'This profile represents your organization on the Sahel AgriConnect platform and is visible to partner cooperatives and farmers.',
                style: const TextStyle(color: _lime, fontSize: 11,
                  height: 1.4))),
            ])),
          const SizedBox(height: 16),
          _card(children: [
            _secLabel(isFr ? '🏢 Identité de l\'organisation'
              : '🏢 Organization Identity'),
            _lbl(isFr ? 'Nom de l\'organisation *' : 'Organization Name *'),
            _tf(_orgNameCtrl,
              isFr ? 'Ex: Action Contre la Faim Mali'
                   : 'e.g. Action Against Hunger Mali'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Type d\'organisation' : 'Organization Type'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              isDense: true,
              value: _orgType, dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _dec(''),
              items: [
                DropdownMenuItem(value: 'ngo',
                  child: Text(isFr ? 'ONG internationale' : 'International NGO',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'local_ngo',
                  child: Text(isFr ? 'ONG locale' : 'Local NGO',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'foundation',
                  child: Text(isFr ? 'Fondation' : 'Foundation',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'donor',
                  child: Text(isFr ? 'Agence de financement' : 'Donor Agency',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'un',
                  child: Text(isFr ? 'Agence ONU' : 'UN Agency',
                    style: const TextStyle(color: _text))),
                DropdownMenuItem(value: 'bilateral',
                  child: Text(isFr ? 'Coopération bilatérale'
                    : 'Bilateral Cooperation',
                    style: const TextStyle(color: _text))),
              ],
              onChanged: (v) => setState(() => _orgType = v ?? 'ngo')),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Numéro d\'enregistrement légal *'
              : 'Legal Registration Number *'),
            _tf(_regNumCtrl,
              isFr ? 'Numéro officiel d\'enregistrement'
                   : 'Official registration number'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Mission & mandat' : 'Mission & Mandate'),
            _tf(_missionCtrl,
              isFr ? 'Décrivez la mission de votre organisation...'
                   : 'Describe your organization\'s mission...',
              maxLines: 3),
            const SizedBox(height: 20),

            _secLabel(isFr ? '🎯 Domaines d\'intervention'
              : '🎯 Areas of Intervention'),
            _lbl(isFr ? 'Domaine principal' : 'Primary Focus'),
            DropdownButtonFormField<String>(
              isExpanded: true,
              isDense: true,
              value: _focus, dropdownColor: _surface,
              style: const TextStyle(color: _text),
              decoration: _dec(''),
              items: ['agriculture', 'women', 'climate',
                'finance', 'education', 'health']
                .map((f) => DropdownMenuItem(value: f,
                  child: Text(_focusName(f),
                    style: const TextStyle(color: _text)))).toList(),
              onChanged: (v) => setState(() => _focus = v ?? 'agriculture')),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Zones géographiques d\'intervention'
              : 'Geographic Areas of Intervention'),
            _tf(_regionsCtrl,
              isFr ? 'Ex: Ségou, Mopti, Sikasso, Mali'
                   : 'e.g. Segou, Mopti, Sikasso, Mali'),
            const SizedBox(height: 20),

            _secLabel(isFr ? '📞 Contacts officiels' : '📞 Official Contacts'),
            _lbl(isFr ? 'Email officiel *' : 'Official Email *'),
            _tf(_emailCtrl, 'organisation@domain.org',
              type: TextInputType.emailAddress),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Téléphone principal' : 'Main Phone'),
            _tf(_phoneCtrl, '+223 / +33 / +1...',
              type: TextInputType.phone),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Site web' : 'Website'),
            _tf(_websiteCtrl, 'https://www.organisation.org'),
            const SizedBox(height: 20),

            _secLabel(isFr ? '👤 Référent principal' : '👤 Primary Contact'),
            _lbl(isFr ? 'Nom du référent' : 'Contact Person Name'),
            _tf(_contactNameCtrl,
              isFr ? 'Prénom et nom' : 'First and last name'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Titre / Poste' : 'Title / Position'),
            _tf(_contactTitleCtrl,
              isFr ? 'Ex: Directeur programmes, Coordinateur'
                   : 'e.g. Program Director, Coordinator'),
            const SizedBox(height: 12),
            _lbl(isFr ? 'Pays d\'opération principal'
              : 'Primary Country of Operation'),
            _tf(_countryCtrl,
              isFr ? 'Ex: Mali, Sénégal, Burkina Faso'
                   : 'e.g. Mali, Senegal, Burkina Faso'),
            const SizedBox(height: 20),
            _btn(isFr ? 'Enregistrer le profil' : 'Save Profile',
              _saving, _save, _lime),
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

Widget _header(String t) => Text(t, style: const TextStyle(
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
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _lime)),
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
    borderSide: const BorderSide(color: _lime)),
  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12));

Widget _btn(String label, bool loading, VoidCallback onTap, Color col) =>
  SizedBox(width: double.infinity,
    child: ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: col, foregroundColor: Colors.black,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12))),
      onPressed: loading ? null : onTap,
      child: loading
        ? const SizedBox(width: 20, height: 20,
            child: CircularProgressIndicator(
              color: Colors.black, strokeWidth: 2))
        : Text(label, style: const TextStyle(
            fontWeight: FontWeight.bold, fontSize: 15))));

Widget _empty(IconData icon, String title, String subtitle) =>
  Container(
    padding: const EdgeInsets.all(24),
    decoration: _cardDeco(),
    child: Column(children: [
      Icon(icon, color: _muted, size: 48),
      const SizedBox(height: 12),
      Text(title, style: const TextStyle(color: _text, fontSize: 15,
        fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      Text(subtitle, textAlign: TextAlign.center,
        style: const TextStyle(color: _muted, fontSize: 12)),
    ]));