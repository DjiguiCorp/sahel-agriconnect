import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/auth_form_theme.dart';

/// Post-registration wizard: land area, crops, infrastructure, needs (matches web form).
class FarmerOnboardingScreen extends StatefulWidget {
  const FarmerOnboardingScreen({super.key});

  @override
  State<FarmerOnboardingScreen> createState() => _FarmerOnboardingScreenState();
}

class _FarmerOnboardingScreenState extends State<FarmerOnboardingScreen> {
  int _step = 0;
  bool _loading = false;
  String _error = '';

  final _scrollCtrl = ScrollController();
  final _areaFieldKey = GlobalKey();

  final _areaCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  String _country = 'Mali';
  String _farmType = 'Familiale';
  final Set<String> _cultures = {};
  String _electricity = 'Partiel';
  String _solarNeed = '';
  String _storage = 'Non';
  String _collectionNeed = '';
  String _coopLink = 'Non';
  final _coopNameCtrl = TextEditingController();
  final Set<String> _needs = {};

  static const _crops = [
    'Rice',
    'Millet',
    'Sorghum',
    'Maize',
    'Sesame',
    'Cotton',
    'Shea',
    'Mango',
    'Cashew',
    'Other',
  ];

  static const _needOptions = [
    'Irrigation',
    'Seeds',
    'Fertilizer',
    'Equipment',
    'Storage',
    'Market access',
    'Training',
  ];

