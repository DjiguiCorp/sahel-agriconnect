# Script de configuration automatique pour Sahel AgriConnect Backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sahel AgriConnect - Setup Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si .env existe
if (Test-Path .env) {
    Write-Host "[OK] Fichier .env existe" -ForegroundColor Green
} else {
    Write-Host "[INFO] Création du fichier .env..." -ForegroundColor Yellow
    @"
PORT=3001
MONGO_URI=mongodb://localhost:27017/sahel-agriconnect
JWT_SECRET=sahel-agriconnect-super-secret-key-2024-change-in-production
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "[OK] Fichier .env créé" -ForegroundColor Green
}

# Vérifier si node_modules existe
if (Test-Path node_modules) {
    Write-Host "[OK] Dépendances déjà installées" -ForegroundColor Green
} else {
    Write-Host "[INFO] Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dépendances installées" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Échec de l'installation" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Prochaines étapes manuelles:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Démarrer MongoDB (local ou Atlas)" -ForegroundColor Yellow
Write-Host "   - Local: Vérifier que MongoDB est démarré" -ForegroundColor White
Write-Host "   - Atlas: Configurer MONGO_URI dans .env" -ForegroundColor White
Write-Host ""
Write-Host "2. Créer l'admin par défaut:" -ForegroundColor Yellow
Write-Host "   node scripts/initAdmin.js" -ForegroundColor White
Write-Host ""
Write-Host "3. (Optionnel) Charger des données de test:" -ForegroundColor Yellow
Write-Host "   node scripts/seedData.js" -ForegroundColor White
Write-Host ""
Write-Host "4. Démarrer le serveur:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "5. Tester l'API:" -ForegroundColor Yellow
Write-Host "   http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Pour plus de détails, voir SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

