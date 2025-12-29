# Script de configuration MongoDB Atlas pour Sahel AgriConnect
# Ce script vous guide pour configurer MongoDB Atlas

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration MongoDB Atlas" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Instructions pour obtenir la chaîne de connexion
Write-Host "📋 ÉTAPE 1: Obtenir votre chaîne de connexion MongoDB Atlas" -ForegroundColor Yellow
Write-Host ""
Write-Host "Suivez ces étapes dans MongoDB Atlas:" -ForegroundColor White
Write-Host ""
Write-Host "1. Connectez-vous à https://cloud.mongodb.com" -ForegroundColor Green
Write-Host "2. Cliquez sur 'Connect' sur votre cluster" -ForegroundColor Green
Write-Host "3. Choisissez 'Connect your application'" -ForegroundColor Green
Write-Host "4. Sélectionnez 'Node.js' et version '5.5 or later'" -ForegroundColor Green
Write-Host "5. Copiez la chaîne de connexion (elle ressemble à:)" -ForegroundColor Green
Write-Host "   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "   - Remplacez <username> par votre nom d'utilisateur MongoDB" -ForegroundColor Yellow
Write-Host "   - Remplacez <password> par votre mot de passe MongoDB" -ForegroundColor Yellow
Write-Host "   - Ajoutez le nom de la base de données à la fin:" -ForegroundColor Yellow
Write-Host "     ...mongodb.net/sahel-agriconnect?retryWrites=true&w=majority" -ForegroundColor Gray
Write-Host ""

# Demander la chaîne de connexion
$mongoUri = Read-Host "Collez votre chaîne de connexion MongoDB Atlas complète"

# Vérifier que la chaîne n'est pas vide
if ([string]::IsNullOrWhiteSpace($mongoUri)) {
    Write-Host "❌ Erreur: La chaîne de connexion ne peut pas être vide!" -ForegroundColor Red
    exit 1
}

# Vérifier que la chaîne contient mongodb
if (-not $mongoUri.Contains("mongodb")) {
    Write-Host "⚠️  Attention: La chaîne ne semble pas être une URI MongoDB valide." -ForegroundColor Yellow
    $continue = Read-Host "Continuer quand même? (o/n)"
    if ($continue -ne "o" -and $continue -ne "O") {
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Chaîne de connexion reçue!" -ForegroundColor Green
Write-Host ""

# Étape 2: Générer un JWT_SECRET sécurisé
Write-Host "🔐 ÉTAPE 2: Génération d'une clé secrète JWT" -ForegroundColor Yellow
Write-Host ""

# Générer un JWT_SECRET aléatoire sécurisé
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "✅ Clé JWT générée automatiquement" -ForegroundColor Green
Write-Host ""

# Étape 3: Créer/mettre à jour le fichier .env
Write-Host "📝 ÉTAPE 3: Mise à jour du fichier .env" -ForegroundColor Yellow
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

# Vérifier si le fichier .env existe
if (Test-Path $envPath) {
    Write-Host "ℹ️  Le fichier .env existe déjà. Mise à jour..." -ForegroundColor Cyan
    
    # Lire le contenu actuel
    $envContent = Get-Content $envPath -Raw
    
    # Remplacer MONGO_URI si elle existe, sinon l'ajouter
    if ($envContent -match "MONGO_URI=") {
        $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=$mongoUri"
    } else {
        $envContent += "`nMONGO_URI=$mongoUri"
    }
    
    # Remplacer JWT_SECRET si elle existe, sinon l'ajouter
    if ($envContent -match "JWT_SECRET=") {
        $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
    } else {
        $envContent += "`nJWT_SECRET=$jwtSecret"
    }
    
    # S'assurer que les autres variables existent
    if (-not ($envContent -match "PORT=")) {
        $envContent += "`nPORT=3001"
    }
    if (-not ($envContent -match "ADMIN_EMAIL=")) {
        $envContent += "`nADMIN_EMAIL=admin@sahelagriconnect.org"
    }
    if (-not ($envContent -match "ADMIN_PASSWORD=")) {
        $envContent += "`nADMIN_PASSWORD=admin123"
    }
    
    Set-Content -Path $envPath -Value $envContent
} else {
    Write-Host "ℹ️  Création d'un nouveau fichier .env..." -ForegroundColor Cyan
    
    # Créer un nouveau fichier .env
    $envContent = @"
# Sahel AgriConnect - Configuration Backend
# Ne partagez JAMAIS ce fichier (il contient des secrets)

PORT=3001
MONGO_URI=$mongoUri
JWT_SECRET=$jwtSecret
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
"@
    
    Set-Content -Path $envPath -Value $envContent
}

Write-Host "✅ Fichier .env mis à jour avec succès!" -ForegroundColor Green
Write-Host ""

# Étape 4: Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Résumé de la configuration:" -ForegroundColor Yellow
Write-Host "   • MongoDB Atlas: Connecté" -ForegroundColor White
Write-Host "   • JWT Secret: Généré (64 caractères)" -ForegroundColor White
Write-Host "   • Fichier .env: Créé/Mis à jour" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Créer l'admin par défaut:" -ForegroundColor White
Write-Host "      node scripts/initAdmin.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. (Optionnel) Charger des données de test:" -ForegroundColor White
Write-Host "      node scripts/seedData.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. Démarrer le serveur backend:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Votre backend est maintenant configuré pour MongoDB Atlas!" -ForegroundColor Green
Write-Host ""

