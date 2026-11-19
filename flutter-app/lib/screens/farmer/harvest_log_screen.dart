import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/theme.dart';
import '../../data/crops.dart';
import '../../services/api_service.dart';

const _bg = Color(0xFF0f2318);
const _surface = Color(0xFF1e4535);
const _surface2 = Color(0xFF162e24);
const _border = Color(0x14FFFFFF);
const _gold = AppColors.gold;
const _green = Color(0xFF1D9E75);
const _text = Colors.white;
const _textMuted = Color(0x80FFFFFF);

class HarvestLogScreen extends StatefulWidget {
  final bool isFr;
  final Map<String, dynamic>? farmer;
  final VoidCallback? onSaved;

  const HarvestLogScreen({
    super.key,
    required this.isFr,
    this.farmer,
    this.onSaved,
  });

  @override
  State<HarvestLogScreen> createState() => _HarvestLogScreenState();
}

class _HarvestLogScreenState extends State<HarvestLogScreen> {
  int _step = 0;
  bool _submitting = false;
  String? _error;
  String? _batchId;
  String? _traceUrl;

  String? _cropType;
  DateTime _harvestDate = DateTime.now();
  final _qtyCtrl = TextEditingController();
  String _quality = 'A';

  final _plotSizeCtrl = TextEditingController();
  final _storageCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  double? _plotLat;
  double? _plotLng;
  bool _gpsLoading = false;

  final List<Map<String, dynamic>> _inputs = [];

  @override
  void dispose() {
    _qtyCtrl.dispose();
    _plotSizeCtrl.dispose();
    _storageCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  String? get _cooperativeId {
    final f = widget.farmer;
    final id = f?['cooperativeId']?.toString();
    if (id != null && id.isNotEmpty) return id;
    return null;
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _harvestDate,
      firstDate: DateTime(DateTime.now().year - 3),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      builder: (ctx, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: const ColorScheme.dark(
            primary: _green,
            surface: _surface,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _harvestDate = picked);
  }

  Future<void> _captureGps() async {
    final isFr = widget.isFr;
    setState(() => _gpsLoading = true);
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) {
        throw Exception(
          isFr
              ? 'Activez la localisation GPS'
              : 'Please enable location services',
        );
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        throw Exception(
          isFr ? 'Permission GPS refusée' : 'Location permission denied',
        );
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (!mounted) return;
      setState(() {
        _plotLat = pos.latitude;
        _plotLng = pos.longitude;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString().replaceFirst('Exception: ', '')),
        backgroundColor: Colors.orange,
      ));
    } finally {
      if (mounted) setState(() => _gpsLoading = false);
    }
  }

