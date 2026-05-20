import 'package:flutter/material.dart';
import '../../core/safe_insets.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';

/// Update phone or email with OTP-style verification (local save for now).
class ChangeContactScreen extends StatefulWidget {
  const ChangeContactScreen({super.key, required this.type});

  final String type;

  @override
  State<ChangeContactScreen> createState() => _ChangeContactScreenState();
}

class _ChangeContactScreenState extends State<ChangeContactScreen> {
  final _newCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _otpSent = false;
  bool _saving = false;

  static const _bg = AppColors.darkBg;
  static const _surface = Color(0xFF1a3530);
  static const _text = Colors.white;
  static const _muted = Color(0x99FFFFFF);
  static const _accent = Color(0xFF1D9E75);

  @override
  void dispose() {
    _newCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  bool get _isPhone => widget.type == 'phone';

  Future<void> _sendOtp() async {
    if (_newCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() {
      _saving = false;
      _otpSent = true;
    });
    final lp = context.read<LanguageProvider>();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          lp.t(
            '📱 Code sent to ${_newCtrl.text.trim()}',
            '📱 Code envoyé à ${_newCtrl.text.trim()}',
          ),
        ),
        backgroundColor: const Color(0xFF2196F3),
      ),
    );
  }

  Future<void> _confirm() async {
    if (_otpCtrl.text.trim().length < 4) return;
    setState(() => _saving = true);
    final auth = context.read<AuthState>();
    if (_isPhone) {
      auth.updateLocalProfile(phone: _newCtrl.text.trim());
    } else {
      auth.updateLocalProfile(email: _newCtrl.text.trim());
    }
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _saving = false);
    final lp = context.read<LanguageProvider>();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          lp.t(
            _isPhone ? '✅ Phone updated!' : '✅ Email updated!',
            _isPhone
                ? '✅ Téléphone mis à jour !'
                : '✅ E-mail mis à jour !',
          ),
        ),
        backgroundColor: _accent,
      ),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();
    final current = _isPhone ? auth.displayPhone : auth.displayEmail;

    return Scaffold(
      backgroundColor: _bg,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: _text,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _text),
          onPressed: () => context.pop(),
        ),
        title: Text(
          lp.t(
            _isPhone ? 'Update Phone' : 'Update Email',
            _isPhone
                ? 'Mettre à jour le téléphone'
                : 'Mettre à jour l\'e-mail',
          ),
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: EdgeInsets.fromLTRB(
              16,
              16,
              16,
              SafeInsets.bottom(context, extra: 32),
            ),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (current.isNotEmpty) ...[
                    Text(
                      lp.t('Current', 'Actuel'),
                      style: const TextStyle(
                        color: _muted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      current,
                      style: const TextStyle(color: _text, fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Text(
                    lp.t(
                      _isPhone ? 'New phone number' : 'New email address',
                      _isPhone
                          ? 'Nouveau numéro de téléphone'
                          : 'Nouvelle adresse e-mail',
                    ),
                    style: const TextStyle(
                      color: _muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _newCtrl,
                    enabled: !_otpSent,
                    keyboardType: _isPhone
                        ? TextInputType.phone
                        : TextInputType.emailAddress,
                    style: const TextStyle(color: _text),
                    decoration: InputDecoration(
                      hintText: _isPhone
                          ? '+223 / +33 / +1...'
                          : 'email@exemple.com',
                      hintStyle: const TextStyle(color: _muted, fontSize: 13),
                      filled: true,
                      fillColor: _bg,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.15),
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.15),
                        ),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(10)),
                        borderSide: BorderSide(color: _accent),
                      ),
                    ),
                  ),
                  if (!_otpSent) ...[
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _accent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: _saving ? null : _sendOtp,
                        child: _saving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                lp.t('Send code', 'Envoyer le code'),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: 14),
                    Text(
                      lp.t('Verification code', 'Code de vérification'),
                      style: const TextStyle(
                        color: _muted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _otpCtrl,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(
                        color: _text,
                        fontSize: 18,
                        letterSpacing: 4,
                      ),
                      decoration: InputDecoration(
                        hintText: lp.t('6-digit code', 'Code à 6 chiffres'),
                        hintStyle:
                            const TextStyle(color: _muted, fontSize: 13),
                        filled: true,
                        fillColor: _bg,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: Colors.white.withValues(alpha: 0.15),
                          ),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(10)),
                          borderSide: BorderSide(color: _accent),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: _saving ? null : _confirm,
                        child: _saving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  color: Colors.black,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                lp.t('Confirm', 'Confirmer'),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
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
    );
  }
}
