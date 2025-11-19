-- Eliminar y recrear usuario
DROP USER IF EXISTS 'api_user'@'localhost';

-- Crear usuario con contraseña simple
CREATE USER 'api_user'@'localhost' IDENTIFIED BY 'password123';

-- Otorgar todos los privilegios
GRANT ALL PRIVILEGES ON api_banguat_tipocambio.* TO 'api_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;