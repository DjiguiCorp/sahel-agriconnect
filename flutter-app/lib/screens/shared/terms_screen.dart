import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/glass.dart';
import '../../core/language_provider.dart';
import '../../core/terms_refresh.dart';
import '../../core/theme.dart';

const _termsUrl = 'https://sahelagriconnect.com/terms-of-service';
const _privacyUrl = 'https://sahelagriconnect.com/privacy-policy';
const _agreementUrl = 'https://sahelagriconnect.com/user-agreement';

/// Terms of Service, Privacy Policy, and User Agreement.
class TermsScreen extends StatefulWidget {
  const TermsScreen({
    super.key,
    this.viewOnly = false,
    this.initialTabIndex = 0,
  });

  /// When true (e.g. opened from login), user can read without re-accepting.
  final bool viewOnly;

  /// 0 = Terms, 1 = Privacy, 2 = User Agreement.
  final int initialTabIndex;

  static const termsAcceptedKey = 'terms_accepted';

  static Future<bool> hasAccepted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(termsAcceptedKey) ?? false;
  }

  @override
  State<TermsScreen> createState() => _TermsScreenState();
}

class _TermsScreenState extends State<TermsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  bool _agreed = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialTabIndex.clamp(0, 2),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _acceptAndContinue() async {
    if (!_agreed || _saving) return;
    setState(() => _saving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(TermsScreen.termsAcceptedKey, true);
      if (!mounted) return;
      context.read<TermsRefresh>().onAccepted();
      context.go('/home');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: const Color(0xFF0a1f14),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0a1f14), Color(0xFF1a3c2e)],
          ),
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (widget.viewOnly)
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.arrow_back_ios_new_rounded),
                        color: Colors.white,
                      ),
                      Expanded(
                        child: Text(
                          lp.t(
                            'Terms of Service & Privacy Policy',
                            'Conditions d\'utilisation et politique de confidentialité',
                          ),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lp.t(
                          'Welcome to Sahel AgriConnect',
                          'Bienvenue sur Sahel AgriConnect',
                        ),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        lp.t(
                          'Please review and accept our policies to continue.',
                          'Veuillez lire et accepter nos politiques pour continuer.',
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.65),
                          fontSize: 14,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  labelColor: AppColors.gold,
                  unselectedLabelColor: Colors.white.withValues(alpha: 0.5),
                  indicatorColor: AppColors.gold,
                  indicatorWeight: 2.5,
                  labelStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                  tabs: [
                    Tab(
                      text: lp.t(
                        'Terms of Service',
                        'Conditions d\'utilisation',
                      ),
                    ),
                    Tab(
                      text: lp.t(
                          'Privacy Policy', 'Politique de confidentialité'),
                    ),
                    Tab(
                      text: lp.t('User Agreement', 'Accord utilisateur'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _LegalScroll(
                      sections: _termsOfServiceSections(lp),
                      webUrl: _termsUrl,
                      lp: lp,
                    ),
                    _LegalScroll(
                      sections: _privacyPolicySections(lp),
                      webUrl: _privacyUrl,
                      lp: lp,
                    ),
                    _LegalScroll(
                      sections: _userAgreementSections(lp),
                      webUrl: _agreementUrl,
                      lp: lp,
                    ),
                  ],
                ),
              ),
              if (!widget.viewOnly)
                Container(
                  padding: EdgeInsets.fromLTRB(
                    20,
                    12,
                    20,
                    16 + MediaQuery.of(context).padding.bottom,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.darkBg.withValues(alpha: 0.92),
                    border: Border(
                      top: BorderSide(
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      InkWell(
                        onTap: () => setState(() => _agreed = !_agreed),
                        borderRadius: BorderRadius.circular(10),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(
                                width: 24,
                                height: 24,
                                child: Checkbox(
                                  value: _agreed,
                                  onChanged: (v) =>
                                      setState(() => _agreed = v ?? false),
                                  activeColor: AppColors.gold,
                                  checkColor: AppColors.forestGreen,
                                  side: BorderSide(
                                    color: Colors.white.withValues(alpha: 0.4),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  lp.t(
                                    'I have read and agree to the Terms, '
                                        'Privacy Policy and User Agreement',
                                    'J\'ai lu et j\'accepte les Conditions, '
                                        'la Politique de confidentialité et '
                                        'l\'Accord utilisateur',
                                  ),
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.85),
                                    fontSize: 13,
                                    height: 1.45,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed:
                              _agreed && !_saving ? _acceptAndContinue : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: AppColors.forestGreen,
                            disabledBackgroundColor:
                                AppColors.gold.withValues(alpha: 0.35),
                            disabledForegroundColor:
                                AppColors.forestGreen.withValues(alpha: 0.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: _saving
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.forestGreen,
                                  ),
                                )
                              : Text(
                                  lp.t(
                                    'Accept & Continue',
                                    'Accepter et continuer',
                                  ),
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  List<({String title, List<String> bullets})> _termsOfServiceSections(
    LanguageProvider lp,
  ) =>
      [
        (
          title: lp.t('Overview', 'Aperçu'),
          bullets: [
            lp.t(
              'Sahel AgriConnect is a platform for agricultural commerce '
                  'connecting producers, cooperatives, and investors across '
                  'West Africa and the diaspora.',
              'Sahel AgriConnect est une plateforme de commerce agricole '
                  'reliant producteurs, coopératives et investisseurs en Afrique '
                  'de l\'Ouest et dans la diaspora.',
            ),
          ],
        ),
        (
          title: lp.t('Your responsibilities', 'Vos responsabilités'),
          bullets: [
            lp.t(
              'You must provide accurate and up-to-date information when '
                  'registering and using the platform.',
              'Vous devez fournir des informations exactes et à jour lors '
                  'de l\'inscription et de l\'utilisation de la plateforme.',
            ),
            lp.t(
              'Account vetting is required before full access to platform '
                  'features is granted.',
              'Un examen de compte est requis avant l\'accès complet aux '
                  'fonctionnalités.',
            ),
            lp.t(
              'You must be at least 18 years old to use this platform.',
              'Vous devez avoir au moins 18 ans pour utiliser cette plateforme.',
            ),
          ],
        ),
        (
          title: lp.t('Liability & disputes', 'Responsabilité et litiges'),
          bullets: [
            lp.t(
              'The platform is not liable for commercial transactions '
                  'conducted between users.',
              'La plateforme n\'est pas responsable des transactions '
                  'commerciales entre utilisateurs.',
            ),
            lp.t(
              'Disputes are resolved under applicable local law.',
              'Les litiges sont résolus selon le droit local applicable.',
            ),
            lp.t(
              'Accounts may be terminated for violations of these policies.',
              'Les comptes peuvent être résiliés en cas de violation de '
                  'ces politiques.',
            ),
          ],
        ),
      ];

  List<({String title, List<String> bullets})> _privacyPolicySections(
    LanguageProvider lp,
  ) =>
      [
        (
          title: lp.t('Data we collect', 'Données collectées'),
          bullets: [
            lp.t(
              'Name, phone number, email address, location, and crop '
                  'information.',
              'Nom, téléphone, email, localisation et informations sur les cultures.',
            ),
          ],
        ),
        (
          title: lp.t('How we use data', 'Utilisation des données'),
          bullets: [
            lp.t(
              'Platform matching between farmers, cooperatives, and investors.',
              'Mise en relation entre agriculteurs, coopératives et investisseurs.',
            ),
            lp.t(
              'Market price information and notifications.',
              'Informations sur les prix du marché et notifications.',
            ),
            lp.t(
              'Data is shared with cooperatives and investors you choose to '
                  'engage with.',
              'Les données sont partagées avec les coopératives et investisseurs '
                  'avec lesquels vous interagissez.',
            ),
            lp.t(
              'We do NOT sell your data to third parties.',
              'Nous ne vendons PAS vos données à des tiers.',
            ),
          ],
        ),
        (
          title: lp.t('Your rights', 'Vos droits'),
          bullets: [
            lp.t(
              'You may request data deletion at privacy@sahelagriconnect.com or sahelagriconnect.com/delete-account.',
              'Suppression des données : privacy@sahelagriconnect.com ou sahelagriconnect.com/delete-account.',
            ),
            lp.t(
              'Cookies are used for session management only.',
              'Les cookies sont utilisés uniquement pour la gestion de session.',
            ),
            lp.t(
              'Our practices are GDPR compliant for EU and diaspora users.',
              'Nos pratiques sont conformes au RGPD pour les utilisateurs UE '
                  'et de la diaspora.',
            ),
          ],
        ),
      ];

  List<({String title, List<String> bullets})> _userAgreementSections(
    LanguageProvider lp,
  ) =>
      [
        (
          title: lp.t('Your commitments', 'Vos engagements'),
          bullets: [
            lp.t(
              'You agree to make truthful declarations of produce and '
                  'production data.',
              'Vous acceptez de déclarer honnêtement vos produits et données '
                  'de production.',
            ),
            lp.t(
              'You agree not to manipulate market prices or misrepresent '
                  'supply or demand.',
              'Vous acceptez de ne pas manipuler les prix du marché ni de '
                  'fausser l\'offre ou la demande.',
            ),
            lp.t(
              'You agree to the platform\'s account vetting process.',
              'Vous acceptez le processus d\'examen de compte de la plateforme.',
            ),
          ],
        ),
        (
          title: lp.t('Communications', 'Communications'),
          bullets: [
            lp.t(
              'You agree to receive SMS and email notifications related to '
                  'your account and platform activity.',
              'Vous acceptez de recevoir des notifications SMS et email '
                  'liées à votre compte et à l\'activité de la plateforme.',
            ),
            lp.t(
              'You may withdraw consent at any time via your profile settings '
                  'or by contacting support.',
              'Vous pouvez retirer votre consentement à tout moment via les '
                  'paramètres du profil ou en contactant le support.',
            ),
          ],
        ),
      ];
}

class _LegalScroll extends StatelessWidget {
  const _LegalScroll({
    required this.sections,
    required this.webUrl,
    required this.lp,
  });

  final List<({String title, List<String> bullets})> sections;
  final String webUrl;
  final LanguageProvider lp;

  Future<void> _openFull() async {
    final uri = Uri.parse(webUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      // ignore: avoid_print
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GlassCard(
            borderColor: AppColors.gold.withValues(alpha: 0.35),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  lp.t(
                    'Full legal document on the web',
                    'Document juridique complet en ligne',
                  ),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  webUrl,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 44,
                  child: ElevatedButton.icon(
                    onPressed: _openFull,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: AppColors.forestGreen,
                    ),
                    icon: const Icon(Icons.open_in_new, size: 18),
                    label: Text(
                      lp.t('View full document', 'Voir le document complet'),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          for (final section in sections)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GlassCard(
                borderColor: const Color(0xFF1D9E75).withValues(alpha: 0.25),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.title,
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    for (final bullet in section.bullets)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '•  ',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.7),
                                fontSize: 14,
                                height: 1.55,
                              ),
                            ),
                            Expanded(
                              child: Text(
                                bullet,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.82),
                                  fontSize: 14,
                                  height: 1.55,
                                ),
                              ),
                            ),
                          ],
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
}
