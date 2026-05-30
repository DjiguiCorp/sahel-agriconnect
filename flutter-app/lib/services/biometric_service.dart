import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Device biometric types available for quick sign-in.
enum BiometricKind {
  none,
  fingerprint,
  face,
  iris,
  multiple,
}

class BiometricCapability {
  const BiometricCapability({
    required this.kind,
    required this.deviceSupported,
    required this.canCheckBiometrics,
    required this.availableTypes,
  });

  final BiometricKind kind;
  final bool deviceSupported;
  final bool canCheckBiometrics;
  final List<BiometricType> availableTypes;

  /// True when the device can show a biometric or device-credential prompt.
  bool get isAvailable =>
      deviceSupported && (canCheckBiometrics || availableTypes.isNotEmpty);

  bool get hasFace =>
      kind == BiometricKind.face ||
      kind == BiometricKind.multiple ||
      availableTypes.contains(BiometricType.face);

  bool get hasFingerprint =>
      kind == BiometricKind.fingerprint ||
      kind == BiometricKind.multiple ||
      availableTypes.contains(BiometricType.fingerprint) ||
      availableTypes.contains(BiometricType.strong) ||
      availableTypes.contains(BiometricType.weak);
}

/// Biometric opt-in, capability checks, and system enrollment prompts.
///
/// On Android, native [BiometricBridge] uses
/// `BiometricManager.canAuthenticate(BIOMETRIC_STRONG | BIOMETRIC_WEAK)` and
/// prompts with device PIN/pattern as fallback (`biometricOnly: false`).
abstract final class BiometricService {
  static const _optInKey = 'biometric_relogin_opt_in';
  static const _promptedKey = 'biometric_setup_prompt_shown';
  static const _androidChannel =
      MethodChannel('com.sahelagriconnect.app/biometric');

  static final LocalAuthentication _auth = LocalAuthentication();

  static Future<BiometricCapability> getCapability() async {
    try {
      final deviceSupported = await _auth.isDeviceSupported();
      var canCheck = await _auth.canCheckBiometrics;
      var types = deviceSupported
          ? await _auth.getAvailableBiometrics()
          : <BiometricType>[];

      if (Platform.isAndroid && deviceSupported) {
        final nativeCan =
            await _androidChannel.invokeMethod<bool>('canAuthenticate') ?? false;
        canCheck = canCheck || nativeCan;

        final hasWeak =
            await _androidChannel.invokeMethod<bool>('hasWeakBiometric') ??
                false;
        final hasStrong =
            await _androidChannel.invokeMethod<bool>('hasStrongBiometric') ??
                false;
        types = [
          ...types,
          if (hasWeak && !types.contains(BiometricType.weak))
            BiometricType.weak,
          if (hasStrong && !types.contains(BiometricType.strong))
            BiometricType.strong,
        ];
      }

      return BiometricCapability(
        deviceSupported: deviceSupported,
        canCheckBiometrics: canCheck,
        availableTypes: types,
        kind: _kindFromTypes(types),
      );
    } catch (_) {
      return const BiometricCapability(
        kind: BiometricKind.none,
        deviceSupported: false,
        canCheckBiometrics: false,
        availableTypes: [],
      );
    }
  }

  static BiometricKind _kindFromTypes(List<BiometricType> types) {
    if (types.isEmpty) return BiometricKind.none;

    final hasFace = types.contains(BiometricType.face);
    final hasFinger = types.contains(BiometricType.fingerprint) ||
        types.contains(BiometricType.strong);
    final hasWeak = types.contains(BiometricType.weak);

    if (hasFace && (hasFinger || hasWeak)) return BiometricKind.multiple;
    if (hasFace) return BiometricKind.face;
    if (hasFinger) return BiometricKind.fingerprint;
    // Android class-2 (weak) biometrics are often face unlock on Samsung devices.
    if (hasWeak) return BiometricKind.face;
    if (types.contains(BiometricType.iris)) return BiometricKind.iris;
    return BiometricKind.multiple;
  }

  static Future<bool> isOptedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_optInKey) ?? false;
  }

  static Future<void> setOptedIn(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_optInKey, value);
    if (!value) {
      await prefs.remove(_promptedKey);
    }
  }

  static Future<bool> wasSetupPromptShown() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_promptedKey) ?? false;
  }

  static Future<void> markSetupPromptShown() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_promptedKey, true);
  }

  /// Shows the OS biometric sheet (Face ID / fingerprint / device PIN).
  /// Always allows device credential fallback (`biometricOnly: false`).
  static Future<bool> authenticate({
    required String reason,
  }) async {
    try {
      if (Platform.isAndroid) {
        final deviceSupported = await _auth.isDeviceSupported();
        if (!deviceSupported) return false;
        return await _androidChannel.invokeMethod<bool>(
              'authenticate',
              {'reason': reason},
            ) ??
            false;
      }

      final cap = await getCapability();
      if (!cap.deviceSupported) return false;

      return _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
          useErrorDialogs: true,
          sensitiveTransaction: true,
        ),
      );
    } catch (_) {
      return false;
    }
  }

  /// English / French labels for UI (pass [t] from LanguageProvider.t).
  static String methodLabel(
    BiometricCapability cap,
    String Function(String en, String fr) t,
  ) {
    switch (cap.kind) {
      case BiometricKind.face:
        return t('Face ID', 'Face ID');
      case BiometricKind.fingerprint:
        return t('fingerprint', 'empreinte digitale');
      case BiometricKind.iris:
        return t('iris scan', 'scan iris');
      case BiometricKind.multiple:
        return t('Face or fingerprint', 'Face ou empreinte');
      case BiometricKind.none:
        return t('biometrics', 'biométrie');
    }
  }

  static IconData methodIcon(BiometricCapability cap) {
    if (cap.hasFace && !cap.hasFingerprint) {
      return Icons.face_rounded;
    }
    if (cap.hasFingerprint && !cap.hasFace) {
      return Icons.fingerprint_rounded;
    }
    return Icons.lock_rounded;
  }
}
