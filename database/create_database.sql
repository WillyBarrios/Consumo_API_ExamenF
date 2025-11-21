-- =============================================
-- Script de creación de Base de Datos
-- API SOAP - Banco de Guatemala
-- Tipos de Cambio de Monedas
-- =============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS `api_banguat_tipocambio` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `api_banguat_tipocambio`;

-- =============================================
-- Tabla: monedas
-- Almacena las monedas disponibles
-- =============================================
CREATE TABLE `monedas` (
    `id` INT PRIMARY KEY,
    `codigo_moneda` INT NOT NULL,
    `descripcion` VARCHAR(100) NOT NULL,
    `simbolo` VARCHAR(10) NULL,
    `activa` BOOLEAN DEFAULT TRUE,
    `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY `uk_monedas_codigo` (`codigo_moneda`),
    INDEX `idx_monedas_activa` (`activa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Catálogo de monedas disponibles en el sistema';

-- =============================================
-- Tabla: tipos_cambio_historico
-- Almacena el historial de tipos de cambio
-- =============================================
CREATE TABLE `tipos_cambio_historico` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `moneda_id` INT NOT NULL,
    `fecha` DATE NOT NULL,
    `tipo_compra` DECIMAL(10,6) NULL,
    `tipo_venta` DECIMAL(10,6) NULL,
    `tipo_referencia` DECIMAL(10,6) NULL,
    `fecha_consulta` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `activo` BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY `fk_cambio_moneda` (`moneda_id`) REFERENCES `monedas`(`codigo_moneda`) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `uk_cambio_moneda_fecha` (`moneda_id`, `fecha`),
    INDEX `idx_cambio_fecha` (`fecha`),
    INDEX `idx_cambio_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Histórico de tipos de cambio por moneda y fecha';

-- =============================================
-- Tabla: cambio_dolar_referencia
-- Almacena específicamente las referencias del dólar
-- =============================================
CREATE TABLE `cambio_dolar_referencia` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `fecha` DATE NOT NULL,
    `referencia` DECIMAL(10,6) NOT NULL,
    `fecha_consulta` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `activo` BOOLEAN DEFAULT TRUE,
    
    UNIQUE KEY `uk_dolar_fecha` (`fecha`),
    INDEX `idx_dolar_fecha` (`fecha`),
    INDEX `idx_dolar_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Referencias específicas del tipo de cambio del dólar';

-- =============================================
-- Tabla: log_consultas_api
-- Log de consultas realizadas a la API
-- =============================================
CREATE TABLE `log_consultas_api` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `endpoint` VARCHAR(200) NOT NULL,
    `metodo` ENUM('GET', 'POST', 'PUT', 'DELETE') DEFAULT 'POST',
    `fecha_consulta` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status_code` INT NULL,
    `tiempo_respuesta_ms` INT NULL,
    `total_registros` INT NULL,
    `error_mensaje` TEXT NULL,
    `usuario_ip` VARCHAR(45) NULL,
    
    INDEX `idx_log_fecha` (`fecha_consulta`),
    INDEX `idx_log_endpoint` (`endpoint`),
    INDEX `idx_log_status` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Log de consultas realizadas a la API SOAP';

-- =============================================
-- Vista: v_tipos_cambio_actual
-- Vista con los tipos de cambio más recientes
-- =============================================
CREATE VIEW `v_tipos_cambio_actual` AS
SELECT 
    m.codigo_moneda,
    m.descripcion as moneda_descripcion,
    m.simbolo,
    tc.fecha,
    tc.tipo_compra,
    tc.tipo_venta,
    tc.tipo_referencia,
    tc.fecha_consulta
FROM tipos_cambio_historico tc
INNER JOIN monedas m ON tc.moneda_id = m.codigo_moneda
WHERE tc.fecha = (
    SELECT MAX(fecha) 
    FROM tipos_cambio_historico tc2 
    WHERE tc2.moneda_id = tc.moneda_id 
    AND tc2.activo = TRUE
)
AND tc.activo = TRUE
AND m.activa = TRUE
ORDER BY m.descripcion;

-- =============================================
-- Vista: v_cambio_dolar_actual
-- Vista con la referencia actual del dólar
-- =============================================
CREATE VIEW `v_cambio_dolar_actual` AS
SELECT 
    fecha,
    referencia,
    fecha_consulta
FROM cambio_dolar_referencia
WHERE fecha = (SELECT MAX(fecha) FROM cambio_dolar_referencia WHERE activo = TRUE)
AND activo = TRUE;

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar monedas comunes (basado en códigos ISO y Banguat)
INSERT INTO `monedas` (`id`, `codigo_moneda`, `descripcion`, `simbolo`) VALUES
(1, 1, 'Quetzal Guatemalteco', 'Q'),
(2, 2, 'Dólar Estadounidense', '$'),
(3, 3, 'Euro', '€'),
(4, 4, 'Libra Esterlina', '£'),
(5, 5, 'Yen Japonés', '¥'),
(6, 6, 'Won Surcoreano', '₩'),
(7, 7, 'Yuan Chino', '¥'),
(8, 8, 'Peso Mexicano', '$'),
(9, 9, 'Real Brasileño', 'R$'),
(10, 10, 'Peso Argentino', '$');

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

-- Procedimiento para insertar/actualizar tipo de cambio
DELIMITER //
CREATE PROCEDURE sp_insertar_tipo_cambio(
    IN p_moneda_id INT,
    IN p_fecha DATE,
    IN p_tipo_compra DECIMAL(10,6),
    IN p_tipo_venta DECIMAL(10,6),
    IN p_tipo_referencia DECIMAL(10,6)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    INSERT INTO tipos_cambio_historico 
        (moneda_id, fecha, tipo_compra, tipo_venta, tipo_referencia)
    VALUES 
        (p_moneda_id, p_fecha, p_tipo_compra, p_tipo_venta, p_tipo_referencia)
    ON DUPLICATE KEY UPDATE
        tipo_compra = VALUES(tipo_compra),
        tipo_venta = VALUES(tipo_venta),
        tipo_referencia = VALUES(tipo_referencia),
        fecha_consulta = CURRENT_TIMESTAMP;
    
    COMMIT;
END //

-- Procedimiento para insertar referencia del dólar
CREATE PROCEDURE sp_insertar_cambio_dolar(
    IN p_fecha DATE,
    IN p_referencia DECIMAL(10,6)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    INSERT INTO cambio_dolar_referencia 
        (fecha, referencia)
    VALUES 
        (p_fecha, p_referencia)
    ON DUPLICATE KEY UPDATE
        referencia = VALUES(referencia),
        fecha_consulta = CURRENT_TIMESTAMP;
    
    COMMIT;
END //

-- Procedimiento para registrar log de consulta
CREATE PROCEDURE sp_log_consulta_api(
    IN p_endpoint VARCHAR(200),
    IN p_metodo VARCHAR(10),
    IN p_status_code INT,
    IN p_tiempo_respuesta INT,
    IN p_total_registros INT,
    IN p_error_mensaje TEXT,
    IN p_usuario_ip VARCHAR(45)
)
BEGIN
    INSERT INTO log_consultas_api 
        (endpoint, metodo, status_code, tiempo_respuesta_ms, total_registros, error_mensaje, usuario_ip)
    VALUES 
        (p_endpoint, p_metodo, p_status_code, p_tiempo_respuesta, p_total_registros, p_error_mensaje, p_usuario_ip);
END //

DELIMITER ;

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Función para obtener el tipo de cambio más reciente de una moneda
DELIMITER //
CREATE FUNCTION fn_obtener_tipo_cambio_actual(p_moneda_id INT, p_tipo ENUM('compra', 'venta', 'referencia'))
RETURNS DECIMAL(10,6)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_tipo DECIMAL(10,6) DEFAULT 0;
    
    SELECT 
        CASE p_tipo
            WHEN 'compra' THEN tipo_compra
            WHEN 'venta' THEN tipo_venta
            WHEN 'referencia' THEN tipo_referencia
        END INTO v_tipo
    FROM tipos_cambio_historico
    WHERE moneda_id = p_moneda_id
    AND activo = TRUE
    ORDER BY fecha DESC, fecha_consulta DESC
    LIMIT 1;
    
    RETURN COALESCE(v_tipo, 0);
END //
DELIMITER ;

-- =============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- =============================================

-- Índice compuesto para consultas frecuentes
CREATE INDEX `idx_cambio_moneda_fecha_activo` 
ON `tipos_cambio_historico` (`moneda_id`, `fecha`, `activo`);

-- Índice para consultas por rango de fechas
CREATE INDEX `idx_cambio_fecha_consulta` 
ON `tipos_cambio_historico` (`fecha_consulta`);

-- =============================================
-- TRIGGERS PARA AUDITORÍA
-- =============================================

-- Trigger para mantener histórico en actualizaciones
DELIMITER //
CREATE TRIGGER tr_tipos_cambio_backup
BEFORE UPDATE ON tipos_cambio_historico
FOR EACH ROW
BEGIN
    -- Si se está desactivando un registro, no hacer nada especial
    IF NEW.activo = FALSE AND OLD.activo = TRUE THEN
        SET NEW.fecha_consulta = CURRENT_TIMESTAMP;
    END IF;
END //
DELIMITER ;

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

/*
NOTAS IMPORTANTES:

1. Esta base de datos está diseñada para almacenar datos de la API SOAP del Banco de Guatemala
2. Soporta múltiples monedas y mantiene histórico completo
3. Incluye logging de consultas para auditoría
4. Las tablas están optimizadas para consultas frecuentes
5. Los procedimientos almacenados facilitan las operaciones CRUD
6. Las vistas simplifican las consultas más comunes

ENDPOINTS SOAP A CONSUMIR:
- TipoCambioDia: www.banguat.gob.gt/variables/ws/tipocambio.asmx
- Método: TipoCambioDia
- Retorna: XML con tipos de cambio del día

ESTRUCTURA DE RESPUESTA XML:
- Variables: Catálogo de monedas
- CambioDia: Tipos de cambio (compra/venta)
- CambioDolar: Referencias específicas del dólar
- TotalItems: Número total de registros

USO RECOMENDADO:
1. Ejecutar este script para crear la BD
2. Configurar el backend Node.js para consumir SOAP
3. Procesar XML y almacenar en estas tablas
4. Usar las vistas para consultas del frontend
*/

-- =============================================
-- FIN DEL SCRIPT
-- =============================================