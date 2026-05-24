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

  @override
  void initState() {
    super.initState();
    _loadIdentity();
  }

  Future<void> _loadIdentity() async {
    final auth = context.read<AuthState>();
    final email = await auth.getSavedFarmerEmail() ?? '';
    final name = await auth.getSavedFarmerName() ?? '';
    final role = await auth.getSavedRole() ?? '';
    setState(() {
      _savedEmail = email;
      _savedName = name;
      _savedRole = role;
    });
  }

  Future<void> _biometricLogin() async {
    final lp = context.read<LanguageProvider>();
    setState(() { _loading = true; _error = ''; });

    // Step 1 — biometric gate
    final passed = await AuthService.authenticateWithBiometrics(
      reason: lp.t('Confirm your identity to sign in', 'Confirmez votre identité pour vous connecter'),
    );
    if (!passed) {
      setState(() { _loading = false; _error = lp.t('Biometric verification failed', 'Échec de la vérification biométrique'); });
      return;
    }

    // Step 2 — silent refresh with stored seed
    try {
      final auth = context.read<AuthState>();
      final seed = await auth.getSavedSeed();
      if (seed == null) {
        setState(() { _loading = false; _error = lp.t('Session not found. Please log in.', 'Session introuvable. Veuillez vous connecter.'); });
        return;
      }

      final res = await ApiService.post('/api/auth/silent-refresh', { 'sessionSeed': seed });

      if (res['success'] != true) {
        final code = res['code'] ?? '';
        if (code == 'SESSION_EXPIRED' || code == 'ACCOUNT_NOT_FOUND') {
          await auth.clearSeed();
          if (mounted) context.go('/farmer-auth');
          return;
        }
        setState(() { _loading = false; _error = res['error'] ?? lp.t('Sign-in failed', 'Échec de la connexion'); });
        return;
      }

      // Step 3 — restore full session
      final token = res['token'] as String;
      final roleStr = res['role'] as String? ?? _savedRole;
      final roleEnum = AuthRole.values.firstWhere(
        (r) => r.name == roleStr,
        orElse: () => AuthRole.farmer,
      );
      final userData = { 'name': res['name'], 'nom': res['name'], 'email': res['email'], 'role': roleStr };
      await auth.setSession(roleEnum, token, userData);

      if (mounted) {
        final routes = {
          'farmer': '/farmer', 'investor': '/investor', 'cooperative': '/cooperative',
          'government': '/government', 'ngo': '/ngo', 'processor': '/processor',
        };
        context.go(routes[roleStr] ?? '/home');
      }
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      backgroundColor: AppColors.forestGreen,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person_rounded, size: 44, color: Colors.white),
              ),
              const SizedBox(height: 24),
              Text(
                lp.t('Welcome back', 'Bon retour'),
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              if (_savedName.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  _savedName,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.gold),
                ),
              ],
              if (_savedEmail.isNotEmpty) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _savedEmail,
                    style: const TextStyle(fontSize: 13, color: Colors.white70),
                  ),
                ),
              ],
              const SizedBox(height: 48),
              // Biometric button
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _loading ? null : _biometricLogin,
                  icon: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.fingerprint_rounded, size: 24),
                  label: Text(
                    _loading
                        ? lp.t('Signing in…', 'Connexion…')
                        : lp.t('Sign in with biometrics', 'Connexion biométrique'),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.gold,
                    foregroundColor: AppColors.forestGreen,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(_error, textAlign: TextAlign.center, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
              ],
              const SizedBox(height: 16),
              // Fallback — use a different account
              TextButton(
                onPressed: () async {
                  final auth = context.read<AuthState>();
                  await auth.clearSeed();
                  if (mounted) context.go('/home');
                },
                child: Text(
                  lp.t('Not you? Sign in with a different account', "Pas vous ? Utiliser un autre compte"),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
