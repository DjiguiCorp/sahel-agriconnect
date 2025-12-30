# 👤 User Flows - Sahel AgriConnect

## Vue d'Ensemble

Ce document décrit les flux utilisateurs principaux de la plateforme Sahel AgriConnect, de l'enregistrement d'un agriculteur à l'export vers les marchés internationaux.

---

## 🌾 Flow 1: Enregistrement Agriculteur → Coopérative → Transformation → Marché

### Étape 1: Enregistrement de l'Agriculteur

```
1. Agriculteur accède à /dashboard
   ↓
2. Clique "Enregistrer un agriculteur"
   ↓
3. Remplit le formulaire :
   - Informations personnelles (nom, téléphone)
   - Localisation GPS (latitude, longitude)
   - Superficie et cultures
   - Type d'exploitation (familiale/commerciale)
   - Connexion coopérative (optionnel)
   ↓
4. Détection automatique des terres via satellite
   ↓
5. Analyse de maladies (upload photo feuille)
   ↓
6. Soumission du formulaire
   ↓
7. Données enregistrées dans MongoDB
   ↓
8. Notification admin en temps réel (WebSocket)
   ↓
9. Confirmation à l'agriculteur
```

### Étape 2: Connexion à une Coopérative

```
1. Agriculteur indique son lien avec une coopérative
   ↓
2. Sélectionne la coopérative dans la liste
   ↓
3. Indique son rôle (membre/dirigeant)
   ↓
4. Coopérative reçoit notification (à implémenter)
   ↓
5. Accès aux équipements partagés de la coopérative
```

### Étape 3: Demande de Financement (Coopérative)

```
1. Coopérative accède à /cooperatives
   ↓
2. Clique "Demander financement"
   ↓
3. Sélectionne type :
   - Équipement (tracteurs, séchoirs, irrigation)
   - Partenariat diaspora
   - Expansion transformation
   ↓
4. Remplit les détails (besoins, montant estimé)
   ↓
5. Soumet la demande
   ↓
6. Admin reçoit notification
   ↓
7. Traitement de la demande (à implémenter)
```

### Étape 4: Transformation des Produits

```
1. Agriculteur/Coopérative produit (karité, sésame, etc.)
   ↓
2. Accède à /centres-transformation
   ↓
3. Trouve un centre correspondant à son produit
   ↓
4. Contacte le centre (via plateforme ou téléphone)
   ↓
5. Livraison des produits au centre
   ↓
6. Transformation (beurre karité, huile sésame, etc.)
   ↓
7. Certification (si nécessaire)
```

### Étape 5: Certification FDA/USDA (Centre)

```
1. Centre accède à /centres-transformation
   ↓
2. Clique "Demander certification FDA/USDA"
   ↓
3. Remplit le formulaire :
   - Capacité actuelle
   - Date inspection souhaitée
   - Message complémentaire
   ↓
4. Soumet la demande
   ↓
5. Admin traite la demande
   ↓
6. Inspection organisée (à implémenter)
   ↓
7. Certification accordée
   ↓
8. Centre peut exporter vers USA
```

### Étape 6: Connexion Diaspora → Export

```
1. Entreprise diaspora (USA) accède à /diaspora
   ↓
2. S'inscrit avec :
   - Nom entreprise
   - Ville, État (USA)
   - Type business (restaurant/retail)
   - Produits recherchés
   ↓
3. Matching automatique avec centres certifiés
   ↓
4. Entreprise voit les centres correspondants
   ↓
5. Contacte le centre
   ↓
6. Négociation et commande
   ↓
7. Export vers USA
   ↓
8. Traçabilité complète (à implémenter)
```

---

## 👨‍💼 Flow 2: Dashboard Administratif

### Connexion Admin

```
1. Admin accède à /admin/login
   ↓
2. Entre credentials :
   - Email: admin@sahelagriconnect.org
   - Password: admin123
   ↓
3. Backend vérifie credentials
   ↓
4. Génère JWT token
   ↓
5. Stocke token (localStorage)
   ↓
6. Redirige vers /admin/central
```

### Gestion des Agriculteurs

