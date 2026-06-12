import 'package:flutter/material.dart';

import '../../core/safe_insets.dart';
import '../../core/theme.dart';

/// Certification pathways for processor batches — types, levels, and request UI.
abstract final class ProcessorCertificationFlow {
  static void show(
    BuildContext context, {
    required bool isFr,
    Map<String, dynamic>? batch,
  }) {
    showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF2a1a00),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.88,
        minChildSize: 0.45,
        maxChildSize: 0.95,
        builder: (_, scrollCtrl) => _CertificationRequestSheet(
          isFr: isFr,
          batch: batch,
          scrollController: scrollCtrl,
        ),
      ),
    );
  }
}

class _CertLevel {
  const _CertLevel({
    required this.id,
    required this.nameEn,
    required this.nameFr,
    required this.summaryEn,
    required this.summaryFr,
    required this.timelineEn,
    required this.timelineFr,
    required this.badgeEn,
    required this.badgeFr,
  });

  final String id;
  final String nameEn;
  final String nameFr;
  final String summaryEn;
  final String summaryFr;
  final String timelineEn;
  final String timelineFr;
  final String badgeEn;
  final String badgeFr;
}

class _CertType {
  const _CertType({
    required this.id,
    required this.icon,
    required this.accent,
    required this.titleEn,
    required this.titleFr,
    required this.descEn,
    required this.descFr,
    required this.levels,
  });

  final String id;
  final IconData icon;
  final Color accent;
  final String titleEn;
  final String titleFr;
  final String descEn;
  final String descFr;
  final List<_CertLevel> levels;
}

