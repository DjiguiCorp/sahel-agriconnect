import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_service.dart';

bool _hasNetwork(List<ConnectivityResult> results) {
  return results.any((r) => r != ConnectivityResult.none);
}

class OfflineQueue extends ChangeNotifier {
  static const _queueKey = 'offline_queue';

  OfflineQueue() {
    _sub = Connectivity().onConnectivityChanged.listen(_onConnectivityChanged);
    Future.microtask(() async {
      await _loadQueue();
      await _checkInitial();
    });
  }

  StreamSubscription<List<ConnectivityResult>>? _sub;

  bool _isOnline = true;
  List<Map<String, dynamic>> _queue = [];

  bool get isOnline => _isOnline;
  int get queueLength => _queue.length;

  Future<void> _checkInitial() async {
    final result = await Connectivity().checkConnectivity();
    _isOnline = _hasNetwork(result);
    notifyListeners();
    if (_isOnline) await _flush();
  }

  Future<void> _onConnectivityChanged(List<ConnectivityResult> result) async {
    final wasOffline = !_isOnline;
    _isOnline = _hasNetwork(result);
    notifyListeners();
    if (wasOffline && _isOnline) await _flush();
  }

  Future<void> _loadQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw != null) {
      try {
        final list = json.decode(raw) as List<dynamic>;
        _queue = list
            .map((e) => e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{})
            .where((m) => m.isNotEmpty)
            .toList();
        notifyListeners();
      } catch (_) {}
    }
  }

  Future<void> _saveQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_queueKey, json.encode(_queue));
  }

  Future<void> enqueue({
    required String path,
    required Map<String, dynamic> body,
    required String label,
    String? token,
  }) async {
    _queue.add({
      'path': path,
      'body': body,
      'label': label,
      'token': token,
      'enqueuedAt': DateTime.now().toIso8601String(),
    });
    await _saveQueue();
    notifyListeners();
  }

  Future<void> _flush() async {
    if (_queue.isEmpty || !_isOnline) return;
    final toProcess = List<Map<String, dynamic>>.from(_queue);
    final failed = <Map<String, dynamic>>[];

    for (final item in toProcess) {
      final path = item['path'] as String?;
      final bodyRaw = item['body'];
      if (path == null || bodyRaw is! Map) {
        continue;
      }
      final res = await ApiService.post(
        path,
        Map<String, dynamic>.from(bodyRaw),
        token: item['token'] as String?,
      );
      if (res['success'] == false) {
        failed.add(item);
      }
    }

    _queue = failed;
    await _saveQueue();
    notifyListeners();
  }

  Future<void> retryNow() => _flush();

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
