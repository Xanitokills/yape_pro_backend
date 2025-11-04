# test-notifications.ps1
# Script para probar el sistema de notificaciones simuladas

Write-Host "🧪 YAPE PRO - Testing de Notificaciones Simuladas" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor DarkGray
Write-Host ""

# URL del backend
$BASE_URL = "http://localhost:3002"

# Función para hacer login y obtener token
function Get-AuthToken {
    param (
        [string]$Email = "propietario@example.com",
        [string]$Password = "password123"
    )
    
    Write-Host "🔐 Autenticando como: $Email" -ForegroundColor Yellow
    
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ Login exitoso" -ForegroundColor Green
            return $response.data.token
        } else {
            Write-Host "❌ Error en login: $($response.message)" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Error de conexión: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Función para obtener tiendas disponibles
function Get-TestStores {
    param ([string]$Token)
    
    Write-Host ""
    Write-Host "🏪 Obteniendo tiendas disponibles..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $Token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/test/stores" `
            -Method GET `
            -Headers $headers
        
        if ($response.success) {
            Write-Host "✅ Tiendas encontradas: $($response.data.count)" -ForegroundColor Green
            Write-Host ""
            
            foreach ($store in $response.data.stores) {
                Write-Host "  📍 $($store.name)" -ForegroundColor Cyan
                Write-Host "     ID: $($store.id)" -ForegroundColor Gray
                Write-Host "     Dueño: $($store.owner.name)" -ForegroundColor Gray
                Write-Host "     Trabajadores: $($store.workers_count)" -ForegroundColor Gray
                Write-Host ""
            }
            
            return $response.data.stores
        }
    } catch {
        Write-Host "❌ Error al obtener tiendas: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

# Función para simular una notificación
function Send-SimulatedNotification {
    param (
        [string]$Token,
        [string]$StoreId,
        [decimal]$Amount = 50.00,
        [string]$SenderName = "Juan Pérez",
        [string]$Source = "yape",
        [int]$Format = 1
    )
    
    Write-Host ""
    Write-Host "📱 Simulando notificación de $Source..." -ForegroundColor Yellow
    Write-Host "   💰 Monto: S/ $Amount" -ForegroundColor Gray
    Write-Host "   👤 De: $SenderName" -ForegroundColor Gray
    Write-Host "   📝 Formato: $Format" -ForegroundColor Gray
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        store_id = $StoreId
        amount = $Amount
        sender_name = $SenderName
        source = $Source
        format = $Format
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/test/simulate-notification" `
            -Method POST `
            -Headers $headers `
            -Body $body
        
        if ($response.success) {
            Write-Host "✅ Notificación simulada exitosamente" -ForegroundColor Green
            Write-Host "   ID: $($response.data.notification.id)" -ForegroundColor Gray
            Write-Host "   Trabajadores notificados: $($response.data.simulation.workers.notified)" -ForegroundColor Gray
            
            Write-Host ""
            Write-Host "   📩 Mensajes generados:" -ForegroundColor Cyan
            Write-Host "   Título: $($response.data.simulation.messages.title)" -ForegroundColor Gray
            Write-Host "   Texto: $($response.data.simulation.messages.text)" -ForegroundColor Gray
            Write-Host "   BigText: $($response.data.simulation.messages.bigText)" -ForegroundColor Gray
            
            return $true
        } else {
            Write-Host "❌ Error: $($response.message)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error al simular notificación: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para simular múltiples notificaciones (batch)
function Send-BatchNotifications {
    param (
        [string]$Token,
        [string]$StoreId,
        [int]$Count = 5,
        [decimal]$MinAmount = 10.00,
        [decimal]$MaxAmount = 500.00,
        [int]$DelayMs = 1000
    )
    
    Write-Host ""
    Write-Host "📊 Simulando batch de $Count notificaciones..." -ForegroundColor Yellow
    Write-Host "   💰 Rango: S/ $MinAmount - S/ $MaxAmount" -ForegroundColor Gray
    Write-Host "   ⏱️ Delay: ${DelayMs}ms entre cada una" -ForegroundColor Gray
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        store_id = $StoreId
        count = $Count
        min_amount = $MinAmount
        max_amount = $MaxAmount
        sources = @("yape", "plin")
        delay_ms = $DelayMs
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/test/simulate-batch" `
            -Method POST `
            -Headers $headers `
            -Body $body
        
        if ($response.success) {
            Write-Host "✅ Batch iniciado" -ForegroundColor Green
            Write-Host "   Duración estimada: $($response.data.estimated_duration_seconds) segundos" -ForegroundColor Gray
            Write-Host "   Revisa la consola del backend para ver el progreso..." -ForegroundColor Cyan
            return $true
        } else {
            Write-Host "❌ Error: $($response.message)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error al simular batch: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# MENÚ PRINCIPAL
function Show-Menu {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "  OPCIONES DE TESTING" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "1. 🔐 Login y listar tiendas" -ForegroundColor White
    Write-Host "2. 📱 Simular 1 notificación de Yape (Formato 1)" -ForegroundColor White
    Write-Host "3. 📱 Simular 1 notificación de Plin (Formato 2)" -ForegroundColor White
    Write-Host "4. 🎲 Simular notificación aleatoria (todos los formatos)" -ForegroundColor White
    Write-Host "5. 📊 Simular 5 notificaciones (batch)" -ForegroundColor White
    Write-Host "6. 💥 Simular 20 notificaciones (stress test)" -ForegroundColor White
    Write-Host "7. 🚪 Salir" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host ""
}

# EJECUCIÓN PRINCIPAL
$token = $null
$stores = @()
$selectedStore = $null

while ($true) {
    Show-Menu
    $option = Read-Host "Selecciona una opción"
    
    switch ($option) {
        "1" {
            $token = Get-AuthToken
            if ($token) {
                $stores = Get-TestStores -Token $token
                if ($stores.Count -gt 0) {
                    $selectedStore = $stores[0].id
                    Write-Host "✅ Tienda seleccionada por defecto: $($stores[0].name)" -ForegroundColor Green
                }
            }
        }
        "2" {
            if (-not $token) {
                Write-Host "❌ Primero debes hacer login (opción 1)" -ForegroundColor Red
            } elseif (-not $selectedStore) {
                Write-Host "❌ No hay tiendas disponibles" -ForegroundColor Red
            } else {
                Send-SimulatedNotification -Token $token -StoreId $selectedStore `
                    -Amount 50.00 -SenderName "Juan Pérez" -Source "yape" -Format 1
            }
        }
        "3" {
            if (-not $token) {
                Write-Host "❌ Primero debes hacer login (opción 1)" -ForegroundColor Red
            } elseif (-not $selectedStore) {
                Write-Host "❌ No hay tiendas disponibles" -ForegroundColor Red
            } else {
                Send-SimulatedNotification -Token $token -StoreId $selectedStore `
                    -Amount 75.50 -SenderName "María García" -Source "plin" -Format 2
            }
        }
        "4" {
            if (-not $token) {
                Write-Host "❌ Primero debes hacer login (opción 1)" -ForegroundColor Red
            } elseif (-not $selectedStore) {
                Write-Host "❌ No hay tiendas disponibles" -ForegroundColor Red
            } else {
                $randomAmount = [decimal](Get-Random -Minimum 10 -Maximum 500)
                $names = @("Juan", "María", "Carlos", "Ana", "José", "Carmen", "Luis", "Rosa")
                $randomName = $names[(Get-Random -Maximum $names.Count)]
                $randomSource = @("yape", "plin")[(Get-Random -Maximum 2)]
                $randomFormat = Get-Random -Minimum 1 -Maximum 5
                
                Send-SimulatedNotification -Token $token -StoreId $selectedStore `
                    -Amount $randomAmount -SenderName "$randomName Pérez" `
                    -Source $randomSource -Format $randomFormat
            }
        }
        "5" {
            if (-not $token) {
                Write-Host "❌ Primero debes hacer login (opción 1)" -ForegroundColor Red
            } elseif (-not $selectedStore) {
                Write-Host "❌ No hay tiendas disponibles" -ForegroundColor Red
            } else {
                Send-BatchNotifications -Token $token -StoreId $selectedStore `
                    -Count 5 -MinAmount 10.00 -MaxAmount 200.00 -DelayMs 1000
            }
        }
        "6" {
            if (-not $token) {
                Write-Host "❌ Primero debes hacer login (opción 1)" -ForegroundColor Red
            } elseif (-not $selectedStore) {
                Write-Host "❌ No hay tiendas disponibles" -ForegroundColor Red
            } else {
                Write-Host "⚠️ Esto creará 20 notificaciones. ¿Continuar? (s/n)" -ForegroundColor Yellow
                $confirm = Read-Host
                if ($confirm -eq "s") {
                    Send-BatchNotifications -Token $token -StoreId $selectedStore `
                        -Count 20 -MinAmount 5.00 -MaxAmount 500.00 -DelayMs 500
                }
            }
        }
        "7" {
            Write-Host ""
            Write-Host "👋 ¡Hasta luego!" -ForegroundColor Cyan
            exit
        }
        default {
            Write-Host "❌ Opción inválida" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Presiona Enter para continuar..." -ForegroundColor DarkGray
    Read-Host
    Clear-Host
    Write-Host "🧪 YAPE PRO - Testing de Notificaciones Simuladas" -ForegroundColor Cyan
    Write-Host "=" -NoNewline; Write-Host ("=" * 50) -ForegroundColor DarkGray
}
