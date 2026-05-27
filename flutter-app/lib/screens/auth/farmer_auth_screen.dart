import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../core/safe_insets.dart';
import 'package:go_router/go_router.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:app_links/app_links.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/auth_form_theme.dart';
import '../../widgets/country_picker.dart';
import '../../widgets/otp_code_row.dart';

enum FarmerAuthStep { identity, otp, register }

class FarmerAuthScreen extends StatefulWidget {
  const FarmerAuthScreen({
    super.key,
    this.pendingRegistrationId,
    this.initialEmail,
  });

  /// Set when returning from magic-link verification (new farmer).
  final String? pendingRegistrationId;
  final String? initialEmail;

  @override
  State<FarmerAuthScreen> createState() => _FarmerAuthScreenState();
}

class _FarmerAuthScreenState extends State<FarmerAuthScreen> {
  FarmerAuthStep _step = FarmerAuthStep.identity;

  final _contactController = TextEditingController();

  final List<TextEditingController> _otpCtrl =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocus = List.generate(6, (_) => FocusNode());

  final _nameCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  String _selectedCrop = 'Shea Butter';
  String _selectedCountry = '';
  String? _pendingRegistrationId;
  double? _latitude;
  double? _longitude;
  bool _locating = false;

  bool _loading = false;
  String _error = '';
  String _countryPrefix = '+223';
  String? _verificationId;
  String? _accountStatusMessage;
  bool _showManualCode = false;

  Timer? _resendTimer;
  int _resendSeconds = 45;

  TextInputType _keyboardType = TextInputType.emailAddress;
  bool _isEmail = false;

  String _savedEmail = '';
  String _savedName = '';
  bool _checkingSession = true;
  StreamSubscription<Uri>? _magicLinkSub;

  static const _crops = [
    'Shea Butter',
    'Sesame',
    'Cashew',
    'Mango',
    'Rice',
    'Millet',
    'Sorghum',
    'Cotton',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _contactController.addListener(_onContactChanged);
    _detectCountry();
    _checkSavedSession();
    _applyRouteParams();
    _magicLinkSub = AppLinks().uriLinkStream.listen(_onMagicLinkUri);
  }

  void _applyRouteParams() {
    final pending = widget.pendingRegistrationId;
    final email = widget.initialEmail;
    if (pending != null && pending.isNotEmpty) {
      _pendingRegistrationId = pending;
      _step = FarmerAuthStep.register;
    }
    if (email != null && email.isNotEmpty) {
      _contactController.text = email;
      _isEmail = true;
      _keyboardType = TextInputType.emailAddress;
    }
  }

