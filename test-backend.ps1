# Script de Test pour le Backend Render.com
# Usage: .\test-backend.ps1 [URL_DU_BACKEND]

param(
    [string]$BackendUrl = ""
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST DU BACKEND RENDER.COM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demander l'URL si non fournie
if ([string]::IsNullOrEmpty($BackendUrl)) {
    Write-Host "Entrez l'URL de votre backend Render:" -ForegroundColor Yellow
    Write-Host "  Exemple: https://sahel-agriconnect-backend.onrender.com" -ForegroundColor Gray
    Write-Host ""
    $BackendUrl = Read-Host "URL"
}

# Nettoyer l'URL (enlever les espaces, trailing slash)
$BackendUrl = $BackendUrl.Trim().TrimEnd('/')

Write-Host ""
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
Write-Host "  URL: $BackendUrl/api/health" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/health" -Method GET -ErrorAction Stop
    
    Write-Host "✅ SUCCES!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Reponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($response.status -eq "OK") {
        Write-Host "✅ Backend fonctionne correctement!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERREUR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Message d'erreur:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Causes possibles:" -ForegroundColor Yellow
    Write-Host "  - Service Render est en train de demarrer (attendez 1-2 min)" -ForegroundColor White
    Write-Host "  - Service Render est 'Sleeping' (premiere requete prend 30-60 sec)" -ForegroundColor White
    Write-Host "  - URL incorrecte" -ForegroundColor White
    Write-Host "  - Probleme de connexion MongoDB" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Test 2: Login Admin..." -ForegroundColor Yellow
Write-Host "  URL: $BackendUrl/api/auth/login" -ForegroundColor Gray
Write-Host ""

$loginBody = @{
    email = "admin@sahelagriconnect.org"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCES!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Token recu: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Cyan
    Write-Host "Email: $($loginResponse.user.email)" -ForegroundColor Cyan
    Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Authentification fonctionne!" -ForegroundColor Green
} catch {
    Write-Host "❌ ERREUR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Message d'erreur:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Causes possibles:" -ForegroundColor Yellow
    Write-Host "  - Identifiants incorrects" -ForegroundColor White
    Write-Host "  - Admin non cree dans MongoDB" -ForegroundColor White
    Write-Host "  - Probleme de connexion MongoDB" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTS TERMINES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si les deux tests reussissent, votre backend est OK! ✅" -ForegroundColor Green
Write-Host ""

