import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';
import '../services/auth_service.dart';

class WebActionTile extends StatelessWidget {
  final String title;
  final String description;
  final String action;
  final String? opportunityId;
  final Color dangerColor;
  final IconData icon;
  final bool isDangerous;
  final Color? titleColor;
  final Color? subtitleColor;

  const WebActionTile({
    super.key,
    required this.title,
    required this.description,
    required this.action,
    required this.icon,
    this.opportunityId,
    this.dangerColor = const Color(0xFFA32D2D),
    this.isDangerous = false,
    this.titleColor,
    this.subtitleColor,
  });

  Future<void> _handleTap(BuildContext context) async {
    if (isDangerous) {
      final okBio = await AuthService.authenticateWithBiometrics(
        reason: 'Confirm $title',
      );
      if (!okBio || !context.mounted) return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          isDangerous
              ? 'This requires verification'
              : 'Continue on web',
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isDangerous) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCEBEB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF791F1F),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            Text(
              isDangerous
                  ? 'For your security, this action must be completed on our web platform with email confirmation.'
                  : 'We\'ll open your browser and you\'ll be logged in automatically.',
              style: const TextStyle(fontSize: 13),
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
              backgroundColor:
                  isDangerous ? dangerColor : AppColors.forestGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(isDangerous ? 'Open secure page' : 'Continue'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final handoffToken = await AuthService.getMobileHandoffToken(action);
    const base = 'https://sahelagriconnect.com';
    final String url;
    if (action == 'invest' && opportunityId != null) {
      url =
          '$base/afri-yield/opportunities/$opportunityId${handoffToken != null ? '?mtoken=$handoffToken' : ''}';
    } else {
      url = '$base/$action${handoffToken != null ? '?mtoken=$handoffToken' : ''}';
    }

    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: () => _handleTap(context),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isDangerous
              ? const Color(0xFFFCEBEB)
              : AppColors.forestGreen.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          icon,
          color: isDangerous ? dangerColor : AppColors.forestGreen,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: titleColor ?? (isDangerous ? dangerColor : null),
        ),
      ),
      subtitle: Text(
        description,
        style: TextStyle(
          fontSize: 12,
          color: subtitleColor ?? const Color(0xFF555555),
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
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
          ),
          const SizedBox(width: 4),
          const Icon(Icons.open_in_browser, size: 18, color: Colors.grey),
        ],
      ),
    );
  }
}
