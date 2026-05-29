import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/auth_form_theme.dart';
import '../../widgets/biometric_setup_sheet.dart';

class MagicLinkScreen extends StatefulWidget {
  const MagicLinkScreen({
    super.key,
    required this.code,
    required this.email,
    required this.purpose,
    this.role,
    this.lang,
  });

  final String code;
  final String email;
  final String purpose;
  final String? role;
  final String? lang;

  @override
  State<MagicLinkScreen> createState() => _MagicLinkScreenState();
}

class _MagicLinkScreenState extends State<MagicLinkScreen> {
  String _status = 'verifying';
  String _error = '';

  @override
  void initState() {
    super.initState();
    _verify();
  }

  Future<void> _verify() async {
    final lp = context.read<LanguageProvider>();
    if (widget.lang == 'en' || widget.lang == 'fr') {
      lp.setLang(widget.lang!);
    }
    if (widget.code.isEmpty || widget.email.isEmpty) {
      setState(() {
        _status = 'error';
        _error = lp.t('Invalid link', 'Lien invalide');
      });
      return;
    }
    try {
      final roleHint = widget.role ?? 'farmer';
      final res = await ApiService.post('/api/verify/confirm', {
        'code': widget.code,
        'email': widget.email,
        'purpose':
            widget.purpose.isNotEmpty ? widget.purpose : 'farmer_verify',
        'role': roleHint,
      });

      if (res['isNewUser'] == true) {
        if (!mounted) return;
        setState(() => _status = 'success');
        await Future.delayed(const Duration(milliseconds: 600));
        if (!mounted) return;
        final pending = res['pendingRegistrationId']?.toString() ?? '';
        final appRole = res['role']?.toString() ?? roleHint;
        if (appRole == 'farmer' && pending.isNotEmpty) {
          context.go(
            '/login/farmer?pending=${Uri.encodeComponent(pending)}'
            '&email=${Uri.encodeComponent(widget.email)}',
          );
          return;
        }
        final path = res['registerPath']?.toString() ?? '/cooperative-registration';
        final lang = lp.lang;
        final webUrl =
            'https://sahelagriconnect.com$path?lang=$lang&from=app';
        final uri = Uri.parse(webUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
        if (!mounted) return;
        context.go('/login/$appRole');
        return;
      }

      if (res['success'] != true || res['token'] == null) {
        setState(() {
          _status = 'error';
          _error = res['error']?.toString() ??
              lp.t(
                'Link expired or already used',
                'Lien expiré ou déjà utilisé',
              );
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

      // ignore: use_build_context_synchronously
      final auth = context.read<AuthState>();
      await auth.setSession(roleEnum, token, userData);

      final seed = res['sessionSeed'] as String?;

      if (roleEnum == AuthRole.farmer) {
        await auth.saveFarmerIdentity(
          userData['email'] ?? widget.email,
          userData['nom'] ?? userData['name'] ?? '',
        );
      }

      setState(() => _status = 'success');

      if (!mounted) return;
      await Future.delayed(const Duration(milliseconds: 800));

      if (!mounted) return;
      await offerBiometricSetupIfAvailable(
        context,
        sessionSeed: seed,
        role: roleStr,
      );

      const routes = {
        'farmer': '/farmer',
        'investor': '/investor',
        'cooperative': '/cooperative',
        'government': '/government',
        'ngo': '/ngo',
        'processor': '/processor',
      };
      if (mounted) context.go(routes[roleStr] ?? '/home');
    } catch (e) {
      setState(() {
        _status = 'error';
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      body: Container(
        decoration: AuthFormTheme.scaffoldGradient(),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white.withValues(alpha: 0.92),
                          const Color(0xFFE8F5F0).withValues(alpha: 0.85),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AuthFormTheme.glassIconBadge(
                          _status == 'success'
                              ? Icons.verified_rounded
                              : _status == 'error'
                                  ? Icons.link_off_rounded
                                  : Icons.mark_email_read_rounded,
                          color: _status == 'error'
                              ? AppColors.error
                              : const Color(0xFF1D9E75),
                        ),
                        const SizedBox(height: 24),
                        if (_status == 'verifying') ...[
                          const CircularProgressIndicator(
                            color: AppColors.gold,
                            strokeWidth: 3,
                          ),
                          const SizedBox(height: 24),
                          Text(
                            lp.t(
                              'Verifying your magic link…',
                              'Vérification de votre lien magique…',
                            ),
                            textAlign: TextAlign.center,
                            style: AuthFormTheme.labelStyle().copyWith(
                              fontSize: 16,
                            ),
                          ),
                        ],
                        if (_status == 'success') ...[
                          Text(
                            lp.t('Email verified!', 'Email vérifié !'),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AuthFormTheme.labelColor,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            lp.t(
                              'Taking you to the next step…',
                              'Étape suivante en cours…',
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AuthFormTheme.hintColor,
                              fontSize: 14,
                            ),
                          ),
                        ],
                        if (_status == 'error') ...[
                          Text(
                            lp.t(
                              'Link expired or already used',
                              'Lien expiré ou déjà utilisé',
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AuthFormTheme.labelColor,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _error.isNotEmpty
                                ? _error
                                : lp.t(
                                    'Request a new magic link from the farmer portal.',
                                    'Demandez un nouveau lien depuis le portail agriculteur.',
                                  ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AuthFormTheme.hintColor,
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 28),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: () => context.go('/login/farmer'),
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.gold,
                                foregroundColor: AppColors.forestGreen,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: Text(
                                lp.t(
                                  'Back to farmer portal',
                                  'Retour au portail agriculteur',
                                ),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
