import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

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

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.role});

  final AuthRole role;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String _error = '';
  String _selectedCountry = '';

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

  bool get _needsCountry =>
      widget.role == AuthRole.government ||
      widget.role == AuthRole.cooperative;

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
      hint: 'your@email.com',
    ),
    AuthRole.cooperative: (
      title: 'Cooperative portal',
      subtitle: 'Sahel AgriConnect',
      emoji: '🤝',
      color: const Color(0xFFB5850A),
      bg: const [Color(0xFF1a3c2e), Color(0xFF2d5a3d)],
      loginEndpoint: '/api/cooperatives/login',
      canSelfRegister: false,
      registerUrl: 'https://sahelagriconnect.com/cooperative-registration',
      hint: 'cooperative@email.com',
    ),
    AuthRole.government: (
      title: 'Government / NGO',
      subtitle: 'Institutional portal',
      emoji: '🏛️',
      color: const Color(0xFF378ADD),
      bg: const [Color(0xFF0d1a2e), Color(0xFF1a3c2e)],
      loginEndpoint: '/api/government/login',
      canSelfRegister: false,
      registerUrl: 'https://sahelagriconnect.com/platform-licensing',
      hint: 'minister@agriculture.gov.ml',
    ),
    AuthRole.processor: (
      title: 'Processor portal',
      subtitle: 'Transformation center',
      emoji: '⚙️',
      color: const Color(0xFF3B6D11),
      bg: const [Color(0xFF1a3c2e), Color(0xFF0d1f17)],
      loginEndpoint: '/api/processors/login',
      canSelfRegister: false,
      registerUrl: 'https://sahelagriconnect.com/dashboard',
      hint: 'processor@email.com',
    ),
  };

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _login() async {
    final email = _emailCtrl.text.trim().toLowerCase();
    final password = _passwordCtrl.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please enter your email and password');
      return;
    }
    if (_needsCountry && _selectedCountry.isEmpty) {
      setState(() => _error = 'Please select your country');
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final res = await ApiService.post(_config.loginEndpoint, {
        'email': email,
        'password': password,
        if (_needsCountry && _selectedCountry.isNotEmpty)
          'country': _selectedCountry,
      });
      if (res['success'] == false) {
        throw Exception(res['error']?.toString() ?? 'Login failed');
      }
      final token = res['token'] as String?;
      if (token == null || token.isEmpty) {
        throw Exception(res['error']?.toString() ?? 'Login failed');
      }

      final raw = JwtDecoder.decode(token);
      final merged = Map<String, dynamic>.from(raw as Map);
      void mergeObj(String key) {
        final o = res[key];
        if (o is Map) {
          merged.addAll(Map<String, dynamic>.from(o));
        }
      }

      mergeObj('investor');
      mergeObj('cooperative');
      mergeObj('admin');
      mergeObj('processor');

      if (!mounted) return;
      await context.read<AuthState>().setSession(widget.role, token, merged);
      if (!mounted) return;

      if (widget.role == AuthRole.investor) {
        final bioPassed = await AuthService.authenticateWithBiometrics(
          reason: 'Verify your identity to access AfriYield Exchange',
        );
        if (!bioPassed) {
          if (!mounted) return;
          await context.read<AuthState>().logout();
          if (!mounted) return;
          setState(() {
            _loading = false;
            _error = 'Biometric verification failed. Please try again.';
          });
          return;
        }
      }

      if (!mounted) return;
      context.go(_dashboardRoute(widget.role));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: _config.bg,
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
                      onTap: () => context.go('/role'),
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
                          _config.subtitle,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          _config.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Text(_config.emoji, style: const TextStyle(fontSize: 24)),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Sign in',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1a3c2e),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        widget.role == AuthRole.government
                            ? 'Use your institutional email to sign in'
                            : 'Welcome back',
                        style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                      ),
                      const SizedBox(height: 28),
                      _label('Email'),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        style: const TextStyle(
                          fontSize: 15,
                          color: Color(0xFF1a3c2e),
                        ),
                        decoration: _inputDecoration(
                          _config.hint,
                          Icons.alternate_email_rounded,
                        ),
                      ),
                      if (widget.role == AuthRole.government) ...[
                        const SizedBox(height: 6),
                        Text(
                          'Requires official .gov or .gouv email',
                          style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                        ),
                      ],
                      if (_needsCountry) ...[
                        const SizedBox(height: 14),
                        _label(
                          widget.role == AuthRole.government
                              ? 'Country / Pays'
                              : 'Cooperative country',
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding:
                              const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: Colors.grey.shade200,
                              width: 0.5,
                            ),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedCountry.isEmpty
                                  ? null
                                  : _selectedCountry,
                              hint: Text(
                                widget.role == AuthRole.government
                                    ? 'Your country / Votre pays'
                                    : 'Cooperative country',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFFAAAAAA),
                                ),
                              ),
                              isExpanded: true,
                              icon: const Icon(
                                  Icons.keyboard_arrow_down_rounded),
                              items: _countries
                                  .map((c) => DropdownMenuItem<String>(
                                        value: c,
                                        child: Text(c),
                                      ))
                                  .toList(),
                              onChanged: (v) {
                                if (v != null) {
                                  setState(() => _selectedCountry = v);
                                }
                              },
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      _label('Password'),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _passwordCtrl,
                        obscureText: _obscure,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _login(),
                        style: const TextStyle(
                          fontSize: 15,
                          color: Color(0xFF1a3c2e),
                        ),
                        decoration: _inputDecoration(
                          '••••••••',
                          Icons.lock_outline_rounded,
                        ).copyWith(
                          suffixIcon: GestureDetector(
                            onTap: () => setState(() => _obscure = !_obscure),
                            child: Icon(
                              _obscure
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: Colors.grey[400],
                            ),
                          ),
                        ),
                      ),
                      if (_error.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFCEBEB),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline_rounded,
                                color: Color(0xFFA32D2D),
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _error,
                                  style: const TextStyle(
                                    color: Color(0xFFA32D2D),
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _login,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _config.color,
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
                              : const Text(
                                  'Sign in',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),
                      if (widget.role == AuthRole.investor) ...[
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.fingerprint, size: 14, color: Colors.grey.shade600),
                            const SizedBox(width: 4),
                            Text(
                              'Biometric verification required',
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 16),
                      Center(
                        child: TextButton(
                          onPressed: () => _openUrl(
                            'https://sahelagriconnect.com/account/reset-password',
                          ),
                          child: Text(
                            'Forgot password?',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F4E3),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                _config.canSelfRegister
                                    ? 'New to AfriYield Exchange?'
                                    : "Don't have access yet?",
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
                                _config.canSelfRegister
                                    ? 'Register'
                                    : 'Request access',
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
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Colors.grey[700],
        ),
      );

  InputDecoration _inputDecoration(String hint, IconData icon) =>
      InputDecoration(
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      );

  String _dashboardRoute(AuthRole role) {
    switch (role) {
      case AuthRole.investor:
        return '/investor';
      case AuthRole.cooperative:
        return '/cooperative';
      case AuthRole.government:
        return '/government';
      case AuthRole.processor:
        return '/processor';
      default:
        return '/role';
    }
  }
}
