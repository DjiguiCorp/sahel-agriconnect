import 'package:flutter/material.dart';

/// ISO country code → international dial prefix (auth OTP / phone entry).
const Map<String, String> countryCodePrefixMap = {
  // West Africa
  'ML': '+223',
  'SN': '+221',
  'BF': '+226',
  'NE': '+227',
  'GN': '+224',
  'CI': '+225',
  'GW': '+245',
  'MR': '+222',
  'GM': '+220',
  'SL': '+232',
  'LR': '+231',
  'TG': '+228',
  'BJ': '+229',
  'GH': '+233',
  'NG': '+234',
  'CM': '+237',
  // North Africa
  'MA': '+212',
  'DZ': '+213',
  'TN': '+216',
  // East Africa
  'ET': '+251',
  'KE': '+254',
  'TZ': '+255',
  'UG': '+256',
  // Diaspora - Americas
  'US': '+1',
  'CA': '+1',
  'BR': '+55',
  // Diaspora - Europe
  'FR': '+33',
  'GB': '+44',
  'DE': '+49',
  'BE': '+32',
  'IT': '+39',
  'ES': '+34',
  'NL': '+31',
  'PT': '+351',
  'CH': '+41',
  'SE': '+46',
  'NO': '+47',
  // Middle East
  'AE': '+971',
  'SA': '+966',
  'QA': '+974',
};

class PhonePrefixOption {
  const PhonePrefixOption({
    required this.countryCode,
    required this.prefix,
    required this.flag,
    required this.name,
  });

  final String countryCode;
  final String prefix;
  final String flag;
  final String name;
}

