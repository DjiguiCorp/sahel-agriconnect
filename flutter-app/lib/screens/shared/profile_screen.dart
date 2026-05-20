import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import 'webview_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final initials = auth.displayName.isNotEmpty
        ? auth.displayName
            .split(' ')
            .take(2)
            .map((w) => w.isNotEmpty ? w[0] : '')
            .join()
            .toUpperCase()
        : '?';

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: const Text('Profile & Settings'),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 0.5),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => context.push('/profile/edit'),
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: const Color(0xFF1a3c2e),
                        child: Text(
                          initials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: const BoxDecoration(
                            color: Color(0xFFB5850A),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.edit_rounded,
                            size: 12,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        auth.displayName.isNotEmpty
                            ? auth.displayName
                            : 'Set up your profile',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1a3c2e),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        auth.displayEmail.isNotEmpty
                            ? auth.displayEmail
                            : 'Tap to add email',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                      if (auth.displayCountry.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          '🌍 ${auth.displayCountry}',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[400],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/profile/edit'),
                  child: const Text(
                    'Edit',
                    style: TextStyle(
                      color: Color(0xFF1a3c2e),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          _sectionTitle('Account'),
          _settingsGroup([
            _tile(
              context,
              icon: Icons.person_outline_rounded,
              iconBg: const Color(0xFFEAF3DE),
              iconColor: const Color(0xFF3B6D11),
              title: 'Edit profile',
              subtitle: 'Name, region, crops, profile photo',
              onTap: () => context.push('/profile/edit'),
            ),
            _tile(
              context,
              icon: Icons.phone_outlined,
              iconBg: const Color(0xFFE6F1FB),
              iconColor: const Color(0xFF185FA5),
              title: 'Phone number',
              subtitle: 'Change requires verification code',
              onTap: () => context.push('/profile/change-phone'),
            ),
            _tile(
              context,
              icon: Icons.mail_outline_rounded,
              iconBg: const Color(0xFFE6F1FB),
              iconColor: const Color(0xFF185FA5),
              title: 'Email address',
              subtitle: 'Change requires verification code',
              onTap: () => context.push('/profile/change-email'),
            ),
            _tile(
              context,
              icon: Icons.language_rounded,
              iconBg: const Color(0xFFFAEEDA),
              iconColor: const Color(0xFF633806),
              title: 'Language',
              subtitle: 'English · Français · Bambara · Fulani',
              onTap: () => context.push('/profile/language'),
            ),
          ]),

          const SizedBox(height: 16),
          _sectionTitle('Notifications'),
          _settingsGroup([
            _tile(
              context,
              icon: Icons.notifications_outlined,
              iconBg: const Color(0xFFEAF3DE),
              iconColor: const Color(0xFF3B6D11),
              title: 'Notification settings',
              subtitle: 'Manage what you receive',
              onTap: () => context.push('/profile/notifications'),
            ),
          ]),

          const SizedBox(height: 16),
          _sectionTitle('Support'),
          _settingsGroup([
            _tile(
              context,
              icon: Icons.help_outline_rounded,
              iconBg: const Color(0xFFE6F1FB),
              iconColor: const Color(0xFF185FA5),
              title: 'Help center',
              subtitle: 'FAQs and guides',
              onTap: () => context.push('/help'),
            ),
            _tile(
              context,
              icon: Icons.chat_bubble_outline_rounded,
              iconBg: const Color(0xFFEAF3DE),
              iconColor: const Color(0xFF3B6D11),
              title: 'Contact us',
              subtitle: 'info@djiguicorporation.org',
              isExternal: true,
              onTap: () => launchUrl(
                Uri.parse('mailto:info@djiguicorporation.org'),
                mode: LaunchMode.externalApplication,
              ),
            ),
            _tile(
              context,
              icon: PhosphorIcons.whatsappLogo(),
              iconBg: const Color(0xFFEAF3DE),
              iconColor: const Color(0xFF3B6D11),
              title: 'WhatsApp support',
              subtitle: 'Chat with our team',
              isExternal: true,
              onTap: () => launchUrl(
                Uri.parse('https://wa.me/message/sahelagriconnect'),
                mode: LaunchMode.externalApplication,
              ),
            ),
          ]),

          const SizedBox(height: 16),
          _sectionTitle('Legal'),
          _settingsGroup([
            _tile(
              context,
              icon: Icons.lock_outline_rounded,
              iconBg: Colors.grey.shade100,
              iconColor: Colors.grey.shade600,
              title: 'Privacy policy',
              subtitle: 'How we protect your data',
              isExternal: true,
              onTap: () => _openWebView(
                context,
                'Privacy Policy',
                'https://sahelagriconnect.com/privacy',
              ),
            ),
            _tile(
              context,
              icon: Icons.description_outlined,
              iconBg: Colors.grey.shade100,
              iconColor: Colors.grey.shade600,
              title: 'Terms of use',
              subtitle: "Conditions d'utilisation",
              isExternal: true,
              onTap: () => _openWebView(
                context,
                'Terms of Use',
                'https://sahelagriconnect.com/terms',
              ),
            ),
            _tile(
              context,
              icon: Icons.info_outline_rounded,
              iconBg: Colors.grey.shade100,
              iconColor: Colors.grey.shade600,
              title: 'About Sahel AgriConnect',
              subtitle: 'Version 1.0.0 · Djigui Corporation',
              onTap: () => context.push('/about-app'),
            ),
          ]),

          const SizedBox(height: 16),
          _sectionTitle('Danger zone'),
          _settingsGroup([
            _tile(
              context,
              icon: Icons.delete_outline_rounded,
              iconBg: const Color(0xFFFCEBEB),
              iconColor: const Color(0xFFA32D2D),
              title: 'Delete account',
              subtitle: 'Permanent — requires verification',
              titleColor: const Color(0xFFA32D2D),
              trailing: _webBadge(),
              onTap: () => _handleDeleteAccount(context),
            ),
            _tile(
              context,
              icon: Icons.logout_rounded,
              iconBg: const Color(0xFFFAEEDA),
              iconColor: const Color(0xFF633806),
              title: 'Sign out',
              subtitle: 'You can sign back in anytime',
              onTap: () => _handleLogout(context),
            ),
          ]),

          const SizedBox(height: 24),
          Center(
            child: Text(
              'Sahel AgriConnect · Djigui Corporation · v1.0.0',
              style: TextStyle(fontSize: 11, color: Colors.grey[400]),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) => Padding(
        padding: const EdgeInsets.only(bottom: 8, left: 4),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.grey[600],
            letterSpacing: 0.5,
          ),
        ),
      );

  Widget _settingsGroup(List<Widget> children) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200, width: 0.5),
        ),
        child: Column(children: children),
      );

  Widget _tile(
    BuildContext context, {
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? titleColor,
    bool isExternal = false,
    Widget? trailing,
  }) =>
      InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: titleColor ?? const Color(0xFF1a1a1a),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                    ),
                  ],
                ),
              ),
              trailing ??
                  Icon(
                    isExternal
                        ? Icons.open_in_new_rounded
                        : Icons.chevron_right_rounded,
                    color: Colors.grey[400],
                    size: 18,
                  ),
            ],
          ),
        ),
      );

  Widget _webBadge() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFE6F1FB),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'Web',
          style: TextStyle(
            fontSize: 10,
            color: Color(0xFF185FA5),
            fontWeight: FontWeight.w600,
          ),
        ),
      );

  void _openWebView(BuildContext context, String title, String url) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (_) => InAppWebViewScreen(title: title, url: url),
      ),
    );
  }

  Future<void> _handleDeleteAccount(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFCEBEB),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'This permanently deletes your account and all your data. This action cannot be undone.',
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF791F1F),
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              "A verification code will be sent to your phone or email. You'll then be redirected to our secure web platform to complete the deletion.",
              style: TextStyle(fontSize: 13, height: 1.5),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFA32D2D),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      context.push('/profile/delete-account');
    }
  }

  Future<void> _handleLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1a3c2e),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await context.read<AuthState>().logout();
      if (context.mounted) context.go('/home');
    }
  }
}