const _catalog = <_CertType>[
  _CertType(
    id: 'haccp',
    icon: Icons.restaurant_outlined,
    accent: Color(0xFF10B981),
    titleEn: 'HACCP',
    titleFr: 'HACCP',
    descEn: 'Food safety hazard analysis & critical control points',
    descFr: 'Analyse des dangers & points critiques pour la sécurité alimentaire',
    levels: [
      _CertLevel(
        id: 'haccp_l1',
        nameEn: 'Level I — Hazard plan',
        nameFr: 'Niveau I — Plan de dangers',
        summaryEn: 'Document hazards, CCPs, and monitoring for one product line.',
        summaryFr: 'Documenter dangers, CCP et surveillance pour une ligne produit.',
        timelineEn: '2–4 weeks',
        timelineFr: '2–4 semaines',
        badgeEn: 'Foundation',
        badgeFr: 'Fondation',
      ),
      _CertLevel(
        id: 'haccp_l2',
        nameEn: 'Level II — Operational controls',
        nameFr: 'Niveau II — Contrôles opérationnels',
        summaryEn: 'Implement monitoring logs, corrective actions, and staff training.',
        summaryFr: 'Mettre en place journaux, actions correctives et formation.',
        timelineEn: '6–8 weeks',
        timelineFr: '6–8 semaines',
        badgeEn: 'Operational',
        badgeFr: 'Opérationnel',
      ),
      _CertLevel(
        id: 'haccp_l3',
        nameEn: 'Level III — Audit-ready',
        nameFr: 'Niveau III — Prêt pour audit',
        summaryEn: 'Full documentation pack for buyer or government inspection.',
        summaryFr: 'Dossier complet pour acheteur ou inspection officielle.',
        timelineEn: '10–12 weeks',
        timelineFr: '10–12 semaines',
        badgeEn: 'Export-ready',
        badgeFr: 'Export',
      ),
    ],
  ),
  _CertType(
    id: 'iso22000',
    icon: Icons.health_and_safety_outlined,
    accent: Color(0xFF3B82F6),
    titleEn: 'ISO 22000',
    titleFr: 'ISO 22000',
    descEn: 'Food safety management system (FSMS)',
    descFr: 'Système de management de la sécurité des denrées (SMSSD)',
    levels: [
      _CertLevel(
        id: 'iso22_gap',
        nameEn: 'Foundation — Gap assessment',
        nameFr: 'Fondation — Évaluation des écarts',
        summaryEn: 'Baseline audit against ISO 22000 clauses for your facility.',
        summaryFr: 'Audit de référence selon les clauses ISO 22000.',
        timelineEn: '3–5 weeks',
        timelineFr: '3–5 semaines',
        badgeEn: 'Level I',
        badgeFr: 'Niveau I',
      ),
      _CertLevel(
        id: 'iso22_full',
        nameEn: 'Standard — Full FSMS',
        nameFr: 'Standard — SMSSD complet',
        summaryEn: 'Policies, PRPs, HACCP integration, and management review cycle.',
        summaryFr: 'Politiques, PRP, HACCP et revue de direction.',
        timelineEn: '8–14 weeks',
        timelineFr: '8–14 semaines',
        badgeEn: 'Level II',
        badgeFr: 'Niveau II',
      ),
      _CertLevel(
        id: 'iso22_export',
        nameEn: 'Advanced — Third-party audit prep',
        nameFr: 'Avancé — Préparation audit tiers',
        summaryEn: 'Mock audit, corrective closure, and certification body handoff.',
        summaryFr: 'Audit blanc, corrections et passage organisme certificateur.',
        timelineEn: '16–20 weeks',
        timelineFr: '16–20 semaines',
        badgeEn: 'Level III',
        badgeFr: 'Niveau III',
      ),
    ],
  ),
  _CertType(
    id: 'iso9001',
    icon: Icons.verified_outlined,
    accent: Color(0xFFF59E0B),
    titleEn: 'ISO 9001',
    titleFr: 'ISO 9001',
    descEn: 'Quality management for consistent processing output',
    descFr: 'Management qualité pour une production constante',
    levels: [
      _CertLevel(
        id: 'iso9_doc',
        nameEn: 'Level I — QMS documentation',
        nameFr: 'Niveau I — Documentation SMQ',
        summaryEn: 'Quality manual, procedures, and records for core processes.',
        summaryFr: 'Manuel qualité, procédures et enregistrements.',
        timelineEn: '4–6 weeks',
        timelineFr: '4–6 semaines',
        badgeEn: 'Foundation',
        badgeFr: 'Fondation',
      ),
      _CertLevel(
        id: 'iso9_cert',
        nameEn: 'Level II — Process certification',
        nameFr: 'Niveau II — Certification processus',
        summaryEn: 'Internal audits, KPIs, and customer complaint handling.',
        summaryFr: 'Audits internes, KPI et traitement réclamations.',
        timelineEn: '10–12 weeks',
        timelineFr: '10–12 semaines',
        badgeEn: 'Standard',
        badgeFr: 'Standard',
      ),
      _CertLevel(
        id: 'iso9_advanced',
        nameEn: 'Level III — Continuous improvement',
        nameFr: 'Niveau III — Amélioration continue',
        summaryEn: 'Export buyer readiness with full traceability linkage.',
        summaryFr: 'Prêt acheteurs export avec traçabilité complète.',
        timelineEn: '14–18 weeks',
        timelineFr: '14–18 semaines',
        badgeEn: 'Level III',
        badgeFr: 'Niveau III',
      ),
    ],
  ),
  _CertType(
    id: 'organic_eu',
    icon: Icons.eco_outlined,
    accent: Color(0xFF6B9B4E),
    titleEn: 'Organic EU',
    titleFr: 'Bio UE',
    descEn: 'European organic label for shea, sesame, cashew & oils',
    descFr: 'Label bio européen — karité, sésame, cajou et huiles',
    levels: [
      _CertLevel(
        id: 'org_conv',
        nameEn: 'In-conversion — Year 1',
        nameFr: 'En conversion — Année 1',
        summaryEn: 'Transition period documentation for organic fields & inputs.',
        summaryFr: 'Documentation période de conversion champs et intrants.',
        timelineEn: '12 months',
        timelineFr: '12 mois',
        badgeEn: 'Transition',
        badgeFr: 'Conversion',
      ),
      _CertLevel(
        id: 'org_full',
        nameEn: 'EU Organic — Full label',
        nameFr: 'Bio UE — Label complet',
        summaryEn: 'Certified organic processing and labeling rights.',
        summaryFr: 'Transformation et étiquetage bio certifiés.',
        timelineEn: '6–9 months',
        timelineFr: '6–9 mois',
        badgeEn: 'Certified',
        badgeFr: 'Certifié',
      ),
      _CertLevel(
        id: 'org_export',
        nameEn: 'Export organic bundle',
        nameFr: 'Pack export bio',
        summaryEn: 'COI, residue testing plan, and EU importer documentation.',
        summaryFr: 'COI, plan résidus et dossier importateur UE.',
        timelineEn: '3–4 months after cert.',
        timelineFr: '3–4 mois après cert.',
        badgeEn: 'Export',
        badgeFr: 'Export',
      ),
    ],
  ),
  _CertType(
    id: 'fairtrade',
    icon: Icons.handshake_outlined,
    accent: Color(0xFF7B61FF),
    titleEn: 'Fair Trade',
    titleFr: 'Commerce équitable',
    descEn: 'Ethical sourcing & cooperative fair-trade pathways',
    descFr: 'Approvisionnement éthique et prime coopérative',
    levels: [
      _CertLevel(
        id: 'ft_local',
        nameEn: 'Community readiness',
        nameFr: 'Préparation communautaire',
        summaryEn: 'Social standards baseline for local buyers.',
        summaryFr: 'Référentiel social pour acheteurs locaux.',
        timelineEn: '4–8 weeks',
        timelineFr: '4–8 semaines',
        badgeEn: 'Level I',
        badgeFr: 'Niveau I',
      ),
      _CertLevel(
        id: 'ft_flo',
        nameEn: 'FLO-Cert pathway',
        nameFr: 'Parcours FLO-Cert',
        summaryEn: 'Fairtrade International standards for export lots.',
        summaryFr: 'Normes Fairtrade International pour lots export.',
        timelineEn: '12–16 weeks',
        timelineFr: '12–16 semaines',
        badgeEn: 'Level II',
        badgeFr: 'Niveau II',
      ),
      _CertLevel(
        id: 'ft_chain',
        nameEn: 'Full supply chain',
        nameFr: 'Chaîne complète',
        summaryEn: 'Processor + cooperative linkage with full traceability.',
        summaryFr: 'Lien transformateur–coopérative et traçabilité prime.',
        timelineEn: '18–24 weeks',
        timelineFr: '18–24 semaines',
        badgeEn: 'Level III',
        badgeFr: 'Niveau III',
      ),
    ],
  ),
  _CertType(
    id: 'sahel_trace',
    icon: Icons.qr_code_2_outlined,
    accent: AppColors.gold,
    titleEn: 'Sahel Traceability',
    titleFr: 'Traçabilité Sahel',
    descEn: 'Platform & government export traceability mandate',
    descFr: 'Mandat traçabilité plateforme et export national',
    levels: [
      _CertLevel(
        id: 'trace_batch',
        nameEn: 'Batch trace ID',
        nameFr: 'ID traçabilité lot',
        summaryEn: 'QR-linked batch record for a single processing lot.',
        summaryFr: 'Fiche lot liée QR pour un lot de transformation.',
        timelineEn: '1–2 weeks',
        timelineFr: '1–2 semaines',
        badgeEn: 'Lot',
        badgeFr: 'Lot',
      ),
      _CertLevel(
        id: 'trace_facility',
        nameEn: 'Facility chain of custody',
        nameFr: 'Chaîne de custody site',
        summaryEn: 'End-to-end inputs, processing steps, and output custody.',
        summaryFr: 'Intrants, étapes et custody des sorties.',
        timelineEn: '4–6 weeks',
        timelineFr: '4–6 semaines',
        badgeEn: 'Facility',
        badgeFr: 'Site',
      ),
      _CertLevel(
        id: 'trace_national',
        nameEn: 'National export mandate',
        nameFr: 'Mandat export national',
        summaryEn: 'Government portal alignment for cross-border shipment.',
        summaryFr: 'Alignement portail gouvernemental export transfrontalier.',
        timelineEn: '6–10 weeks',
        timelineFr: '6–10 semaines',
        badgeEn: 'National',
        badgeFr: 'National',
      ),
    ],
  ),
  _CertType(
    id: 'halal',
    icon: Icons.mosque_outlined,
    accent: Color(0xFF2DD4BF),
    titleEn: 'Halal',
    titleFr: 'Halal',
    descEn: 'Halal compliance for domestic & Gulf export markets',
    descFr: 'Conformité halal pour marchés locaux et Golfe',
    levels: [
      _CertLevel(
        id: 'halal_screen',
        nameEn: 'Facility screening',
        nameFr: 'Pré-qualification site',
        summaryEn: 'Ingredient and equipment halal suitability review.',
        summaryFr: 'Revue conformité ingrédients et équipements.',
        timelineEn: '2–3 weeks',
        timelineFr: '2–3 semaines',
        badgeEn: 'Level I',
        badgeFr: 'Niveau I',
      ),
      _CertLevel(
        id: 'halal_process',
        nameEn: 'Process halal',
        nameFr: 'Processus halal',
        summaryEn: 'Supervised processing protocol and segregation plan.',
        summaryFr: 'Protocole transformation supervisé et ségrégation.',
        timelineEn: '6–8 weeks',
        timelineFr: '6–8 semaines',
        badgeEn: 'Level II',
        badgeFr: 'Niveau II',
      ),
      _CertLevel(
        id: 'halal_export',
        nameEn: 'Export halal certificate',
        nameFr: 'Certificat halal export',
        summaryEn: 'Recognized body certificate for international buyers.',
        summaryFr: 'Certificat organisme reconnu pour acheteurs internationaux.',
        timelineEn: '10–14 weeks',
        timelineFr: '10–14 semaines',
        badgeEn: 'Export',
        badgeFr: 'Export',
      ),
    ],
  ),
];

