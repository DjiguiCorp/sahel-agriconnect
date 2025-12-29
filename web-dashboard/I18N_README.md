# 🌍 Guide de Traduction Multi-langues - Sahel AgriConnect

Ce guide explique comment ajouter et gérer les traductions dans l'application React Sahel AgriConnect.

## 📋 Langues Supportées

L'application supporte actuellement 5 langues :

1. **Français (fr)** - Langue principale
2. **Anglais (en)** - English
3. **Bambara (bm)** - Bamanankan
4. **Mooré (mo)** - Mòoré
5. **Fulfulde (ff)** - Fulfulde

## 📁 Structure des Fichiers

```
web-dashboard/
├── src/
│   ├── i18n/
│   │   └── config.js          # Configuration i18next
│   ├── locales/
│   │   ├── fr.json            # Traductions françaises
│   │   ├── en.json            # Traductions anglaises
│   │   ├── bm.json            # Traductions bambara
│   │   ├── mo.json            # Traductions mooré
│   │   └── ff.json            # Traductions fulfulde
│   └── components/
│       └── LanguageSelector.jsx  # Composant sélecteur de langue
```

## 🚀 Utilisation dans les Composants

### 1. Importer useTranslation

```jsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <p>{t('home.title')}</p>
    </div>
  );
};
```

### 2. Utiliser les Traductions

```jsx
// Traduction simple
{t('nav.home')}

// Traduction avec interpolation
{t('welcome', { name: 'John' })}

// Traduction avec pluriel
{t('items', { count: 5 })}
```

## ➕ Ajouter une Nouvelle Langue

### Étape 1 : Créer le Fichier de Traduction

Créez un nouveau fichier dans `src/locales/` avec le code de langue (ex: `ar.json` pour l'arabe).

### Étape 2 : Copier la Structure

Copiez la structure du fichier `fr.json` et traduisez tous les textes :

```json
{
  "common": {
    "appName": "Sahel AgriConnect",
    "loading": "جاري التحميل...",
    ...
  },
  "nav": {
    "home": "الرئيسية",
    ...
  }
}
```

### Étape 3 : Ajouter la Langue dans la Configuration

Modifiez `src/i18n/config.js` :

```javascript
import ar from '../locales/ar.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  bm: { translation: bm },
  mo: { translation: mo },
  ff: { translation: ff },
  ar: { translation: ar }  // Nouvelle langue
};
```

### Étape 4 : Ajouter au Sélecteur de Langue

Modifiez `src/components/LanguageSelector.jsx` :

```javascript
const languages = [
  { code: 'fr', name: 'FR', nativeName: 'Français' },
  { code: 'en', name: 'EN', nativeName: 'English' },
  { code: 'bm', name: 'BM', nativeName: 'Bamanankan' },
  { code: 'mo', name: 'MO', nativeName: 'Mòoré' },
  { code: 'ff', name: 'FF', nativeName: 'Fulfulde' },
  { code: 'ar', name: 'AR', nativeName: 'العربية' }  // Nouvelle langue
];
```

### Étape 5 : Support RTL (si nécessaire)

Pour les langues RTL (arabe, hébreu), ajoutez dans `src/i18n/config.js` :

```javascript
i18n.init({
  // ... autres options
  detection: {
    // ...
  },
  // Support RTL
  rtl: {
    ar: true,
    // Ajoutez d'autres langues RTL ici
  }
});
```

Puis dans vos composants :

```jsx
const { t, i18n } = useTranslation();
const isRTL = i18n.dir() === 'rtl';

<div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'text-right' : 'text-left'}>
  {t('welcome')}
</div>
```

## 📝 Structure des Clés de Traduction

Les clés sont organisées par sections :

- `common.*` - Textes communs (boutons, labels, etc.)
- `nav.*` - Navigation
- `home.*` - Page d'accueil
- `farmerRegistration.*` - Formulaire d'enregistrement agriculteur
- `dashboard.*` - Tableau de bord
- `admin.*` - Administration
- `soilDiagnostic.*` - Diagnostic du sol
- `diseaseDetection.*` - Détection de maladies
- `thinkTank.*` - Think Tank
- `contact.*` - Contact
- `language.*` - Sélection de langue

## 🔍 Bonnes Pratiques

1. **Utilisez des clés descriptives** : `farmerRegistration.fields.fullName` plutôt que `field1`
2. **Groupez par fonctionnalité** : Toutes les traductions d'une page dans la même section
3. **Évitez les traductions hardcodées** : Utilisez toujours `t('key')` au lieu de texte direct
4. **Testez toutes les langues** : Vérifiez que toutes les traductions sont présentes
5. **Respectez la longueur** : Certaines langues sont plus longues que d'autres

## 🐛 Dépannage

### La traduction ne s'affiche pas

1. Vérifiez que la clé existe dans tous les fichiers de traduction
2. Vérifiez l'orthographe de la clé
3. Vérifiez que le fichier de traduction est importé dans `config.js`

### La langue ne change pas

1. Vérifiez que la langue est dans la liste du `LanguageSelector`
2. Vérifiez que le fichier de traduction existe
3. Vérifiez la console pour les erreurs

### Erreur de chargement

1. Vérifiez la syntaxe JSON (pas de virgule finale, guillemets corrects)
2. Vérifiez que tous les fichiers sont sauvegardés
3. Redémarrez le serveur de développement

## 📚 Ressources

- [Documentation i18next](https://www.i18next.com/)
- [Documentation react-i18next](https://react.i18next.com/)
- [Codes de langue ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## 🤝 Contribution

Pour ajouter ou améliorer des traductions :

1. Modifiez le fichier de traduction approprié
2. Testez dans l'application
3. Vérifiez que toutes les clés sont traduites
4. Soumettez une pull request

---

**Note** : Les traductions pour le Bambara, Mooré et Fulfulde sont en cours d'amélioration. N'hésitez pas à contribuer !

