import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutAppScreen extends StatelessWidget {
  const AboutAppScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: const Text('About'),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1a3c2e),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: const Center(
                    child: Text(
                      'SA',
                      style: TextStyle(
                        color: Color(0xFFB5850A),
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 0.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _AboutItem(
                  title: 'Sahel AgriConnect',
                  content: 'A pan-African agricultural platform connecting '
                      'farmers, cooperatives, investors and processors '
                      'across West Africa and the global diaspora.',
                ),
                const _AboutItem(
                  title: 'Version',
                  content: '1.1.0',
                ),
                const _AboutItem(
                  title: 'Mission',
                  content: 'Produce together. Sell further. Earn more.',
                ),
                const _AboutItem(
                  title: 'Website',
                  content: 'sahelagriconnect.com',
                  isLink: true,
                  url: 'https://sahelagriconnect.com',
                ),
                const _AboutItem(
                  title: 'Contact',
                  content: 'support@sahelagriconnect.com',
                  isLink: true,
                  url: 'mailto:support@sahelagriconnect.com',
                ),
                const Divider(height: 1),
                ListTile(
                  title: const Text(
                    'Terms of Service',
                    style: TextStyle(
                      color: Color(0xFF1a3c2e),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  trailing: const Icon(
                    Icons.arrow_forward_ios,
                    color: Colors.black54,
                    size: 16,
                  ),
                  onTap: () => context.push('/terms?view=1'),
                ),
                ListTile(
                  title: const Text(
                    'Privacy Policy',
                    style: TextStyle(
                      color: Color(0xFF1a3c2e),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  trailing: const Icon(
                    Icons.arrow_forward_ios,
                    color: Colors.black54,
                    size: 16,
                  ),
                  onTap: () => context.push('/terms?view=1'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AboutItem extends StatelessWidget {
  const _AboutItem({
    required this.title,
    required this.content,
    this.isLink = false,
    this.url,
  });

  final String title;
  final String content;
  final bool isLink;
  final String? url;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 6),
          if (isLink && url != null)
            InkWell(
              onTap: () => launchUrl(
                Uri.parse(url!),
                mode: LaunchMode.externalApplication,
              ),
              child: Text(
                content,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF185FA5),
                  decoration: TextDecoration.underline,
                ),
              ),
            )
          else
            Text(
              content,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF333333),
                height: 1.45,
              ),
            ),
        ],
      ),
    );
  }
}
