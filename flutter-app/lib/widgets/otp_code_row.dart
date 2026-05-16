import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Six-digit OTP row that scales to the parent width (no horizontal overflow).
class OtpCodeRow extends StatelessWidget {
  const OtpCodeRow({
    super.key,
    required this.controllers,
    required this.focusNodes,
    required this.enabled,
    required this.onDigitChanged,
    this.digitCount = 6,
    this.boxHeight = 58,
  });

  final List<TextEditingController> controllers;
  final List<FocusNode> focusNodes;
  final bool enabled;
  final void Function(int index, String value) onDigitChanged;
  final int digitCount;
  final double boxHeight;

  static const _fillColor = Color(0xFFF8F4E3);
  static const _textColor = Color(0xFF1a3c2e);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(digitCount, (index) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              left: index == 0 ? 0 : 3,
              right: index == digitCount - 1 ? 0 : 3,
            ),
            child: SizedBox(
              height: boxHeight,
              child: TextField(
                controller: controllers[index],
                focusNode: focusNodes[index],
                textAlign: TextAlign.center,
                textAlignVertical: TextAlignVertical.center,
                keyboardType: TextInputType.number,
                maxLength: 1,
                enabled: enabled,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: _textColor,
                  height: 1.0,
                ),
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  counterText: '',
                  isDense: true,
                  filled: true,
                  fillColor: _fillColor,
                  contentPadding: const EdgeInsets.symmetric(vertical: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: _textColor, width: 2),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  disabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (value) => onDigitChanged(index, value),
              ),
            ),
          ),
        );
      }),
    );
  }
}
