import 'package:flutter/material.dart';

/// Reusable dropdown for selecting an African country.
///
/// Exposes the same simple `value` / `hint` / `onChanged` API used by
/// callers like the login and registration screens, so the underlying
/// state can be a plain `String` (or a `TextEditingController.text`)
/// without leaking dropdown internals.
class CountryDropdown extends StatelessWidget {
  const CountryDropdown({
    super.key,
    required this.value,
    required this.onChanged,
    this.hint,
    this.countries = africanCountries,
    this.fillColor = const Color(0xFFF8F4E3),
  });

  /// Currently selected country name. Empty string means "no selection",
  /// in which case the [hint] is shown.
  final String value;

  /// Called with the new country name (or null when the dropdown is
  /// cleared by the framework — rare but possible).
  final ValueChanged<String?> onChanged;

  /// Placeholder text shown when [value] is empty.
  final String? hint;

  /// Override the list of countries (defaults to all 54 African states).
  final List<String> countries;

  /// Background color of the dropdown container.
  final Color fillColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: fillColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: value.isEmpty
              ? Colors.orange.shade300
              : Colors.transparent,
          width: 0.5,
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value.isEmpty ? null : value,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down_rounded),
          hint: hint == null
              ? null
              : Text(
                  hint!,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFFAAAAAA),
                  ),
                ),
          items: countries
              .map(
                (c) => DropdownMenuItem<String>(
                  value: c,
                  child: Text(
                    c,
                    style: const TextStyle(fontSize: 14),
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

/// All 54 African countries (UN/AU member states), alphabetical.
/// Kept here so any caller can use the same canonical list without
/// duplicating it across screens.
const List<String> africanCountries = [
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
