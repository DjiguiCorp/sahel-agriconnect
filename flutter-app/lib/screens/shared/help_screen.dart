import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/glass.dart';
import '../../core/language_provider.dart';
import '../../core/safe_insets.dart';
import '../../core/theme.dart';

const _bg = Color(0xFF0a1f14);
const _playStore =
    'https://play.google.com/store/apps/details?id=com.sahelagriconnect.app';
const _appStore = 'https://apps.apple.com/us/search?term=Sahel%20AgriConnect';
const _whatsapp = 'https://wa.me/12152175381';
const _helpWeb = 'https://sahelagriconnect.com/help-center';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  final _searchCtrl = TextEditingController();
  String _search = '';
  int? _openFaq;

  static const _faqs = [
    (
      'Comment créer un compte agriculteur?',
      'How do I create a farmer account?',
      'Téléchargez l\'application, sélectionnez Agriculteur et entrez votre email ou téléphone pour recevoir un lien de connexion.',
      'Download the app, select Farmer, and enter your email or phone for a magic sign-in link.',
    ),
    (
      'Comment s\'inscrire en coopérative?',
      'How do I register as a cooperative?',
      'Visitez sahelagriconnect.com/cooperative-registration sur ordinateur.',
      'Visit sahelagriconnect.com/cooperative-registration on your computer.',
    ),
    (
      'Comment fonctionne AfriYield Exchange?',
      'How does AfriYield Exchange work?',
      'Les investisseurs de la diaspora financent des coopératives certifiées avec protection escrow.',
      'Diaspora investors fund certified cooperatives with escrow protection.',
    ),
    (
      'Mes données sont-elles sécurisées?',
      'Is my data secure?',
      'Oui. Chiffrement en transit et au repos. Conformité RGPD et OHADA.',
      'Yes. Encrypted in transit and at rest. GDPR and OHADA compliant.',
    ),
    (
      'Comment supprimer mon compte?',
      'How do I delete my account?',
      'Visitez sahelagriconnect.com/delete-account ou privacy@sahelagriconnect.com',
      'Visit sahelagriconnect.com/delete-account or email privacy@sahelagriconnect.com',
    ),
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open link')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final isFr = lp.locale.languageCode == 'fr';
    final q = _search.toLowerCase();
    final faqs = _faqs.where((f) {
      if (q.isEmpty) return true;
      return f.$1.toLowerCase().contains(q) ||
          f.$2.toLowerCase().contains(q) ||
          f.$3.toLowerCase().contains(q) ||
          f.$4.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: _bg,
      appBar: AppBar(
        title: Text(lp.t('Help Center', 'Centre d\'aide')),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bg, Color(0xFF1a3c2e)],
          ),
        ),
        child: ListView(
          padding: SafeInsets.listBottom(context, glassNav: false, extra: 20),
          children: [
            Text(
              lp.t('How can we help?', 'Comment pouvons-nous vous aider ?'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _search = v),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: lp.t('Search help...', 'Rechercher...'),
                    hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
                    prefixIcon: Icon(Icons.search, color: Colors.white.withValues(alpha: 0.5)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.06),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: const Color(0xFF1D9E75).withValues(alpha: 0.3)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: const Color(0xFF1D9E75).withValues(alpha: 0.3)),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              lp.t('Download the app', 'Téléchargez l\'application'),
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _storeButton(
                    label: 'Google Play',
                    icon: Icons.android,
                    onTap: () => _open(_playStore),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _storeButton(
                    label: 'App Store',
                    icon: Icons.apple,
                    onTap: () => _open(_appStore),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _contactCard(
              icon: Icons.chat,
              title: 'WhatsApp',
              subtitle: lp.t('Response within 24h', 'Réponse sous 24h'),
              color: const Color(0xFF25D366),
              onTap: () => _open(_whatsapp),
            ),
            const SizedBox(height: 10),
            _contactCard(
              icon: Icons.mail_outline,
              title: 'Email',
              subtitle: 'support@sahelagriconnect.com',
              color: const Color(0xFF60a5fa),
              onTap: () => _open('mailto:support@sahelagriconnect.com'),
            ),
            const SizedBox(height: 10),
            _contactCard(
              icon: Icons.language,
              title: lp.t('Help website', 'Site d\'aide'),
              subtitle: 'sahelagriconnect.com/help-center',
              color: AppColors.gold,
              onTap: () => _open(_helpWeb),
            ),
            const SizedBox(height: 24),
            Text(
              lp.t('FAQ', 'Questions fréquentes'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            if (faqs.isEmpty)
              Text(
                lp.t('No results', 'Aucun résultat'),
                style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
              )
            else
              ...faqs.asMap().entries.map((e) {
                final i = e.key;
                final f = e.value;
                final open = _openFaq == i;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: GlassCard(
                    borderColor: const Color(0xFF1D9E75).withValues(alpha: 0.25),
                    onTap: () => setState(() => _openFaq = open ? null : i),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                isFr ? f.$1 : f.$2,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            Icon(
                              open ? Icons.expand_less : Icons.expand_more,
                              color: const Color(0xFF1D9E75),
                            ),
                          ],
                        ),
                        if (open) ...[
                          const SizedBox(height: 10),
                          Text(
                            isFr ? f.$3 : f.$4,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _storeButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: AppColors.gold.withValues(alpha: 0.2),
                blurRadius: 12,
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: const Color(0xFF1a3c2e), size: 22),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF1a3c2e),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      );

  Widget _contactCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) =>
      GlassCard(
        borderColor: color.withValues(alpha: 0.35),
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 14),
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
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.3)),
          ],
        ),
      );
}
