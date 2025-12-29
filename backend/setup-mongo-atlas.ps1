# Script pour configurer MongoDB Atlas avec les identifiants fournis

param(
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString,
    
    [Parameter(Mandatory=$false)]
    [string]$ClusterDomain
)

$username = "info_db_user"
$password = "DjiguiAdmin1"
$envPath = Join-Path $PSScriptRoot ".env"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration MongoDB Atlas" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Si une chaîne complète est fournie
if ($ConnectionString) {
    Write-Host "Utilisation de la chaine fournie..." -ForegroundColor Yellow
    
    # Remplacer <username> et <password> si présents
    $mongoUri = $ConnectionString -replace "<username>", $username -replace "<password>", $password
    
    # Encoder le password pour l'URL (au cas où il contient des caractères spéciaux)
    $encodedPassword = [System.Web.HttpUtility]::UrlEncode($password)
    $mongoUri = $mongoUri -replace [regex]::Escape($password), $encodedPassword
    
    # S'assurer que /sahel-agriconnect est présent avant le ?
    if ($mongoUri -notmatch "/sahel-agriconnect\?") {
        if ($mongoUri -match "(\?retryWrites)") {
            $mongoUri = $mongoUri -replace "(\?retryWrites)", "/sahel-agriconnect`$1"
        } elseif ($mongoUri -match "(\?.*)") {
            $mongoUri = $mongoUri -replace "(\?.*)", "/sahel-agriconnect`$1"
        } else {
            $mongoUri = $mongoUri.TrimEnd('/') + "/sahel-agriconnect?retryWrites=true&w=majority"
        }
    }
}
# Si seulement le domaine du cluster est fourni
elseif ($ClusterDomain) {
    Write-Host "Construction de l'URI avec le domaine fourni..." -ForegroundColor Yellow
    
    # Encoder le password
    $encodedPassword = [System.Web.HttpUtility]::UrlEncode($password)
    
    # Construire l'URI complète
    $mongoUri = "mongodb+srv://${username}:${encodedPassword}@${ClusterDomain}/sahel-agriconnect?retryWrites=true&w=majority"
}
else {
    Write-Host "ERREUR: Fournissez soit -ConnectionString soit -ClusterDomain" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\setup-mongo-atlas.ps1 -ConnectionString 'mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority'" -ForegroundColor Cyan
    Write-Host "  .\setup-mongo-atlas.ps1 -ClusterDomain 'cluster0.xxxxx.mongodb.net'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exemple:" -ForegroundColor Yellow
    Write-Host "  .\setup-mongo-atlas.ps1 -ClusterDomain 'cluster0.abc123.mongodb.net'" -ForegroundColor Gray
    exit 1
}

# Lire le fichier .env
if (-not (Test-Path $envPath)) {
    Write-Host "Creation du fichier .env..." -ForegroundColor Yellow
    $envContent = @"
PORT=3001
MONGO_URI=$mongoUri
JWT_SECRET=$(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_}))
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
"@
} else {
    $envContent = Get-Content $envPath -Raw
    
    # Remplacer ou ajouter MONGO_URI
    if ($envContent -match "MONGO_URI=") {
        $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=$mongoUri"
    } else {
        $envContent += "`nMONGO_URI=$mongoUri"
    }
}

# Écrire le fichier
Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Configuration terminee!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "MONGO_URI configuree:" -ForegroundColor White
Write-Host "  mongodb+srv://$username:***@[cluster]/sahel-agriconnect?..." -ForegroundColor Gray
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Tester la connexion:" -ForegroundColor White
Write-Host "     node scripts/initAdmin.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Si la connexion fonctionne, demarrer le serveur:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si vous avez une erreur de connexion, verifiez:" -ForegroundColor Yellow
Write-Host "  - Que votre IP est autorisee dans Network Access" -ForegroundColor White
Write-Host "  - Que le domaine du cluster est correct" -ForegroundColor White
Write-Host "  - Que le username et password sont corrects" -ForegroundColor White
Write-Host ""

