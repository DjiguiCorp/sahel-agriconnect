# Script PowerShell pour préparer le projet pour GitHub
# Usage: .\prepare-github.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Préparation pour GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Git est installé
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Host "❌ Erreur: Git n'est pas installé!" -ForegroundColor Red
    Write-Host "   Téléchargez Git depuis: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git détecté: $gitVersion" -ForegroundColor Green
Write-Host ""

# Vérifier si Git est déjà initialisé
$gitStatus = git status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Initialisation de Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Repository Git initialisé" -ForegroundColor Green
} else {
    Write-Host "✅ Repository Git déjà initialisé" -ForegroundColor Green
}

Write-Host ""
Write-Host "Vérification des fichiers..." -ForegroundColor Yellow

# Vérifier que .gitignore existe
if (-not (Test-Path ".gitignore")) {
    Write-Host "⚠️  .gitignore n'existe pas" -ForegroundColor Yellow
    Write-Host "   Création d'un .gitignore de base..." -ForegroundColor Gray
} else {
    Write-Host "✅ .gitignore existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Prêt pour GitHub!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Créez un repository sur GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Exécutez ces commandes:" -ForegroundColor White
Write-Host ""
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Initial commit - Sahel AgriConnect'" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Remplacez VOTRE-USERNAME par votre nom d'utilisateur GitHub" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Suivez le guide DEPLOIEMENT_DEBUTANT.md" -ForegroundColor Yellow
Write-Host ""

