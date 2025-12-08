# Test Dashboard Endpoints
# Este script prueba los nuevos endpoints del dashboard

$API_URL = "http://localhost:3000/api"

Write-Host "=== TEST DASHBOARD ENDPOINTS ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login para obtener el token
Write-Host "1. Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "test123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✓ Login exitoso" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Headers con autenticación
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Obtener estadísticas del dashboard
Write-Host "2. Obtener estadísticas del dashboard..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri "$API_URL/dashboard/stats" -Method Get -Headers $headers
    Write-Host "✓ Estadísticas obtenidas" -ForegroundColor Green
    Write-Host ($statsResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "✗ Error al obtener estadísticas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Obtener transacciones recientes
Write-Host "3. Obtener transacciones recientes..." -ForegroundColor Yellow
try {
    $transactionsResponse = Invoke-RestMethod -Uri "$API_URL/dashboard/recent-transactions?limit=5" -Method Get -Headers $headers
    Write-Host "✓ Transacciones obtenidas" -ForegroundColor Green
    Write-Host ($transactionsResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "✗ Error al obtener transacciones: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Obtener datos del gráfico semanal
Write-Host "4. Obtener datos del gráfico semanal..." -ForegroundColor Yellow
try {
    $chartResponse = Invoke-RestMethod -Uri "$API_URL/dashboard/weekly-chart" -Method Get -Headers $headers
    Write-Host "✓ Datos del gráfico obtenidos" -ForegroundColor Green
    Write-Host ($chartResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "✗ Error al obtener datos del gráfico: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIN DE LAS PRUEBAS ===" -ForegroundColor Cyan
