import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

import '../services/auth_service.dart';
import '../services/guest_content_service.dart';

enum AuthRole { none, farmer, investor, cooperative, government, ngo, processor }

class AuthState extends ChangeNotifier {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  AuthRole _role = AuthRole.none;
  String? _token;
  Map<String, dynamic>? _user;
  bool _loading = true;

  /// True when the user explicitly chose "Explore as Guest" on the home
  /// screen. Not persisted across app launches — guests start fresh.
  /// Cleared automatically as soon as a real session is set.
  bool _isGuest = true;
  String _accountStatus = 'active';

  AuthRole get role => _role;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _token != null && _role != AuthRole.none;
  bool get isGuest => _isGuest && !isLoggedIn;
  bool get isPendingVetting => _accountStatus == 'pending_vetting';
  bool get isSuspended => _accountStatus == 'suspended';
  bool get canUseFullFeatures => isLoggedIn && !isPendingVetting;
  String get accountStatus => _accountStatus;

  String get displayName =>
      _user?['name']?.toString() ??
      _user?['nom']?.toString() ??
      _user?['cooperativeName']?.toString() ??
      '';

  String get displayEmail => _user?['email']?.toString() ?? '';
  String get displayCountry => _user?['country']?.toString() ?? '';
  String get countryCode => _user?['countryCode']?.toString() ?? '';

  /// Restores JWT from secure storage (called from [main] before [runApp]).
  Future<void> restoreSession() async {
    _loading = true;
    notifyListeners();

    try {
      for (final role in AuthRole.values.where((r) => r != AuthRole.none)) {
        final token = await _storage.read(key: 'token_${role.name}');
        if (token != null && token.isNotEmpty) {
          if (!JwtDecoder.isExpired(token)) {
            try {
              final raw = JwtDecoder.decode(token);
              final payload =
                  Map<String, dynamic>.from(raw as Map<dynamic, dynamic>);
              _role = role;
              _token = token;
              _user = payload;
              break;
            } catch (_) {
              await _storage.delete(key: 'token_${role.name}');
            }
          } else {
            await _storage.delete(key: 'token_${role.name}');
          }
        }
      }
    } catch (_) {}

    _loading = false;
    notifyListeners();
  }

  Future<void> setSession(
    AuthRole role,
    String token,
    Map<String, dynamic> userData,
  ) async {
    await _storage.write(key: 'token_${role.name}', value: token);
    _role = role;
    _token = token;
    _isGuest = false;
    _accountStatus = userData['accountStatus'] as String? ?? 'active';
    _user = userData;
    notifyListeners();
    AuthService.resetActivity();
  }

  /// Marks the user as a guest, allowing read-only browsing of the public
  /// content surfaced on the home screen without forcing a login.
  void continueAsGuest() {
    if (_isGuest) return;
    _isGuest = true;
    notifyListeners();
  }

  /// Clears guest mode (e.g. when navigating to a real login flow).
  void exitGuestMode() {
    if (!_isGuest) return;
    _isGuest = false;
    notifyListeners();
  }

  Future<void> logout() async {
    if (_role != AuthRole.none) {
      await _storage.delete(key: 'token_${_role.name}');
    }
    _role = AuthRole.none;
    _token = null;
    _user = null;
    await GuestContentService.clearCache();
    _isGuest = true;
    _accountStatus = 'active';
    notifyListeners();
    AuthService.cancelSessionTimer();
  }

  Future<void> logoutAll() async {
    for (final role in AuthRole.values.where((r) => r != AuthRole.none)) {
      await _storage.delete(key: 'token_${role.name}');
    }
    await _storage.delete(key: 'farmer_email');
    await _storage.delete(key: 'farmer_name');
    _role = AuthRole.none;
    _token = null;
    _user = null;
    await GuestContentService.clearCache();
    notifyListeners();
    AuthService.cancelSessionTimer();
  }

  Future<void> saveFarmerIdentity(String email, String name) async {
    await _storage.write(key: 'farmer_email', value: email);
    await _storage.write(key: 'farmer_name', value: name);
  }

  Future<String?> getFarmerEmail() => _storage.read(key: 'farmer_email');

  /// Returning-user lookup helpers for the farmer welcome-back screen.
  Future<String?> getSavedFarmerEmail() async =>
      _storage.read(key: 'farmer_email');
  Future<String?> getSavedFarmerName() async =>
      _storage.read(key: 'farmer_name');

  void startGuestSession() {
    _isGuest = true;
    _role = AuthRole.none;
    _token = null;
    notifyListeners();
  }
}
