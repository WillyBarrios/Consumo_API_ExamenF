@echo off
echo.
echo ===================================================
echo Ejecutando DDL para Base de Datos MariaDB
echo ===================================================
echo.

REM Cambiar al directorio del script
cd /d "c:\Dev\Consumo_API_ExamenF\database"

REM Ejecutar el script DDL
"C:\Program Files\MariaDB 12.0\bin\mysql.exe" -u root -p < create_database.sql

echo.
echo ===================================================
echo Proceso completado
echo ===================================================
echo.
pause