/// Dialing codes for manual override of locale auto-detection (flag + prefix).
const List<PhonePrefixOption> phonePrefixOptions = [
  PhonePrefixOption(countryCode: 'ML', prefix: '+223', flag: '🇲🇱', name: 'Mali'),
  PhonePrefixOption(countryCode: 'SN', prefix: '+221', flag: '🇸🇳', name: 'Senegal'),
  PhonePrefixOption(countryCode: 'BF', prefix: '+226', flag: '🇧🇫', name: 'Burkina Faso'),
  PhonePrefixOption(countryCode: 'NE', prefix: '+227', flag: '🇳🇪', name: 'Niger'),
  PhonePrefixOption(countryCode: 'GN', prefix: '+224', flag: '🇬🇳', name: 'Guinea'),
  PhonePrefixOption(countryCode: 'CI', prefix: '+225', flag: '🇨🇮', name: 'Ivory Coast'),
  PhonePrefixOption(countryCode: 'GW', prefix: '+245', flag: '🇬🇼', name: 'Guinea-Bissau'),
  PhonePrefixOption(countryCode: 'MR', prefix: '+222', flag: '🇲🇷', name: 'Mauritania'),
  PhonePrefixOption(countryCode: 'GM', prefix: '+220', flag: '🇬🇲', name: 'Gambia'),
  PhonePrefixOption(countryCode: 'SL', prefix: '+232', flag: '🇸🇱', name: 'Sierra Leone'),
  PhonePrefixOption(countryCode: 'LR', prefix: '+231', flag: '🇱🇷', name: 'Liberia'),
  PhonePrefixOption(countryCode: 'TG', prefix: '+228', flag: '🇹🇬', name: 'Togo'),
  PhonePrefixOption(countryCode: 'BJ', prefix: '+229', flag: '🇧🇯', name: 'Benin'),
  PhonePrefixOption(countryCode: 'GH', prefix: '+233', flag: '🇬🇭', name: 'Ghana'),
  PhonePrefixOption(countryCode: 'NG', prefix: '+234', flag: '🇳🇬', name: 'Nigeria'),
  PhonePrefixOption(countryCode: 'CM', prefix: '+237', flag: '🇨🇲', name: 'Cameroon'),
  PhonePrefixOption(countryCode: 'MA', prefix: '+212', flag: '🇲🇦', name: 'Morocco'),
  PhonePrefixOption(countryCode: 'DZ', prefix: '+213', flag: '🇩🇿', name: 'Algeria'),
  PhonePrefixOption(countryCode: 'TN', prefix: '+216', flag: '🇹🇳', name: 'Tunisia'),
  PhonePrefixOption(countryCode: 'ET', prefix: '+251', flag: '🇪🇹', name: 'Ethiopia'),
  PhonePrefixOption(countryCode: 'KE', prefix: '+254', flag: '🇰🇪', name: 'Kenya'),
  PhonePrefixOption(countryCode: 'TZ', prefix: '+255', flag: '🇹🇿', name: 'Tanzania'),
  PhonePrefixOption(countryCode: 'UG', prefix: '+256', flag: '🇺🇬', name: 'Uganda'),
  PhonePrefixOption(countryCode: 'US', prefix: '+1', flag: '🇺🇸', name: 'United States'),
  PhonePrefixOption(countryCode: 'CA', prefix: '+1', flag: '🇨🇦', name: 'Canada'),
  PhonePrefixOption(countryCode: 'BR', prefix: '+55', flag: '🇧🇷', name: 'Brazil'),
  PhonePrefixOption(countryCode: 'FR', prefix: '+33', flag: '🇫🇷', name: 'France'),
  PhonePrefixOption(countryCode: 'GB', prefix: '+44', flag: '🇬🇧', name: 'United Kingdom'),
  PhonePrefixOption(countryCode: 'DE', prefix: '+49', flag: '🇩🇪', name: 'Germany'),
  PhonePrefixOption(countryCode: 'BE', prefix: '+32', flag: '🇧🇪', name: 'Belgium'),
  PhonePrefixOption(countryCode: 'IT', prefix: '+39', flag: '🇮🇹', name: 'Italy'),
  PhonePrefixOption(countryCode: 'ES', prefix: '+34', flag: '🇪🇸', name: 'Spain'),
  PhonePrefixOption(countryCode: 'NL', prefix: '+31', flag: '🇳🇱', name: 'Netherlands'),
  PhonePrefixOption(countryCode: 'PT', prefix: '+351', flag: '🇵🇹', name: 'Portugal'),
  PhonePrefixOption(countryCode: 'CH', prefix: '+41', flag: '🇨🇭', name: 'Switzerland'),
  PhonePrefixOption(countryCode: 'SE', prefix: '+46', flag: '🇸🇪', name: 'Sweden'),
  PhonePrefixOption(countryCode: 'NO', prefix: '+47', flag: '🇳🇴', name: 'Norway'),
  PhonePrefixOption(countryCode: 'AE', prefix: '+971', flag: '🇦🇪', name: 'UAE'),
  PhonePrefixOption(countryCode: 'SA', prefix: '+966', flag: '🇸🇦', name: 'Saudi Arabia'),
  PhonePrefixOption(countryCode: 'QA', prefix: '+974', flag: '🇶🇦', name: 'Qatar'),
];

PhonePrefixOption phonePrefixForCountryCode(String code) {
  final upper = code.toUpperCase();
  return phonePrefixOptions.firstWhere(
    (o) => o.countryCode == upper,
    orElse: () => phonePrefixOptions.first,
  );
}

/// Compact flag + dial-code selector shown beside the phone input.
class PhonePrefixDropdown extends StatelessWidget {
  const PhonePrefixDropdown({
    super.key,
    required this.selectedCountryCode,
    required this.onChanged,
    this.fillColor = const Color(0xFFF8F4E3),
  });

  final String selectedCountryCode;
  final ValueChanged<PhonePrefixOption> onChanged;
  final Color fillColor;

  @override
  Widget build(BuildContext context) {
    final selected = phonePrefixForCountryCode(selectedCountryCode);
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: fillColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: selected.countryCode,
          isDense: true,
          icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 20),
          selectedItemBuilder: (context) => phonePrefixOptions
              .map(
                (o) => Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '${o.flag} ${o.prefix}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1a3c2e),
                    ),
                  ),
                ),
              )
              .toList(),
          items: phonePrefixOptions
              .map(
                (o) => DropdownMenuItem<String>(
                  value: o.countryCode,
                  child: Text(
                    '${o.flag} ${o.prefix}  ${o.name}',
                    style: const TextStyle(fontSize: 14),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              )
              .toList(),
          onChanged: (code) {
            if (code == null) return;
            onChanged(phonePrefixForCountryCode(code));
          },
        ),
      ),
    );
  }
}

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
