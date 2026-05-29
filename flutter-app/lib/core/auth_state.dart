import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/auth_service.dart';
import '../services/biometric_service.dart';
import '../services/guest_content_service.dart';

enum AuthRole { none, farmer, investor, cooperative, government, ngo, processor }

class AuthState extends ChangeNotifier {
  /// Optional hook for post-logout navigation (e.g. return to [/home]).
  VoidCallback? onLogout;

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const String _seedKey = 'session_seed';
  static const String _savedRoleKey = 'saved_role';

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
              _isGuest = false;
              _accountStatus =
                  payload['accountStatus'] as String? ?? 'active';
              final prefs = await SharedPreferences.getInstance();
              await prefs.setString('auth_token', token);
              await prefs.setString('auth_role', role.toString());
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

    if (_token == null) {
      _isGuest = true;
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        final roleStr = prefs.getString('auth_role');
        if (token != null &&
            token.isNotEmpty &&
            roleStr != null &&
            !JwtDecoder.isExpired(token)) {
          final role = AuthRole.values.firstWhere(
            (r) => r.toString() == roleStr,
            orElse: () => AuthRole.none,
          );
          if (role != AuthRole.none) {
            final raw = JwtDecoder.decode(token);
            _role = role;
            _token = token;
            _user = Map<String, dynamic>.from(raw as Map<dynamic, dynamic>);
            _isGuest = false;
            _accountStatus = _user?['accountStatus'] as String? ?? 'active';
          }
        }
      } catch (_) {}
    }

    _loading = false;
    notifyListeners();
  }

  Future<void> setSession(
    AuthRole role,
    String token,
    Map<String, dynamic> userData,
  ) async {
    await _storage.write(key: 'token_${role.name}', value: token);
    // sessionSeed is passed separately when available (from OTP login response)
    // Stored here via storeSeed() — see below.
    _role = role;
    _token = token;
    _isGuest = false;
    _accountStatus = userData['accountStatus'] as String? ?? 'active';
    _user = userData;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('auth_role', role.toString());

    notifyListeners();
    AuthService.resetActivity();
  }

  /// Called after a successful OTP login when the backend returns a sessionSeed.
  /// Stores it permanently (survives logout) for biometric re-login.
  Future<void> storeSeed(String seed, String role) async {
    await _storage.write(key: _seedKey, value: seed);
    await _storage.write(key: _savedRoleKey, value: role);
  }

  /// Returns the stored sessionSeed if present (used for biometric re-login).
  Future<String?> getSavedSeed() => _storage.read(key: _seedKey);

  /// Returns the role associated with the saved seed.
  Future<String?> getSavedRole() => _storage.read(key: _savedRoleKey);

  /// True if the user opted in and a device seed exists for biometric re-login.
  Future<bool> hasSavedSession() async {
    if (!await BiometricService.isOptedIn()) return false;
    final seed = await getSavedSeed();
    return seed != null && seed.isNotEmpty;
  }

  /// Saves seed and marks biometric quick sign-in as enabled (after OS prompt).
  Future<void> enableBiometricRelogin(String seed, String role) async {
    await storeSeed(seed, role);
    await BiometricService.setOptedIn(true);
  }

  /// Disables biometric re-login and removes the stored device seed.
  Future<void> disableBiometricRelogin() async {
    await clearSeed();
  }

  /// Clears the device seed (called only when user explicitly asks to
  /// "sign out of all devices" or when silent-refresh returns SESSION_EXPIRED).
  Future<void> clearSeed() async {
    await _storage.delete(key: _seedKey);
    await _storage.delete(key: _savedRoleKey);
    await BiometricService.setOptedIn(false);
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

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_role');

    onLogout?.call();
    notifyListeners();
    AuthService.cancelSessionTimer();
  }

  Future<void> logoutAll() async {
    for (final role in AuthRole.values.where((r) => r != AuthRole.none)) {
      await _storage.delete(key: 'token_${role.name}');
    }
    await _storage.delete(key: _seedKey);
    await _storage.delete(key: _savedRoleKey);
    await _storage.delete(key: 'farmer_email');
    await _storage.delete(key: 'farmer_name');
    _role = AuthRole.none;
    _token = null;
    _user = null;
    await GuestContentService.clearCache();
    _isGuest = true;
    _accountStatus = 'active';

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_role');

    onLogout?.call();
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

  Future<void> clearSavedFarmerIdentity() async {
    await _storage.delete(key: 'farmer_email');
    await _storage.delete(key: 'farmer_name');
  }

  void startGuestSession() {
    _isGuest = true;
    _role = AuthRole.none;
    _token = null;
    notifyListeners();
  }

  /// Updates display fields locally (until a profile API is wired).
  void updateLocalProfile({
    String? name,
    String? email,
    String? phone,
    String? country,
  }) {
    _user ??= <String, dynamic>{};
    if (name != null) {
      _user!['name'] = name;
      _user!['nom'] = name;
    }
    if (email != null) _user!['email'] = email;
    if (phone != null) _user!['phone'] = phone;
    if (country != null) _user!['country'] = country;
    notifyListeners();
  }

  String get displayPhone => _user?['phone']?.toString() ?? '';
}
