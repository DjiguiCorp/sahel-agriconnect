import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../widgets/web_action_tile.dart';

class ProcessorDashboard extends StatelessWidget {
  const ProcessorDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        title: const Text('Centre de transformation'),
        backgroundColor: AppColors.forestGreen,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.forestGreen, AppColors.sage],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Processeur',
                    style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
                SizedBox(height: 8),
                Text('Certification & lots',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Branchez ici les routes /api/processors et le flux de certification depuis sahelagriconnect.com.',
            style: TextStyle(color: AppColors.textMuted, height: 1.4),
          ),
          const SizedBox(height: 20),
          Text(
            'Réglages & web',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.forestGreen.withValues(alpha: 0.08),
                width: 0.5,
              ),
            ),
            child: const Column(
              children: [
                WebActionTile(
                  title: 'Delete my account',
                  description:
                      'Permanently remove your data from the platform',
                  action: 'delete-account',
                  icon: Icons.delete_outline,
                  isDangerous: true,
                ),
                Divider(height: 1),
                WebActionTile(
                  title: 'Change password',
                  description:
                      'Update your login credentials securely',
                  action: 'account/security',
                  icon: Icons.lock_outline,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
