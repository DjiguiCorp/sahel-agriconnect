import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../core/safe_insets.dart';
import 'package:go_router/go_router.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import 'investor_kyc_screen.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/biometric_service.dart';
import '../../widgets/auth_form_theme.dart';
import '../../widgets/biometric_setup_sheet.dart';
import '../../widgets/country_picker.dart';
import '../../widgets/otp_code_row.dart';

typedef _LoginRoleConfig = ({
  String title,
  String subtitle,
  String emoji,
  Color color,
  List<Color> bg,
  String loginEndpoint,
  bool canSelfRegister,
  String registerUrl,
  String hint,
});

enum _LoginStep { contact, otp }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.role});

  final AuthRole role;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  _LoginStep _step = _LoginStep.contact;

  final _contactCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrl =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocus = List.generate(6, (_) => FocusNode());

  bool _loading = false;
  bool _showManualCode = false;
  String _error = '';
  String _countryPrefix = '+223';
  String _selectedCountry = '';
  String? _verificationId;
  String? _accountStatusMessage;

  Timer? _resendTimer;
  int _resendSeconds = 45;

  TextInputType _keyboardType = TextInputType.emailAddress;
  bool _isEmail = false;

  bool get _needsCountry =>
      widget.role == AuthRole.government || widget.role == AuthRole.cooperative;

  late final _LoginRoleConfig _config = _roleConfig[widget.role]!;

  static final Map<AuthRole, _LoginRoleConfig> _roleConfig = {
    AuthRole.investor: (
      title: 'AfriYield Exchange',
      subtitle: 'Investor portal',
      emoji: '💰',
      color: const Color(0xFFB5850A),
      bg: const [Color(0xFF0d1f17), Color(0xFF1a3c2e)],
      loginEndpoint: '/api/investors/login',
      canSelfRegister: true,
      registerUrl: 'https://sahelagriconnect.com/afri-yield/register',
      hint: 'your@email.com or +223...',
    ),
    AuthRole.cooperative: (
      title: 'Cooperative portal',
      subtitle: 'Sahel AgriConnect',
      emoji: '🤝',
      color: const Color(0xFFB5850A),
      bg: const [Color(0xFF1a3c2e), Color(0xFF2d5a3d)],
      loginEndpoint: '/api/cooperatives/lookup',
      canSelfRegister: true,
      registerUrl: 'https://sahelagriconnect.com/cooperative-registration',
      hint: 'cooperative@email.com or +223...',
    ),
    AuthRole.government: (
      title: 'Government',
      subtitle: 'Government portal',
      emoji: '🏛️',
      color: const Color(0xFF378ADD),
      bg: const [Color(0xFF0d1a2e), Color(0xFF1a3c2e)],
      loginEndpoint: '/api/government/login',
      canSelfRegister: false,
      registerUrl: 'https://sahelagriconnect.com/platform-licensing',
      hint: 'minister@agriculture.gov.ml',
    ),
    AuthRole.ngo: (
      title: 'NGO / Partner',
      subtitle: 'Partner programs',
      emoji: '🌍',
      color: const Color(0xFF1D9E75),
      bg: const [Color(0xFF0d2e1a), Color(0xFF1a3c2e)],
      loginEndpoint: '/api/government/login',
      canSelfRegister: false,
      registerUrl: 'https://sahelagriconnect.com/platform-licensing',
      hint: 'contact@ngo.org',
    ),
    AuthRole.processor: (
      title: 'Processor portal',
      subtitle: 'Transformation center',
      emoji: '⚙️',
      color: const Color(0xFF3B6D11),
      bg: const [Color(0xFF1a3c2e), Color(0xFF0d1f17)],
      loginEndpoint: '/api/processors/login',
      canSelfRegister: true,
      registerUrl: 'https://sahelagriconnect.com/transformation-registration',
      hint: 'processor@email.com or +223...',
    ),
  };

  String get _contact => _contactCtrl.text.trim();

  bool get _contactIsEmail => _contact.contains('@');

  String get _otpCode => _otpCtrl.map((c) => c.text).join();

  bool get _isValidContact {
    final value = _contactCtrl.text.trim();
    if (value.isEmpty) return false;
    if (value.contains('@')) {
      return RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(value);
    }
    final digits = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    return digits.length >= 6 && digits.length <= 15;
  }

  @override
  void initState() {
    super.initState();
    _contactCtrl.addListener(_onContactChanged);
    _detectCountry();
  }

  Future<void> _detectCountry() async {
    try {
      final locale = WidgetsBinding.instance.platformDispatcher.locale;
      final countryCode = locale.countryCode ?? 'ML';
      final option = countryCodePrefixMap.containsKey(countryCode)
          ? phonePrefixForCountryCode(countryCode)
          : phonePrefixForCountryCode('ML');
      setState(() {
        _countryPrefix = option.prefix;
      });
    } catch (_) {
      setState(() {
        _countryPrefix = '+223';
      });
    }
  }

  void _onContactChanged() {
    if (_error.isNotEmpty || _accountStatusMessage != null) {
      setState(() {
        _error = '';
        _accountStatusMessage = null;
      });
    }
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _contactCtrl.removeListener(_onContactChanged);
    _contactCtrl.dispose();
    for (final c in _otpCtrl) {
      c.dispose();
    }
    for (final f in _otpFocus) {
      f.dispose();
    }
    super.dispose();
  }

  void _startResendCountdown() {
    _resendTimer?.cancel();
    setState(() => _resendSeconds = 45);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_resendSeconds > 0) {
          _resendSeconds--;
        } else {
          timer.cancel();
        }
      });
    });
  }

  void _clearOtpFields() {
    for (final c in _otpCtrl) {
      c.clear();
    }
    _otpFocus[0].requestFocus();
  }

  void _goToContactStep() {
    _resendTimer?.cancel();
    setState(() {
      _step = _LoginStep.contact;
      _showManualCode = false;
      _error = '';
      _accountStatusMessage = null;
      _verificationId = null;
    });
    _clearOtpFields();
  }

  bool _shouldMock(Map<String, dynamic> res) {
    if (res['verificationId'] != null || res['token'] != null) return false;
    final err = res['error']?.toString().toLowerCase() ?? '';
    return res['success'] == false ||
        err.contains('not found') ||
        err.contains('404') ||
        err.contains('route');
  }

  Future<Map<String, dynamic>> _sendOtpApi() async {
    final contact = _contactCtrl.text.trim();
    final formattedContact = contact.contains('@')
        ? contact
        : '$_countryPrefix${contact.replaceAll(RegExp(r'^0+'), '')}';
    final lang = context.read<LanguageProvider>().lang;
    final body = <String, dynamic>{
      'purpose': 'login',
      'role': widget.role.name,
      'lang': lang,
      if (contact.contains('@')) 'email': formattedContact.toLowerCase(),
      if (!contact.contains('@')) 'phone': formattedContact,
    };
    try {
      final res = await ApiService.post('/api/auth/send-otp', body);
      if (res['verificationId'] != null ||
          (res['success'] == true && res['error'] == null)) {
        return res;
      }
      if (kDebugMode && _shouldMock(res)) {
        return {'success': true, 'verificationId': 'mock-id'};
      }
      return res;
    } catch (_) {
      if (kDebugMode) {
        return {'success': true, 'verificationId': 'mock-id'};
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> _verifyOtpApi(String otp) async {
    final id = _verificationId ?? 'mock-id';
    try {
      final res = await ApiService.post('/api/auth/verify-otp', {
        'verificationId': id,
        'otp': otp,
        'role': widget.role.name,
      });
      if (res['token'] != null || res['success'] == true) return res;
      if (kDebugMode && _shouldMock(res)) {
        return {
          'success': true,
          'token': 'mock-token',
          'accountStatus': 'active',
        };
      }
      return res;
    } catch (_) {
      if (kDebugMode) {
        return {
          'success': true,
          'token': 'mock-token',
          'accountStatus': 'active',
        };
      }
      rethrow;
    }
  }

  String _friendlyError(Object? raw, LanguageProvider lp) {
    final msg = raw?.toString().toLowerCase() ?? '';
    if (msg.contains('expir')) {
      return lp.t(
        'Code expired. Request a new one',
        'Code expiré. Demandez-en un nouveau',
      );
    }
    if (msg.contains('invalid') ||
        msg.contains('wrong') ||
        msg.contains('incorrect')) {
      return lp.t(
        'Invalid code. Please try again',
        'Code invalide. Veuillez réessayer',
      );
    }
    if (msg.contains('network') ||
        msg.contains('connection') ||
        msg.contains('internet') ||
        msg.contains('timeout')) {
      return lp.t(
        'Connection error. Please check your network',
        'Erreur de connexion. Vérifiez votre réseau',
      );
    }
    if (msg.contains('email') ||
        msg.contains('phone') ||
        msg.contains('valid')) {
      return lp.t(
        'Please enter a valid email or phone number',
        'Veuillez entrer un email ou un numéro de téléphone valide',
      );
    }
    final cleaned = raw
        .toString()
        .replaceAll('Exception: ', '')
        .replaceAll('DioException', '')
        .trim();
    if (cleaned.isEmpty) {
      return lp.t(
        'Connection error. Please check your network',
        'Erreur de connexion. Vérifiez votre réseau',
      );
    }
    return cleaned;
  }

  Future<void> _openUrl(String url) async {
    // Pass current app language to web pages so they open in EN or FR correctly
    final lang = context.read<LanguageProvider>().lang;

    final separator = url.contains('?') ? '&' : '?';
    final localizedUrl = '$url${separator}lang=$lang&from=app';

    final uri = Uri.parse(localizedUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showOtpSentSnackBar() {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isEmail
              ? 'Code sent to $_contact. Check your inbox.'
              : 'Code sent to $_countryPrefix$_contact',
          style: const TextStyle(color: Colors.black),
        ),
        backgroundColor: AppColors.gold,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'OK',
          textColor: Colors.black,
          onPressed: () {},
        ),
      ),
    );
  }

  Future<void> _sendCode() async {
    final lp = context.read<LanguageProvider>();
    if (!_isValidContact) {
      setState(() => _error = lp.t(
            'Please enter a valid email or phone number',
            'Veuillez entrer un email ou un numéro de téléphone valide',
          ));
      return;
    }
    if (_needsCountry && _selectedCountry.isEmpty) {
      setState(() => _error = lp.t(
            'Please select your country',
            'Veuillez sélectionner votre pays',
          ));
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
      _accountStatusMessage = null;
    });
    try {
      final res = await _sendOtpApi();
      if (res['success'] == false && res['verificationId'] == null) {
        throw Exception(res['error']?.toString() ?? 'Request failed');
      }
      final vid = res['verificationId']?.toString();
      if (!mounted) return;
      setState(() {
        _loading = false;
        _verificationId = vid ?? 'mock-id';
        _step = _LoginStep.otp;
        _showManualCode = false;
      });
      _clearOtpFields();
      _startResendCountdown();
      _showOtpSentSnackBar();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = _friendlyError(e, lp);
      });
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
    if (!merged.containsKey('email') && _contactIsEmail) {
      merged['email'] = _contact.toLowerCase();
    }
    if (!merged.containsKey('phone') && !_contactIsEmail) {
      merged['phone'] = _contact;
    }
    return merged;
  }

  Future<void> _handleAccountStatus(
    String status,
    String token,
    Map<String, dynamic> res,
    LanguageProvider lp,
  ) async {
    switch (status) {
      case 'active':
        final apiUser = res['user'];
        final userMap = apiUser is Map
            ? Map<String, dynamic>.from(apiUser)
            : <String, dynamic>{};
        void mergeObj(String key) {
          final o = res[key];
          if (o is Map) userMap.addAll(Map<String, dynamic>.from(o));
        }
        mergeObj('investor');
        mergeObj('cooperative');
        mergeObj('admin');
        mergeObj('processor');
        final merged = _sessionUserFrom(token, userMap);
        if (!mounted) return;
        final auth = context.read<AuthState>();
        await auth.setSession(widget.role, token, merged);
        final seed = res['sessionSeed'] as String?;
        if (!mounted) return;
        if (widget.role == AuthRole.investor) {
          final cap = await BiometricService.getCapability();
          if (cap.isAvailable) {
            final bioPassed = await BiometricService.authenticate(
              reason: lp.t(
                'Verify your identity to access AfriYield Exchange',
                'Vérifiez votre identité pour accéder à AfriYield Exchange',
              ),
            );
            if (!bioPassed) {
              if (!mounted) return;
              await auth.logout();
              if (!mounted) return;
              setState(() {
                _loading = false;
                _error = lp.t(
                  'Biometric verification failed. Please try again.',
                  'Vérification biométrique échouée. Veuillez réessayer.',
                );
              });
              return;
            }
            if (seed != null && seed.isNotEmpty) {
              await auth.enableBiometricRelogin(seed, widget.role.name);
            }
          }
        } else {
          await offerBiometricSetupIfAvailable(
            context,
            sessionSeed: seed,
            role: widget.role.name,
          );
        }
        if (!mounted) return;
        if (widget.role == AuthRole.investor) {
          final prefs = await SharedPreferences.getInstance();
          if (!mounted) return;
          final kycDone = prefs.getBool(investorKycSubmittedKey) ?? false;
          context.go(kycDone ? '/investor' : '/investor/kyc');
        } else {
          context.go(_dashboardRoute(widget.role));
        }
        return;
      case 'pending_vetting':
        if (!mounted) return;
        context.go('/pending-vetting', extra: {
          'role': widget.role,
          'contact': _contact,
          'sessionToken': token,
          'verificationId': _verificationId,
        });
        return;
      case 'suspended':
        setState(() {
          _loading = false;
          _accountStatusMessage = lp.t(
            'Your account has been suspended. Contact support@sahelagriconnect.com',
            'Votre compte a été suspendu. Contactez support@sahelagriconnect.com',
          );
        });
        return;
      default:
        setState(() {
          _loading = false;
          _error = lp.t(
            'Unable to sign in. Please try again.',
            'Connexion impossible. Veuillez réessayer.',
          );
        });
    }
  }

  Future<void> _verifyOtp() async {
    final lp = context.read<LanguageProvider>();
    if (_otpCode.length < 6) return;
    setState(() {
      _loading = true;
      _error = '';
      _accountStatusMessage = null;
    });
    try {
      final res = await _verifyOtpApi(_otpCode);
      if (res['success'] == false && res['token'] == null) {
        throw Exception(res['error']?.toString() ?? 'Verification failed');
      }
      final token = res['token'] as String?;
      if (token == null || token.isEmpty) {
        throw Exception(res['error']?.toString() ?? 'Verification failed');
      }
      final status = res['accountStatus']?.toString() ?? 'active';
      await _handleAccountStatus(status, token, res, lp);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = _friendlyError(e, lp);
      });
    }
    if (mounted && _loading) setState(() => _loading = false);
  }

  Future<void> _resendCode() async {
    if (_resendSeconds > 0 || _loading) return;
    await _sendCode();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: _config.bg,
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Column(
                children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Consumer<LanguageProvider>(
                                builder: (context, langProvider, _) {
                                  final isFr =
                                      langProvider.locale.languageCode == 'fr';
                                  return GestureDetector(
                                    onTap: () {
                                      langProvider.setLang(isFr ? 'en' : 'fr');
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                          color: AppColors.gold.withValues(
                                            alpha: 0.5,
                                          ),
                                        ),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            isFr ? '🇫🇷' : '🇺🇸',
                                            style:
                                                const TextStyle(fontSize: 16),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            isFr ? 'FR' : 'EN',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                          child: Row(
                            children: [
                              GestureDetector(
                                onTap: () {
                                  if (_step == _LoginStep.otp) {
                                    _goToContactStep();
                                  } else {
                                    context.go('/home');
                                  }
                                },
                                child: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.arrow_back_ios_new_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _localizedSubtitle(lp),
                                    style: TextStyle(
                                      color:
                                          Colors.white.withValues(alpha: 0.5),
                                      fontSize: 12,
                                    ),
                                  ),
                                  Text(
                                    _localizedTitle(lp),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              const Spacer(),
                              Text(
                                _config.emoji,
                                style: const TextStyle(fontSize: 24),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                        Expanded(
                          child: _step == _LoginStep.otp
                              ? AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 300),
                                  child: _buildOtpStep(lp),
                                )
                              : Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.vertical(
                                      top: Radius.circular(28),
                                    ),
                                  ),
                                  child: AnimatedSwitcher(
                                    duration:
                                        const Duration(milliseconds: 300),
                                    child: _accountStatusMessage != null
                                        ? _buildStatusMessage(lp)
                                        : _buildContactStep(lp),
                                  ),
                                ),
                        ),
                      ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildStatusMessage(LanguageProvider lp) {
    return Column(
      key: const ValueKey<String>('status'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.info_outline_rounded,
          color: Color(0xFFB5850A),
          size: 40,
        ),
        const SizedBox(height: 16),
        Text(
          _accountStatusMessage!,
          style: TextStyle(
            fontSize: 15,
            color: Colors.grey[700],
            height: 1.5,
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: _goToContactStep,
            child: Text(lp.t('Back to sign in', 'Retour à la connexion')),
          ),
        ),
      ],
    );
  }

  Widget _buildContactStep(LanguageProvider lp) {
    return SingleChildScrollView(
      key: const ValueKey<String>('contact'),
      physics: const ClampingScrollPhysics(),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
        Text(
          lp.t('Sign in', 'Connexion'),
          style: const TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1a3c2e),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          widget.role == AuthRole.government
              ? lp.t(
                  'Use your institutional email or phone to sign in',
                  'Utilisez votre email ou téléphone institutionnel',
                )
              : lp.t(
                  'Enter your email or phone — we\'ll send a verification code',
                  'Entrez votre email ou téléphone — nous enverrons un code',
                ),
          style: TextStyle(fontSize: 14, color: Colors.grey[500]),
        ),
        const SizedBox(height: 28),
        ValueListenableBuilder<TextEditingValue>(
          valueListenable: _contactCtrl,
          builder: (context, value, _) {
            return TextFormField(
              controller: _contactCtrl,
              keyboardType: _keyboardType,
              autocorrect: false,
              enableSuggestions: false,
              style: AuthFormTheme.fieldTextStyle(),
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) {
                if (_isValidContact && !_loading) _sendCode();
              },
              decoration: AuthFormTheme.decoration(
                hint: _isEmail
                    ? lp.t('email@example.com', 'email@exemple.com')
                    : '$_countryPrefix  •  ${lp.t('phone number', 'numéro de téléphone')}',
                labelText: lp.t(
                  'Email or phone number',
                  'Email ou numéro de téléphone',
                ),
                suffixIcon: value.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AuthFormTheme.hintColor),
                        onPressed: () {
                          _contactCtrl.clear();
                          setState(() {
                            _isEmail = false;
                            _keyboardType = TextInputType.emailAddress;
                          });
                        },
                      )
                    : null,
              ),
              onChanged: (val) {
                setState(() {
                  _isEmail = val.contains('@');
                  _keyboardType = _isEmail
                      ? TextInputType.emailAddress
                      : TextInputType.phone;
                });
              },
            );
          },
        ),
        if (widget.role == AuthRole.government) ...[
          const SizedBox(height: 6),
          Text(
            lp.t(
              'Requires official .gov or .gouv email',
              'Email officiel .gov ou .gouv requis',
            ),
            style: TextStyle(fontSize: 11, color: Colors.grey[400]),
          ),
        ],
        if (_needsCountry) ...[
          const SizedBox(height: 14),
          _label(
            widget.role == AuthRole.government
                ? lp.t('Country', 'Pays')
                : lp.t('Cooperative country', 'Pays de la coopérative'),
          ),
          const SizedBox(height: 8),
          CountryDropdown(
            value: _selectedCountry,
            hint: lp.t('Select country', 'Sélectionner le pays'),
            onChanged: (v) => setState(() => _selectedCountry = v ?? ''),
          ),
        ],
        if (_error.isNotEmpty) ...[
          const SizedBox(height: 10),
          _inlineError(_error),
        ],
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _loading || !_isValidContact ? null : _sendCode,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: AppColors.forestGreen,
              disabledBackgroundColor: AppColors.gold.withValues(alpha: 0.4),
              disabledForegroundColor:
                  AppColors.forestGreen.withValues(alpha: 0.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: _loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      color: AppColors.forestGreen,
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    lp.t('Send Code', 'Envoyer le code'),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
        Visibility(
          visible: _loading,
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              lp.t(
                'Connecting to server — this may take up to 30 seconds on first launch.',
                'Connexion au serveur — cela peut prendre jusqu\'à 30 secondes au premier lancement.',
              ),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[400],
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Center(
          child: TextButton(
            onPressed: () => context.push('/terms?view=1'),
            child: Text(
              lp.t('View Terms', 'Voir les conditions'),
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 13,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
                decorationColor: Colors.grey[500],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        _registerFooter(lp),
      ],
    ),
    );
  }

  Widget _buildOtpStep(LanguageProvider lp) {
    return GestureDetector(
      key: const ValueKey<String>('otp'),
      behavior: HitTestBehavior.opaque,
      onTap: () => FocusScope.of(context).unfocus(),
      child: Center(
        child: SingleChildScrollView(
          reverse: true,
          physics: const ClampingScrollPhysics(),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: SafeInsets.bottom(context, extra: 16),
          ),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lp.t('Check your email', 'Vérifiez votre email'),
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1a3c2e),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  lp.t(
                    'We sent a sign-in link to $_contact. Tap the button in the email to sign in instantly.',
                    'Nous avons envoyé un lien de connexion à $_contact. Appuyez sur le bouton dans l\'email pour vous connecter instantanément.',
                  ),
                  style: TextStyle(fontSize: 14, color: Colors.grey[500], height: 1.5),
                ),
                const SizedBox(height: 8),
                Text(
                  lp.t(
                    'The link expires in 15 minutes.',
                    'Le lien expire dans 15 minutes.',
                  ),
                  style: TextStyle(fontSize: 13, color: Colors.grey[400]),
                ),
                if (!_showManualCode) ...[
                  const SizedBox(height: 20),
                  TextButton(
                    onPressed: _loading
                        ? null
                        : () {
                            setState(() => _showManualCode = true);
                            _otpFocus[0].requestFocus();
                          },
                    child: Text(
                      lp.t(
                        'Enter code manually instead',
                        'Entrer le code manuellement',
                      ),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1a3c2e),
                      ),
                    ),
                  ),
                ],
                if (_showManualCode) ...[
                  const SizedBox(height: 12),
                  OtpCodeRow(
                    controllers: _otpCtrl,
                    focusNodes: _otpFocus,
                    enabled: !_loading,
                    onDigitChanged: _onOtpDigitChanged,
                  ),
                ],
                if (kDebugMode) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Colors.orange.withValues(alpha: 0.5),
                      ),
                    ),
                    child: const Text(
                      '🔧 Dev mode: Backend OTP not configured yet.\n'
                      'Enter any 6 digits to continue testing.',
                      style: TextStyle(color: Colors.orange, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _inlineError(_error),
                ],
                const SizedBox(height: 12),
                Center(
                  child: _resendSeconds > 0
                      ? Text(
                          lp.t(
                            'Resend in ${_resendSeconds}s',
                            'Renvoyer dans ${_resendSeconds}s',
                          ),
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[500],
                          ),
                        )
                      : TextButton(
                          onPressed: _loading ? null : _resendCode,
                          child: Text(
                            lp.t('Resend code', 'Renvoyer le code'),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1a3c2e),
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _loading ? null : _goToContactStep,
                  child: Text(
                    lp.t('← Change number', '← Changer le numéro'),
                    style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                  ),
                ),
                if (_loading) ...[
                  const SizedBox(height: 8),
                  const Center(
                    child: SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                _registerFooter(lp),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _onOtpDigitChanged(int index, String val) {
    if (val.isNotEmpty && index < 5) {
      _otpFocus[index + 1].requestFocus();
    }
    if (val.isEmpty && index > 0) {
      _otpFocus[index - 1].requestFocus();
    }
    if (_error.isNotEmpty) setState(() => _error = '');
    if (_otpCode.length == 6 && !_loading) {
      _verifyOtp();
    }
  }

  Widget _inlineError(String message) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFCEBEB),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          message,
          style: const TextStyle(color: Color(0xFFA32D2D), fontSize: 12),
        ),
      );

  bool get _showsWebPaymentNote =>
      widget.role == AuthRole.investor ||
      widget.role == AuthRole.cooperative ||
      widget.role == AuthRole.processor;

  String _registerButtonLabel(LanguageProvider lp) {
    if (widget.role == AuthRole.investor) {
      return lp.t('Register', "S'inscrire");
    }
    if (widget.role == AuthRole.cooperative) {
      return lp.t('Register (web)', "S'inscrire (web)");
    }
    if (widget.role == AuthRole.processor) {
      return lp.t('Register (web)', "S'inscrire (web)");
    }
    return lp.t('Request access', "Demander l'accès");
  }

  Widget _registerFooter(LanguageProvider lp) => Container(
        padding: const EdgeInsets.all(16),
        decoration: AuthFormTheme.footerDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    widget.role == AuthRole.investor
                        ? lp.t(
                            'New to AfriYield Exchange?',
                            'Nouveau sur AfriYield Exchange ?',
                          )
                        : widget.role == AuthRole.cooperative
                            ? lp.t(
                                'New cooperative?',
                                'Nouvelle coopérative ?',
                              )
                            : widget.role == AuthRole.processor
                                ? lp.t(
                                    'New transformation center?',
                                    'Nouveau centre de transformation ?',
                                  )
                                : lp.t(
                                    "Don't have access yet?",
                                    'Pas encore accès ?',
                                  ),
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => _openUrl(_config.registerUrl),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    backgroundColor: const Color(0xFF1a3c2e),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    _registerButtonLabel(lp),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            if (_showsWebPaymentNote) ...[
              const SizedBox(height: 10),
              Text(
                lp.t(
                  'Registration starts here. Payment is completed in the web browser.',
                  'L\'inscription démarre ici. Le paiement s\'effectue sur le navigateur web.',
                ),
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
              ),
            ],
          ],
        ),
      );

  String _localizedSubtitle(LanguageProvider lp) {
    switch (widget.role) {
      case AuthRole.government:
        return lp.t('Government portal', 'Portail gouvernemental');
      case AuthRole.ngo:
        return lp.t('Partner programs', 'Programmes partenaires');
      default:
        return _config.subtitle;
    }
  }

  String _localizedTitle(LanguageProvider lp) {
    switch (widget.role) {
      case AuthRole.cooperative:
        return lp.t('Cooperative portal', 'Portail coopérative');
      case AuthRole.investor:
        return lp.t('AfriYield Exchange', 'AfriYield Exchange');
      case AuthRole.government:
        return lp.t('Government', 'Gouvernement');
      case AuthRole.ngo:
        return lp.t('NGO / Partner', 'ONG / Partenaire');
      case AuthRole.processor:
        return lp.t('Processor portal', 'Portail processeur');
      default:
        return _config.title;
    }
  }

  Widget _label(String text) => Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Colors.grey[700],
        ),
      );

  String _dashboardRoute(AuthRole role) {
    switch (role) {
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
}
