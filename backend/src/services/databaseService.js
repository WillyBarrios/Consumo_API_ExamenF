const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseService {
  constructor() {
    this.pool = null;
    this.initializePool();
  }

  initializePool() {
    try {
      // Debug: mostrar configuración de conexión
      console.log('🔧 Configuración de BD:', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'api_banguat_tipocambio',
        password: process.env.DB_PASSWORD ? '***' : 'vacío'
      });

      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'api_banguat_tipocambio',
        charset: process.env.DB_CHARSET || 'utf8mb4',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        waitForConnections: true,
        idleTimeout: 60000,
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000
      });

      console.log('🗄️  Pool de conexiones MySQL inicializado');
    } catch (error) {
      console.error('❌ Error inicializando pool de base de datos:', error);
    }
  }

  async getConnection() {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('❌ Error obteniendo conexión de la BD:', error);
      throw error;
    }
  }

  async executeQuery(query, params = []) {
    let connection = null;
    try {
      connection = await this.getConnection();
      const [results] = await connection.execute(query, params);
      return results;
    } catch (error) {
      console.error('❌ Error ejecutando consulta:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async executeTransaction(queries) {
    let connection = null;
    try {
      connection = await this.getConnection();
      await connection.beginTransaction();

      const results = [];
      for (const { query, params = [] } of queries) {
        const [result] = await connection.execute(query, params);
        results.push(result);
      }

      await connection.commit();
      return results;
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('❌ Error en transacción:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  // Métodos específicos para las tablas
  async insertarMoneda(codigoMoneda, descripcion, simbolo = null) {
    const query = `
      INSERT INTO monedas (codigo_moneda, descripcion, simbolo)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        descripcion = VALUES(descripcion),
        simbolo = VALUES(simbolo),
        fecha_actualizacion = CURRENT_TIMESTAMP
    `;
    return await this.executeQuery(query, [codigoMoneda, descripcion, simbolo]);
  }

  async insertarTipoCambio(monedaId, fecha, tipoCompra, tipoVenta, tipoReferencia) {
    const query = `
      CALL sp_insertar_tipo_cambio(?, ?, ?, ?, ?)
    `;
    return await this.executeQuery(query, [monedaId, fecha, tipoCompra, tipoVenta, tipoReferencia]);
  }

  async insertarCambioDolar(fecha, referencia) {
    const query = `
      CALL sp_insertar_cambio_dolar(?, ?)
    `;
    return await this.executeQuery(query, [fecha, referencia]);
  }

  async obtenerTiposCambioActuales() {
    const query = `
      SELECT 
        codigo_moneda,
        moneda_descripcion,
        simbolo,
        fecha,
        tipo_compra,
        tipo_venta,
        tipo_referencia,
        fecha_consulta
      FROM v_tipos_cambio_actual
      ORDER BY moneda_descripcion
    `;
    return await this.executeQuery(query);
  }

  async obtenerHistorialTipoCambio(monedaId, fechaInicio = null, fechaFin = null) {
    let query = `
      SELECT 
        tc.fecha,
        tc.tipo_compra,
        tc.tipo_venta,
        tc.tipo_referencia,
        tc.fecha_consulta,
        m.descripcion as moneda_descripcion,
        m.simbolo
      FROM tipos_cambio_historico tc
      INNER JOIN monedas m ON tc.moneda_id = m.codigo_moneda
      WHERE tc.moneda_id = ? AND tc.activo = TRUE
    `;
    
    const params = [monedaId];
    
    if (fechaInicio) {
      query += ' AND tc.fecha >= ?';
      params.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ' AND tc.fecha <= ?';
      params.push(fechaFin);
    }
    
    query += ' ORDER BY tc.fecha DESC';
    
    return await this.executeQuery(query, params);
  }

  async obtenerCambioDolarActual() {
    const query = `
      SELECT fecha, referencia, fecha_consulta
      FROM v_cambio_dolar_actual
    `;
    return await this.executeQuery(query);
  }

  async obtenerMonedas() {
    const query = `
      SELECT codigo_moneda, descripcion, simbolo, activa
      FROM monedas
      WHERE activa = TRUE
      ORDER BY descripcion
    `;
    return await this.executeQuery(query);
  }

  async registrarLogConsulta(endpoint, metodo, statusCode, tiempoRespuesta, totalRegistros, errorMensaje = null, usuarioIp = null) {
    const query = `
      CALL sp_log_consulta_api(?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.executeQuery(query, [endpoint, metodo, statusCode, tiempoRespuesta, totalRegistros, errorMensaje, usuarioIp]);
  }

  async testConnection() {
    try {
      const [rows] = await this.pool.execute('SELECT 1 as test');
      console.log('✅ Conexión a la base de datos exitosa');
      return true;
    } catch (error) {
      console.error('❌ Error probando conexión a la BD:', error.message);
      return false;
    }
  }

  async closePool() {
    try {
      if (this.pool) {
        await this.pool.end();
        console.log('🔐 Pool de conexiones cerrado');
      }
    } catch (error) {
      console.error('❌ Error cerrando pool de conexiones:', error);
    }
  }
}

module.exports = new DatabaseService();