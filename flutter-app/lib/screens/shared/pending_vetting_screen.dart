import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';

/// Shown when [accountStatus] is `pending_vetting` after OTP verification.
/// Reassuring, transparent copy — never alarming language.
class PendingVettingScreen extends StatefulWidget {
  const PendingVettingScreen({
    super.key,
    required this.role,
    required this.contact,
    this.sessionToken,
    this.verificationId,
  });

  final AuthRole role;
  final String contact;

  /// JWT returned from verify-otp while account is still under review.
  final String? sessionToken;
  final String? verificationId;

  @override
  State<PendingVettingScreen> createState() => _PendingVettingScreenState();
}

class _PendingVettingScreenState extends State<PendingVettingScreen> {
  static const _portalUrl = 'https://sahelagriconnect.com';
  static const _supportEmail = 'support@sahelagriconnect.com';
  static const _pollInterval = Duration(seconds: 10);
  static const _maxPolls = 6;

  bool _checking = false;
  bool _pollingActive = false;
  int _pollCount = 0;
  Timer? _pollTimer;

  String? get _token => widget.sessionToken;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _startAutoPoll());
  }

  @override
  void dispose() {
    _stopPolling();
    super.dispose();
  }

  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
    _pollingActive = false;
  }

  void _startAutoPoll() {
    if (_pollingActive || _pollCount >= _maxPolls) return;
    _pollingActive = true;
    _pollTimer = Timer.periodic(_pollInterval, (_) => _pollOnce(silent: true));
  }

  bool _shouldMock(Map<String, dynamic> res) {
    if (res['accountStatus'] != null || res['token'] != null) return false;
    final err = res['error']?.toString().toLowerCase() ?? '';
    return res['success'] == false ||
        err.contains('not found') ||
        err.contains('404') ||
        err.contains('route');
  }

  /// Re-checks account status using the stored session token.
  /// Falls back to mock `pending_vetting` until the backend endpoint exists.
  Future<Map<String, dynamic>> _fetchStatus() async {
    final token = _token;
    if (token == null || token.isEmpty) {
      return {'accountStatus': 'pending_vetting'};
    }
    try {
      final res = await ApiService.get('/api/auth/status', token: token);
      if (res['accountStatus'] != null) return res;
      if (_shouldMock(res)) {
        return {'accountStatus': 'pending_vetting'};
      }
      return res;
    } catch (_) {
      try {
        final res = await ApiService.post(
          '/api/auth/verify-otp',
          {
            if (widget.verificationId != null)
              'verificationId': widget.verificationId,
            'token': token,
            'statusCheck': true,
          },
          token: token,
        );
        if (res['accountStatus'] != null || res['token'] != null) return res;
        if (_shouldMock(res)) {
          return {'accountStatus': 'pending_vetting'};
        }
        return res;
      } catch (_) {
        return {'accountStatus': 'pending_vetting'};
      }
    }
  }

  Map<String, dynamic> _sessionUserFrom(
    String token,
    Map<String, dynamic>? apiUser,
  ) {
    final merged = <String, dynamic>{};
    if (apiUser != null && apiUser.isNotEmpty) {
      merged.addAll(apiUser);
    }
    if (token.isNotEmpty && !token.startsWith('mock-')) {
      try {
        final raw = JwtDecoder.decode(token);
        merged.addAll(Map<String, dynamic>.from(raw as Map));
      } catch (_) {}
    }
    if (!merged.containsKey('email') && widget.contact.contains('@')) {
      merged['email'] = widget.contact.toLowerCase();
    }
    if (!merged.containsKey('phone') && !widget.contact.contains('@')) {
      merged['phone'] = widget.contact;
    }
    return merged;
  }

  Future<void> _handleActive(Map<String, dynamic> res) async {
    final token = (res['token'] as String?) ?? _token;
    if (token == null || token.isEmpty) return;
    final apiUser = res['user'];
    final userMap = apiUser is Map
        ? Map<String, dynamic>.from(apiUser)
        : <String, dynamic>{};
    final merged = _sessionUserFrom(token, userMap);
    if (!mounted) return;
    final auth = context.read<AuthState>();
    await auth.setSession(widget.role, token, merged);
    if (!mounted) return;
    _stopPolling();
    context.go(_dashboardRoute(widget.role));
  }

  Future<void> _pollOnce({required bool silent}) async {
    if (_checking) return;
    if (!silent && mounted) {
      setState(() => _checking = true);
    } else {
      _checking = true;
    }

    try {
      final res = await _fetchStatus();
      final status = res['accountStatus']?.toString() ?? 'pending_vetting';

      if (status == 'active') {
        await _handleActive(res);
        return;
      }

      if (silent) {
        _pollCount++;
        if (_pollCount >= _maxPolls) {
          _stopPolling();
        }
      }
    } finally {
      if (mounted) {
        setState(() => _checking = false);
      } else {
        _checking = false;
      }
    }
  }

  Future<void> _checkStatusManually() => _pollOnce(silent: false);

  Future<void> _openPortal() async {
    final uri = Uri.parse(_portalUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _goBackToLogin() {
    _stopPolling();
    context.go(_loginPath(widget.role));
  }

  String _loginPath(AuthRole role) {
    switch (role) {
      case AuthRole.farmer:
        return '/login/farmer';
      case AuthRole.investor:
        return '/login/investor';
      case AuthRole.cooperative:
        return '/login/cooperative';
      case AuthRole.government:
        return '/login/government';
      case AuthRole.ngo:
        return '/login/ngo';
      case AuthRole.processor:
        return '/login/processor';
      default:
        return '/home';
    }
  }

  String _dashboardRoute(AuthRole role) {
    switch (role) {
      case AuthRole.farmer:
        return '/farmer';
      case AuthRole.investor:
        return '/investor';
      case AuthRole.cooperative:
        return '/cooperative';
      case AuthRole.government:
        return '/government';
      case AuthRole.ngo:
        return '/ngo';
      case AuthRole.processor:
        return '/processor';
      default:
        return '/home';
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.forestGreen,
              AppColors.sage,
              AppColors.darkBg,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: _goBackToLogin,
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                      color: Colors.white,
                    ),
                    Expanded(
                      child: Text(
                        lp.t('Account review', 'Examen du compte'),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Center(
                  child: SingleChildScrollView(
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 400),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: AppColors.gold.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.gold.withValues(alpha: 0.35),
                              ),
                            ),
                            child: const Icon(
                              Icons.hourglass_bottom_rounded,
                              size: 36,
                              color: AppColors.gold,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            lp.t(
                              'Account Under Review',
                              'Compte en cours d\'examen',
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            lp.t(
                              'Your account is being reviewed to ensure the security and quality of our platform. This usually takes 24–48 hours.',
                              'Votre compte est en cours d\'examen pour garantir la sécurité et la qualité de notre plateforme. Cela prend généralement 24 à 48 heures.',
                            ),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 15,
                              height: 1.55,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.12),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  widget.contact.contains('@')
                                      ? Icons.alternate_email_rounded
                                      : Icons.phone_outlined,
                                  color: AppColors.gold,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        lp.t(
                                          'Signed in as',
                                          'Connecté en tant que',
                                        ),
                                        style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.5),
                                          fontSize: 11,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        widget.contact,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.gold.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: AppColors.gold.withValues(alpha: 0.25),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.access_time_rounded,
                                  size: 16,
                                  color: AppColors.gold,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  lp.t(
                                    'Expected: within 48 hours',
                                    'Prévu : sous 48 heures',
                                  ),
                                  style: const TextStyle(
                                    color: AppColors.gold,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (_pollingActive && _pollCount < _maxPolls) ...[
                            const SizedBox(height: 16),
                            Text(
                              lp.t(
                                'We\'ll check automatically for updates…',
                                'Nous vérifions automatiquement les mises à jour…',
                              ),
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.45),
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                          const SizedBox(height: 28),
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              onPressed: _checking ? null : _checkStatusManually,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.gold,
                                foregroundColor: AppColors.forestGreen,
                                disabledBackgroundColor:
                                    AppColors.gold.withValues(alpha: 0.4),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                elevation: 0,
                              ),
                              child: _checking
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                        color: AppColors.forestGreen,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Text(
                                      lp.t(
                                        'Check Status',
                                        'Vérifier le statut',
                                      ),
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: OutlinedButton(
                              onPressed: _openPortal,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white,
                                side: BorderSide(
                                  color: Colors.white.withValues(alpha: 0.35),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: Text(
                                lp.t(
                                  'Visit Web Portal',
                                  'Visiter le portail web',
                                ),
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 28),
                          Text(
                            lp.t(
                              'Questions? $_supportEmail',
                              'Des questions ? $_supportEmail',
                            ),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
