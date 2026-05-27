import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../main.dart';

/// App-wide language state for inline `lp.t('EN', 'FR')` lookups.
///
/// Persisted under the same SharedPreferences key (`app_locale`) used by
/// [SahelApp]'s `Locale` state, so toggling the language anywhere in the
/// app drives both runtime translations *and* `MaterialApp.locale` (for
/// Flutter's built-in localizations).
class LanguageProvider extends ChangeNotifier {
  static const _key = 'app_locale';

  String _lang = 'fr';

  String get lang => _lang;
  bool get isFr => _lang == 'fr';

  /// Use with [context.watch] so UI rebuilds when language changes.
  Locale get locale => Locale(_lang);

  LanguageProvider() {
    _load();
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_key);
      if (saved == 'fr' || saved == 'en') {
        _lang = saved!;
        notifyListeners();
        SahelApp.updateLocale(Locale(_lang));
      } else {
        final deviceLocale =
            PlatformDispatcher.instance.locale.languageCode;
        final defaultLang = (deviceLocale == 'fr') ? 'fr' : 'en';
        _lang = defaultLang;
        notifyListeners();
        SahelApp.updateLocale(Locale(_lang));
      }
    } catch (_) {
      // Keep default 'fr' if storage fails.
    }
  }

  Future<void> setLang(String lang) async {
    final normalized = lang.toLowerCase();
    if (normalized != 'fr' && normalized != 'en') return;
    if (_lang == normalized) return;

    _lang = normalized;
    notifyListeners();
    SahelApp.updateLocale(Locale(_lang));

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, _lang);
    } catch (_) {
      // Silent failure: in-memory state is still correct.
    }
  }

  /// Picks the FR or EN string for the current language.
  String t(String en, String fr) => isFr ? fr : en;
}
