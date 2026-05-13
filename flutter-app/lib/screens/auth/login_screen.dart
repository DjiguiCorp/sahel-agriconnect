import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../services/api_service.dart';

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
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final res = await ApiService.post(_config.loginEndpoint, {
        'email': email,
        'password': password,
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
      switch (widget.role) {
        case AuthRole.investor:
          context.go('/investor');
        case AuthRole.cooperative:
          context.go('/cooperative');
        case AuthRole.government:
          context.go('/government');
        case AuthRole.processor:
          context.go('/processor');
        default:
          context.go('/role');
      }
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
}
