# Script pour déployer les nouvelles fonctionnalités sur Vercel
# Usage: .\deploy-new-features.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOIEMENT NOUVELLES FONCTIONNALITES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon dossier
if (-not (Test-Path "web-dashboard")) {
    Write-Host "❌ Erreur: Vous n'êtes pas dans le dossier du projet!" -ForegroundColor Red
    Write-Host "   Allez dans: C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project" -ForegroundColor Yellow
    exit 1
}

Write-Host "Étape 1: Vérification de l'état Git..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "Étape 2: Ajout de tous les fichiers..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Étape 3: Création du commit..." -ForegroundColor Yellow
$commitMessage = "Ajout nouvelles fonctionnalités: Coopératives, Diaspora, Centres Transformation, Extension Niger"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  Aucun changement à commiter ou erreur lors du commit" -ForegroundColor Yellow
    Write-Host "   Vérifiez l'état avec: git status" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✅ Commit créé avec succès!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Étape 4: Push vers GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ DEPLOIEMENT REUSSI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel va automatiquement redéployer votre application!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Allez sur: https://vercel.com" -ForegroundColor White
    Write-Host "  2. Vérifiez le déploiement dans 'Deployments'" -ForegroundColor White
    Write-Host "  3. Attendez 2-5 minutes pour le build" -ForegroundColor White
    Write-Host "  4. Testez les nouvelles routes:" -ForegroundColor White
    Write-Host "     - https://sahel-agriconnect.vercel.app/cooperatives" -ForegroundColor Gray
    Write-Host "     - https://sahel-agriconnect.vercel.app/diaspora" -ForegroundColor Gray
    Write-Host "     - https://sahel-agriconnect.vercel.app/centres-transformation" -ForegroundColor Gray
    Write-Host "     - https://sahel-agriconnect.vercel.app/admin/central" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du push vers GitHub" -ForegroundColor Red
    Write-Host "   Vérifiez votre connexion et vos credentials Git" -ForegroundColor Yellow
    Write-Host ""
}

