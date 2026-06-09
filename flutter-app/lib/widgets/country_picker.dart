import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme.dart';

/// ISO country code → international dial prefix (auth OTP / phone entry).
/// Scoped to all African countries + investor-residence diaspora (US, CA, FR, GB) only.
Map<String, String> get countryCodePrefixMap => {
      for (final o in phonePrefixOptions) o.countryCode: o.prefix,
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

/// Dialing codes for auth OTP — Africa (54) + diaspora investor residence (US, CA, FR, GB).
const List<PhonePrefixOption> phonePrefixOptions = [
  // Africa (alphabetical)
  PhonePrefixOption(countryCode: 'DZ', prefix: '+213', flag: '🇩🇿', name: 'Algeria'),
  PhonePrefixOption(countryCode: 'AO', prefix: '+244', flag: '🇦🇴', name: 'Angola'),
  PhonePrefixOption(countryCode: 'BJ', prefix: '+229', flag: '🇧🇯', name: 'Benin'),
  PhonePrefixOption(countryCode: 'BW', prefix: '+267', flag: '🇧🇼', name: 'Botswana'),
  PhonePrefixOption(countryCode: 'BF', prefix: '+226', flag: '🇧🇫', name: 'Burkina Faso'),
  PhonePrefixOption(countryCode: 'BI', prefix: '+257', flag: '🇧🇮', name: 'Burundi'),
  PhonePrefixOption(countryCode: 'CV', prefix: '+238', flag: '🇨🇻', name: 'Cabo Verde'),
  PhonePrefixOption(countryCode: 'CM', prefix: '+237', flag: '🇨🇲', name: 'Cameroon'),
  PhonePrefixOption(countryCode: 'CF', prefix: '+236', flag: '🇨🇫', name: 'Central African Republic'),
  PhonePrefixOption(countryCode: 'TD', prefix: '+235', flag: '🇹🇩', name: 'Chad'),
  PhonePrefixOption(countryCode: 'KM', prefix: '+269', flag: '🇰🇲', name: 'Comoros'),
  PhonePrefixOption(countryCode: 'CG', prefix: '+242', flag: '🇨🇬', name: 'Congo'),
  PhonePrefixOption(countryCode: 'CI', prefix: '+225', flag: '🇨🇮', name: "Côte d'Ivoire"),
  PhonePrefixOption(countryCode: 'CD', prefix: '+243', flag: '🇨🇩', name: 'Democratic Republic of the Congo'),
  PhonePrefixOption(countryCode: 'DJ', prefix: '+253', flag: '🇩🇯', name: 'Djibouti'),
  PhonePrefixOption(countryCode: 'EG', prefix: '+20', flag: '🇪🇬', name: 'Egypt'),
  PhonePrefixOption(countryCode: 'GQ', prefix: '+240', flag: '🇬🇶', name: 'Equatorial Guinea'),
  PhonePrefixOption(countryCode: 'ER', prefix: '+291', flag: '🇪🇷', name: 'Eritrea'),
  PhonePrefixOption(countryCode: 'SZ', prefix: '+268', flag: '🇸🇿', name: 'Eswatini'),
  PhonePrefixOption(countryCode: 'ET', prefix: '+251', flag: '🇪🇹', name: 'Ethiopia'),
  PhonePrefixOption(countryCode: 'GA', prefix: '+241', flag: '🇬🇦', name: 'Gabon'),
  PhonePrefixOption(countryCode: 'GM', prefix: '+220', flag: '🇬🇲', name: 'Gambia'),
  PhonePrefixOption(countryCode: 'GH', prefix: '+233', flag: '🇬🇭', name: 'Ghana'),
  PhonePrefixOption(countryCode: 'GN', prefix: '+224', flag: '🇬🇳', name: 'Guinea'),
  PhonePrefixOption(countryCode: 'GW', prefix: '+245', flag: '🇬🇼', name: 'Guinea-Bissau'),
  PhonePrefixOption(countryCode: 'KE', prefix: '+254', flag: '🇰🇪', name: 'Kenya'),
  PhonePrefixOption(countryCode: 'LS', prefix: '+266', flag: '🇱🇸', name: 'Lesotho'),
  PhonePrefixOption(countryCode: 'LR', prefix: '+231', flag: '🇱🇷', name: 'Liberia'),
  PhonePrefixOption(countryCode: 'LY', prefix: '+218', flag: '🇱🇾', name: 'Libya'),
  PhonePrefixOption(countryCode: 'MG', prefix: '+261', flag: '🇲🇬', name: 'Madagascar'),
  PhonePrefixOption(countryCode: 'MW', prefix: '+265', flag: '🇲🇼', name: 'Malawi'),
  PhonePrefixOption(countryCode: 'ML', prefix: '+223', flag: '🇲🇱', name: 'Mali'),
  PhonePrefixOption(countryCode: 'MR', prefix: '+222', flag: '🇲🇷', name: 'Mauritania'),
  PhonePrefixOption(countryCode: 'MU', prefix: '+230', flag: '🇲🇺', name: 'Mauritius'),
  PhonePrefixOption(countryCode: 'MA', prefix: '+212', flag: '🇲🇦', name: 'Morocco'),
  PhonePrefixOption(countryCode: 'MZ', prefix: '+258', flag: '🇲🇿', name: 'Mozambique'),
  PhonePrefixOption(countryCode: 'NA', prefix: '+264', flag: '🇳🇦', name: 'Namibia'),
  PhonePrefixOption(countryCode: 'NE', prefix: '+227', flag: '🇳🇪', name: 'Niger'),
  PhonePrefixOption(countryCode: 'NG', prefix: '+234', flag: '🇳🇬', name: 'Nigeria'),
  PhonePrefixOption(countryCode: 'RW', prefix: '+250', flag: '🇷🇼', name: 'Rwanda'),
  PhonePrefixOption(countryCode: 'ST', prefix: '+239', flag: '🇸🇹', name: 'São Tomé and Príncipe'),
  PhonePrefixOption(countryCode: 'SN', prefix: '+221', flag: '🇸🇳', name: 'Senegal'),
  PhonePrefixOption(countryCode: 'SC', prefix: '+248', flag: '🇸🇨', name: 'Seychelles'),
  PhonePrefixOption(countryCode: 'SL', prefix: '+232', flag: '🇸🇱', name: 'Sierra Leone'),
  PhonePrefixOption(countryCode: 'SO', prefix: '+252', flag: '🇸🇴', name: 'Somalia'),
  PhonePrefixOption(countryCode: 'ZA', prefix: '+27', flag: '🇿🇦', name: 'South Africa'),
  PhonePrefixOption(countryCode: 'SS', prefix: '+211', flag: '🇸🇸', name: 'South Sudan'),
  PhonePrefixOption(countryCode: 'SD', prefix: '+249', flag: '🇸🇩', name: 'Sudan'),
  PhonePrefixOption(countryCode: 'TZ', prefix: '+255', flag: '🇹🇿', name: 'Tanzania'),
  PhonePrefixOption(countryCode: 'TG', prefix: '+228', flag: '🇹🇬', name: 'Togo'),
  PhonePrefixOption(countryCode: 'TN', prefix: '+216', flag: '🇹🇳', name: 'Tunisia'),
  PhonePrefixOption(countryCode: 'UG', prefix: '+256', flag: '🇺🇬', name: 'Uganda'),
  PhonePrefixOption(countryCode: 'ZM', prefix: '+260', flag: '🇿🇲', name: 'Zambia'),
  PhonePrefixOption(countryCode: 'ZW', prefix: '+263', flag: '🇿🇼', name: 'Zimbabwe'),
  // Diaspora investor residence (confirmed scope)
  PhonePrefixOption(countryCode: 'CA', prefix: '+1', flag: '🇨🇦', name: 'Canada'),
  PhonePrefixOption(countryCode: 'FR', prefix: '+33', flag: '🇫🇷', name: 'France'),
  PhonePrefixOption(countryCode: 'GB', prefix: '+44', flag: '🇬🇧', name: 'United Kingdom'),
  PhonePrefixOption(countryCode: 'US', prefix: '+1', flag: '🇺🇸', name: 'United States'),
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

/// 54 African Union member states — alphabetical English names.
const List<String> africanCountries = [
  'Algeria',
  'Angola',
  'Benin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cameroon',
  'Central African Republic',
  'Chad',
  'Comoros',
  'Congo',
  "Côte d'Ivoire",
  'Democratic Republic of the Congo',
  'Djibouti',
  'Egypt',
  'Equatorial Guinea',
  'Eritrea',
  'Eswatini',
  'Ethiopia',
  'Gabon',
  'Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libya',
  'Madagascar',
  'Malawi',
  'Mali',
  'Mauritania',
  'Mauritius',
  'Morocco',
  'Mozambique',
  'Namibia',
  'Niger',
  'Nigeria',
  'Rwanda',
  'São Tomé and Príncipe',
  'Senegal',
  'Seychelles',
  'Sierra Leone',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Sudan',
  'Tanzania',
  'Togo',
  'Tunisia',
  'Uganda',
  'Zambia',
  'Zimbabwe',
];

const List<String> diasporaCountries = [
  'Canada',
  'France',
  'United Kingdom',
  'United States',
];

/// Single normalized country list — Africa first, then diaspora.
const List<String> allCountries = [
  ...africanCountries,
  ...diasporaCountries,
];

/// Canonical English country names for [CountryDropdown].
final List<String> appCountryNames = List<String>.unmodifiable(allCountries);

/// Reusable country dropdown for registration and role-specific forms.
class CountryDropdown extends StatelessWidget {
  CountryDropdown({
    super.key,
    required this.value,
    required this.onChanged,
    this.hint,
    List<String>? countries,
    this.fillColor = const Color(0xFFF8F4E3),
    this.darkStyle = false,
  }) : countries = countries ?? allCountries;

  /// Currently selected country name. Empty string means "no selection".
  final String value;

  final ValueChanged<String?> onChanged;

  final String? hint;

  final List<String> countries;

  final Color fillColor;

  /// When true, uses high-contrast dark-green styling for dark auth backgrounds.
  final bool darkStyle;

  static const _menuItemStyle = TextStyle(
    color: Colors.white,
    fontSize: 15,
    fontWeight: FontWeight.w500,
  );

  static const _fieldItemStyle = TextStyle(
    color: Color(0xFF1a3c2e),
    fontSize: 15,
    fontWeight: FontWeight.w600,
  );

  static const _darkFieldItemStyle = TextStyle(
    color: Colors.white,
    fontSize: 15,
    fontWeight: FontWeight.w600,
  );

  List<DropdownMenuItem<String>> _buildItems() {
    return countries
        .map(
          (c) => DropdownMenuItem<String>(
            value: c,
            child: Text(c, style: _menuItemStyle),
          ),
        )
        .toList();
  }

  List<Widget> _buildSelectedItems(TextStyle style) {
    return countries
        .map(
          (c) => Align(
            alignment: Alignment.centerLeft,
            child: Text(c, style: style, overflow: TextOverflow.ellipsis),
          ),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final items = _buildItems();
    final hasSelection = value.isNotEmpty && countries.contains(value);
    final fieldStyle = darkStyle ? _darkFieldItemStyle : _fieldItemStyle;

    if (darkStyle) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: DropdownButtonFormField<String>(
            value: hasSelection ? value : null,
            isExpanded: true,
            style: _darkFieldItemStyle,
            dropdownColor: const Color(0xFF142820),
            iconEnabledColor: AppColors.gold,
            items: items,
            selectedItemBuilder: (context) =>
                _buildSelectedItems(_darkFieldItemStyle),
            decoration: InputDecoration(
              labelText: hint,
              labelStyle: const TextStyle(color: Colors.white70),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.08),
              enabledBorder: OutlineInputBorder(
                borderSide:
                    BorderSide(color: AppColors.gold.withValues(alpha: 0.45)),
                borderRadius: BorderRadius.circular(14),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onChanged: onChanged,
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFF5F0E4).withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: value.isEmpty
                  ? AppColors.gold.withValues(alpha: 0.35)
                  : AppColors.forestGreen.withValues(alpha: 0.18),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.forestGreen.withValues(alpha: 0.06),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: hasSelection ? value : null,
              isExpanded: true,
              style: fieldStyle,
              dropdownColor: const Color(0xFF142820),
              iconEnabledColor: AppColors.gold,
              icon: const Icon(Icons.keyboard_arrow_down_rounded),
              items: items,
              selectedItemBuilder: (context) => _buildSelectedItems(fieldStyle),
              hint: hint == null
                  ? null
                  : Text(
                      hint!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7280),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
              onChanged: onChanged,
            ),
          ),
        ),
      ),
    );
  }
}
