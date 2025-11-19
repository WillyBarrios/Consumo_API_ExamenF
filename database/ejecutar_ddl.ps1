# Script para ejecutar DDL en MariaDB
# Autor: Asistente de Copilot
# Fecha: $(Get-Date)

Write-Host "====================================================" -ForegroundColor Green
Write-Host "Ejecutando DDL para Base de Datos MariaDB" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

# Rutas
$mariadbPath = "C:\Program Files\MariaDB 12.0\bin\mysql.exe"
$ddlFile = "c:\Dev\Consumo_API_ExamenF\database\create_database.sql"

# Verificar que los archivos existen
if (-not (Test-Path $mariadbPath)) {
    Write-Host "ERROR: No se encontró MariaDB en: $mariadbPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ddlFile)) {
    Write-Host "ERROR: No se encontró el archivo DDL en: $ddlFile" -ForegroundColor Red
    exit 1
}

Write-Host "MariaDB encontrado: $mariadbPath" -ForegroundColor Yellow
Write-Host "Archivo DDL: $ddlFile" -ForegroundColor Yellow
Write-Host ""

# Solicitar credenciales
$usuario = Read-Host "Ingrese el usuario de MariaDB (por defecto: root)"
if ([string]::IsNullOrEmpty($usuario)) {
    $usuario = "root"
}

Write-Host ""
Write-Host "Ejecutando script DDL..." -ForegroundColor Cyan
Write-Host "Nota: Se te solicitará la contraseña de MariaDB" -ForegroundColor Cyan
Write-Host ""

try {
    # Cambiar al directorio de la base de datos
    Set-Location "c:\Dev\Consumo_API_ExamenF\database"
    
    # Ejecutar el script usando Get-Content
    $ddlContent = Get-Content $ddlFile -Raw
    $ddlContent | & $mariadbPath -u $usuario -p
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "====================================================" -ForegroundColor Green
        Write-Host "✓ Base de datos creada exitosamente!" -ForegroundColor Green
        Write-Host "====================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos pasos:" -ForegroundColor Cyan
        Write-Host "1. Verificar la conexión desde tu aplicación Node.js" -ForegroundColor White
        Write-Host "2. Actualizar las credenciales en el archivo .env" -ForegroundColor White
        Write-Host "3. Probar los endpoints de la API" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "ERROR: Hubo un problema ejecutando el DDL" -ForegroundColor Red
        Write-Host "Código de salida: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')