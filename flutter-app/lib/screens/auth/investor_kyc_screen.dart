import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/language_provider.dart';
import '../../core/theme.dart';

/// Investor identity verification (KYC) after OTP login, before dashboard access.
class InvestorKycScreen extends StatefulWidget {
  const InvestorKycScreen({super.key});

  @override
  State<InvestorKycScreen> createState() => _InvestorKycScreenState();
}

class _InvestorKycScreenState extends State<InvestorKycScreen> {
  final _nameCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();
  final _nationalityCtrl = TextEditingController();
  final _countryCtrl = TextEditingController();
  final _idNumberCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _sourceCtrl = TextEditingController();
  String _idType = 'passport';
  String _investorType = 'individual';
  bool _notUsPerson = false;
  bool _agreeTerms = false;
  bool _agreeRisk = false;
  bool _submitting = false;
  int _step = 0;

  static const _bg = Color(0xFF0A1628);
  static const _surface = Color(0xFF1a2744);
  static const _blue = Color(0xFF185FA5);
  static const _gold = AppColors.gold;
  static const _text = Colors.white;
  static const _muted = Color(0x99FFFFFF);

  @override
  void dispose() {
    _nameCtrl.dispose();
    _dobCtrl.dispose();
    _nationalityCtrl.dispose();
    _countryCtrl.dispose();
    _idNumberCtrl.dispose();
    _addressCtrl.dispose();
    _sourceCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final isFr =
        context.read<LanguageProvider>().locale.languageCode == 'fr';
    if (!_agreeTerms || !_agreeRisk || !_notUsPerson) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isFr
                ? 'Vous devez accepter toutes les déclarations pour continuer.'
                : 'You must accept all agreements to proceed.',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    if (_nameCtrl.text.trim().isEmpty || _idNumberCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isFr
                ? 'Le nom complet et le numéro de document sont requis.'
                : 'Full name and ID number are required.',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    setState(() => _submitting = true);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('kyc_submitted', true);
    await prefs.setString('kyc_name', _nameCtrl.text.trim());
    await prefs.setString('kyc_id_type', _idType);
    await prefs.setString('kyc_id_number', _idNumberCtrl.text.trim());
    await prefs.setString('kyc_country', _countryCtrl.text.trim());
    if (mounted) {
      setState(() => _submitting = false);
      context.go('/investor');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFr = context.watch<LanguageProvider>().locale.languageCode == 'fr';

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0e1d3a),
        elevation: 0,
        title: Text(
          isFr ? 'Vérification KYC' : 'KYC Verification',
          style: const TextStyle(
            color: _text,
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: _step > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: _text),
                onPressed: () => setState(() => _step--),
              )
            : null,
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_step + 1) / 3,
            backgroundColor: Colors.white.withValues(alpha: 0.1),
            color: _gold,
            minHeight: 3,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                20,
                20,
                20,
                MediaQuery.of(context).viewInsets.bottom + 100,
              ),
              child: _step == 0
                  ? _buildStep1(isFr)
                  : _step == 1
                      ? _buildStep2(isFr)
                      : _buildStep3(isFr),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1(bool isFr) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _heading(
            isFr ? '👤 Identité personnelle' : '👤 Personal Identity',
            isFr
                ? 'Étape 1 sur 3 — Informations de base'
                : 'Step 1 of 3 — Basic information',
          ),
          const SizedBox(height: 20),
          _card(
            children: [
              _lbl(
                isFr
                    ? 'Nom complet (comme sur votre pièce d\'identité) *'
                    : 'Full Name (as on your ID document) *',
              ),
              _tf(_nameCtrl, isFr ? 'Prénom et nom' : 'First and last name'),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Date de naissance' : 'Date of Birth'),
              _tf(_dobCtrl, 'DD/MM/YYYY', type: TextInputType.datetime),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Nationalité' : 'Nationality'),
              _tf(
                _nationalityCtrl,
                isFr ? 'Ex: Malienne, Française' : 'e.g. Malian, French, American',
              ),
              const SizedBox(height: 12),
              _lbl(
                isFr
                    ? 'Pays de résidence actuel *'
                    : 'Current Country of Residence *',
              ),
              _tf(
                _countryCtrl,
                isFr
                    ? 'Ex: Mali, France, États-Unis'
                    : 'e.g. Mali, France, United States',
              ),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Type d\'investisseur' : 'Investor Type'),
              DropdownButtonFormField<String>(
                value: _investorType,
                dropdownColor: _surface,
                isExpanded: true,
                style: const TextStyle(color: _text),
                decoration: _dec(''),
                items: [
                  DropdownMenuItem(
                    value: 'individual',
                    child: Text(
                      isFr ? 'Particulier' : 'Individual',
                      style: const TextStyle(color: _text),
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'diaspora',
                    child: Text(
                      isFr ? 'Diaspora africaine' : 'African Diaspora',
                      style: const TextStyle(color: _text),
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'institutional',
                    child: Text(
                      isFr ? 'Institution / Entreprise' : 'Institution / Company',
                      style: const TextStyle(color: _text),
                    ),
                  ),
                ],
                onChanged: (v) =>
                    setState(() => _investorType = v ?? 'individual'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _nextBtn(isFr ? 'Continuer' : 'Continue', () {
            if (_nameCtrl.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(isFr ? 'Nom requis' : 'Name required'),
                  backgroundColor: Colors.red,
                ),
              );
              return;
            }
            setState(() => _step = 1);
          }),
        ],
      );

  Widget _buildStep2(bool isFr) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _heading(
            isFr ? '🪪 Pièce d\'identité' : '🪪 Identity Document',
            isFr
                ? 'Étape 2 sur 3 — Vérification documentaire'
                : 'Step 2 of 3 — Document verification',
          ),
          const SizedBox(height: 20),
          _card(
            children: [
              _lbl(isFr ? 'Type de document *' : 'Document Type *'),
              DropdownButtonFormField<String>(
                value: _idType,
                dropdownColor: _surface,
                isExpanded: true,
                style: const TextStyle(color: _text),
                decoration: _dec(''),
                items: [
                  DropdownMenuItem(
                    value: 'passport',
                    child: Text(
                      isFr ? 'Passeport' : 'Passport',
                      style: const TextStyle(color: _text),
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'national_id',
                    child: Text(
                      isFr ? 'Carte nationale d\'identité' : 'National ID Card',
                      style: const TextStyle(color: _text),
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'drivers_license',
                    child: Text(
                      isFr ? 'Permis de conduire' : 'Driver\'s License',
                      style: const TextStyle(color: _text),
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'residence_permit',
                    child: Text(
                      isFr ? 'Titre de séjour' : 'Residence Permit',
                      style: const TextStyle(color: _text),
                    ),
                  ),
                ],
                onChanged: (v) => setState(() => _idType = v ?? 'passport'),
              ),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Numéro de document *' : 'Document Number *'),
              _tf(
                _idNumberCtrl,
                isFr
                    ? 'Numéro tel qu\'il apparaît sur le document'
                    : 'Number as it appears on document',
              ),
              const SizedBox(height: 12),
              _lbl(isFr ? 'Adresse de résidence' : 'Residential Address'),
              _tf(
                _addressCtrl,
                isFr
                    ? 'Adresse complète, ville, pays'
                    : 'Full address, city, country',
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
                ),
                child: Text(
                  isFr
                      ? '🔒 Vos documents sont chiffrés et ne sont utilisés qu\'à des fins de vérification d\'identité conformément aux réglementations anti-blanchiment (AML/KYC).'
                      : '🔒 Your documents are encrypted and used solely for identity verification purposes in compliance with anti-money laundering regulations (AML/KYC).',
                  style: const TextStyle(
                    color: Colors.blue,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _nextBtn(isFr ? 'Continuer' : 'Continue', () {
            if (_idNumberCtrl.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    isFr ? 'Numéro de document requis' : 'Document number required',
                  ),
                  backgroundColor: Colors.red,
                ),
              );
              return;
            }
            setState(() => _step = 2);
          }),
        ],
      );

  Widget _buildStep3(bool isFr) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _heading(
            isFr ? '📋 Déclarations et accords' : '📋 Declarations & Agreements',
            isFr
                ? 'Étape 3 sur 3 — Confirmation légale'
                : 'Step 3 of 3 — Legal confirmation',
          ),
          const SizedBox(height: 20),
          _card(
            children: [
              _lbl(
                isFr ? 'Source des fonds (optionnel)' : 'Source of Funds (optional)',
              ),
              _tf(
                _sourceCtrl,
                isFr
                    ? 'Ex: Revenus professionnels, économies, héritage'
                    : 'e.g. Employment income, savings, inheritance',
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isFr
                          ? '🇺🇸 Déclaration personne américaine'
                          : '🇺🇸 US Person Declaration',
                      style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Checkbox(
                          value: _notUsPerson,
                          activeColor: AppColors.gold,
                          checkColor: Colors.black,
                          onChanged: (v) =>
                              setState(() => _notUsPerson = v ?? false),
                        ),
                        Expanded(
                          child: Text(
                            isFr
                                ? 'Je confirme que je ne suis PAS une "US Person" au sens de la réglementation SEC. (Ressortissants américains, résidents permanents aux États-Unis ou entités américaines doivent contacter compliance@sahelagriconnect.com avant d\'investir.)'
                                : 'I confirm I am NOT a "US Person" under SEC regulations. (US citizens, US permanent residents, or US entities must contact compliance@sahelagriconnect.com before investing.)',
                            style: const TextStyle(
                              color: _muted,
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _agreementBox(
                isFr
                    ? 'Conditions d\'utilisation & Risques'
                    : 'Terms of Service & Investment Risks',
                isFr
                    ? 'AfriYield Exchange est une plateforme de facilitation d\'investissement agricole exploitée par Djigui Corporation. Je comprends que:\n\n• Les investissements comportent des risques incluant la perte totale ou partielle du capital investi\n• Les rendements projetés sont basés sur les performances historiques des coopératives et ne sont PAS garantis\n• Je ne recevrai pas de conseil financier personnalisé de la part de la plateforme\n• Le traitement de mes paiements s\'effectue exclusivement via le portail web sécurisé afriyieldexchange.com\n• En cas de litige, je dois d\'abord recourir à la médiation selon les CGU'
                    : 'AfriYield Exchange is an agricultural investment facilitation platform operated by Djigui Corporation. I understand that:\n\n• Investments carry risks including total or partial loss of invested capital\n• Projected returns are based on historical cooperative performance and are NOT guaranteed\n• I will not receive personalized financial advice from the platform\n• Payment processing occurs exclusively through the secure web portal at afriyieldexchange.com\n• In case of dispute, I must first seek mediation as per the Terms of Service',
                _agreeTerms,
                (v) => setState(() => _agreeTerms = v ?? false),
              ),
              const SizedBox(height: 12),
              _agreementBox(
                isFr
                    ? 'Acceptation du risque d\'investissement'
                    : 'Investment Risk Acknowledgment',
                isFr
                    ? 'Je reconnais avoir lu et compris les risques liés aux investissements agricoles en Afrique de l\'Ouest, incluant les risques climatiques, de marché, de liquidité et réglementaires. Je confirme que les fonds que j\'investis ne sont pas nécessaires pour mes besoins essentiels et que je peux me permettre une perte éventuelle.'
                    : 'I acknowledge having read and understood the risks associated with agricultural investments in West Africa, including climate, market, liquidity, and regulatory risks. I confirm that the funds I am investing are not needed for my essential needs and that I can afford a potential loss.',
                _agreeRisk,
                (v) => setState(() => _agreeRisk = v ?? false),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    (!_agreeTerms || !_agreeRisk || !_notUsPerson)
                        ? Colors.grey
                        : _gold,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: (!_agreeTerms ||
                      !_agreeRisk ||
                      !_notUsPerson ||
                      _submitting)
                  ? null
                  : _submit,
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.black,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      isFr
                          ? 'Soumettre la vérification KYC'
                          : 'Submit KYC Verification',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              isFr
                  ? 'Votre KYC sera examiné sous 24-48h. Vous recevrez une confirmation par email.'
                  : 'Your KYC will be reviewed within 24-48 hours. You will receive an email confirmation.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: _muted, fontSize: 11),
            ),
          ),
        ],
      );

  Widget _heading(String title, String subtitle) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: _text,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: _muted, fontSize: 13)),
        ],
      );

  Widget _agreementBox(
    String title,
    String body,
    bool checked,
    ValueChanged<bool?> onChanged,
  ) =>
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: checked
              ? _gold.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: checked
                ? _gold.withValues(alpha: 0.3)
                : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: checked ? _gold : _text,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              style: const TextStyle(color: _muted, fontSize: 11, height: 1.5),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Checkbox(
                  value: checked,
                  activeColor: _gold,
                  checkColor: Colors.black,
                  onChanged: onChanged,
                ),
                Expanded(
                  child: Text(
                    'J\'ai lu et j\'accepte / I have read and I agree',
                    style: TextStyle(
                      color: checked ? _gold : _muted,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      );

  Widget _nextBtn(String label, VoidCallback onTap) => SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: _blue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          onPressed: onTap,
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
        ),
      );

  Widget _card({required List<Widget> children}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [_surface, Color(0xFF0f1a33)],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        ),
      );

  Widget _lbl(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(
          t,
          style: const TextStyle(
            color: _muted,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      );

  Widget _tf(
    TextEditingController c,
    String hint, {
    TextInputType type = TextInputType.text,
    int maxLines = 1,
  }) =>
      TextField(
        controller: c,
        keyboardType: type,
        maxLines: maxLines,
        style: const TextStyle(color: _text, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: _muted, fontSize: 13),
          filled: true,
          fillColor: _bg,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: _blue),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
        ),
      );

  InputDecoration _dec(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: _bg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      );
}

/// SharedPreferences key — investor completed KYC onboarding.
const String investorKycSubmittedKey = 'kyc_submitted';