  void _onMagicLinkUri(Uri uri) {
    if (!uri.pathSegments.contains('magic') &&
        !(uri.host == 'auth' && uri.path.contains('magic'))) {
      return;
    }
    final code = uri.queryParameters['c'] ?? '';
    final email = uri.queryParameters['e'] ?? '';
    final purpose = uri.queryParameters['p'] ?? 'farmer_verify';
    if (code.isEmpty || email.isEmpty) return;
    if (!mounted) return;
    context.go(
      '/auth/magic?c=${Uri.encodeComponent(code)}'
      '&e=${Uri.encodeComponent(email)}'
      '&p=${Uri.encodeComponent(purpose)}',
    );
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

  Future<void> _checkSavedSession() async {
    final auth = context.read<AuthState>();
    final email = await auth.getSavedFarmerEmail();
    final name = await auth.getSavedFarmerName();
    if (!mounted) return;
    setState(() {
      _savedEmail = email ?? '';
      _savedName = name ?? '';
      _checkingSession = false;
      if (_savedEmail.isNotEmpty) {
        _contactController.text = _savedEmail;
        _isEmail = _savedEmail.contains('@');
        _keyboardType =
            _isEmail ? TextInputType.emailAddress : TextInputType.phone;
      }
    });
  }

  bool get _isValidContact {
    final value = _contactController.text.trim();
    if (value.isEmpty) return false;
    if (value.contains('@')) {
      return RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(value);
    }
    final digits = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    return digits.length >= 6 && digits.length <= 15;
  }

  @override
  void dispose() {
    _magicLinkSub?.cancel();
    _resendTimer?.cancel();
    _contactController.removeListener(_onContactChanged);
    _contactController.dispose();
    for (final c in _otpCtrl) {
      c.dispose();
    }
    for (final f in _otpFocus) {
      f.dispose();
    }
    _nameCtrl.dispose();
    _regionCtrl.dispose();
    super.dispose();
  }

  String get _otpCode => _otpCtrl.map((c) => c.text).join();

  String get _contact => _contactController.text.trim();

  bool get _contactIsEmail => _contact.contains('@');

  String _maskedDestination(String contact) {
    if (_contactIsEmail) {
      final parts = contact.split('@');
      if (parts.length != 2) return contact;
      final local = parts[0];
      final masked = local.length <= 1
          ? '*'
          : '${local[0]}${'*' * (local.length - 1).clamp(1, 3)}';
      return '$masked@${parts[1]}';
    }
    if (contact.length <= 8) return contact;
    return '${contact.substring(0, 4)}...${contact.substring(contact.length - 4)}';
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

  void _goToIdentityStep() {
    _resendTimer?.cancel();
    setState(() {
      _step = FarmerAuthStep.identity;
      _error = '';
      _accountStatusMessage = null;
      _verificationId = null;
      _showManualCode = false;
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
    final contact = _contactController.text.trim();
    final formattedContact = contact.contains('@')
        ? contact
        : '$_countryPrefix${contact.replaceAll(RegExp(r'^0+'), '')}';
    final lang = context.read<LanguageProvider>().lang;
    final body = <String, dynamic>{
      'purpose': 'farmer_verify',
      'role': 'farmer',
      'lang': lang,
      if (contact.contains('@')) 'email': formattedContact.toLowerCase(),
      if (!contact.contains('@')) 'phone': formattedContact,
    };
    try {
      final res = await ApiService.post('/api/auth/send-otp', body);
      if (res['success'] == false && res['code'] == 'EMAIL_SEND_FAILED') {
        return res;
      }
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
        'role': 'farmer',
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
    setState(() {
      _loading = true;
      _error = '';
      _accountStatusMessage = null;
      _pendingRegistrationId = null;
    });
    try {
      final res = await _sendOtpApi();
      if (res['success'] == false && res['code'] == 'EMAIL_SEND_FAILED') {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _error = lp.t(
            'Email not received. Check your email address and try again.',
            'Email non reçu. Vérifiez votre adresse email et réessayez.',
          );
        });
        return;
      }
      if (res['success'] == false) {
        setState(() {
          _error = res['error'] ??
              lp.t(
                'Something went wrong. Try again.',
                'Une erreur est survenue. Réessayez.',
              );
          _loading = false;
        });
        return;
      }
      final vid = res['verificationId']?.toString();
      if (!mounted) return;
      setState(() {
        _loading = false;
        _verificationId = vid ?? 'mock-id';
        _step = FarmerAuthStep.otp;
        _showManualCode = false;
      });
      _clearOtpFields();
      _startResendCountdown();
      _showOtpSentSnackBar();
      if (mounted && res['emailDelivery'] == 'dev_logged') {
        final devCode = res['otpCode']?.toString() ?? '';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              lp.t(
                devCode.isNotEmpty
                    ? 'Email delivery is not configured. Dev OTP code: $devCode'
                    : 'Email delivery is not configured on the server. Check server logs for the code, or ask admin to set RESEND_API_KEY.',
                devCode.isNotEmpty
                    ? 'Envoi email non configuré. Code OTP (dev): $devCode'
                    : 'L\'envoi d\'email n\'est pas configuré sur le serveur. Vérifiez les logs serveur pour le code, ou configurez RESEND_API_KEY.',
              ),
            ),
            duration: const Duration(seconds: 6),
            backgroundColor: AppColors.gold,
          ),
        );
      }
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

  Future<void> _completeFarmerSession(
    String token,
    Map<String, dynamic> res,
    LanguageProvider lp,
  ) async {
    final contact = _contact;
    final apiUser = res['user'];
    final userMap = apiUser is Map
        ? Map<String, dynamic>.from(apiUser)
        : <String, dynamic>{};
    final merged = _sessionUserFrom(token, userMap);
    if (!mounted) return;
    final auth = context.read<AuthState>();
    await auth.saveFarmerIdentity(
      userMap['email']?.toString() ?? (_contactIsEmail ? contact : ''),
      userMap['nom']?.toString() ?? userMap['name']?.toString() ?? '',
    );
    await auth.setSession(AuthRole.farmer, token, merged);
    // Store sessionSeed for biometric re-login (seed comes from OTP verify response)
    final seed = res['sessionSeed'] as String?;
    if (seed != null && seed.isNotEmpty) {
      await auth.storeSeed(seed, 'farmer');
    }
    if (!mounted) return;
    context.go('/farmer/onboarding');
  }

  Future<void> _verifyOtp() async {
    if (_otpCode.length < 6) return;
    final lp = context.read<LanguageProvider>();
    setState(() {
      _loading = true;
      _error = '';
      _accountStatusMessage = null;
    });
    try {
      final res = await _verifyOtpApi(_otpCode);
      if (res['success'] == false &&
          res['token'] == null &&
          res['isNewUser'] != true) {
        throw Exception(res['error']?.toString() ?? 'Verification failed');
      }

      final status = res['accountStatus']?.toString();
      if (status == 'pending_vetting') {
        if (!mounted) return;
        final token = res['token'] as String?;
        context.go('/pending-vetting', extra: {
          'role': AuthRole.farmer,
          'contact': _contact,
          'sessionToken': token,
          'verificationId': _verificationId,
        });
        return;
      }
      if (status == 'suspended') {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _accountStatusMessage = lp.t(
            'Your account has been suspended. Contact support@sahelagriconnect.com',
            'Votre compte a été suspendu. Contactez support@sahelagriconnect.com',
          );
        });
        return;
      }

      if (res['isNewUser'] == true) {
        final pending = res['pendingRegistrationId']?.toString();
        if (!mounted) return;
        setState(() {
          _loading = false;
          _step = FarmerAuthStep.register;
          _pendingRegistrationId = pending;
        });
        return;
      }

      final token = res['token'] as String?;
      if (token != null && token.isNotEmpty) {
        await _completeFarmerSession(token, res, lp);
        return;
      }

      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = lp.t(
          'Unable to sign in. Please try again.',
          'Connexion impossible. Veuillez réessayer.',
        );
      });
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

