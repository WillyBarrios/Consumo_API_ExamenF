# Script para verificar la base de datos creada
# Autor: Asistente de Copilot

Write-Host "====================================================" -ForegroundColor Blue
Write-Host "Verificando Base de Datos MariaDB" -ForegroundColor Blue
Write-Host "====================================================" -ForegroundColor Blue
Write-Host ""

$mariadbPath = "C:\Program Files\MariaDB 12.0\bin\mysql.exe"

# Consultas de verificación
$consultas = @"
-- Verificar que la base de datos existe
SHOW DATABASES LIKE 'api_banguat_tipocambio';

-- Usar la base de datos
USE api_banguat_tipocambio;

-- Verificar tablas creadas
SHOW TABLES;

-- Verificar estructura de tabla principal
DESCRIBE tipos_cambio_historico;

-- Verificar datos iniciales en monedas
SELECT * FROM monedas LIMIT 5;

-- Verificar vistas creadas
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Verificar procedimientos almacenados
SHOW PROCEDURE STATUS WHERE Db = 'api_banguat_tipocambio';

-- Verificar funciones
SHOW FUNCTION STATUS WHERE Db = 'api_banguat_tipocambio';
"@

# Guardar consultas en archivo temporal
$tempFile = "c:\Dev\Consumo_API_ExamenF\database\verificacion_temp.sql"
$consultas | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "Ejecutando verificaciones..." -ForegroundColor Cyan
Write-Host ""

try {
    $usuario = Read-Host "Usuario de MariaDB (por defecto: root)"
    if ([string]::IsNullOrEmpty($usuario)) {
        $usuario = "root"
    }

    & $mariadbPath -u $usuario -p < $tempFile
    
    # Limpiar archivo temporal
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "Verificación completada" -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

Write-Host ""
Read-Host "Presiona Enter para continuar"