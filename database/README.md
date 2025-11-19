# Configuración de Base de Datos MySQL

Este documento explica cómo configurar la base de datos MySQL para el proyecto de consumo de la API SOAP del Banco de Guatemala.

## Prerrequisitos

1. **MySQL Server 8.0+** instalado y funcionando
2. **MySQL Workbench** (opcional, para administración gráfica)
3. Acceso administrativo a MySQL

## Configuración Inicial

### 1. Crear Usuario y Base de Datos

```sql
-- Conectarse como root
mysql -u root -p

-- Crear base de datos
CREATE DATABASE api_banguat_tipocambio 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico para la aplicación (recomendado)
CREATE USER 'banguat_user'@'localhost' IDENTIFIED BY 'banguat_password_2025';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON api_banguat_tipocambio.* TO 'banguat_user'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'banguat_user';
```

### 2. Ejecutar Script de Creación

```bash
# Opción 1: Desde línea de comandos
mysql -u banguat_user -p api_banguat_tipocambio < database/create_database.sql

# Opción 2: Desde MySQL Workbench
# 1. Abrir MySQL Workbench
# 2. Conectarse a la instancia MySQL
# 3. Seleccionar la base de datos api_banguat_tipocambio
# 4. Abrir el archivo create_database.sql
# 5. Ejecutar el script completo
```

### 3. Configurar Variables de Entorno

Editar el archivo `backend/.env`:

```env
# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=api_banguat_tipocambio
DB_USER=banguat_user
DB_PASSWORD=banguat_password_2025
DB_CHARSET=utf8mb4

# O usar conexión como root (no recomendado para producción)
# DB_USER=root
# DB_PASSWORD=tu_password_root
```

## Estructura de la Base de Datos

### Tablas Principales

1. **monedas**: Catálogo de monedas disponibles
2. **tipos_cambio_historico**: Histórico de tipos de cambio
3. **cambio_dolar_referencia**: Referencias específicas del dólar
4. **log_consultas_api**: Auditoría de consultas a la API

### Vistas

1. **v_tipos_cambio_actual**: Tipos de cambio más recientes
2. **v_cambio_dolar_actual**: Referencia actual del dólar

### Procedimientos Almacenados

1. **sp_insertar_tipo_cambio**: Insertar/actualizar tipos de cambio
2. **sp_insertar_cambio_dolar**: Insertar referencias del dólar
3. **sp_log_consulta_api**: Registrar logs de consultas

## Verificación de la Instalación

### 1. Test desde Backend

```bash
# Iniciar el backend
cd backend
npm run dev

# Verificar conexión
curl http://localhost:3001/api/test/database
```

### 2. Test Directo en MySQL

```sql
-- Verificar estructura
USE api_banguat_tipocambio;
SHOW TABLES;

-- Verificar datos iniciales
SELECT * FROM monedas;

-- Probar vistas
SELECT * FROM v_tipos_cambio_actual;

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'api_banguat_tipocambio';
```

## Comandos Útiles de Mantenimiento

### Backup de la Base de Datos

```bash
# Backup completo
mysqldump -u banguat_user -p api_banguat_tipocambio > backup_banguat_$(date +%Y%m%d).sql

# Backup solo estructura
mysqldump -u banguat_user -p --no-data api_banguat_tipocambio > estructura_banguat.sql

# Backup solo datos
mysqldump -u banguat_user -p --no-create-info api_banguat_tipocambio > datos_banguat.sql
```

### Restauración

```bash
# Restaurar desde backup
mysql -u banguat_user -p api_banguat_tipocambio < backup_banguat_20251118.sql
```

### Consultas de Monitoreo

```sql
-- Ver última actualización de datos
SELECT MAX(fecha_consulta) as ultima_actualizacion 
FROM tipos_cambio_historico 
WHERE activo = TRUE;

-- Estadísticas de consultas API
SELECT 
    DATE(fecha_consulta) as fecha,
    COUNT(*) as total_consultas,
    AVG(tiempo_respuesta_ms) as tiempo_promedio_ms,
    SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as exitosas,
    SUM(CASE WHEN status_code != 200 THEN 1 ELSE 0 END) as con_error
FROM log_consultas_api 
WHERE fecha_consulta >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(fecha_consulta)
ORDER BY fecha DESC;

-- Monedas con tipos de cambio disponibles
SELECT 
    m.codigo_moneda,
    m.descripcion,
    COUNT(tc.id) as registros_historicos,
    MAX(tc.fecha) as ultima_fecha
FROM monedas m
LEFT JOIN tipos_cambio_historico tc ON m.codigo_moneda = tc.moneda_id
WHERE m.activa = TRUE AND tc.activo = TRUE
GROUP BY m.codigo_moneda, m.descripcion
ORDER BY m.descripcion;
```

## Solución de Problemas Comunes

### Error de Conexión

```bash
# Verificar que MySQL esté corriendo
sudo service mysql status
# o
brew services list | grep mysql

# Verificar puerto
netstat -an | grep 3306
```

### Error de Permisos

```sql
-- Verificar permisos del usuario
SHOW GRANTS FOR 'banguat_user'@'localhost';

-- Otorgar permisos específicos si es necesario
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON api_banguat_tipocambio.* TO 'banguat_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error de Charset

```sql
-- Verificar charset de la base de datos
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'api_banguat_tipocambio';

-- Cambiar charset si es necesario
ALTER DATABASE api_banguat_tipocambio 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### Limpiar Datos de Prueba

```sql
-- Limpiar logs antiguos (mantener solo últimos 30 días)
DELETE FROM log_consultas_api 
WHERE fecha_consulta < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Limpiar tipos de cambio antiguos (mantener solo último año)
DELETE FROM tipos_cambio_historico 
WHERE fecha < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);

-- Optimizar tablas
OPTIMIZE TABLE monedas, tipos_cambio_historico, cambio_dolar_referencia, log_consultas_api;
```

## Configuración de Producción

### 1. Configuración de my.cnf

```ini
[mysqld]
# Configuraciones específicas para la aplicación
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 64M
query_cache_limit = 2M
```

### 2. Configuración de Seguridad

```sql
-- Cambiar passwords por defecto
ALTER USER 'banguat_user'@'localhost' IDENTIFIED BY 'password_seguro_produccion';

-- Configurar SSL (recomendado)
ALTER USER 'banguat_user'@'localhost' REQUIRE SSL;

-- Limitar conexiones por usuario
ALTER USER 'banguat_user'@'localhost' WITH MAX_CONNECTIONS_PER_HOUR 100;
```

### 3. Monitoreo y Logs

```sql
-- Habilitar logs de queries lentas
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Verificar logs de error
SHOW VARIABLES LIKE 'log_error';
```