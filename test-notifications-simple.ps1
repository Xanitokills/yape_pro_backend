# test-notifications-simple.ps1
# Script simplificado para probar notificaciones simuladas

param(
    [string]$BaseUrl = "http://localhost:3002",
    [string]$Email = "propietario@example.com",
    [string]$Password = "password123"
)

Write-Host ""
Write-Host "🧪 YAPE PRO - Testing de Notificaciones" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host ""

# 1. LOGIN
Write-Host "🔐 Autenticando..." -ForegroundColor Yellow
$loginBody = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $token = $loginResponse.data.token
    Write-Host "✅ Login exitoso" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. OBTENER TIENDAS
Write-Host ""
Write-Host "🏪 Obteniendo tiendas..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $storesResponse = Invoke-RestMethod -Uri "$BaseUrl/api/test/stores" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $stores = $storesResponse.data.stores
    Write-Host "✅ Tiendas encontradas: $($stores.Count)" -ForegroundColor Green
    
    foreach ($store in $stores) {
        Write-Host "  📍 $($store.name) (ID: $($store.id))" -ForegroundColor Cyan
        Write-Host "     Trabajadores activos: $($store.workers_count)" -ForegroundColor Gray
    }
    
    if ($stores.Count -eq 0) {
        Write-Host "❌ No hay tiendas disponibles" -ForegroundColor Red
        exit 1
    }
    
    $selectedStore = $stores[0]
    Write-Host ""
    Write-Host "✅ Usando tienda: $($selectedStore.name)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error al obtener tiendas: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. SIMULAR NOTIFICACIÓN
Write-Host ""
Write-Host "📱 Simulando notificación de Yape..." -ForegroundColor Yellow

$notificationBody = @{
    store_id = $selectedStore.id
    amount = 50.00
    sender_name = "Juan Pérez"
    source = "yape"
    format = 1
} | ConvertTo-Json

try {
    $notifResponse = Invoke-RestMethod -Uri "$BaseUrl/api/test/simulate-notification" `
        -Method POST `
        -Headers $headers `
        -Body $notificationBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ Notificación simulada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Resultados:" -ForegroundColor Cyan
    Write-Host "  ID: $($notifResponse.data.notification.id)" -ForegroundColor Gray
    Write-Host "  Monto: S/ $($notifResponse.data.notification.amount)" -ForegroundColor Gray
    Write-Host "  De: $($notifResponse.data.notification.sender_name)" -ForegroundColor Gray
    Write-Host "  Trabajadores notificados: $($notifResponse.data.notification.workers_notified)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📩 Mensajes generados:" -ForegroundColor Cyan
    Write-Host "  Título: $($notifResponse.data.simulation.messages.title)" -ForegroundColor Gray
    Write-Host "  Texto: $($notifResponse.data.simulation.messages.text)" -ForegroundColor Gray
    Write-Host "  BigText: $($notifResponse.data.simulation.messages.bigText)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error al simular notificación: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Prueba completada exitosamente" -ForegroundColor Green
Write-Host ""
