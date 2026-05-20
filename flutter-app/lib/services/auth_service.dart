import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

import 'api_service.dart';

class AuthService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static final _localAuth = LocalAuthentication();
  static Future<void> saveToken(String role, String token) async {
    await _storage.write(key: 'token_$role', value: token);
  }

  static Future<String?> getToken(String role) =>
      _storage.read(key: 'token_$role');

  /// First non-empty JWT among known portal roles (for FCM registration & handoff).
  static void cancelSessionTimer() {}

  static Future<String?> getAnyStoredJwt() async {
    for (final role in [
      'investor',
      'cooperative',
      'government',
      'farmer',
      'processor',
    ]) {
      final t = await getToken(role);
      if (t != null && t.isNotEmpty) return t;
    }
    return null;
  }

  static Future<void> logout(String role) async {
    await _storage.delete(key: 'token_$role');
    cancelSessionTimer();
  }

  static Future<bool> authenticateWithBiometrics({
    String reason = 'Verify your identity',
  }) async {
    try {
      final supported = await _localAuth.isDeviceSupported();
      if (!supported) return true;
      final biometrics = await _localAuth.getAvailableBiometrics();
      if (biometrics.isEmpty) return true;
      return _localAuth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } catch (_) {
      return false;
    }
  }

  /// Sessions persist until explicit sign-out or JWT expiry on restore.
  static void resetActivity() {}

  static Future<String?> getMobileHandoffToken(String action) async {
    try {
      final token = await getToken('investor') ??
          await getToken('cooperative') ??
          await getToken('government') ??
          await getToken('farmer') ??
          await getToken('processor');
      if (token == null) return null;
      final response = await ApiService.post(
        '/api/auth/mobile-handoff-token',
        {'action': action},
        token: token,
      );
      final handoff = response['handoffToken'];
      return handoff is String ? handoff : null;
    } catch (_) {
      return null;
    }
  }
}
