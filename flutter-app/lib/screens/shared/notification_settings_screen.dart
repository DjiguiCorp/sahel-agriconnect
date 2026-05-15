import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/auth_state.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotifSettingsState();
}

class _NotifSettingsState extends State<NotificationSettingsScreen> {
  final Map<String, bool> _settings = {
    'training': true,
    'government_projects': true,
    'cooperative_invitations': true,
    'produce_updates': true,
    'milestone_releases': true,
    'new_opportunities': true,
    'price_alerts': false,
    'platform_updates': false,
  };

  static const Map<String, (String, String)> _labels = {
    'training': (
      'Training availability',
      'New programs and courses near you',
    ),
    'government_projects': (
      'Government projects',
      'National broadcasts from your country',
    ),
    'cooperative_invitations': (
      'Cooperative invitations',
      'When a cooperative invites you to join',
    ),
    'produce_updates': (
      'Produce status updates',
      'Approvals, rejections, and promotions',
    ),
    'milestone_releases': (
      'Milestone releases',
      'When escrow funds are released (investors)',
    ),
    'new_opportunities': (
      'New investment opportunities',
      'Matching your Track interest',
    ),
    'price_alerts': (
      'Price alerts',
      'Commodity price movements (Premium)',
    ),
    'platform_updates': (
      'Platform updates',
      'New features and announcements',
    ),
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      for (final key in _settings.keys) {
        _settings[key] = prefs.getBool('notif_$key') ?? _settings[key]!;
      }
    });
  }

  Future<void> _toggle(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notif_$key', value);
    if (mounted) setState(() => _settings[key] = value);
  }

  @override
  Widget build(BuildContext context) {
    final isPremium = context.watch<AuthState>().user?['isPremium'] == true;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: const Text('Notification settings'),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF3DE),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'Choose which notifications you want to receive. You can change these at any time.',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF3B6D11),
                height: 1.5,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 0.5),
            ),
            child: Column(
              children: _settings.entries.map((entry) {
                final labels = _labels[entry.key]!;
                final isPremiumFeature = entry.key == 'price_alerts';
                final isLocked = isPremiumFeature && !isPremium;

                return Opacity(
                  opacity: isLocked ? 0.5 : 1.0,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    labels.$1,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF1a1a1a),
                                    ),
                                  ),
                                  if (isPremiumFeature) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFAEEDA),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Text(
                                        'Premium',
                                        style: TextStyle(
                                          fontSize: 9,
                                          color: Color(0xFF633806),
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                labels.$2,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch.adaptive(
                          value: entry.value,
                          onChanged:
                              isLocked ? null : (v) => _toggle(entry.key, v),
                          activeTrackColor: const Color(0xFF1a3c2e),
                          inactiveTrackColor: Colors.grey.shade300,
                          thumbColor: WidgetStateProperty.resolveWith((states) {
                            if (states.contains(WidgetState.selected)) {
                              return Colors.white;
                            }
                            return Colors.grey.shade100;
                          }),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
