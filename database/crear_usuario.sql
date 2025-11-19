-- Script para crear usuario específico para la aplicación
-- Ejecutar desde la consola de MariaDB como administrador

-- Crear usuario específico para la aplicación
CREATE USER IF NOT EXISTS 'api_user'@'localhost' IDENTIFIED BY 'api_password_123';

-- Otorgar permisos completos en la base de datos
GRANT ALL PRIVILEGES ON api_banguat_tipocambio.* TO 'api_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que el usuario se creó
SELECT User, Host, plugin FROM mysql.user WHERE User = 'api_user';

-- Mostrar permisos del usuario
SHOW GRANTS FOR 'api_user'@'localhost';