# Script pour préparer le projet pour le déploiement
# Usage: .\prepare-deployment.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Préparation au Déploiement" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Git est installé
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Host "❌ Erreur: Git n'est pas installé!" -ForegroundColor Red
    Write-Host "   Installez Git depuis https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git détecté" -ForegroundColor Green

# Vérifier que Node.js est installé
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Erreur: Node.js n'est pas installé!" -ForegroundColor Red
    Write-Host "   Installez Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Vérifier les fichiers .env
Write-Host "Vérification des fichiers .env..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend/.env n'existe pas" -ForegroundColor Yellow
    Write-Host "   Créez-le avec les variables nécessaires" -ForegroundColor Gray
} else {
    Write-Host "✅ backend/.env existe" -ForegroundColor Green
}

if (-not (Test-Path "web-dashboard\.env")) {
    Write-Host "⚠️  web-dashboard/.env n'existe pas (optionnel pour dev local)" -ForegroundColor Yellow
} else {
    Write-Host "✅ web-dashboard/.env existe" -ForegroundColor Green
}

Write-Host ""

# Vérifier que .gitignore existe
if (-not (Test-Path ".gitignore")) {
    Write-Host "⚠️  .gitignore n'existe pas - création..." -ForegroundColor Yellow
    # Le fichier devrait déjà exister
} else {
    Write-Host "✅ .gitignore existe" -ForegroundColor Green
}

Write-Host ""

# Vérifier l'état Git
$gitStatus = git status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ℹ️  Initialisation du repository Git..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Repository Git initialisé" -ForegroundColor Green
} else {
    Write-Host "✅ Repository Git déjà initialisé" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Checklist de Déploiement" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Avant de déployer, assurez-vous d'avoir:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✅ Compte GitHub créé" -ForegroundColor White
Write-Host "2. ✅ Repository GitHub créé" -ForegroundColor White
Write-Host "3. ✅ Compte MongoDB Atlas créé" -ForegroundColor White
Write-Host "4. ✅ Cluster MongoDB Atlas créé" -ForegroundColor White
Write-Host "5. ✅ Compte Railway créé (pour backend)" -ForegroundColor White
Write-Host "6. ✅ Compte Vercel créé (pour frontend)" -ForegroundColor White
Write-Host ""
Write-Host "Commandes pour pousser sur GitHub:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor Gray
Write-Host "  git commit -m 'Initial commit - Ready for deployment'" -ForegroundColor Gray
Write-Host "  git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git" -ForegroundColor Gray
Write-Host "  git branch -M main" -ForegroundColor Gray
Write-Host "  git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "Ensuite, suivez DEPLOYMENT_QUICK_START.md" -ForegroundColor Yellow
Write-Host ""

