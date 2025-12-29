# 🔐 Liens Admin - Sahel AgriConnect

## 📋 Pages Admin

### Page de Connexion Admin
```
http://localhost:5173/admin/login
```
**C'est la page pour se connecter en tant qu'administrateur**

### Dashboard Admin (après connexion)
```
http://localhost:5173/admin/central
```
**Dashboard administratif complet (accès protégé - nécessite connexion)**

---

## 🔑 Identifiants Admin (par défaut)

- **Email:** `admin@sahelagriconnect.org`
- **Mot de passe:** `admin123`

⚠️ **Important:** Changez ces identifiants en production!

---

## 📝 Étapes pour Accéder au Dashboard Admin

1. **Ouvrez la page de connexion:**
   ```
   http://localhost:5173/admin/login
   ```

2. **Entrez les identifiants:**
   - Email: `admin@sahelagriconnect.org`
   - Mot de passe: `admin123`

3. **Cliquez sur "Se connecter"**

4. **Vous serez automatiquement redirigé vers:**
   ```
   http://localhost:5173/admin/central
   ```

---

## 🛠️ Fonctionnalités du Dashboard Admin

Le dashboard admin (`/admin/central`) inclut:

- **Agriculteurs en temps réel** - Visualisation des agriculteurs enregistrés
- **Gestion des coopératives** - Liste et gestion des coopératives
- **Planification saisonnière** - Planification des saisons agricoles
- **Gestion des intrants** - Intrants et fertilisants
- **Certification** - Gestion des certifications (Local, Régional, International)
- **Partenariats & Usines** - Gestion des partenariats
- **Logistique** - Gestion logistique et chaînes d'approvisionnement
- **Rapports** - Génération de rapports

---

## 🔒 Sécurité

- Les routes admin sont protégées par authentification JWT
- Le token est stocké dans le localStorage
- La session expire après un certain temps (selon la configuration JWT)
- En cas de déconnexion, vous serez redirigé vers `/admin/login`

---

## 🐛 Dépannage

### Erreur: "Email ou mot de passe incorrect"
- Vérifiez que vous utilisez les bons identifiants
- Vérifiez que le backend est démarré (`http://localhost:3001`)
- Vérifiez que l'admin existe dans la base de données:
  ```bash
  cd backend
  node scripts/initAdmin.js
  ```

### Erreur: "Cannot connect to backend"
- Vérifiez que le backend est démarré:
  ```bash
  cd backend
  npm run dev
  ```
- Vérifiez l'URL de l'API dans `web-dashboard/src/config/api.js`

### Redirection vers /admin/login après connexion
- Vérifiez que le token JWT est bien généré
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que `JWT_SECRET` est défini dans `backend/.env`

---

## 📞 Support

Pour toute question ou problème avec l'accès admin, vérifiez:
1. Que le backend est démarré sur `http://localhost:3001`
2. Que MongoDB est connecté
3. Que l'admin existe dans la base de données
4. Les logs du backend pour les erreurs

