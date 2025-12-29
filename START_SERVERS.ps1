# Script PowerShell pour démarrer les serveurs Sahel AgriConnect
# Usage: .\START_SERVERS.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Démarrage Sahel AgriConnect" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Node.js est installé
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Erreur: Node.js n'est pas installé!" -ForegroundColor Red
    Write-Host "   Installez Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Vérifier les ports
Write-Host "Vérification des ports..." -ForegroundColor Yellow
$port3001 = netstat -ano | findstr :3001
$port5173 = netstat -ano | findstr :5173

if ($port3001) {
    Write-Host "⚠️  Le port 3001 est déjà utilisé" -ForegroundColor Yellow
    Write-Host "   Le backend pourrait déjà être en cours d'exécution" -ForegroundColor Gray
}

if ($port5173) {
    Write-Host "⚠️  Le port 5173 est déjà utilisé" -ForegroundColor Yellow
    Write-Host "   Le frontend pourrait déjà être en cours d'exécution" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Démarrage des serveurs..." -ForegroundColor Yellow
Write-Host ""

# Démarrer le backend
Write-Host "📦 Démarrage du Backend (port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Backend - Port 3001' -ForegroundColor Green; npm run dev" -WindowStyle Normal

# Attendre un peu
Start-Sleep -Seconds 3

# Démarrer le frontend
Write-Host "🌐 Démarrage du Frontend (port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\web-dashboard'; Write-Host 'Frontend - Port 5173' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Serveurs démarrés!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Deux fenêtres PowerShell ont été ouvertes:" -ForegroundColor White
Write-Host "  1. Backend (port 3001)" -ForegroundColor Cyan
Write-Host "  2. Frontend (port 5173)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Attendez quelques secondes que les serveurs démarrent..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Puis ouvrez dans votre navigateur:" -ForegroundColor White
Write-Host "  http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Pour arrêter les serveurs, fermez les fenêtres PowerShell" -ForegroundColor Gray
Write-Host ""

