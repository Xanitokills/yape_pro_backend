# test-menu.ps1
# Script interactivo para testing de notificaciones

$BASE_URL = "http://localhost:3002"
$global:token = $null
$global:stores = @()
$global:selectedStore = $null

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "🧪 YAPE PRO - Testing de Notificaciones" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host ""
    
    if ($global:token) {
        Write-Host "✅ Autenticado" -ForegroundColor Green
        if ($global:selectedStore) {
            Write-Host "🏪 Tienda: $($global:selectedStore.name)" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  No autenticado" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "OPCIONES:" -ForegroundColor White
    Write-Host "1. 🔐 Login" -ForegroundColor White
    Write-Host "2. 🏪 Listar tiendas" -ForegroundColor White
    Write-Host "3. 📱 Simular 1 notificación Yape" -ForegroundColor White
    Write-Host "4. 📱 Simular 1 notificación Plin" -ForegroundColor White
    Write-Host "5. 📊 Simular 5 notificaciones (batch)" -ForegroundColor White
    Write-Host "6. 🚪 Salir" -ForegroundColor White
    Write-Host ""
}

function Do-Login {
    Write-Host ""
    Write-Host "🔐 Iniciando sesión..." -ForegroundColor Yellow
    
    $body = @{
        email = "propietario@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        $global:token = $response.data.token
        Write-Host "✅ Login exitoso" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
    }
}

function Get-Stores {
    if (-not $global:token) {
        Write-Host "❌ Debes hacer login primero" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
        return
    }
    
    Write-Host ""
    Write-Host "🏪 Obteniendo tiendas..." -ForegroundColor Yellow
    
    $headers = @{ "Authorization" = "Bearer $global:token" }
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/test/stores" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop
        
        $global:stores = $response.data.stores
        Write-Host "✅ Tiendas encontradas: $($global:stores.Count)" -ForegroundColor Green
        Write-Host ""
        
        for ($i = 0; $i -lt $global:stores.Count; $i++) {
            $store = $global:stores[$i]
            Write-Host "[$($i + 1)] $($store.name)" -ForegroundColor Cyan
            Write-Host "    ID: $($store.id)" -ForegroundColor Gray
            Write-Host "    Trabajadores: $($store.workers_count)" -ForegroundColor Gray
            Write-Host ""
        }
        
        if ($global:stores.Count -gt 0) {
            $global:selectedStore = $global:stores[0]
            Write-Host "✅ Seleccionada: $($global:selectedStore.name)" -ForegroundColor Green
        }
        
        Read-Host "Presiona Enter para continuar"
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
    }
}

function Send-Notification {
    param(
        [string]$Source = "yape",
        [int]$Format = 1
    )
    
    if (-not $global:token) {
        Write-Host "❌ Debes hacer login primero" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
        return
    }
    
    if (-not $global:selectedStore) {
        Write-Host "❌ Debes listar tiendas primero" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
        return
    }
    
    Write-Host ""
    Write-Host "📱 Simulando notificación de $Source..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $global:token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        store_id = $global:selectedStore.id
        amount = 50.00
        sender_name = "Juan Pérez"
        source = $Source
        format = $Format
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/test/simulate-notification" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ Notificación simulada" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Resultados:" -ForegroundColor Cyan
        Write-Host "  ID: $($response.data.notification.id)" -ForegroundColor Gray
        Write-Host "  Monto: S/ $($response.data.notification.amount)" -ForegroundColor Gray
        Write-Host "  De: $($response.data.notification.sender_name)" -ForegroundColor Gray
        Write-Host "  Trabajadores notificados: $($response.data.notification.workers_notified)" -ForegroundColor Gray
        Write-Host ""
        
        Read-Host "Presiona Enter para continuar"
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        Read-Host "Presiona Enter para continuar"
    }
}

function Send-Batch {
    if (-not $global:token) {
        Write-Host "❌ Debes hacer login primero" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
        return
    }
    
    if (-not $global:selectedStore) {
        Write-Host "❌ Debes listar tiendas primero" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
        return
    }
    
    Write-Host ""
    Write-Host "📊 Simulando 5 notificaciones..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $global:token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        store_id = $global:selectedStore.id
        count = 5
        min_amount = 10.00
        max_amount = 200.00
        sources = @("yape", "plin")
        delay_ms = 1000
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/test/simulate-batch" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ Batch iniciado" -ForegroundColor Green
        Write-Host "Duración estimada: $($response.data.estimated_duration_seconds) segundos" -ForegroundColor Gray
        Write-Host "Revisa la consola del backend..." -ForegroundColor Cyan
        
        Read-Host "Presiona Enter para continuar"
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
    }
}

# MAIN LOOP
while ($true) {
    Show-Menu
    $option = Read-Host "Selecciona una opción"
    
    switch ($option) {
        "1" { Do-Login }
        "2" { Get-Stores }
        "3" { Send-Notification -Source "yape" -Format 1 }
        "4" { Send-Notification -Source "plin" -Format 2 }
        "5" { Send-Batch }
        "6" { 
            Write-Host ""
            Write-Host "👋 ¡Hasta luego!" -ForegroundColor Cyan
            exit 
        }
        default {
            Write-Host "❌ Opción inválida" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