  Future<void> _captureLocation(LanguageProvider lp) async {
    setState(() {
      _locating = true;
      _error = '';
    });
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        if (!mounted) return;
        setState(() {
          _locating = false;
          _error = lp.t(
            'Location permission is required for GPS. Enable it in settings.',
            'La localisation est requise pour le GPS. Activez-la dans les paramètres.',
          );
        });
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (!mounted) return;
      setState(() {
        _latitude = pos.latitude;
        _longitude = pos.longitude;
        _locating = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lp.t(
              'Location captured',
              'Position enregistrée',
            ),
          ),
          backgroundColor: AppColors.gold,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _locating = false;
        _error = lp.t(
          'Could not get GPS location. Enter your region manually.',
          'Impossible d\'obtenir le GPS. Entrez votre région manuellement.',
        );
      });
    }
  }

  Future<void> _register() async {
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Please enter your name');
      return;
    }
    if (_selectedCountry.isEmpty) {
      setState(() => _error = 'Please select your country');
      return;
    }
    final lp = context.read<LanguageProvider>();
    if (_pendingRegistrationId == null || _pendingRegistrationId!.isEmpty) {
      setState(() => _error = lp.t(
            'Please verify your email first. Go back and tap Send Code, then enter the 6-digit code.',
            'Vérifiez d\'abord votre email. Revenez en arrière, appuyez sur Envoyer le code, puis entrez le code à 6 chiffres.',
          ));
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final contact = _contact;
      final res = await ApiService.post('/api/farmers/register-mobile', {
        'pendingRegistrationId': _pendingRegistrationId,
        'nom': _nameCtrl.text.trim(),
        'email': _contactIsEmail ? contact : null,
        'telephone': !_contactIsEmail
            ? '$_countryPrefix${contact.replaceAll(RegExp(r'^0+'), '')}'
            : null,
        'country': _selectedCountry,
        'region': _regionCtrl.text.trim(),
        if (_latitude != null) 'latitude': _latitude,
        if (_longitude != null) 'longitude': _longitude,
        'cultures': [_selectedCrop],
        'statut': 'Actif',
      });
      if (res['error'] != null) {
        throw Exception(res['error'].toString());
      }
      if (res['success'] == false) {
        throw Exception(res['error']?.toString() ?? 'Registration failed');
      }
      final token = res['token'] as String?;
      if (token != null && token.isNotEmpty) {
        final farmer = res['farmer'];
        final farmerMap = farmer is Map
            ? Map<String, dynamic>.from(farmer)
            : <String, dynamic>{};
        final merged = _sessionUserFrom(token, farmerMap);
        if (!mounted) return;
        final auth = context.read<AuthState>();
        await auth.saveFarmerIdentity(
          farmerMap['email']?.toString() ?? (_contactIsEmail ? contact : ''),
          _nameCtrl.text.trim(),
        );
        await auth.setSession(AuthRole.farmer, token, merged);
        final seed = res['sessionSeed'] as String?;
        if (seed != null && seed.isNotEmpty) {
          await auth.storeSeed(seed, 'farmer');
        }
        if (!mounted) return;
        context.go('/farmer/onboarding');
        return;
      }
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'No token returned';
      });
    } catch (e) {
      if (!mounted) return;
      final lp = context.read<LanguageProvider>();
      setState(() {
        _loading = false;
        _error = _friendlyError(e, lp);
      });
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
              Color(0xFF1a3c2e),
              Color(0xFF2d5a3d),
              Color(0xFF0d1f17),
            ],
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
                                  if (_step == FarmerAuthStep.identity) {
                                    context.go('/home');
                                  } else if (_step == FarmerAuthStep.otp) {
                                    _goToIdentityStep();
                                  } else {
                                    setState(() {
                                      _step = FarmerAuthStep.identity;
                                      _error = '';
                                      _accountStatusMessage = null;
                                    });
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
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      lp.t(
                                        'Farmer portal',
                                        'Portail agriculteur',
                                      ),
                                      style: TextStyle(
                                        color: Colors.white.withValues(
                                          alpha: 0.5,
                                        ),
                                        fontSize: 12,
                                      ),
                                    ),
                                    const Text(
                                      'Sahel AgriConnect',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.gold.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color:
                                        AppColors.gold.withValues(alpha: 0.3),
                                    width: 0.5,
                                  ),
                                ),
                                child: Text(
                                  lp.t('🌾 Farmer', '🌾 Agriculteur'),
                                  style: const TextStyle(
                                    color: AppColors.gold,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                        Expanded(
                          child: _step == FarmerAuthStep.otp
                              ? AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 300),
                                  child: _buildOtpStep(lp),
                                )
                              : Container(
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  padding: const EdgeInsets.all(24),
                                  decoration: AuthFormTheme.glassPanelDecoration(),
                                  child: AnimatedSwitcher(
                                    duration:
                                        const Duration(milliseconds: 300),
                                    child: _accountStatusMessage != null
                                        ? _buildStatusMessage(lp)
                                        : _buildStep(lp),
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

  Widget _buildStep(LanguageProvider lp) {
    switch (_step) {
      case FarmerAuthStep.identity:
        return _buildIdentityStep(lp);
      case FarmerAuthStep.otp:
        return _buildOtpStep(lp);
      case FarmerAuthStep.register:
        return _buildRegisterStep(lp);
    }
  }

  Widget _buildStatusMessage(LanguageProvider lp) {
    return Column(
      key: const ValueKey<String>('status'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.info_outline_rounded,
          color: AppColors.gold,
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
            onPressed: _goToIdentityStep,
            child: Text(lp.t('Back to sign in', 'Retour à la connexion')),
          ),
        ),
      ],
    );
  }

  Widget _buildIdentityStep(LanguageProvider lp) {
    return SingleChildScrollView(
      key: const ValueKey<String>('identity'),
      physics: const ClampingScrollPhysics(),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
        if (_checkingSession)
          const Center(child: CircularProgressIndicator())
        else if (_savedName.isNotEmpty) ...[
          Text(
            lp.t('Welcome back', 'Bon retour'),
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1a3c2e),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            lp.t(
              'Good to see you again, $_savedName',
              'Heureux de vous revoir, $_savedName',
            ),
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF3DE),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.person_outline,
                  size: 16,
                  color: Color(0xFF3B6D11),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _savedEmail,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF3B6D11),
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          TextButton(
            onPressed: () => setState(() {
              _savedName = '';
              _savedEmail = '';
              _contactController.clear();
              _isEmail = false;
              _keyboardType = TextInputType.emailAddress;
            }),
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: const Size(0, 32),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              lp.t(
                'Not you? Use a different account',
                'Pas vous ? Utiliser un autre compte',
              ),
              style: TextStyle(fontSize: 12, color: Colors.grey[400]),
            ),
          ),
        ] else ...[
          Text(
            lp.t('Welcome', 'Bienvenue'),
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1a3c2e),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            lp.t(
              'Enter your email or phone number to continue',
              'Entrez votre email ou numéro de téléphone pour continuer',
            ),
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
        const SizedBox(height: 28),
        ValueListenableBuilder<TextEditingValue>(
          valueListenable: _contactController,
          builder: (context, value, _) {
            return TextFormField(
              controller: _contactController,
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
                          _contactController.clear();
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
          child: Text(
            lp.t(
              "We'll send a 6-digit code to verify your identity.\nNo password needed.",
              "Nous enverrons un code à 6 chiffres pour vérifier votre identité.\nAucun mot de passe requis.",
            ),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 12,
              height: 1.6,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AuthFormTheme.footerDecoration(),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  lp.t(
                    'New farmer? Create your account',
                    'Nouvel agriculteur ? Créez votre compte',
                  ),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AuthFormTheme.hintColor,
                  ),
                ),
              ),
              TextButton(
                onPressed: _loading
                    ? null
                    : _sendCode,
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
                  lp.t('Register', "S'inscrire"),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
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
                    'We sent a sign-in link to ${_maskedDestination(_contact)}. Tap the button in the email to sign in instantly.',
                    'Nous avons envoyé un lien de connexion à ${_maskedDestination(_contact)}. Appuyez sur le bouton dans l\'email pour vous connecter instantanément.',
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
                Visibility(
                  visible: _showManualCode,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 12),
                      OtpCodeRow(
                        controllers: _otpCtrl,
                        focusNodes: _otpFocus,
                        enabled: !_loading,
                        onDigitChanged: _onOtpDigitChanged,
                      ),
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
                    ],
                  ),
                ),
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 12),
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
                  onPressed: _loading ? null : _goToIdentityStep,
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
              ],
            ),
          ),
        ),
      ),
    );
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

  Widget _buildRegisterStep(LanguageProvider lp) {
    return SingleChildScrollView(
      key: const ValueKey<String>('register'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF3DE),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              lp.t('New account', 'Nouveau compte'),
              style: const TextStyle(
                color: Color(0xFF3B6D11),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            lp.t('Tell us about yourself', 'Parlez-nous de vous'),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1a3c2e),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            lp.t(
              "We'll set up your farmer profile",
              'Nous allons créer votre profil agriculteur',
            ),
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
          const SizedBox(height: 24),
          _field(
            lp.t('Full name *', 'Nom complet *'),
            _nameCtrl,
            Icons.person_outline_rounded,
            'Amadou Diallo',
          ),
          const SizedBox(height: 14),
          Text(
            lp.t('Country *', 'Pays *'),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8F4E3),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _selectedCountry.isEmpty
                    ? Colors.orange.shade300
                    : Colors.transparent,
                width: 0.5,
              ),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedCountry.isEmpty ? null : _selectedCountry,
                hint: Text(
                  lp.t('Country *', 'Pays *'),
                  style:
                      const TextStyle(color: Color(0xFFAAAAAA), fontSize: 14),
                ),
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded),
                items: appCountryNames
                    .map((c) => DropdownMenuItem<String>(
                          value: c,
                          child: Text(c, style: const TextStyle(fontSize: 14)),
                        ))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedCountry = v);
                },
              ),
            ),
          ),
          const SizedBox(height: 14),
          _field(
            lp.t('Region / Village', 'Région / Village'),
            _regionCtrl,
            Icons.location_on_outlined,
            lp.t('Region / Village', 'Région / Village'),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _locating ? null : () => _captureLocation(lp),
              icon: _locating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location, size: 18),
              label: Text(
                lp.t('Use my location (GPS)', 'Utiliser ma position (GPS)'),
                style: const TextStyle(fontSize: 13),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AuthFormTheme.labelColor,
                side: BorderSide(
                  color: AppColors.forestGreen.withValues(alpha: 0.25),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          if (_latitude != null && _longitude != null) ...[
            const SizedBox(height: 6),
            Text(
              'GPS: ${_latitude!.toStringAsFixed(5)}, ${_longitude!.toStringAsFixed(5)}',
              style: const TextStyle(
                fontSize: 11,
                color: AuthFormTheme.hintColor,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Text(
            lp.t('Main crop', 'Culture principale'),
            style: AuthFormTheme.labelStyle(),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: AuthFormTheme.fillColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.forestGreen.withValues(alpha: 0.12),
              ),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedCrop,
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded),
                items: _crops
                    .map(
                      (c) => DropdownMenuItem<String>(
                        value: c,
                        child: Text(c),
                      ),
                    )
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedCrop = v);
                },
              ),
            ),
          ),
          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            _inlineError(_error),
          ],
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _loading ? null : _register,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1a3c2e),
                foregroundColor: Colors.white,
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
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      lp.t('Create my account', 'Créer mon compte'),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController ctrl,
    IconData icon,
    String hint,
  ) =>
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AuthFormTheme.labelStyle()),
          const SizedBox(height: 8),
          TextField(
            controller: ctrl,
            style: AuthFormTheme.fieldTextStyle(),
            decoration: AuthFormTheme.decoration(
              hint: hint,
              prefixIcon: Icon(icon, color: AuthFormTheme.hintColor, size: 20),
            ),
          ),
        ],
      );
}
