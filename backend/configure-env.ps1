# Script simple pour configurer le fichier .env avec MongoDB Atlas

param(
    [Parameter(Mandatory=$true)]
    [string]$MongoUri,
    
    [Parameter(Mandatory=$false)]
    [string]$JwtSecret
)

# Générer un JWT_SECRET si non fourni
if ([string]::IsNullOrWhiteSpace($JwtSecret)) {
    $JwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "JWT_SECRET genere automatiquement" -ForegroundColor Green
}

$envPath = Join-Path $PSScriptRoot ".env"

# Créer le contenu du fichier .env
$envContent = @"
# Sahel AgriConnect - Configuration Backend
# Ne partagez JAMAIS ce fichier (il contient des secrets)

PORT=3001
MONGO_URI=$MongoUri
JWT_SECRET=$JwtSecret
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
"@

# Écrire le fichier
Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Fichier .env configure avec succes!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "MongoDB URI: Configure" -ForegroundColor White
Write-Host "JWT Secret: Configure" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. node scripts/initAdmin.js" -ForegroundColor Cyan
Write-Host "  2. npm run dev" -ForegroundColor Cyan
Write-Host ""

