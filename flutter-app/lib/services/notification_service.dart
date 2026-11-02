import 'package:flutter/foundation.dart';

/// Push/Firebase disabled for iOS crash isolation.
class NotificationService {
  static Future<void> init() async {
    debugPrint('NotificationService.init skipped: Firebase fully disabled');
  }
}
