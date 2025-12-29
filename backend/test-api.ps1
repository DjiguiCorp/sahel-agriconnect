# Script de test de l'API Sahel AgriConnect

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test de l'API Sahel AgriConnect" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1 : Santé de l'API
Write-Host "Test 1 : Santé de l'API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3001/api/health -Method GET -TimeoutSec 5
    Write-Host "[OK] API accessible" -ForegroundColor Green
    Write-Host "Réponse: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] API non accessible" -ForegroundColor Red
    Write-Host "Assurez-vous que le serveur est démarré (npm run dev)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2 : Login Admin
Write-Host "Test 2 : Login Admin..." -ForegroundColor Yellow
try {
    $body = @{
        email = "admin@sahelagriconnect.org"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri http://localhost:3001/api/auth/login -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "[OK] Login réussi" -ForegroundColor Green
        Write-Host "Token: $($result.token.Substring(0, 50))..." -ForegroundColor Gray
        $global:token = $result.token
    } else {
        Write-Host "[ERREUR] Login échoué" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERREUR] Erreur lors du login" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3 : Enregistrer un agriculteur (Public)
Write-Host "Test 3 : Enregistrer un agriculteur..." -ForegroundColor Yellow
try {
    $farmerData = @{
        nom = "Test Agriculteur"
        telephone = "+223 76 12 34 56"
        latitude = "12.6392"
        longitude = "-8.0029"
        superficie = 10
        cultures = @("Riz", "Mil")
        region = "Sikasso, Mali"
        typeExploitation = "Familiale"
        objectifsProduction = @("Souveraineté alimentaire locale")
        accesElectricite = "Non"
        accesStockage = "Non"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri http://localhost:3001/api/farmers -Method POST -Body $farmerData -ContentType "application/json" -TimeoutSec 5
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "[OK] Agriculteur enregistré" -ForegroundColor Green
        Write-Host "ID: $($result.farmer._id)" -ForegroundColor Gray
        $global:farmerId = $result.farmer._id
    } else {
        Write-Host "[ERREUR] Échec de l'enregistrement" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERREUR] Erreur lors de l'enregistrement" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# Test 4 : Récupérer les agriculteurs (Protégée)
if ($global:token) {
    Write-Host "Test 4 : Récupérer les agriculteurs (avec token)..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $($global:token)"
        }
        
        $response = Invoke-WebRequest -Uri http://localhost:3001/api/farmers -Method GET -Headers $headers -TimeoutSec 5
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success) {
            Write-Host "[OK] Liste récupérée" -ForegroundColor Green
            Write-Host "Nombre d'agriculteurs: $($result.farmers.Count)" -ForegroundColor Gray
        } else {
            Write-Host "[ERREUR] Échec de la récupération" -ForegroundColor Red
        }
    } catch {
        Write-Host "[ERREUR] Erreur lors de la récupération" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tests terminés" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

