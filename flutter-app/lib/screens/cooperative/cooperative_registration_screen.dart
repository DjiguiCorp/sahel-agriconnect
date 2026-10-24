import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/auth_form_theme.dart';

const _upgradeUrl = 'https://sahelagriconnect.com/cooperative-upgrade';

/// Native cooperative registration with freemium member-count gate.
class CooperativeRegistrationScreen extends StatefulWidget {
  const CooperativeRegistrationScreen({super.key});

  @override
  State<CooperativeRegistrationScreen> createState() =>
      _CooperativeRegistrationScreenState();
}

class _CooperativeRegistrationScreenState
    extends State<CooperativeRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _leaderCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  final _memberCtrl = TextEditingController();

  String _country = 'Mali';
  bool _loading = false;
  String? _error;
  String? _success;

  int get _memberCount => int.tryParse(_memberCtrl.text.trim()) ?? 0;
  bool get _isGrowthTier => _memberCount > 50;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _leaderCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _regionCtrl.dispose();
    _memberCtrl.dispose();
    super.dispose();
  }

  Future<void> _openUpgrade() async {
    final uri = Uri.parse(_upgradeUrl);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _submit({required String tier}) async {
    final isFr = context.read<LanguageProvider>().isFr;
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });
    try {
      final res = await ApiService.registerCooperativePlatform({
        'cooperativeName': _nameCtrl.text.trim(),
        'country': _country,
        'regionCity': _regionCtrl.text.trim(),
        'memberCount': _memberCount,
        'tier': tier,
        'leaderName': _leaderCtrl.text.trim(),
        'email': _emailCtrl.text.trim().toLowerCase(),
        'phone': _phoneCtrl.text.trim(),
        'primaryCrops': <String>[],
        'interests': <String>[],
      });
      if (res['success'] != true && res['cooperativeId'] == null) {
        throw Exception(
          res['error']?.toString() ??
              (isFr ? 'Inscription échouée' : 'Registration failed'),
        );
      }
      if (!mounted) return;
      setState(() {
        _loading = false;
        _success = tier == 'growth'
            ? (isFr
                ? 'Inscription enregistrée. Ouvrez le paiement Croissance pour activer le portail.'
                : 'Registration saved. Complete Growth payment to activate your portal.')
            : (isFr
                ? 'Inscription gratuite confirmée (Plan Démarrage). Connectez-vous au portail.'
                : 'Free registration confirmed (Starter plan). Sign in to your portal.');
      });
      if (tier == 'growth') {
        await _openUpgrade();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _onSubmitPressed() async {
    if (!_formKey.currentState!.validate()) return;
    final isFr = context.read<LanguageProvider>().isFr;

    if (_isGrowthTier) {
      final action = await showModalBottomSheet<String>(
        context: context,
        backgroundColor: const Color(0xFF1a3530),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (ctx) => Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                isFr ? 'Plan Croissance requis' : 'Growth Plan Required',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                isFr
                    ? 'Votre coopérative a 51+ membres. Complétez l\'inscription et mettez à niveau pour 199\$/an afin de débloquer certification et export.'
                    : 'Your cooperative has 51+ members. Complete registration and upgrade to \$199/year to unlock certification and export.',
                style: const TextStyle(color: Colors.white70, height: 1.4),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, 'continue'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD97706),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  isFr ? 'Continuer & Mettre à niveau' : 'Continue & Upgrade',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, 'cancel'),
                child: Text(
                  isFr ? 'Annuler' : 'Cancel',
                  style: const TextStyle(color: Colors.white54),
                ),
              ),
            ],
          ),
        ),
      );
      if (action != 'continue') return;
      await _submit(tier: 'growth');
      return;
    }

    await _submit(tier: 'starter');
  }

  @override
  Widget build(BuildContext context) {
    final isFr = context.watch<LanguageProvider>().isFr;

    return Scaffold(
      backgroundColor: const Color(0xFF0d1f1a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d1f1a),
        foregroundColor: Colors.white,
        title: Text(isFr ? 'Inscription coopérative' : 'Cooperative registration'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop()
              ? context.pop()
              : context.go('/login/cooperative'),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                isFr
                    ? 'Gratuit jusqu\'à 50 membres · Croissance 199\$/an'
                    : 'Free up to 50 members · Growth \$199/yr',
                style: const TextStyle(color: AppColors.gold, fontSize: 13),
              ),
              const SizedBox(height: 16),
              _field(
                controller: _nameCtrl,
                label: isFr ? 'Nom de la coopérative' : 'Cooperative name',
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? (isFr ? 'Requis' : 'Required') : null,
              ),
              _field(
                controller: _leaderCtrl,
                label: isFr ? 'Nom du responsable' : 'Leader name',
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? (isFr ? 'Requis' : 'Required') : null,
              ),
              _field(
                controller: _emailCtrl,
                label: 'Email',
                keyboard: TextInputType.emailAddress,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return isFr ? 'Requis' : 'Required';
                  }
                  if (!v.contains('@')) {
                    return isFr ? 'Email invalide' : 'Invalid email';
                  }
                  return null;
                },
              ),
              _field(
                controller: _phoneCtrl,
                label: isFr ? 'Téléphone' : 'Phone',
                keyboard: TextInputType.phone,
              ),
              DropdownButtonFormField<String>(
                value: _country,
                dropdownColor: const Color(0xFF1a3530),
                style: const TextStyle(color: Colors.white),
                decoration: AuthFormTheme.decoration(
                  hint: isFr ? 'Pays' : 'Country',
                  labelText: isFr ? 'Pays' : 'Country',
                ),
                items: const [
                  'Mali',
                  'Senegal',
                  'Burkina Faso',
                  "Côte d'Ivoire",
                  'Niger',
                  'Guinea',
                  'Togo',
                  'Benin',
                ]
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => _country = v ?? 'Mali'),
              ),
              const SizedBox(height: 12),
              _field(
                controller: _regionCtrl,
                label: isFr ? 'Région / Ville' : 'Region / City',
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? (isFr ? 'Requis' : 'Required') : null,
              ),
              _field(
                controller: _memberCtrl,
                label: isFr
                    ? 'Nombre de membres actifs'
                    : 'Number of active members',
                keyboard: TextInputType.number,
                onChanged: (_) => setState(() {}),
                validator: (v) {
                  final n = int.tryParse(v?.trim() ?? '');
                  if (n == null || n < 1) {
                    return isFr ? 'Entrez un nombre ≥ 1' : 'Enter a number ≥ 1';
                  }
                  return null;
                },
              ),
              if (_isGrowthTier)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD97706).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: const Color(0xFFD97706).withValues(alpha: 0.45),
                    ),
                  ),
                  child: Text(
                    isFr
                        ? '📈 Les coopératives de 51+ membres nécessitent le plan Croissance (199\$/an) pour accéder à la certification, AfriYield Exchange et l\'export.'
                        : '📈 Cooperatives with 51+ members require the Growth plan (\$199/year) to access certification, AfriYield Exchange, and export features.',
                    style: const TextStyle(
                      color: Color(0xFFFBBF24),
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                ),
              if (_success != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_success!, style: const TextStyle(color: Color(0xFF4ADE80))),
                ),
              ElevatedButton(
                onPressed: _loading ? null : _onSubmitPressed,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isGrowthTier
                      ? const Color(0xFFD97706)
                      : const Color(0xFF1D9E75),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        _isGrowthTier
                            ? (isFr ? 'Continuer vers Croissance →' : 'Continue to Growth →')
                            : (isFr ? "S'inscrire gratuitement →" : 'Register for free →'),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/login/cooperative'),
                child: Text(
                  isFr ? 'Déjà inscrit ? Connexion' : 'Already registered? Sign in',
                  style: const TextStyle(color: Colors.white54),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboard,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboard,
        style: const TextStyle(color: Colors.white),
        validator: validator,
        onChanged: onChanged,
        decoration: AuthFormTheme.decoration(hint: label, labelText: label),
      ),
    );
  }
}
