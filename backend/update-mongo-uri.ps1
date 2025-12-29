# Script pour mettre à jour MONGO_URI dans .env avec les identifiants MongoDB Atlas

param(
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString,
    
    [Parameter(Mandatory=$false)]
    [string]$Cluster,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "info_db_user",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "DjiguiAdmin1"
)

$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "Erreur: Fichier .env non trouve!" -ForegroundColor Red
    exit 1
}

# Si une chaîne complète est fournie
if ($ConnectionString) {
    # Remplacer <username> et <password> si présents
    $mongoUri = $ConnectionString -replace "<username>", $Username -replace "<password>", $Password
    
    # S'assurer que /sahel-agriconnect est présent avant le ?
    if ($mongoUri -notmatch "/sahel-agriconnect\?") {
        $mongoUri = $mongoUri -replace "(\?retryWrites)", "/sahel-agriconnect`$1"
    }
} 
# Si seulement le cluster est fourni
elseif ($Cluster) {
    # Construire la chaîne complète
    $mongoUri = "mongodb+srv://${Username}:${Password}@${Cluster}/sahel-agriconnect?retryWrites=true&w=majority"
}
else {
    Write-Host "Erreur: Fournissez soit -ConnectionString soit -Cluster" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\update-mongo-uri.ps1 -ConnectionString 'mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/...'" -ForegroundColor Cyan
    Write-Host "  .\update-mongo-uri.ps1 -Cluster 'cluster0.xxxxx.mongodb.net'" -ForegroundColor Cyan
    exit 1
}

# Lire le fichier .env
$envContent = Get-Content $envPath -Raw

# Remplacer ou ajouter MONGO_URI
if ($envContent -match "MONGO_URI=") {
    $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=$mongoUri"
} else {
    $envContent += "`nMONGO_URI=$mongoUri"
}

# Écrire le fichier
Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MONGO_URI mis a jour avec succes!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "MongoDB Atlas URI configuree" -ForegroundColor White
Write-Host "Username: $Username" -ForegroundColor Gray
Write-Host "Cluster: Configure" -ForegroundColor Gray
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. node scripts/initAdmin.js" -ForegroundColor Cyan
Write-Host "  2. npm run dev" -ForegroundColor Cyan
Write-Host ""

