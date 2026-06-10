import 'package:dio/dio.dart';

import 'api_service.dart';

/// User-facing auth failure — never contains stack traces or transport details.
class AuthError {
  const AuthError(this.message);

  final String message;

  @override
  String toString() => message;
}

/// OTP / verify API outcome with a typed error when [isSuccess] is false.
class AuthResult {
  const AuthResult._({
    required this.isSuccess,
    this.data,
    this.error,
  });

  final bool isSuccess;
  final Map<String, dynamic>? data;
  final AuthError? error;

  factory AuthResult.success(dynamic value) {
    if (value is Map<String, dynamic>) {
      return AuthResult._(isSuccess: true, data: value);
    }
    if (value is Map) {
      return AuthResult._(
        isSuccess: true,
        data: Map<String, dynamic>.from(value),
      );
    }
    return AuthResult._(
      isSuccess: true,
      data: {'verificationId': value?.toString()},
    );
  }

  factory AuthResult.failure(AuthError error) =>
      AuthResult._(isSuccess: false, error: error);
}

/// Passwordless OTP helpers with consistent, non-technical error copy.
class UnifiedAuthService {
  UnifiedAuthService._();

  static const networkError =
      'Connection error. Please check your network and try again.';
  static const badRequestError =
      'Please enter a valid email or phone number.';
  static const unauthorizedError = 'Invalid code. Please try again.';
  static const expiredOtpError =
      'Your code has expired. Request a new one.';
  static const rateLimitError =
      'Too many attempts. Please wait 30 minutes and try again.';
  static const serverError =
      'Something went wrong on our end. Please try again shortly.';
  static const unexpectedError =
      'An unexpected error occurred. Please try again.';

  /// Maps any raw failure (status code, API body, or exception) to safe copy.
  static String friendlyMessage(Object? raw, {int? statusCode}) {
    final code = statusCode ?? _statusFromRaw(raw);
    if (code != null) {
      switch (code) {
        case 400:
          return badRequestError;
        case 401:
          return unauthorizedError;
        case 410:
          return expiredOtpError;
        case 429:
          return rateLimitError;
        default:
          if (code >= 500) return serverError;
      }
    }

    final msg = raw?.toString() ?? '';
    if (msg.isEmpty || _isTechnical(msg)) {
      return _heuristicMessage(msg) ?? unexpectedError;
    }

    return _heuristicMessage(msg) ?? unexpectedError;
  }

  static Future<AuthResult> sendOtp(
    String contact,
    String purpose, {
    String role = 'farmer',
    String? country,
    String lang = 'en',
  }) async {
    final response = await ApiService.sendOtp(
      contact: contact,
      role: role,
      purpose: purpose,
      country: country,
      lang: lang,
    );
    return _fromMap(response);
  }

  static Future<AuthResult> verifyOtp(
    String verificationId,
    String otp, {
    String role = 'farmer',
  }) async {
    final response = await ApiService.post('/api/auth/verify-otp', {
      'verificationId': verificationId,
      'otp': otp,
      'role': role,
    });
    return _fromMap(response);
  }

  static Future<AuthResult> checkAccountStatus({required String token}) async {
    final res = await ApiService.get('/api/auth/status', token: token);
    return _fromMap(res);
  }

  static AuthResult _fromMap(Map<String, dynamic> res) {
    final normalized = _normalizeResponse(res);
    final err = normalized['error'];
    if (normalized['success'] == false ||
        (err != null && err.toString().trim().isNotEmpty)) {
      final status = _statusFromMap(normalized);
      return AuthResult.failure(
        AuthError(
          friendlyMessage(err, statusCode: status),
        ),
      );
    }
    return AuthResult.success(normalized);
  }

  static Map<String, dynamic> _normalizeResponse(Map<String, dynamic> res) {
    final copy = Map<String, dynamic>.from(res);
    if (copy['success'] == false || copy['error'] != null) {
      final status = _statusFromMap(copy);
      copy['error'] = friendlyMessage(copy['error'], statusCode: status);
      copy['success'] = false;
    }
    return copy;
  }

  static int? _statusFromMap(Map<String, dynamic> res) {
    final s = res['statusCode'] ?? res['status'];
    if (s is int) return s;
    if (s is String) return int.tryParse(s);
    return null;
  }

  static int? _statusFromRaw(Object? raw) {
    if (raw is DioException) return raw.response?.statusCode;
    return null;
  }

  static String? _heuristicMessage(String msg) {
    final lower = msg.toLowerCase();
    if (lower.contains('expir') || lower.contains('gone')) {
      return expiredOtpError;
    }
    if (lower.contains('too many') || lower.contains('rate limit')) {
      return rateLimitError;
    }
    if (lower.contains('invalid') ||
        lower.contains('unauthorized') ||
        lower.contains('wrong') ||
        lower.contains('incorrect')) {
      return unauthorizedError;
    }
    if (lower.contains('valid') &&
        (lower.contains('email') || lower.contains('phone'))) {
      return badRequestError;
    }
    if (lower.contains('network') ||
        lower.contains('connection') ||
        lower.contains('internet') ||
        lower.contains('timeout') ||
        lower.contains('socket') ||
        lower.contains('host')) {
      return networkError;
    }
    if (lower.contains('server') || lower.contains('500')) {
      return serverError;
    }
    return null;
  }

  static bool _isTechnical(String msg) {
    final lower = msg.toLowerCase();
    return lower.contains('socketexception') ||
        lower.contains('httpexception') ||
        lower.contains('dioexception') ||
        lower.contains('formatexception') ||
        lower.contains('stacktrace') ||
        lower.contains('stack trace') ||
        lower.contains('exception:') ||
        lower.contains('#0 ') ||
        lower.contains('failed host lookup');
  }
}
