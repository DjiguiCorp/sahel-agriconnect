import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f2318),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: const Color(0xFF1a3c2e),
            pinned: true,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => context.pop(),
            ),
            title: const Text(
              'About',
              style: TextStyle(color: Colors.white),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF2d6a4f), Color(0xFF1a3c2e)],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.gold.withValues(alpha: 0.3),
                                blurRadius: 20,
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Text(
                              'SA',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Sahel AgriConnect',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Version 1.1.0',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Produce together. Sell further. Earn more.',
                          style: TextStyle(
                            color: AppColors.gold,
                            fontSize: 13,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  const _AboutCard(
                    icon: '🌍',
                    title: 'Our Mission',
                    content:
                        'Sahel AgriConnect is a pan-African agricultural '
                        'platform connecting farmers, cooperatives, investors, '
                        'processors and NGOs across West Africa and the global '
                        'diaspora. We digitize and strengthen agricultural '
                        'value chains for a more prosperous Africa.',
                  ),
                  const SizedBox(height: 12),
                  const _AboutCard(
                    icon: '🚀',
                    title: 'What We Do',
                    content:
                        '• Connect farmers directly with buyers and investors\n'
                        '• Provide AI-powered agricultural tools\n'
                        '• Facilitate cooperative management\n'
                        '• Enable transparent market price discovery\n'
                        '• Support the African diaspora to invest in agriculture',
                  ),
                  const SizedBox(height: 12),
                  _AboutCard(
                    icon: '📬',
                    title: 'Contact Us',
                    content:
                        'support@sahelagriconnect.com\nsahelagriconnect.com',
                    onTap: () => launchUrl(
                      Uri.parse('mailto:support@sahelagriconnect.com'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _AboutCard(
                    icon: '⚖️',
                    title: 'Legal',
                    content: 'Terms of Service  •  Privacy Policy',
                    onTap: () => context.push('/terms?view=1'),
                  ),
                  const SizedBox(height: 32),
                  Center(
                    child: Text(
                      '© 2026 DjiguiCorp. All rights reserved.',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.25),
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Backwards-compatible route target for `/about-app`.
class AboutAppScreen extends StatelessWidget {
  const AboutAppScreen({super.key});

  @override
  Widget build(BuildContext context) => const AboutScreen();
}

class _AboutCard extends StatelessWidget {
  const _AboutCard({
    required this.icon,
    required this.title,
    required this.content,
    this.onTap,
  });

  final String icon;
  final String title;
  final String content;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1e4535), Color(0xFF162e24)],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(icon, style: const TextStyle(fontSize: 20)),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (onTap != null) ...[
                  const Spacer(),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 14,
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(
              content,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.65),
                fontSize: 13,
                height: 1.6,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
