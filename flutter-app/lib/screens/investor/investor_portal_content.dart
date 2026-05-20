import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';

/// Shared AfriYield investor UI — aligned with web [InvestorPortal] content.
abstract final class InvestorPortalContent {
  static const journeyStepsEn = [
    'Investment received',
    'Equipment purchased',
    'Farmers at work',
    'Your payout',
  ];
  static const journeyStepsFr = [
    'Investissement reçu',
    'Équipement acheté',
    'Agriculteurs au travail',
    'Votre versement',
  ];

  static String firstName(String? fullName) {
    final n = (fullName ?? '').trim();
    if (n.isEmpty) return '';
    return n.split(RegExp(r'\s+')).first;
  }

  static Future<void> openAfriYieldWeb() async {
    final uri = Uri.parse('https://afriyieldexchange.com');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

class InvestorPaymentNoticeCard extends StatelessWidget {
  const InvestorPaymentNoticeCard({required this.isFr, super.key});

  final bool isFr;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFr ? '💳 Traitement des paiements' : '💳 Payment processing',
            style: TextStyle(
              color: AppColors.gold.withValues(alpha: 0.95),
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isFr
                ? 'Votre investissement sera traité via le portail sécurisé AfriYield Exchange. Vous recevrez un contrat formel avant tout mouvement de fonds.'
                : 'Your investment will be processed through the secure AfriYield Exchange portal. You will receive a formal agreement before any funds move.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 11,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isFr
                ? 'Rendements projetés basés sur les performances historiques des coopératives — non garantis.'
                : 'Projected returns based on historical cooperative performance — not guaranteed.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 10,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isFr
                ? 'Tous les paiements sont traités exclusivement sur afriyieldexchange.com. Aucun paiement via l\'application mobile.'
                : 'All payments are processed exclusively on afriyieldexchange.com. No payments via the mobile app.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.38),
              fontSize: 10,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class InvestorGreetingHeader extends StatelessWidget {
  const InvestorGreetingHeader({
    required this.isFr,
    required this.displayName,
    super.key,
  });

  final bool isFr;
  final String displayName;

  @override
  Widget build(BuildContext context) {
    final first = InvestorPortalContent.firstName(displayName);
    final greeting = first.isEmpty
        ? (isFr ? 'Bonjour 👋' : 'Hello 👋')
        : (isFr ? 'Bonjour, $first 👋' : 'Hello, $first 👋');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          greeting,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          isFr
              ? 'Voici comment votre investissement africain se porte aujourd\'hui'
              : 'Here is how your African investment is doing today',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 13,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

class InvestorOnboardingCard extends StatelessWidget {
  const InvestorOnboardingCard({
    required this.isFr,
    required this.onCta,
    super.key,
  });

  final bool isFr;
  final VoidCallback onCta;

  @override
  Widget build(BuildContext context) {
    final steps = isFr
        ? [
            'Inscrivez votre profil investisseur',
            'Choisissez une coopérative karité ou sésame',
            'Suivez votre investissement — versements deux fois par an',
          ]
        : [
            'Register your investor profile',
            'Choose a shea butter or sesame cooperative',
            'Watch your investment grow — get paid twice a year',
          ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F0E8),
        borderRadius: BorderRadius.circular(16),
        border: const Border(
          top: BorderSide(color: Color(0xFF1a3c2e), width: 4),
        ),
      ),
      child: Column(
        children: [
          const Text('🌱 → 🌿 → 🌾', style: TextStyle(fontSize: 28)),
          const SizedBox(height: 10),
          Text(
            isFr
                ? 'Votre premier investissement dans l\'agriculture africaine'
                : 'Your first investment in African agriculture',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF1a3c2e),
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          ...steps.asMap().entries.map(
            (e) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${e.key + 1}.',
                    style: const TextStyle(
                      color: Color(0xFF1a3c2e),
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      e.value,
                      style: TextStyle(
                        color: const Color(0xFF1a3c2e).withValues(alpha: 0.85),
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            isFr
                ? 'Même 1 000 \$ font une vraie différence pour les agriculteurs et leurs familles.'
                : 'As little as \$1,000 makes a real difference for farmers and their families.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: const Color(0xFF1a3c2e).withValues(alpha: 0.65),
              fontSize: 11,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onCta,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1a3c2e),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                isFr
                    ? 'Voir les opportunités disponibles →'
                    : 'See available opportunities →',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class InvestorActivityFeed extends StatelessWidget {
  const InvestorActivityFeed({required this.isFr, super.key});

  final bool isFr;

  @override
  Widget build(BuildContext context) {
    final items = isFr
        ? [
            ('Votre profil a été vérifié', 'Aujourd\'hui', const Color(0xFF22c55e)),
            (
              'La saison de récolte du karité commence dans votre région',
              'Mai 2026',
              AppColors.gold,
            ),
            ('Votre prochain versement arrive', 'Bientôt', const Color(0xFF22c55e)),
          ]
        : [
            ('Your profile was verified', 'Today', const Color(0xFF22c55e)),
            ('Shea harvest season starts in your region', 'May 2026', AppColors.gold),
            ('Your next payout is coming', 'Coming up', const Color(0xFF22c55e)),
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isFr
              ? 'CE QUI SE PASSE AVEC VOTRE INVESTISSEMENT'
              : 'WHAT IS HAPPENING WITH YOUR INVESTMENT',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 10),
        ...items.map(
          (item) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: item.$3,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.$1,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 12,
                    ),
                  ),
                ),
                Text(
                  item.$2,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.35),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class InvestorHotOpportunityBanner extends StatelessWidget {
  const InvestorHotOpportunityBanner({
    required this.isFr,
    required this.onCta,
    super.key,
  });

  final bool isFr;
  final VoidCallback onCta;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F0E8),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35), width: 2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🔥', style: TextStyle(fontSize: 22)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isFr
                      ? 'Le beurre de karité est très demandé'
                      : 'Shea butter is in high demand',
                  style: const TextStyle(
                    color: Color(0xFF1a3c2e),
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isFr
                      ? 'Les acheteurs européens recherchent du karité africain certifié. Plusieurs coopératives sont ouvertes.'
                      : 'European buyers want certified African shea. Several cooperatives are open for investment.',
                  style: TextStyle(
                    color: const Color(0xFF1a3c2e).withValues(alpha: 0.75),
                    fontSize: 11,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onCta,
            child: Text(
              isFr ? 'Voir →' : 'See →',
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class InvestorPortfolioEmptyBlock extends StatelessWidget {
  const InvestorPortfolioEmptyBlock({
    required this.isFr,
    required this.onChoose,
    super.key,
  });

  final bool isFr;
  final VoidCallback onChoose;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text('🌱', style: TextStyle(fontSize: 48)),
        const SizedBox(height: 12),
        Text(
          isFr ? 'Vous n\'avez pas encore investi' : 'You have not invested yet',
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          isFr
              ? 'Choisissez une coopérative et faites votre première contribution. Même 1 000 \$ font une vraie différence.'
              : 'Choose a cooperative and make your first contribution. As little as \$1,000 makes a real difference.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 13,
            height: 1.45,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: onChoose,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: const Color(0xFF0d1f17),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: Text(
              isFr ? 'Choisir mon premier investissement 🌾' : 'Choose my first investment',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
            ),
          ),
        ),
      ],
    );
  }
}

class InvestorJourneyProgress extends StatelessWidget {
  const InvestorJourneyProgress({
    required this.isFr,
    required this.currentStep,
    super.key,
  });

  final bool isFr;
  final int currentStep;

  @override
  Widget build(BuildContext context) {
    final steps = isFr
        ? InvestorPortalContent.journeyStepsFr
        : InvestorPortalContent.journeyStepsEn;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isFr ? 'Progression du parcours' : 'Journey progress',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: List.generate(steps.length * 2 - 1, (i) {
            if (i.isOdd) {
              return Container(
                width: 4,
                height: 4,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
              );
            }
            final stepIndex = i ~/ 2;
            final done = stepIndex < currentStep;
            final active = stepIndex == currentStep;
            return Expanded(
              child: Container(
                height: 6,
                decoration: BoxDecoration(
                  color: done || active
                      ? AppColors.gold
                      : Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 6),
        Text(
          '↳ ${steps[currentStep.clamp(0, steps.length - 1)]}',
          style: const TextStyle(color: AppColors.gold, fontSize: 11),
        ),
      ],
    );
  }
}