class _CertificationRequestSheet extends StatefulWidget {
  const _CertificationRequestSheet({
    required this.isFr,
    required this.scrollController,
    this.batch,
  });

  final bool isFr;
  final ScrollController scrollController;
  final Map<String, dynamic>? batch;

  @override
  State<_CertificationRequestSheet> createState() =>
      _CertificationRequestSheetState();
}

class _CertificationRequestSheetState extends State<_CertificationRequestSheet> {
  String _typeId = _catalog.first.id;
  late String _levelId = _catalog.first.levels.first.id;
  final _notesCtrl = TextEditingController();
  bool _submitting = false;
  bool _submitted = false;

  _CertType get _selectedType =>
      _catalog.firstWhere((t) => t.id == _typeId);

  _CertLevel get _selectedLevel =>
      _selectedType.levels.firstWhere((l) => l.id == _levelId);

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() {
      _submitting = false;
      _submitted = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    final batch = widget.batch;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF2a1a00), Color(0xFF1a1200)],
        ),
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: ListView(
        controller: widget.scrollController,
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          SafeInsets.bottom(context, extra: 20),
        ),
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isFr ? 'Demande de certification' : 'Certification request',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isFr
                ? 'Choisissez le type et le niveau adaptés à votre lot et à vos marchés cibles.'
                : 'Choose the type and level that fit your batch and target markets.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 13,
              height: 1.45,
            ),
          ),
          if (batch != null) ...[
            const SizedBox(height: 14),
            _BatchChip(batch: batch, isFr: isFr),
          ],
          const SizedBox(height: 20),
          if (_submitted) ...[
            _SuccessPanel(
              isFr: isFr,
              type: _selectedType,
              level: _selectedLevel,
              batchId: batch?['id']?.toString(),
            ),
          ] else ...[
            Text(
              isFr ? '1 · Type de certification' : '1 · Certification type',
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 10),
            ..._catalog.map((t) => _TypeCard(
                  type: t,
                  isFr: isFr,
                  selected: t.id == _typeId,
                  onTap: () => setState(() {
                    _typeId = t.id;
                    _levelId = t.levels.first.id;
                  }),
                )),
            const SizedBox(height: 20),
            Text(
              isFr ? '2 · Niveau du parcours' : '2 · Pathway level',
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 10),
            ..._selectedType.levels.map(
              (l) => _LevelCard(
                level: l,
                accent: _selectedType.accent,
                isFr: isFr,
                selected: l.id == _levelId,
                onTap: () => setState(() => _levelId = l.id),
              ),
            ),
            const SizedBox(height: 16),
            _SummaryCard(
              isFr: isFr,
              type: _selectedType,
              level: _selectedLevel,
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _notesCtrl,
              maxLines: 2,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                hintText: isFr
                    ? 'Notes pour l\'équipe certification (optionnel)'
                    : 'Notes for the certification team (optional)',
                hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.35),
                ),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.06),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: AppColors.gold.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _selectedType.accent,
                  foregroundColor: Colors.black,
                  disabledBackgroundColor:
                      _selectedType.accent.withValues(alpha: 0.4),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.black,
                        ),
                      )
                    : Text(
                        isFr ? 'Soumettre la demande' : 'Submit request',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BatchChip extends StatelessWidget {
  const _BatchChip({required this.batch, required this.isFr});

  final Map<String, dynamic> batch;
  final bool isFr;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          const Icon(Icons.inventory_2_outlined, color: AppColors.gold, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${batch['id']} · ${batch['crop']}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  isFr ? 'Lot concerné par cette demande' : 'Batch covered by this request',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.type,
    required this.isFr,
    required this.selected,
    required this.onTap,
  });

  final _CertType type;
  final bool isFr;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Ink(
            decoration: BoxDecoration(
              color: selected
                  ? type.accent.withValues(alpha: 0.12)
                  : Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected
                    ? type.accent.withValues(alpha: 0.55)
                    : Colors.white.withValues(alpha: 0.1),
                width: selected ? 1.5 : 1,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: type.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(type.icon, color: type.accent, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isFr ? type.titleFr : type.titleEn,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          isFr ? type.descFr : type.descEn,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 11,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isFr
                              ? '${type.levels.length} niveaux disponibles'
                              : '${type.levels.length} levels available',
                          style: TextStyle(
                            color: type.accent,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (selected)
                    Icon(Icons.check_circle, color: type.accent, size: 22),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LevelCard extends StatelessWidget {
  const _LevelCard({
    required this.level,
    required this.accent,
    required this.isFr,
    required this.selected,
    required this.onTap,
  });

  final _CertLevel level;
  final Color accent;
  final bool isFr;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: selected
                  ? accent.withValues(alpha: 0.1)
                  : Colors.white.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: selected
                    ? accent.withValues(alpha: 0.5)
                    : Colors.white.withValues(alpha: 0.08),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  selected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_off,
                  color: selected ? accent : Colors.white38,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              isFr ? level.nameFr : level.nameEn,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: accent.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isFr ? level.badgeFr : level.badgeEn,
                              style: TextStyle(
                                color: accent,
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isFr ? level.summaryFr : level.summaryEn,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 11,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.schedule,
                            size: 12,
                            color: Colors.white.withValues(alpha: 0.4),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isFr ? level.timelineFr : level.timelineEn,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.45),
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.isFr,
    required this.type,
    required this.level,
  });

  final bool isFr;
  final _CertType type;
  final _CertLevel level;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            type.accent.withValues(alpha: 0.15),
            Colors.white.withValues(alpha: 0.04),
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: type.accent.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFr ? 'Récapitulatif' : 'Summary',
            style: TextStyle(
              color: type.accent,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${isFr ? type.titleFr : type.titleEn} · ${isFr ? level.badgeFr : level.badgeEn}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isFr ? level.nameFr : level.nameEn,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.65),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _SuccessPanel extends StatelessWidget {
  const _SuccessPanel({
    required this.isFr,
    required this.type,
    required this.level,
    this.batchId,
  });

  final bool isFr;
  final _CertType type;
  final _CertLevel level;
  final String? batchId;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(Icons.verified_outlined, color: type.accent, size: 56),
        const SizedBox(height: 16),
        Text(
          isFr ? 'Demande enregistrée' : 'Request recorded',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          batchId != null
              ? (isFr
                  ? 'Lot $batchId · ${type.titleFr} (${level.badgeFr})'
                  : 'Batch $batchId · ${type.titleEn} (${level.badgeEn})')
              : (isFr
                  ? '${type.titleFr} · ${level.badgeFr}'
                  : '${type.titleEn} · ${level.badgeEn})'),
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.7),
            fontSize: 14,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          isFr
              ? 'Un conseiller certification vous contactera sous 48 h ouvrées avec la checklist du niveau choisi.'
              : 'A certification advisor will contact you within 48 business hours with your level checklist.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 13,
            height: 1.45,
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.gold,
              side: BorderSide(color: AppColors.gold.withValues(alpha: 0.5)),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              isFr ? 'Fermer' : 'Close',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }
}
