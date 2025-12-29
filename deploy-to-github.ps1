# Script PowerShell pour déployer automatiquement sur GitHub
# Usage: .\deploy-to-github.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "sahel-agriconnect"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Déploiement Automatique sur GitHub" -ForegroundColor Cyan
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

# Vérifier que nous sommes dans le bon dossier
$currentDir = Get-Location
Write-Host "📁 Dossier actuel: $currentDir" -ForegroundColor Cyan
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
    Write-Host "⚠️  .gitignore n'existe pas - création..." -ForegroundColor Yellow
    # Le .gitignore devrait déjà exister, mais on vérifie
} else {
    Write-Host "✅ .gitignore existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "Ajout des fichiers..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Création du commit..." -ForegroundColor Yellow
$commitMessage = "Initial commit - Sahel AgriConnect - Ready for deployment"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aucun changement à commiter (peut-être déjà commité)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Commit créé avec succès" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuration du remote GitHub..." -ForegroundColor Yellow

# Vérifier si le remote existe déjà
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Remote 'origin' existe déjà: $remoteExists" -ForegroundColor Yellow
    $updateRemote = Read-Host "Voulez-vous le mettre à jour? (o/n)"
    if ($updateRemote -eq "o" -or $updateRemote -eq "O") {
        git remote set-url origin "https://github.com/$GitHubUsername/$RepositoryName.git"
        Write-Host "✅ Remote mis à jour" -ForegroundColor Green
    }
} else {
    git remote add origin "https://github.com/$GitHubUsername/$RepositoryName.git"
    Write-Host "✅ Remote ajouté: https://github.com/$GitHubUsername/$RepositoryName.git" -ForegroundColor Green
}

Write-Host ""
Write-Host "Renommage de la branche en 'main'..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Gestion du README GitHub" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Vérification si le repository GitHub existe déjà..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Repository GitHub existe et est accessible" -ForegroundColor Green
    Write-Host ""
    Write-Host "Fusion avec le README GitHub (si présent)..." -ForegroundColor Yellow
    
    # Essayer de fusionner
    git pull origin main --allow-unrelated-histories --no-edit 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Fusion réussie" -ForegroundColor Green
        
        # Vérifier s'il y a un conflit dans README.md
        $readmeContent = Get-Content "README.md" -Raw -ErrorAction SilentlyContinue
        if ($readmeContent -match '<<<<<<<') {
            Write-Host ""
            Write-Host "⚠️  CONFLIT détecté dans README.md" -ForegroundColor Yellow
            Write-Host "   Résolution automatique..." -ForegroundColor Yellow
            
            # Résoudre automatiquement en gardant notre version
            $readmeLines = Get-Content "README.md"
            $newReadme = @()
            $inConflict = $false
            
            foreach ($line in $readmeLines) {
                if ($line -match '^<<<<<<<') {
                    $inConflict = $true
                    # Ignorer cette ligne et les suivantes jusqu'à =======
                    continue
                }
                if ($line -match '^=======') {
                    # Ignorer cette ligne
                    continue
                }
                if ($line -match '^>>>>>>>') {
                    $inConflict = $false
                    # Ignorer cette ligne
                    continue
                }
                if (-not $inConflict) {
                    $newReadme += $line
                }
            }
            
            $newReadme | Set-Content "README.md"
            Write-Host "✅ Conflit résolu automatiquement (version locale conservée)" -ForegroundColor Green
            
            git add README.md
            git commit -m "Resolve README conflict - keep local version"
        }
    } else {
        Write-Host "⚠️  Impossible de fusionner automatiquement" -ForegroundColor Yellow
        Write-Host "   Vous devrez peut-être résoudre manuellement" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Repository GitHub n'existe pas encore ou n'est pas accessible" -ForegroundColor Yellow
    Write-Host "   Assurez-vous d'avoir créé le repository sur GitHub.com" -ForegroundColor Yellow
    Write-Host "   URL: https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Push vers GitHub" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Poussage vers GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  Vous devrez entrer vos identifiants GitHub" -ForegroundColor Yellow
Write-Host "   (Nom d'utilisateur et Personal Access Token)" -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ SUCCÈS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Votre code est maintenant sur GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Vérifiez votre repository sur GitHub" -ForegroundColor White
    Write-Host "  2. Continuez avec le déploiement:" -ForegroundColor White
    Write-Host "     - MongoDB Atlas (voir DEPLOIEMENT_DEBUTANT.md)" -ForegroundColor Cyan
    Write-Host "     - Vercel pour le frontend" -ForegroundColor Cyan
    Write-Host "     - Render.com pour le backend" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ Erreur lors du push" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Causes possibles:" -ForegroundColor Yellow
    Write-Host "  1. Authentification échouée" -ForegroundColor White
    Write-Host "     → Créez un Personal Access Token sur GitHub" -ForegroundColor Cyan
    Write-Host "     → Utilisez-le comme mot de passe" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Repository n'existe pas" -ForegroundColor White
    Write-Host "     → Créez-le sur https://github.com/new" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  3. Conflit avec le README GitHub" -ForegroundColor White
    Write-Host "     → Utilisez: git push -u origin main --force" -ForegroundColor Cyan
    Write-Host "     → (Attention: cela remplace tout sur GitHub)" -ForegroundColor Yellow
    Write-Host ""
}