  Future<void> _addInputDialog() async {
    final isFr = widget.isFr;
    final nameCtrl = TextEditingController();
    final qtyCtrl = TextEditingController();
    String type = 'fertilizer';
    String unit = 'kg';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _surface,
        title: Text(
          isFr ? 'Ajouter un intrant' : 'Add input',
          style: const TextStyle(color: _text),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: _text),
                decoration: InputDecoration(
                  labelText: isFr ? 'Nom' : 'Name',
                  labelStyle: const TextStyle(color: _textMuted),
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: type,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: InputDecoration(
                  labelText: isFr ? 'Type' : 'Type',
                  labelStyle: const TextStyle(color: _textMuted),
                ),
                items: [
                  ('fertilizer', isFr ? 'Engrais' : 'Fertilizer'),
                  ('pesticide', isFr ? 'Pesticide' : 'Pesticide'),
                  ('herbicide', isFr ? 'Herbicide' : 'Herbicide'),
                  ('organic', isFr ? 'Organique' : 'Organic'),
                  ('other', isFr ? 'Autre' : 'Other'),
                ]
                    .map(
                      (e) => DropdownMenuItem(
                        value: e.$1,
                        child: Text(e.$2),
                      ),
                    )
                    .toList(),
                onChanged: (v) => type = v ?? type,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: qtyCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: _text),
                decoration: InputDecoration(
                  labelText: isFr ? 'Quantité' : 'Quantity',
                  labelStyle: const TextStyle(color: _textMuted),
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: unit,
                dropdownColor: _surface,
                style: const TextStyle(color: _text),
                decoration: InputDecoration(
                  labelText: isFr ? 'Unité' : 'Unit',
                  labelStyle: const TextStyle(color: _textMuted),
                ),
                items: ['kg', 'L', 'g']
                    .map((u) => DropdownMenuItem(value: u, child: Text(u)))
                    .toList(),
                onChanged: (v) => unit = v ?? unit,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(isFr ? 'Annuler' : 'Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(isFr ? 'Ajouter' : 'Add'),
          ),
        ],
      ),
    );

    if (ok == true && nameCtrl.text.trim().isNotEmpty) {
      setState(() {
        _inputs.add({
          'name': nameCtrl.text.trim(),
          'type': type,
          'quantity': double.tryParse(qtyCtrl.text.trim()),
          'unit': unit,
        });
      });
    }
    nameCtrl.dispose();
    qtyCtrl.dispose();
  }

  bool _validateStep0() {
    final isFr = widget.isFr;
    if (_cropType == null || _cropType!.isEmpty) {
      setState(() => _error = isFr ? 'Choisissez une culture' : 'Select a crop');
      return false;
    }
    final qty = double.tryParse(_qtyCtrl.text.trim());
    if (qty == null || qty < 0) {
      setState(
        () => _error = isFr ? 'Quantité (kg) invalide' : 'Invalid quantity (kg)',
      );
      return false;
    }
    setState(() => _error = null);
    return true;
  }

  Future<void> _submit() async {
    final isFr = widget.isFr;
    if (!_validateStep0()) {
      setState(() => _step = 0);
      return;
    }
    final auth = context.read<AuthState>();
    final token = auth.token;
    if (token == null || token.isEmpty) {
      setState(
        () => _error = isFr ? 'Session expirée' : 'Session expired',
      );
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final qty = double.parse(_qtyCtrl.text.trim());
      final plotSize = double.tryParse(_plotSizeCtrl.text.trim());
      final res = await ApiService.createHarvestLog(
        token: token,
        cropType: _cropType!,
        harvestDate: _harvestDate,
        quantityKg: qty,
        plotLat: _plotLat,
        plotLng: _plotLng,
        plotSizeHectares: plotSize,
        storageLocation: _storageCtrl.text.trim().isEmpty
            ? null
            : _storageCtrl.text.trim(),
        qualityGrade: _quality,
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        inputs: _inputs.isEmpty ? null : List.from(_inputs),
        cooperativeId: _cooperativeId,
      );

      if (!mounted) return;
      if (res['success'] == true || res['batchId'] != null) {
        final log = res['harvestLog'];
        final batch = (res['batchId'] ??
                (log is Map ? log['batchId'] : null) ??
                '')
            .toString();
        final trace = (res['traceUrl'] ??
                'https://sahelagriconnect.com/trace/$batch')
            .toString();
        setState(() {
          _batchId = batch;
          _traceUrl = trace;
          _submitting = false;
          _step = 4; // success
        });
        widget.onSaved?.call();
      } else {
        setState(() {
          _submitting = false;
          _error = res['error']?.toString() ??
              (isFr ? 'Échec de l\'enregistrement' : 'Save failed');
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = isFr ? 'Erreur réseau. Réessayez.' : 'Network error. Retry.';
      });
    }
  }

  Future<void> _openTrace() async {
    final url = _traceUrl;
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final isFr = widget.isFr;
    final titles = [
      isFr ? 'Infos de base' : 'Basic info',
      isFr ? 'Parcelle' : 'Plot',
      isFr ? 'Intrants' : 'Inputs',
      isFr ? 'Résumé' : 'Summary',
    ];

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a3c2e),
        elevation: 0,
        title: Text(
          isFr ? 'Enregistrer une récolte' : 'Log a Harvest',
          style: const TextStyle(color: _text, fontSize: 17),
        ),
        iconTheme: const IconThemeData(color: _text),
      ),
      body: _step == 4
          ? _buildSuccess(isFr)
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Row(
                    children: List.generate(4, (i) {
                      final active = i == _step;
                      final done = i < _step;
                      return Expanded(
                        child: Container(
                          margin: EdgeInsets.only(right: i < 3 ? 6 : 0),
                          height: 4,
                          decoration: BoxDecoration(
                            color: done || active ? _green : _border,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      titles[_step.clamp(0, 3)],
                      style: const TextStyle(
                        color: _gold,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                    ),
                  ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: _buildStep(isFr),
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: Row(
                      children: [
                        if (_step > 0)
                          TextButton(
                            onPressed: _submitting
                                ? null
                                : () => setState(() => _step -= 1),
                            child: Text(isFr ? 'Retour' : 'Back'),
                          ),
                        const Spacer(),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 14,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: _submitting
                              ? null
                              : () {
                                  if (_step == 0 && !_validateStep0()) return;
                                  if (_step < 3) {
                                    setState(() => _step += 1);
                                  } else {
                                    _submit();
                                  }
                                },
                          child: _submitting
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  _step < 3
                                      ? (isFr ? 'Suivant' : 'Next')
                                      : (isFr
                                          ? 'Enregistrer la récolte'
                                          : 'Save Harvest Log'),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildSuccess(bool isFr) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle, color: _green, size: 64),
            const SizedBox(height: 16),
            Text(
              isFr
                  ? 'Récolte enregistrée. ID de lot: ${_batchId ?? '—'}'
                  : 'Harvest saved. Batch ID: ${_batchId ?? '—'}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: _text,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            if (_traceUrl != null)
              TextButton(
                onPressed: _openTrace,
                child: Text(
                  _traceUrl!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: _gold,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _green,
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(isFr ? 'Terminé' : 'Done'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _card({required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [_surface, _surface2]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildStep(bool isFr) {
    switch (_step) {
      case 0:
        return _card(children: [
          Text(
            isFr ? 'Type de culture *' : 'Crop type *',
            style: const TextStyle(color: _textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: _cropType,
            isExpanded: true,
            dropdownColor: _surface,
            style: const TextStyle(color: _text),
            decoration: _dec(isFr ? 'Choisir' : 'Select'),
            items: kCrops
                .map(
                  (c) => DropdownMenuItem(
                    value: c.en,
                    child: Text(c.label(isFr), overflow: TextOverflow.ellipsis),
                  ),
                )
                .toList(),
            onChanged: (v) => setState(() => _cropType = v),
          ),
          const SizedBox(height: 14),
          Text(
            isFr ? 'Date de récolte *' : 'Harvest date *',
            style: const TextStyle(color: _textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: _pickDate,
            child: InputDecorator(
              decoration: _dec(''),
              child: Text(
                '${_harvestDate.day.toString().padLeft(2, '0')}/'
                '${_harvestDate.month.toString().padLeft(2, '0')}/'
                '${_harvestDate.year}',
                style: const TextStyle(color: _text),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            isFr ? 'Quantité (kg) *' : 'Quantity (kg) *',
            style: const TextStyle(color: _textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _qtyCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(color: _text),
            decoration: _dec(isFr ? 'Ex: 500' : 'e.g. 500'),
          ),
          const SizedBox(height: 14),
          Text(
            isFr ? 'Qualité' : 'Quality grade',
            style: const TextStyle(color: _textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: _quality,
            dropdownColor: _surface,
            style: const TextStyle(color: _text),
            decoration: _dec(''),
            items: [
              DropdownMenuItem(
                value: 'A',
                child: Text(
                  isFr ? 'Qualité A — Premium' : 'Grade A — Premium',
                ),
              ),
              DropdownMenuItem(
                value: 'B',
                child: Text(
                  isFr ? 'Qualité B — Standard' : 'Grade B — Standard',
                ),
              ),
              DropdownMenuItem(
                value: 'C',
                child: Text(
                  isFr ? 'Qualité C — Local' : 'Grade C — Local',
                ),
              ),
            ],
            onChanged: (v) => setState(() => _quality = v ?? 'A'),
          ),
          const SizedBox(height: 14),
          Text(
            isFr ? 'Notes (optionnel)' : 'Notes (optional)',
            style: const TextStyle(color: _textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _notesCtrl,
            maxLines: 2,
            style: const TextStyle(color: _text),
            decoration: _dec(isFr ? 'Infos supplémentaires…' : 'Extra details…'),
          ),
        ]);
      case 1:
        return _card(children: [
          Text(
            isFr
                ? 'Informations sur la parcelle (optionnel)'
                : 'Plot information (optional)',
            style: const TextStyle(
              color: _text,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            isFr ? 'Taille de la parcelle (ha)' : 'Plot size (hectares)',
            style: const TextStyle(color: _textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _plotSizeCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(color: _text),
            decoration: _dec(isFr ? 'Ex: 1.5' : 'e.g. 1.5'),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: _gold,
                side: const BorderSide(color: _gold),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: _gpsLoading ? null : _captureGps,
              icon: _gpsLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: _gold,
                      ),
                    )
                  : const Icon(Icons.my_location),
              label: Text(
                isFr ? 'Capturer ma position GPS' : 'Capture my GPS location',
              ),
            ),
          ),
          if (_plotLat != null && _plotLng != null) ...[
            const SizedBox(height: 10),
            Text(
              isFr
                  ? 'Position: ${_plotLat!.toStringAsFixed(5)}, ${_plotLng!.toStringAsFixed(5)}'
                  : 'Location: ${_plotLat!.toStringAsFixed(5)}, ${_plotLng!.toStringAsFixed(5)}',
              style: const TextStyle(color: _green, fontSize: 12),
            ),
          ],
          const SizedBox(height: 14),
          Text(
            isFr ? 'Lieu de stockage' : 'Storage location',
            style: const TextStyle(color: _textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _storageCtrl,
            style: const TextStyle(color: _text),
            decoration: _dec(isFr ? 'Ex: Magasin village' : 'e.g. Village store'),
          ),
        ]);
      case 2:
        return _card(children: [
          Text(
            isFr ? 'Intrants utilisés (optionnel)' : 'Inputs used (optional)',
            style: const TextStyle(
              color: _text,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ..._inputs.asMap().entries.map((e) {
            final row = e.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: _surface2,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _border),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${row['name']} · ${row['type']}'
                      '${row['quantity'] != null ? ' · ${row['quantity']} ${row['unit']}' : ''}',
                      style: const TextStyle(color: _text, fontSize: 13),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                    onPressed: () => setState(() => _inputs.removeAt(e.key)),
                  ),
                ],
              ),
            );
          }),
          TextButton.icon(
            onPressed: _addInputDialog,
            icon: const Icon(Icons.add, color: _green),
            label: Text(
              isFr ? 'Ajouter un intrant' : 'Add input',
              style: const TextStyle(color: _green),
            ),
          ),
        ]);
      default:
        final cropLabel = cropLabelFor(_cropType, isFr);
        return _card(children: [
          Text(
            isFr ? 'Vérifiez avant d\'enregistrer' : 'Review before saving',
            style: const TextStyle(
              color: _text,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          _summaryRow(isFr ? 'Culture' : 'Crop', cropLabel),
          _summaryRow(
            isFr ? 'Date' : 'Date',
            '${_harvestDate.day}/${_harvestDate.month}/${_harvestDate.year}',
          ),
          _summaryRow(
            isFr ? 'Quantité' : 'Quantity',
            '${_qtyCtrl.text.trim()} kg',
          ),
          _summaryRow(isFr ? 'Qualité' : 'Grade', _quality),
          if (_plotSizeCtrl.text.trim().isNotEmpty)
            _summaryRow(
              isFr ? 'Parcelle' : 'Plot',
              '${_plotSizeCtrl.text.trim()} ha',
            ),
          if (_plotLat != null)
            _summaryRow(
              'GPS',
              '${_plotLat!.toStringAsFixed(4)}, ${_plotLng!.toStringAsFixed(4)}',
            ),
          if (_inputs.isNotEmpty)
            _summaryRow(
              isFr ? 'Intrants' : 'Inputs',
              '${_inputs.length}',
            ),
          if (_cooperativeId != null)
            _summaryRow(
              isFr ? 'Coopérative' : 'Cooperative',
              isFr ? 'Liée' : 'Linked',
            ),
        ]);
    }
  }

  Widget _summaryRow(String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(k, style: const TextStyle(color: _textMuted, fontSize: 13)),
          ),
          Flexible(
            child: Text(
              v,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: _text,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _dec(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: _textMuted),
        filled: true,
        fillColor: _surface2,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: _border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: _border),
        ),
      );
}
