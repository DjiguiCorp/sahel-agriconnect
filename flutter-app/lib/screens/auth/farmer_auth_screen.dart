import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';

enum FarmerAuthStep { identity, otp, register }

class FarmerAuthScreen extends StatefulWidget {
  const FarmerAuthScreen({super.key});

  @override
  State<FarmerAuthScreen> createState() => _FarmerAuthScreenState();
}

class _FarmerAuthScreenState extends State<FarmerAuthScreen> {
  FarmerAuthStep _step = FarmerAuthStep.identity;

  final _emailCtrl = TextEditingController();

  final List<TextEditingController> _otpCtrl =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocus = List.generate(6, (_) => FocusNode());

  final _nameCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  String _selectedCrop = 'Shea Butter';
  String _selectedCountry = '';
  String? _pendingRegistrationId;

  bool _loading = false;
  String _error = '';

  String _savedEmail = '';
  String _savedName = '';
  bool _checkingSession = true;

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

  static const _countries = [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros',
    'Congo', "Côte d'Ivoire", 'Democratic Republic of the Congo',
    'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini',
    'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau',
    'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali',
    'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger',
    'Nigeria', 'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles',
    'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan',
    'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
  ];

  @override
  void initState() {
    super.initState();
    _checkSavedSession();
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
        _emailCtrl.text = _savedEmail;
      }
    });
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
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

  String get _contact => _emailCtrl.text.trim();

  bool get _contactIsEmail => _contact.contains('@');

  Future<void> _sendOtp() async {
    final contact = _contact;
    if (contact.isEmpty) {
      final lp = context.read<LanguageProvider>();
      setState(() => _error = lp.t(
            'Please enter your email or phone number',
            'Veuillez entrer votre email ou numéro de téléphone',
          ));
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
      _pendingRegistrationId = null;
    });
    try {
      final res = await ApiService.post('/api/verify/send', {
        'email': _contactIsEmail ? contact : null,
        'phone': !_contactIsEmail ? contact : null,
        'purpose': 'farmer_verify',
      });
      if (res['error'] != null) {
        throw Exception(res['error'].toString());
      }
      if (res['success'] == false) {
        throw Exception(res['error']?.toString() ?? 'Request failed');
      }
      if (!mounted) return;
      setState(() {
        _loading = false;
        _step = FarmerAuthStep.otp;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e
            .toString()
            .replaceAll('Exception: ', '')
            .replaceAll('DioException', '')
            .trim();
      });
    }
  }

  Map<String, dynamic> _sessionUserFrom(String token, Map<String, dynamic>? apiUser) {
    final raw = JwtDecoder.decode(token);
    final payload = Map<String, dynamic>.from(raw as Map);
    final merged = Map<String, dynamic>.from(payload);
    if (apiUser != null && apiUser.isNotEmpty) {
      merged.addAll(apiUser);
    }
    return merged;
  }

  Future<void> _verifyOtp() async {
    if (_otpCode.length < 6) {
      final lp = context.read<LanguageProvider>();
      setState(() => _error = lp.t(
            'Please enter all 6 digits',
            'Veuillez entrer les 6 chiffres',
          ));
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final contact = _contact;
      final res = await ApiService.post('/api/verify/confirm', {
        'email': _contactIsEmail ? contact : null,
        'phone': !_contactIsEmail ? contact : null,
        'code': _otpCode,
        'purpose': 'farmer_verify',
      });
      if (res['error'] != null) {
        throw Exception(res['error'].toString());
      }
      if (res['success'] == false) {
        throw Exception(res['error']?.toString() ?? 'Verification failed');
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
        final apiUser = res['user'];
        final userMap = apiUser is Map
            ? Map<String, dynamic>.from(apiUser)
            : <String, dynamic>{};
        final merged = _sessionUserFrom(token, userMap);
        if (!mounted) return;
        final auth = context.read<AuthState>();
        await auth.saveFarmerIdentity(
          userMap['email']?.toString() ?? (_contactIsEmail ? contact : ''),
          userMap['nom']?.toString() ?? '',
        );
        await auth.setSession(AuthRole.farmer, token, merged);
        if (!mounted) return;
        context.go('/farmer');
        return;
      }

      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Unexpected response from server';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e
            .toString()
            .replaceAll('Exception: ', '')
            .replaceAll('DioException', '')
            .trim();
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
    if (_pendingRegistrationId == null || _pendingRegistrationId!.isEmpty) {
      setState(() => _error = 'Session expired. Please start again.');
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
        'telephone': !_contactIsEmail ? contact : null,
        'country': _selectedCountry,
        'region': _regionCtrl.text.trim(),
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
        if (!mounted) return;
        context.go('/farmer');
        return;
      }
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'No token returned';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e
            .toString()
            .replaceAll('Exception: ', '')
            .replaceAll('DioException', '')
            .trim();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    return Scaffold(
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
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () {
                        if (_step == FarmerAuthStep.identity) {
                          context.go('/role');
                        } else {
                          setState(() {
                            _step = FarmerAuthStep.identity;
                            _error = '';
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
                            lp.t('Farmer portal', 'Portail agriculteur'),
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
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
                          color: AppColors.gold.withValues(alpha: 0.3),
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
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: _buildStep(lp),
                  ),
                ),
              ),
            ],
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

  Widget _buildIdentityStep(LanguageProvider lp) {
    return Column(
      key: const ValueKey<String>('identity'),
      crossAxisAlignment: CrossAxisAlignment.start,
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
              _emailCtrl.clear();
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
        Text(
          lp.t('Email or phone number', 'Email ou numéro de téléphone'),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(fontSize: 15, color: Color(0xFF1a3c2e)),
          decoration: InputDecoration(
            hintText: lp.t(
              'e.g. your@email.com or +223...',
              'ex. votre@email.com ou +223...',
            ),
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
            filled: true,
            fillColor: const Color(0xFFF8F4E3),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF1a3c2e), width: 1.5),
            ),
            prefixIcon: Icon(Icons.alternate_email_rounded, color: Colors.grey[400]),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        if (_error.isNotEmpty) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFCEBEB),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _error,
              style: const TextStyle(color: Color(0xFFA32D2D), fontSize: 12),
            ),
          ),
        ],
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _loading ? null : _sendOtp,
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
                    lp.t(
                      'Send verification code',
                      'Envoyer le code de vérification',
                    ),
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
        const Spacer(),
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
      ],
    );
  }

  Widget _buildOtpStep(LanguageProvider lp) {
    return Column(
      key: const ValueKey<String>('otp'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          lp.t('Enter your code', 'Entrez votre code'),
          style: const TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1a3c2e),
          ),
        ),
        const SizedBox(height: 6),
        RichText(
          text: TextSpan(
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            children: [
              TextSpan(
                text: '${lp.t(
                  'We sent a 6-digit code to',
                  'Nous avons envoyé un code à 6 chiffres à',
                )} ',
              ),
              TextSpan(
                text: _contact,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1a3c2e),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 36),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (i) => _otpBox(i)),
        ),
        if (_error.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFCEBEB),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _error,
              style: const TextStyle(color: Color(0xFFA32D2D), fontSize: 12),
            ),
          ),
        ],
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _loading ? null : _verifyOtp,
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
                    lp.t('Verify code', 'Vérifier le code'),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: TextButton(
            onPressed: _loading ? null : _sendOtp,
            child: Text(
              lp.t("Didn't receive it? Resend", 'Pas reçu ? Renvoyer'),
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }

  Widget _otpBox(int index) => SizedBox(
        width: 46,
        height: 54,
        child: TextField(
          controller: _otpCtrl[index],
          focusNode: _otpFocus[index],
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          maxLength: 1,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1a3c2e),
          ),
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(
            counterText: '',
            filled: true,
            fillColor: const Color(0xFFF8F4E3),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF1a3c2e), width: 2),
            ),
          ),
          onChanged: (val) {
            if (val.isNotEmpty && index < 5) {
              _otpFocus[index + 1].requestFocus();
            }
            if (val.isEmpty && index > 0) {
              _otpFocus[index - 1].requestFocus();
            }
            setState(() => _error = '');
          },
        ),
      );

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
                  style: const TextStyle(color: Color(0xFFAAAAAA), fontSize: 14),
                ),
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded),
                items: _countries
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
          const SizedBox(height: 14),
          Text(
            lp.t('Main crop', 'Culture principale'),
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
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFCEBEB),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                _error,
                style: const TextStyle(color: Color(0xFFA32D2D), fontSize: 12),
              ),
            ),
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
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: ctrl,
            style: const TextStyle(fontSize: 15, color: Color(0xFF1a3c2e)),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              filled: true,
              fillColor: const Color(0xFFF8F4E3),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFF1a3c2e), width: 1.5),
              ),
              prefixIcon: Icon(icon, color: Colors.grey[400]),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
            ),
          ),
        ],
      );
}