```
1. Admin accède à /admin/central
   ↓
2. Onglet "Agriculteurs (Temps Réel)"
   ↓
3. Voit liste en temps réel (WebSocket)
   ↓
4. Peut :
   - Voir détails d'un agriculteur
   - Modifier statut
   - Exporter données
   ↓
5. Notifications pour nouveaux enregistrements
```

### Gestion Coopératives & Diaspora

```
1. Admin accède à /admin/central
   ↓
2. Onglet "Coopératives & Diaspora"
   ↓
3. Vue "Demandes & Matching"
   ↓
4. Voit :
   - Demandes de financement
   - Demandes de certification
   - Matching diaspora-centres
   ↓
5. Traite les demandes :
   - Approuve/Rejette financement
   - Organise inspections certification
   - Facilite connexions diaspora
```

---

## 🤝 Flow 3: Coopérative - Gestion

### Vue Coopérative

```
1. Responsable coopérative accède à /cooperatives
   ↓
2. Voit sa coopérative dans la liste
   ↓
3. Peut :
   - Voir liste des membres
   - Voir équipements disponibles
   - Demander financement
   ↓
4. Clique "Demander financement"
   ↓
5. Remplit formulaire
   ↓
6. Soumet demande
   ↓
7. Suit statut de la demande
```

---

## 🌍 Flow 4: Diaspora - Partenariat

### Inscription Entreprise Diaspora

```
1. Entreprise accède à /diaspora
   ↓
2. Onglet "Inscription Entreprise"
   ↓
3. Remplit formulaire :
   - Nom entreprise
   - Ville, État (USA)
   - Type business
   - Produits recherchés (karité, sésame, etc.)
   - Option investissement
   ↓
4. Soumet
   ↓
5. Matching automatique avec centres
   ↓
6. Voit centres correspondants
   ↓
7. Contacte centres
   ↓
8. Établit partenariat
```

---

## 🏭 Flow 5: Centre Transformation - Certification

### Demande Certification

```
1. Centre accède à /centres-transformation
   ↓
2. Voit son centre dans la liste
   ↓
3. Statut actuel : "Local" ou "Régional"
   ↓
4. Clique "Demander certification FDA/USDA"
   ↓
5. Remplit formulaire
   ↓
6. Soumet demande
   ↓
7. Admin traite
   ↓
8. Inspection organisée
   ↓
9. Certification accordée
   ↓
10. Statut mis à jour : "International (FDA/USDA)"
   ↓
11. Peut "Représenter aux USA"
```

---

## 📊 Flow 6: Statistiques et Rapports

### Vue Statistiques (Admin)

```
1. Admin accède à /admin/central
   ↓
2. Onglet "Rapports"
   ↓
3. Voit :
   - Nombre total agriculteurs
   - Nombre par région
   - Superficie totale
   - Cultures principales
   - Demandes en attente
   ↓
4. Exporte données (CSV, PDF)
   ↓
5. Partage avec ministères (à implémenter)
```

---

## 🔄 Flow 7: Notifications Temps Réel

### WebSocket Notifications

```
1. Événement déclenché (nouvel agriculteur, nouvelle demande)
   ↓
2. Backend émet événement WebSocket
   ↓
3. Frontend (admin dashboard) reçoit notification
   ↓
4. Affichage notification en temps réel
   ↓
5. Mise à jour automatique de la liste
```

---

## 📱 Flow 8: Application Mobile (Futur)

### Enregistrement via Mobile

```
1. Agriculteur ouvre app mobile
   ↓
2. Se connecte (ou crée compte)
   ↓
3. Accède à "Enregistrer"
   ↓
4. Remplit formulaire (avec GPS automatique)
   ↓
5. Prend photo pour analyse maladie
   ↓
6. Soumet (même API backend)
   ↓
7. Reçoit confirmation
   ↓
8. Peut voir ses données hors ligne (cache local)
```

---

## 🎯 Points d'Amélioration

### À Implémenter

1. **Workflow Approbation** : Processus d'approbation pour demandes
2. **Notifications Email/SMS** : Notifications hors ligne
3. **Paiements** : Intégration système de paiement
4. **Traçabilité Blockchain** : Historique immuable
5. **Chat** : Communication directe entre utilisateurs
6. **Calendrier** : Planification saisonnière
7. **Météo** : Intégration données météo

---

*Dernière mise à jour : Décembre 2024*

