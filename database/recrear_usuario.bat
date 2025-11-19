@echo off
echo Recreando usuario para la aplicación...
echo.
"C:\Program Files\MariaDB 12.0\bin\mysql.exe" -u root -p < recrear_usuario.sql
echo.
echo Usuario recreado. Las credenciales son:
echo DB_USER=api_user
echo DB_PASSWORD=password123
echo.
pause