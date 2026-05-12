import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'auth_service.dart';
import 'api_service.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    try {
      await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings();
      const macos = DarwinInitializationSettings();
      await _localNotifications.initialize(
        const InitializationSettings(
          android: android,
          iOS: ios,
          macOS: macos,
        ),
      );

      final token = await _messaging.getToken();
      if (token != null) await _registerToken(token);

      _messaging.onTokenRefresh.listen(_registerToken);

      FirebaseMessaging.onMessage.listen(_handleForeground);

      FirebaseMessaging.onMessageOpenedApp.listen(_handleTap);
    } catch (e, st) {
      debugPrint('NotificationService.init failed: $e');
      debugPrint('$st');
    }
  }

  static Future<void> _registerToken(String token) async {
    try {
      final savedToken = await AuthService.getAnyStoredJwt();
      if (savedToken == null) return;
      await ApiService.post(
        '/api/auth/fcm-token',
        {'fcmToken': token},
        token: savedToken,
      );
    } catch (_) {}
  }

  static Future<void> _handleForeground(RemoteMessage message) async {
    if (kIsWeb) return;
    final notification = message.notification;
    if (notification == null) return;
    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'sahel_main',
          'Sahel AgriConnect',
          channelDescription: 'Platform notifications',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
    );
  }

  static void _handleTap(RemoteMessage message) {
    final data = message.data;
    if (data.isEmpty) return;
    // Route based on notification type, e.g. milestone_released → escrow
    debugPrint('FCM opened: ${data['type']}');
  }
}