  static const _chipSelectedBg = Color(0xFF1a3c2e);
  static const _onCardText = Color(0xFF0a1f14);
  static const _onCardMuted = Color(0xFF1a3c2e);

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _areaCtrl.dispose();
    _regionCtrl.dispose();
    _coopNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _ensureAreaVisible() async {
    await Future<void>.delayed(const Duration(milliseconds: 50));
    final ctx = _areaFieldKey.currentContext;
    if (ctx != null) {
      await Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
        alignment: 0.15,
      );
    }
  }

  Future<void> _submit() async {
    final lp = context.read<LanguageProvider>();
    final area = double.tryParse(_areaCtrl.text.replaceAll(',', '.'));
    if (area == null || area <= 0) {
      setState(() => _error = lp.t(
            'Enter your farm area in hectares',
            'Indiquez la superficie en hectares',
          ));
      if (mounted) await _ensureAreaVisible();
      return;
    }
    if (_cultures.isEmpty) {
      setState(() => _error = lp.t(
            'Select at least one crop',
            'Sélectionnez au moins une culture',
          ));
      return;
    }

    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final token = context.read<AuthState>().token;
      final res = await ApiService.patch('/api/farmers/complete-profile', {
        'superficie': area,
        'country': _country,
        'region': _regionCtrl.text.trim().isNotEmpty
            ? _regionCtrl.text.trim()
            : _country,
        'cultures': _cultures.toList(),
        'typeExploitation': _farmType,
        'lienCooperative': _coopLink,
        if (_coopLink == 'Oui') 'nomCooperative': _coopNameCtrl.text.trim(),
        'accesElectricite': _electricity,
        if (_solarNeed.isNotEmpty) 'besoinSolaire': _solarNeed,
        'accesStockage': _storage,
        if (_collectionNeed.isNotEmpty) 'besoinCollecte': _collectionNeed,
        'defis': _needs.toList(),
        'objectifsProduction': [
          'Souveraineté alimentaire locale',
        ],
      }, token: token);
      if (res['success'] != true) {
        throw Exception(res['error']?.toString() ?? 'Update failed');
      }
      if (!mounted) return;
      context.go('/farmer');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Widget _sectionTitle(String text) => Text(
        text,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 16,
          color: _onCardText,
        ),
      );

  Widget _fieldLabel(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: _onCardMuted,
        ),
      );

  Widget _areaHectaresField(LanguageProvider lp, {Key? key}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _fieldLabel(lp.t('Superficie (hectares)', 'Superficie (hectares)')),
        const SizedBox(height: 6),
        TextField(
          controller: _areaCtrl,
          style: AuthFormTheme.fieldTextStyle(),
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: AuthFormTheme.decoration(
            hint: lp.t('e.g. 2.5', 'ex. 2,5'),
            labelText: lp.t('Required', 'Obligatoire'),
          ),
        ),
      ],
    );
  }

  Widget _styledFilterChip({
    required String label,
    required bool selected,
    required ValueChanged<bool> onSelected,
  }) {
    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          color: selected ? Colors.white : Colors.black87,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
      selected: selected,
      onSelected: onSelected,
      selectedColor: _chipSelectedBg,
      backgroundColor: const Color(0xFFF3F6F4),
      checkmarkColor: Colors.white,
      side: BorderSide(
        color: selected
            ? _chipSelectedBg
            : AppColors.forestGreen.withValues(alpha: 0.35),
      ),
      showCheckmark: true,
    );
  }

  Widget _styledChoiceChip({
    required String label,
    required bool selected,
    required VoidCallback onSelected,
  }) {
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: selected ? Colors.white : Colors.black87,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
      selected: selected,
      onSelected: (_) => onSelected(),
      selectedColor: _chipSelectedBg,
      backgroundColor: const Color(0xFFF3F6F4),
      checkmarkColor: Colors.white,
      side: BorderSide(
        color: selected
            ? _chipSelectedBg
            : AppColors.forestGreen.withValues(alpha: 0.35),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

    return Scaffold(
      body: Container(
        decoration: AuthFormTheme.scaffoldGradient(),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: _step > 0
                          ? () => setState(() => _step--)
                          : () => context.go('/home'),
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                    ),
                    Expanded(
                      child: Text(
                        lp.t(
                          'Complete your farm profile',
                          'Complétez votre profil agricole',
                        ),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    Text(
                      '${_step + 1}/3',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                    ),
                  ],
                ),
              ),
              LinearProgressIndicator(
                value: (_step + 1) / 3,
                backgroundColor: Colors.white24,
                color: AppColors.gold,
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.all(20),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: AuthFormTheme.glassPanelDecoration(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_step == 0) ..._stepLand(lp),
                        if (_step == 1) ..._stepInfra(lp),
                        if (_step == 2) ..._stepNeeds(lp),
                        if (_error.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Text(
                            _error,
                            style: const TextStyle(
                              color: AppColors.error,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _loading
                              ? null
                              : () {
                                  if (_step < 2) {
                                    setState(() {
                                      _error = '';
                                      _step++;
                                    });
                                  } else {
                                    _submit();
                                  }
                                },
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: _loading
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Text(
                                  _step < 2
                                      ? lp.t('Continue', 'Continuer')
                                      : lp.t(
                                          'Finish & open dashboard',
                                          'Terminer et ouvrir le tableau de bord',
                                        ),
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _stepLand(LanguageProvider lp) {
    return [
      _sectionTitle(lp.t('Land & crops', 'Terres & cultures')),
      const SizedBox(height: 12),
      _areaHectaresField(lp),
      const SizedBox(height: 12),
      TextField(
        controller: _regionCtrl,
        style: AuthFormTheme.fieldTextStyle(),
        decoration: AuthFormTheme.decoration(
          hint: lp.t('Region / village', 'Région / village'),
          labelText: lp.t('Region / village', 'Région / village'),
        ),
      ),
      const SizedBox(height: 12),
      Container(
        decoration: AuthFormTheme.dropdownBoxDecoration(),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: DropdownButtonFormField<String>(
          value: _country,
          dropdownColor: Colors.white,
          style: AuthFormTheme.fieldTextStyle(),
          decoration: InputDecoration(
            labelText: lp.t('Country', 'Pays'),
            labelStyle: AuthFormTheme.labelStyle(),
            border: InputBorder.none,
          ),
          items: [
            'Mali',
            'Senegal',
            'Burkina Faso',
            'Niger',
            'Ghana',
            'Côte d\'Ivoire',
          ]
              .map((c) => DropdownMenuItem(value: c, child: Text(c)))
              .toList(),
          onChanged: (v) => setState(() => _country = v ?? _country),
        ),
      ),
      const SizedBox(height: 12),
      Container(
        decoration: AuthFormTheme.dropdownBoxDecoration(),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: DropdownButtonFormField<String>(
          value: _farmType,
          dropdownColor: Colors.white,
          style: AuthFormTheme.fieldTextStyle(),
          decoration: InputDecoration(
            labelText: lp.t('Farm type', 'Type d\'exploitation'),
            labelStyle: AuthFormTheme.labelStyle(),
            border: InputBorder.none,
          ),
          items: [
            DropdownMenuItem(
              value: 'Familiale',
              child: Text(lp.t('Family farm', 'Exploitation familiale')),
            ),
            DropdownMenuItem(
              value: 'Commerciale/Indépendante',
              child: Text(
                lp.t(
                  'Commercial / independent',
                  'Commerciale / indépendante',
                ),
              ),
            ),
          ],
          onChanged: (v) => setState(() => _farmType = v ?? _farmType),
        ),
      ),
      const SizedBox(height: 12),
      _fieldLabel(lp.t('Main crops (select all)', 'Cultures principales')),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _crops.map((c) {
          final selected = _cultures.contains(c);
          return _styledFilterChip(
            label: c,
            selected: selected,
            onSelected: (v) {
              setState(() {
                if (v) {
                  _cultures.add(c);
                } else {
                  _cultures.remove(c);
                }
              });
            },
          );
        }).toList(),
      ),
    ];
  }

  List<Widget> _stepInfra(LanguageProvider lp) {
    return [
      _sectionTitle(lp.t('Infrastructure', 'Infrastructure')),
      const SizedBox(height: 12),
      _choiceRow(
        lp.t('Electricity access', 'Accès électricité'),
        ['Oui', 'Partiel', 'Non'],
        _electricity,
        (v) => setState(() => _electricity = v),
        labels: [
          lp.t('Yes', 'Oui'),
          lp.t('Partial', 'Partiel'),
          lp.t('No', 'Non'),
        ],
      ),
      const SizedBox(height: 12),
      _choiceRow(
        lp.t('Need solar power?', 'Besoin solaire ?'),
        ['Oui', 'Non'],
        _solarNeed.isEmpty ? 'Non' : _solarNeed,
        (v) => setState(() => _solarNeed = v),
        labels: [lp.t('Yes', 'Oui'), lp.t('No', 'Non')],
      ),
      const SizedBox(height: 12),
      _choiceRow(
        lp.t('Storage available?', 'Stockage disponible ?'),
        ['Oui', 'Non'],
        _storage,
        (v) => setState(() => _storage = v),
        labels: [lp.t('Yes', 'Oui'), lp.t('No', 'Non')],
      ),
      const SizedBox(height: 12),
      _choiceRow(
        lp.t('Need collection / logistics?', 'Besoin collecte / logistique ?'),
        ['Oui', 'Non'],
        _collectionNeed.isEmpty ? 'Non' : _collectionNeed,
        (v) => setState(() => _collectionNeed = v),
        labels: [lp.t('Yes', 'Oui'), lp.t('No', 'Non')],
      ),
    ];
  }

  List<Widget> _stepNeeds(LanguageProvider lp) {
    return [
      _sectionTitle(lp.t('Cooperative & needs', 'Coopérative & besoins')),
      const SizedBox(height: 12),
      // Superficie must be visible on step 3 above the finish button.
      _areaHectaresField(lp, key: _areaFieldKey),
      const SizedBox(height: 16),
      _choiceRow(
        lp.t('Linked to a cooperative?', 'Lié à une coopérative ?'),
        ['Oui', 'Non'],
        _coopLink,
        (v) => setState(() => _coopLink = v),
        labels: [lp.t('Yes', 'Oui'), lp.t('No', 'Non')],
      ),
      if (_coopLink == 'Oui') ...[
        const SizedBox(height: 8),
        _fieldLabel(lp.t('Cooperative name', 'Nom de la coopérative')),
        const SizedBox(height: 6),
        TextField(
          controller: _coopNameCtrl,
          style: AuthFormTheme.fieldTextStyle(),
          decoration: AuthFormTheme.decoration(
            hint: lp.t('Enter cooperative name', 'Entrez le nom de la coopérative'),
            labelText: lp.t('Cooperative name', 'Nom de la coopérative'),
          ),
        ),
      ],
      const SizedBox(height: 16),
      _fieldLabel(lp.t('Your main needs', 'Vos besoins principaux')),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _needOptions.map((n) {
          final selected = _needs.contains(n);
          return _styledFilterChip(
            label: n,
            selected: selected,
            onSelected: (v) {
              setState(() {
                if (v) {
                  _needs.add(n);
                } else {
                  _needs.remove(n);
                }
              });
            },
          );
        }).toList(),
      ),
    ];
  }

  Widget _choiceRow(
    String title,
    List<String> values,
    String current,
    ValueChanged<String> onPick, {
    List<String>? labels,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: _onCardMuted,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          children: List.generate(values.length, (i) {
            final v = values[i];
            final label = labels != null && i < labels.length ? labels[i] : v;
            return _styledChoiceChip(
              label: label,
              selected: current == v,
              onSelected: () => onPick(v),
            );
          }),
        ),
      ],
    );
  }
}
