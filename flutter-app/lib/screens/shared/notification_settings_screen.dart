import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/language_provider.dart';
import '../../core/theme.dart';

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
    'price_alerts': true,
    'platform_updates': false,
  };

  static const Map<String, (String, String, String, String)> _labels = {
    'training': (
      'Training availability',
      'Formations disponibles',
      'New programs and courses near you',
      'Nouveaux programmes et cours près de chez vous',
    ),
    'government_projects': (
      'Government projects',
      'Projets gouvernementaux',
      'National broadcasts from your country',
      'Diffusions nationales de votre pays',
    ),
    'cooperative_invitations': (
      'Cooperative invitations',
      'Invitations coopératives',
      'When a cooperative invites you to join',
      'Quand une coopérative vous invite à rejoindre',
    ),
    'produce_updates': (
      'Produce status updates',
      'Mises à jour des productions',
      'Approvals, rejections, and promotions',
      'Approbations, refus et promotions',
    ),
    'milestone_releases': (
      'Milestone releases',
      'Déblocages d\'étapes',
      'When escrow funds are released (investors)',
      'Quand les fonds séquestre sont libérés (investisseurs)',
    ),
    'new_opportunities': (
      'New investment opportunities',
      'Nouvelles opportunités d\'investissement',
      'Matching your Track interest',
      'Correspondant à vos intérêts Track',
    ),
    'price_alerts': (
      'Price alerts',
      'Alertes de prix',
      'Commodity price movements',
      'Mouvements des prix des matières',
    ),
    'platform_updates': (
      'Platform updates',
      'Mises à jour plateforme',
      'New features and announcements',
      'Nouvelles fonctionnalités et annonces',
    ),
  };

  static const _bg = AppColors.darkBg;
  static const _surface = Color(0xFF1a3530);
  static const _text = Colors.white;
  static const _muted = Color(0x99FFFFFF);
  static const _accent = Color(0xFF1D9E75);

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
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: _text,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          onPressed: () => context.pop(),
        ),
        title: Text(
          lp.t('Notification settings', 'Paramètres de notifications'),
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: _accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _accent.withValues(alpha: 0.25)),
                ),
                child: Text(
                  lp.t(
                    'Choose which notifications you want to receive. You can change these at any time.',
                    'Choisissez les notifications que vous souhaitez recevoir. Vous pouvez les modifier à tout moment.',
                  ),
                  style: const TextStyle(
                    fontSize: 12,
                    color: _text,
                    height: 1.5,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: _surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Column(
                  children: _settings.entries.map((entry) {
                    final labels = _labels[entry.key]!;

                    return Padding(
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
                                Text(
                                  lp.t(labels.$1, labels.$2),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: _text,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  lp.t(labels.$3, labels.$4),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: _muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch.adaptive(
                            value: entry.value,
                            onChanged: (v) => _toggle(entry.key, v),
                            activeTrackColor: _accent,
                            inactiveTrackColor:
                                Colors.white.withValues(alpha: 0.15),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
