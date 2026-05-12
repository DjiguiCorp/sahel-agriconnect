# 📱 Sahel AgriConnect - Application Flutter

Application mobile Flutter avec support multi-langues pour Sahel AgriConnect.

## Fondation (structure actuelle)

- **Point d’entrée :** `lib/main.dart` (Hive + `ProviderScope` + `SahelAgriConnectApp`).
- **App shell :** `lib/app.dart` (thème, `go_router`, l10n).
- **Cœur :** `lib/core/` — thème, router, constantes (`API_BASE_URL` via `--dart-define`), client Dio, offline (Hive + file d’attente + sync), connectivité, stockage.
- **Fonctionnalités :** `lib/features/*` — dossiers `models/`, `providers/`, `screens/` (écrans listés ci‑dessous sont des **squelettes** : `Scaffold` + texte, prêts à être remplacés).
- **Partagé :** `lib/shared/widgets/` et `lib/shared/models/user_role.dart`.

Depuis ce dossier :

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=https://votre-api.example.com
```

Les polices **Inter** ne sont pas incluses dans le dépôt (évite les échecs de build sans fichiers `.ttf`). Ajoutez les fichiers décrits dans `assets/fonts/README.txt` puis réactivez la section `fonts:` dans `pubspec.yaml` si besoin.

> Sur cette machine, la commande `flutter` n’était pas disponible dans le PATH ; exécutez `flutter pub get` localement après installation du SDK Flutter.

## 🌍 Langues Supportées

- **Français (fr)** - Langue principale
- **Anglais (en)** - English
- **Bambara (bm)** - Bamanankan
- **Mooré (mo)** - Mòoré
- **Fulfulde (ff)** - Fulfulde

## 📁 Structure des Fichiers de Traduction

```
flutter-app/
├── lib/
│   ├── l10n/
│   │   ├── app_fr.arb          # Traductions françaises
│   │   ├── app_en.arb          # Traductions anglaises
│   │   ├── app_bm.arb          # Traductions bambara
│   │   ├── app_mo.arb          # Traductions mooré
│   │   └── app_ff.arb          # Traductions fulfulde
│   └── main.dart
├── pubspec.yaml
└── l10n.yaml
```

## 🚀 Configuration

### 1. Ajouter les Dépendances

Dans `pubspec.yaml` :

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0

flutter:
  generate: true
```

### 2. Configurer l10n.yaml

Créez `l10n.yaml` :

```yaml
arb-dir: lib/l10n
template-arb-file: app_fr.arb
output-localization-file: app_localizations.dart
```

### 3. Configurer MaterialApp

Dans `main.dart` :

```dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sahel AgriConnect',
      localizationsDelegates: [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: [
        Locale('fr', ''), // Français
        Locale('en', ''), // Anglais
        Locale('bm', ''), // Bambara
        Locale('mo', ''), // Mooré
        Locale('ff', ''), // Fulfulde
      ],
      locale: Locale('fr'), // Langue par défaut
      home: HomePage(),
    );
  }
}
```

## 📝 Utilisation dans les Widgets

```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appName),
      ),
      body: Column(
        children: [
          Text(l10n.homeTitle),
          Text(l10n.navHome),
        ],
      ),
    );
  }
}
```

## ➕ Ajouter une Nouvelle Langue

### Étape 1 : Créer le Fichier ARB

Créez `lib/l10n/app_XX.arb` où XX est le code de langue (ex: `app_ar.arb` pour l'arabe).

### Étape 2 : Copier la Structure

Copiez la structure de `app_fr.arb` et traduisez :

```json
{
  "@@locale": "ar",
  "appName": "Sahel AgriConnect",
  "@appName": {
    "description": "Nom de l'application"
  },
  "homeTitle": "الصفحة الرئيسية",
  ...
}
```

### Étape 3 : Ajouter dans supportedLocales

Dans `main.dart` :

```dart
supportedLocales: [
  Locale('fr', ''),
  Locale('en', ''),
  Locale('bm', ''),
  Locale('mo', ''),
  Locale('ff', ''),
  Locale('ar', ''), // Nouvelle langue
],
```

### Étape 4 : Générer les Traductions

```bash
flutter gen-l10n
```

## 🔄 Changer la Langue Dynamiquement

```dart
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class LanguageSelector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return DropdownButton<Locale>(
      value: Localizations.localeOf(context),
      items: [
        DropdownMenuItem(value: Locale('fr'), child: Text('Français')),
        DropdownMenuItem(value: Locale('en'), child: Text('English')),
        DropdownMenuItem(value: Locale('bm'), child: Text('Bamanankan')),
        DropdownMenuItem(value: Locale('mo'), child: Text('Mòoré')),
        DropdownMenuItem(value: Locale('ff'), child: Text('Fulfulde')),
      ],
      onChanged: (Locale? locale) {
        if (locale != null) {
          // Utiliser un State Management (Provider, Riverpod, etc.)
          // pour changer la langue de l'application
        }
      },
    );
  }
}
```

## 📚 Format ARB

Le format ARB (Application Resource Bundle) supporte :

- **Traductions simples** : `"key": "value"`
- **Pluriels** : Utilisez `@key` avec `{count, plural, ...}`
- **Interpolation** : `"welcome": "Bonjour {name}"` avec `@welcome { "name": {} }`
- **Métadonnées** : `@key { "description": "...", "type": "..." }`

Exemple :

```json
{
  "@@locale": "fr",
  "items": "{count, plural, =0{Aucun élément} =1{Un élément} other{{count} éléments}}",
  "@items": {
    "placeholders": {
      "count": {
        "type": "int"
      }
    }
  }
}
```

## 🐛 Dépannage

### Les traductions ne s'affichent pas

1. Vérifiez que `flutter gen-l10n` a été exécuté
2. Vérifiez que `generate: true` est dans `pubspec.yaml`
3. Vérifiez la syntaxe ARB (JSON valide)

### Erreur de génération

1. Vérifiez que tous les fichiers ARB ont la même structure
2. Vérifiez que `@@locale` est défini dans chaque fichier
3. Vérifiez les clés manquantes

## 📖 Ressources

- [Flutter Internationalization](https://docs.flutter.dev/development/accessibility-and-localization/internationalization)
- [ARB Format](https://github.com/google/app-resource-bundle)
- [intl Package](https://pub.dev/packages/intl)

---

**Note** : Cette structure est un template. Adaptez-la selon votre architecture Flutter (Provider, Riverpod, Bloc, etc.).

