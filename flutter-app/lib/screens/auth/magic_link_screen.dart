import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';

class MagicLinkScreen extends StatefulWidget {
  const MagicLinkScreen({
    super.key,
    required this.code,
    required this.email,
    required this.purpose,
  });

  final String code;
  final String email;
  final String purpose;

  @override
  State<MagicLinkScreen> createState() => _MagicLinkScreenState();
}

class _MagicLinkScreenState extends State<MagicLinkScreen> {
  String _status = 'verifying'; // verifying | success | error
  String _error = '';

  @override
  void initState() {
    super.initState();
    _verify();
  }

  Future<void> _verify() async {
    if (widget.code.isEmpty || widget.email.isEmpty) {
      setState(() { _status = 'error'; _error = 'Invalid link'; });
      return;
    }
    try {
      final res = await ApiService.post('/api/verify/confirm', {
        'code': widget.code,
        'email': widget.email,
        'purpose': widget.purpose.isNotEmpty ? widget.purpose : 'farmer_verify',
      });

      if (res['success'] != true || res['token'] == null) {
        setState(() {
          _status = 'error';
          _error = res['error'] ?? 'Link expired or already used';
        });
        return;
      }

      final token = res['token'] as String;
      final roleStr = res['role'] as String? ?? 'farmer';
      final roleEnum = AuthRole.values.firstWhere(
        (r) => r.name == roleStr,
        orElse: () => AuthRole.farmer,
      );
      final userData = {
        'name': res['user']?['nom'] ?? res['user']?['name'] ?? '',
        'nom': res['user']?['nom'] ?? '',
        'email': widget.email,
        'role': roleStr,
      };

      final auth = context.read<AuthState>();
      await auth.setSession(roleEnum, token, userData);

      // Store sessionSeed if returned (for biometric re-login)
      final seed = res['sessionSeed'] as String?;
      if (seed != null && seed.isNotEmpty) {
        await auth.storeSeed(seed, roleStr);
      }

      // Save farmer identity for welcome-back screen
      if (roleEnum == AuthRole.farmer) {
        await auth.saveFarmerIdentity(
          userData['email'] ?? widget.email,
          userData['nom'] ?? userData['name'] ?? '',
        );
      }

      setState(() { _status = 'success'; });

      if (!mounted) return;
      await Future.delayed(const Duration(milliseconds: 800));

      final routes = {
        'farmer': '/farmer',
        'investor': '/investor',
        'cooperative': '/cooperative',
        'government': '/government',
        'ngo': '/ngo',
        'processor': '/processor',
      };
      if (mounted) context.go(routes[roleStr] ?? '/home');

    } catch (e) {
      setState(() { _status = 'error'; _error = e.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      backgroundColor: AppColors.forestGreen,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_status == 'verifying') ...[
                  const CircularProgressIndicator(color: AppColors.gold, strokeWidth: 3),
                  const SizedBox(height: 28),
                  Text(
                    lp.t('Verifying your link…', 'Vérification de votre lien…'),
                    style: const TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                ],
                if (_status == 'success') ...[
                  const Icon(Icons.check_circle_rounded, color: Color(0xFF1D9E75), size: 64),
                  const SizedBox(height: 20),
                  Text(
                    lp.t('Signed in!', 'Connecté !'),
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    lp.t('Redirecting to your dashboard…', 'Redirection vers votre tableau de bord…'),
                    style: const TextStyle(color: Colors.white60, fontSize: 14),
                  ),
                ],
                if (_status == 'error') ...[
                  const Icon(Icons.link_off_rounded, color: AppColors.gold, size: 56),
                  const SizedBox(height: 20),
                  Text(
                    lp.t('Link expired or already used', 'Lien expiré ou déjà utilisé'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    lp.t(
                      'This link can only be used once and expires in 15 minutes. '
                      'Request a new sign-in link from the app.',
                      'Ce lien ne peut être utilisé qu\'une seule fois et expire en 15 minutes. '
                      'Demandez un nouveau lien depuis l\'application.',
                    ),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white54, fontSize: 13, height: 1.5),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => context.go('/home'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: AppColors.forestGreen,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(lp.t('Back to home', "Retour à l'accueil"),
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
