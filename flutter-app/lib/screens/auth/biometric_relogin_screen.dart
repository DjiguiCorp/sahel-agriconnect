import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

class BiometricReLoginScreen extends StatefulWidget {
  const BiometricReLoginScreen({super.key});

  @override
  State<BiometricReLoginScreen> createState() => _BiometricReLoginScreenState();
}

class _BiometricReLoginScreenState extends State<BiometricReLoginScreen> {
  bool _loading = false;
  String _error = '';
  String _savedName = '';
  String _savedEmail = '';
  String _savedRole = '';

  static const _portalRoutes = {
    'farmer': '/farmer',
    'investor': '/investor',
    'cooperative': '/cooperative',
    'government': '/government',
    'ngo': '/ngo',
    'processor': '/processor',
  };

  @override
  void initState() {
    super.initState();
    _loadIdentity();
  }

  Future<void> _loadIdentity() async {
    final auth = context.read<AuthState>();
    final email =
        await auth.getSavedFarmerEmail() ?? await auth.getFarmerEmail() ?? '';
    final name = await auth.getSavedFarmerName() ?? '';
    final role = await auth.getSavedRole() ?? '';
    if (!mounted) return;
    setState(() {
      _savedEmail = email;
      _savedName = name;
      _savedRole = role;
    });
  }

  void _stopLoading() {
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _navigateAfterLogin(String roleStr) async {
    if (!mounted) return;
    _stopLoading();
    await Future<void>.delayed(Duration.zero);
    if (!mounted) return;
    context.go(_portalRoutes[roleStr] ?? '/home');
  }

  Future<void> _biometricLogin() async {
    if (_loading) return;
    final lp = context.read<LanguageProvider>();
    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final passed = await AuthService.authenticateWithBiometrics(
        reason: lp.t(
          'Confirm your identity to sign in',
          'Confirmez votre identité pour vous connecter',
        ),
      ).timeout(
        const Duration(seconds: 90),
        onTimeout: () => false,
      );

      if (!passed) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _error = lp.t(
            'Biometric verification failed. You can sign in with an OTP code instead.',
            'Échec de la vérification biométrique. Vous pouvez vous connecter avec un code OTP.',
          );
        });
        return;
      }

      if (!mounted) return;
      final auth = context.read<AuthState>();
      final seed = await auth.getSavedSeed();
      if (seed == null || seed.length < 32) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _error = lp.t(
            'Session not found. Please log in with OTP.',
            'Session introuvable. Connectez-vous avec un code OTP.',
          );
        });
        return;
      }

      final res = await ApiService.post(
        '/api/auth/silent-refresh',
        {'sessionSeed': seed},
      ).timeout(
        const Duration(seconds: 50),
        onTimeout: () => {
          'success': false,
          'code': 'TIMEOUT',
          'error': lp.t(
            'Connection timed out. Try OTP sign-in.',
            'Délai dépassé. Essayez la connexion OTP.',
          ),
        },
      );

      if (!mounted) return;

      final code = res['code']?.toString() ?? '';
      if (code == 'SESSION_EXPIRED' || code == 'ACCOUNT_NOT_FOUND') {
        await auth.clearSeed();
        await _goToOtpLogin(clearIdentity: code == 'ACCOUNT_NOT_FOUND');
        return;
      }

      if (res['success'] != true) {
        _stopLoading();
        setState(() {
          _error = res['error']?.toString() ??
              lp.t('Sign-in failed. Try OTP instead.', 'Échec. Essayez OTP.');
        });
        return;
      }

      final token = res['token']?.toString();
      if (token == null || token.isEmpty) {
        _stopLoading();
        setState(() {
          _error = lp.t(
            'Invalid server response. Try OTP sign-in.',
            'Réponse serveur invalide. Essayez OTP.',
          );
        });
        return;
      }

      final roleStr = (res['role']?.toString() ?? _savedRole).toLowerCase();
      final roleEnum = AuthRole.values.firstWhere(
        (r) => r.name == roleStr,
        orElse: () => AuthRole.farmer,
      );
      final userData = {
        'name': res['name'],
        'nom': res['name'],
        'email': res['email'],
        'role': roleStr,
      };
      await auth.setSession(roleEnum, token, userData);
      await _navigateAfterLogin(roleStr);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _goToOtpLogin({bool clearIdentity = false}) async {
    _stopLoading();
    final auth = context.read<AuthState>();
    // Clear stale JWT so router does not bounce us away from /login/*.
    await auth.logout();
    auth.exitGuestMode();
    if (clearIdentity) {
      await auth.clearSeed();
      await auth.clearSavedFarmerIdentity();
    }

    var email = _savedEmail.trim();
    if (email.isEmpty) {
      email = (await auth.getSavedFarmerEmail())?.trim() ?? '';
    }
    if (!mounted) return;

    final role = _savedRole.isNotEmpty ? _savedRole : 'farmer';
    if (role == 'farmer') {
      final params = <String, String>{'otp': '1'};
      if (email.isNotEmpty) {
        params['email'] = email;
      }
      final q = params.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      context.go('/login/farmer?$q');
      return;
    }
    context.go('/login/$role?otp=1');
  }

  void _goHome() {
    _stopLoading();
    final auth = context.read<AuthState>();
    auth.continueAsGuest();
    context.go('/home');
  }

  Future<bool> _handleSystemBack() async {
    _goHome();
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return BackButtonListener(
      onBackButtonPressed: _handleSystemBack,
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) _goHome();
        },
        child: Scaffold(
          backgroundColor: AppColors.forestGreen,
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.person_rounded,
                      size: 44,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    lp.t('Welcome back', 'Bon retour'),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  if (_savedName.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      _savedName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppColors.gold,
                      ),
                    ),
                  ],
                  if (_savedEmail.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _savedEmail,
                        style:
                            const TextStyle(fontSize: 13, color: Colors.white70),
                      ),
                    ),
                  ],
                  const SizedBox(height: 48),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _loading ? null : _biometricLogin,
                      icon: _loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.lock_rounded, size: 24),
                      label: Text(
                        _loading
                            ? lp.t('Signing in…', 'Connexion…')
                            : lp.t(
                                'Sign in with Face/biometrics',
                                'Connexion Face/biométrie',
                              ),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: AppColors.forestGreen,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: _goToOtpLogin,
                    child: Text(
                      lp.t('Use OTP code instead', 'Utiliser un code OTP'),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      _error,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontSize: 13,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => _goToOtpLogin(clearIdentity: true),
                    child: Text(
                      lp.t(
                        'Not you? Use a different email',
                        'Pas vous ? Utiliser un autre email',
                      ),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
