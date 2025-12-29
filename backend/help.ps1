# Guide Interactif - Sahel AgriConnect Backend

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Sahel AgriConnect - Guide Interactif" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Que souhaitez-vous faire ?" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Vérifier l'état actuel" -ForegroundColor White
    Write-Host "2. Configurer MongoDB (local ou Atlas)" -ForegroundColor White
    Write-Host "3. Créer l'admin par défaut" -ForegroundColor White
    Write-Host "4. Charger des données de test" -ForegroundColor White
    Write-Host "5. Démarrer le serveur backend" -ForegroundColor White
    Write-Host "6. Tester l'API" -ForegroundColor White
    Write-Host "7. Voir les logs du serveur" -ForegroundColor White
    Write-Host "8. Aide pour connecter le frontend" -ForegroundColor White
    Write-Host "9. Dépannage" -ForegroundColor White
    Write-Host "0. Quitter" -ForegroundColor White
    Write-Host ""
}

function Check-Status {
    Write-Host "`n=== État Actuel ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Vérifier .env
    if (Test-Path .env) {
        Write-Host "[OK] Fichier .env existe" -ForegroundColor Green
        $envContent = Get-Content .env
        Write-Host "   Contenu:" -ForegroundColor Gray
        $envContent | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "[MANQUANT] Fichier .env" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Vérifier node_modules
    if (Test-Path node_modules) {
        Write-Host "[OK] Dépendances installées" -ForegroundColor Green
    } else {
        Write-Host "[MANQUANT] Dépendances - Exécutez: npm install" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Vérifier MongoDB
    Write-Host "MongoDB:" -ForegroundColor Cyan
    try {
        $mongoVersion = mongod --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] MongoDB installé" -ForegroundColor Green
        }
    } catch {
        Write-Host "[INFO] MongoDB local non détecté (utilisez Atlas?)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # Vérifier le serveur
    Write-Host "Serveur Backend:" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri http://localhost:3001/api/health -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response) {
            Write-Host "[OK] Serveur démarré sur le port 3001" -ForegroundColor Green
        }
    } catch {
        Write-Host "[INFO] Serveur non démarré" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Setup-MongoDB {
    Write-Host "`n=== Configuration MongoDB ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Choisissez une option:" -ForegroundColor Yellow
    Write-Host "1. MongoDB Local (déjà installé)" -ForegroundColor White
    Write-Host "2. MongoDB Atlas (cloud)" -ForegroundColor White
    Write-Host "3. Retour" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Votre choix"
    
    switch ($choice) {
        "1" {
            Write-Host "`nVérification de MongoDB local..." -ForegroundColor Yellow
            try {
                $version = mongod --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] MongoDB détecté" -ForegroundColor Green
                    Write-Host "Démarrage du service..." -ForegroundColor Yellow
                    Start-Service MongoDB -ErrorAction SilentlyContinue
                    Write-Host "[OK] MongoDB devrait être démarré" -ForegroundColor Green
                } else {
                    Write-Host "[ERREUR] MongoDB non trouvé" -ForegroundColor Red
                    Write-Host "Téléchargez depuis: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "[ERREUR] Erreur lors de la vérification" -ForegroundColor Red
            }
        }
        "2" {
            Write-Host "`nConfiguration MongoDB Atlas:" -ForegroundColor Yellow
            Write-Host "1. Créez un compte sur https://www.mongodb.com/cloud/atlas/register" -ForegroundColor White
            Write-Host "2. Créez un cluster gratuit (M0)" -ForegroundColor White
            Write-Host "3. Configurez l'accès réseau (ajoutez votre IP)" -ForegroundColor White
            Write-Host "4. Créez un utilisateur (username/password)" -ForegroundColor White
            Write-Host "5. Copiez l'URI de connexion" -ForegroundColor White
            Write-Host ""
            $uri = Read-Host "Collez votre URI MongoDB Atlas"
            if ($uri) {
                $envContent = Get-Content .env
                $newContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=$uri"
                $newContent | Set-Content .env
                Write-Host "[OK] URI mise à jour dans .env" -ForegroundColor Green
            }
        }
    }
    
    Read-Host "`nAppuyez sur Entrée pour continuer"
}

function Create-Admin {
    Write-Host "`n=== Création de l'Admin ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exécution du script..." -ForegroundColor Yellow
    node scripts/initAdmin.js
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Load-SeedData {
    Write-Host "`n=== Chargement des Données de Test ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exécution du script..." -ForegroundColor Yellow
    node scripts/seedData.js
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Start-Server {
    Write-Host "`n=== Démarrage du Serveur ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Le serveur va démarrer en mode développement..." -ForegroundColor Yellow
    Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour démarrer"
    npm run dev
}

function Test-API {
    Write-Host "`n=== Test de l'API ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exécution des tests..." -ForegroundColor Yellow
    Write-Host ""
    & .\test-api.ps1
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Show-FrontendHelp {
    Write-Host "`n=== Aide Frontend ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Pour connecter le frontend React au backend:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Mettre à jour WebSocketContext.jsx:" -ForegroundColor White
    Write-Host "   web-dashboard/src/context/WebSocketContext.jsx" -ForegroundColor Gray
    Write-Host "   Changer l'URL vers: http://localhost:3001" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Voir CONNECTION_GUIDE.md pour plus de détails" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Le backend doit être démarré (option 5)" -ForegroundColor White
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Show-Troubleshooting {
    Write-Host "`n=== Dépannage ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Consultez TROUBLESHOOTING.md pour:" -ForegroundColor Yellow
    Write-Host "- Erreurs MongoDB" -ForegroundColor White
    Write-Host "- Port déjà utilisé" -ForegroundColor White
    Write-Host "- Erreurs de validation" -ForegroundColor White
    Write-Host "- Problèmes WebSocket" -ForegroundColor White
    Write-Host "- Et plus..." -ForegroundColor White
    Write-Host ""
    Write-Host "Ou ouvrez le fichier:" -ForegroundColor Yellow
    Write-Host "notepad TROUBLESHOOTING.md" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

# Boucle principale
do {
    Show-Menu
    $choice = Read-Host "Votre choix"
    
    switch ($choice) {
        "1" { Check-Status }
        "2" { Setup-MongoDB }
        "3" { Create-Admin }
        "4" { Load-SeedData }
        "5" { Start-Server }
        "6" { Test-API }
        "7" { 
            Write-Host "`nLes logs s'affichent dans la console du serveur" -ForegroundColor Yellow
            Write-Host "Démarrez le serveur (option 5) pour voir les logs" -ForegroundColor Yellow
            Read-Host "`nAppuyez sur Entrée pour continuer"
        }
        "8" { Show-FrontendHelp }
        "9" { Show-Troubleshooting }
        "0" { 
            Write-Host "`nAu revoir !" -ForegroundColor Cyan
            break
        }
        default {
            Write-Host "`nChoix invalide" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne "0")

