import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';

/// Edit profile — shows session data and allows local updates.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _countryCtrl;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthState>();
    _nameCtrl = TextEditingController(text: auth.displayName);
    _emailCtrl = TextEditingController(text: auth.displayEmail);
    _phoneCtrl = TextEditingController(text: auth.displayPhone);
    _countryCtrl = TextEditingController(text: auth.displayCountry);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _countryCtrl.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    context.read<AuthState>().updateLocalProfile(
          name: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          phone: _phoneCtrl.text.trim(),
          country: _countryCtrl.text.trim(),
        );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.read<LanguageProvider>().t(
                  'Profile updated',
                  'Profil mis à jour',
                ),
          ),
          backgroundColor: const Color(0xFF2d6a4f),
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(lp.t('Edit profile', 'Modifier le profil')),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: _save,
            child: Text(
              lp.t('Save', 'Enregistrer'),
              style: const TextStyle(
                color: Color(0xFFC9A84C),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    lp.t(
                      'Your account (${auth.role.name})',
                      'Votre compte (${auth.role.name})',
                    ),
                    style: const TextStyle(
                      color: Color(0x99FFFFFF),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _field(
                    lp.t('Full name', 'Nom complet'),
                    _nameCtrl,
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? lp.t('Name is required', 'Le nom est requis')
                        : null,
                  ),
                  const SizedBox(height: 14),
                  _field(
                    lp.t('Email', 'E-mail'),
                    _emailCtrl,
                    keyboard: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 14),
                  _field(
                    lp.t('Phone', 'Téléphone'),
                    _phoneCtrl,
                    keyboard: TextInputType.phone,
                  ),
                  const SizedBox(height: 14),
                  _field(
                    lp.t('Country / region', 'Pays / région'),
                    _countryCtrl,
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _save,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1a3c2e),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        lp.t('Save changes', 'Enregistrer les modifications'),
                        style: const TextStyle(fontWeight: FontWeight.w700),
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

  Widget _field(
    String label,
    TextEditingController controller, {
    TextInputType? keyboard,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboard,
      validator: validator,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0x99FFFFFF)),
        filled: true,
        fillColor: const Color(0xFF1a3530),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
    );
  }
}
