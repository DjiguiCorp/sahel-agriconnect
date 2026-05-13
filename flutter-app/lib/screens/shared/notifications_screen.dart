import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../services/api_service.dart';

typedef _NotifTypeStyle = ({
  String emoji,
  Color color,
  Color bg,
});

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;

  static const Map<String, _NotifTypeStyle> _typeConfig = {
    'training': (
      emoji: '📚',
      color: Color(0xFF3B6D11),
      bg: Color(0xFFEAF3DE),
    ),
    'cooperative_invitation': (
      emoji: '🤝',
      color: Color(0xFFB5850A),
      bg: Color(0xFFFAEEDA),
    ),
    'national_project': (
      emoji: '🏛️',
      color: Color(0xFF185FA5),
      bg: Color(0xFFE6F1FB),
    ),
    'produce_approved': (
      emoji: '✅',
      color: Color(0xFF3B6D11),
      bg: Color(0xFFEAF3DE),
    ),
    'milestone_released': (
      emoji: '🔒',
      color: Color(0xFF4ade80),
      bg: Color(0xFFD1FAE5),
    ),
    'new_opportunity': (
      emoji: '💰',
      color: Color(0xFFB5850A),
      bg: Color(0xFFFAEEDA),
    ),
    'benefits_milestone': (
      emoji: '🎁',
      color: Color(0xFF7c3aed),
      bg: Color(0xFFEDE9FE),
    ),
    'price_alerts': (
      emoji: '📈',
      color: Color(0xFFB5850A),
      bg: Color(0xFFFAEEDA),
    ),
  };

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadNotifications());
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    final token = context.read<AuthState>().token;
    if (token == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final res = await ApiService.get('/api/notifications/my', token: token);
      final raw = res['notifications'];
      final list = <Map<String, dynamic>>[];
      if (raw is List) {
        for (final e in raw) {
          if (e is Map) {
            list.add(Map<String, dynamic>.from(e));
          }
        }
      }
      if (mounted) {
        setState(() {
          _notifications = list;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = _notifications.where((n) => n['read'] != true).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Notifications'),
            if (unread > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFB5850A),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$unread',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1a3c2e),
                  ),
                ),
              ),
            ],
          ],
        ),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tab,
          indicatorColor: const Color(0xFFB5850A),
          labelColor: const Color(0xFFB5850A),
          unselectedLabelColor: Colors.white54,
          tabs: [
            Tab(text: 'All (${_notifications.length})'),
            Tab(text: 'Unread ($unread)'),
          ],
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF1a3c2e)),
            )
          : TabBarView(
              controller: _tab,
              children: [
                _buildList(_notifications),
                _buildList(
                  _notifications.where((n) => n['read'] != true).toList(),
                ),
              ],
            ),
    );
  }

  Widget _buildList(List<Map<String, dynamic>> items) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🔔', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(
              'No notifications yet',
              style: TextStyle(color: Colors.grey[500], fontSize: 15),
            ),
            const SizedBox(height: 6),
            Text(
              "We'll notify you about trainings, projects,\ncooperative updates and more.",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final n = items[i];
        final type = n['source'] as String? ?? 'training';
        final config = _typeConfig[type] ?? _typeConfig['training']!;
        final isUnread = n['read'] != true;

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isUnread ? Colors.white : Colors.white70,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isUnread
                  ? config.color.withValues(alpha: 0.2)
                  : Colors.grey.shade200,
              width: isUnread ? 1 : 0.5,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: config.bg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(config.emoji, style: const TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (n['message'] as String? ?? '').split('\n').first,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight:
                            isUnread ? FontWeight.w600 : FontWeight.w400,
                        color: const Color(0xFF1a1a1a),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatTime(n['createdAt']),
                      style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    ),
                  ],
                ),
              ),
              if (isUnread)
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: config.color,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  String _formatTime(dynamic ts) {
    if (ts == null) return '';
    try {
      final dt = DateTime.parse(ts.toString());
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return '';
    }
  }
}
