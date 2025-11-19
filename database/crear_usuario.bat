@echo off
echo Creando usuario específico para la aplicación...
echo.
"C:\Program Files\MariaDB 12.0\bin\mysql.exe" -u root -p < crear_usuario.sql
echo.
echo Usuario creado. Ahora actualiza el archivo .env con estas credenciales:
echo DB_USER=api_user
echo DB_PASSWORD=api_password_123
echo.
pause