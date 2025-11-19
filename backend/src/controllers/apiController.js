const banguatSoapService = require('../services/apiService');
const databaseService = require('../services/databaseService');

class BanguatController {
  // Obtener tipos de cambio actuales desde la BD
  async getTiposCambioActuales(req, res) {
    try {
      const tiposCambio = await databaseService.obtenerTiposCambioActuales();
      
      if (tiposCambio.length === 0) {
        // Si no hay datos en la BD, devolver datos simulados
        const datosSimulados = [
          {
            codigo_moneda: 2,
            moneda_descripcion: 'Dólar Estadounidense',
            simbolo: '$',
            fecha: new Date().toISOString().split('T')[0],
            tipo_compra: null,
            tipo_venta: null,
            tipo_referencia: 7.75,
            fecha_consulta: new Date().toISOString()
          },
          {
            codigo_moneda: 3,
            moneda_descripcion: 'Euro',
            simbolo: '€',
            fecha: new Date().toISOString().split('T')[0],
            tipo_compra: null,
            tipo_venta: null,
            tipo_referencia: 8.45,
            fecha_consulta: new Date().toISOString()
          },
          {
            codigo_moneda: 4,
            moneda_descripcion: 'Libra Esterlina',
            simbolo: '£',
            fecha: new Date().toISOString().split('T')[0],
            tipo_compra: null,
            tipo_venta: null,
            tipo_referencia: 9.85,
            fecha_consulta: new Date().toISOString()
          }
        ];
        
        return res.json({
          success: true,
          data: datosSimulados,
          timestamp: new Date().toISOString(),
          source: 'simulated',
          message: 'Datos simulados (sin datos reales en BD)'
        });
      }

      res.json({
        success: true,
        data: tiposCambio,
        timestamp: new Date().toISOString(),
        source: 'database'
      });
    } catch (error) {
      console.error('Error en getTiposCambioActuales:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener tipos de cambio actuales',
        message: error.message
      });
    }
  }

  // Obtener solo las monedas disponibles
  async getMonedas(req, res) {
    try {
      const monedas = await databaseService.obtenerMonedas();
      res.json({
        success: true,
        data: monedas,
        count: monedas.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener monedas',
        message: error.message
      });
    }
  }

  // Obtener tipos de cambio de una moneda específica
  async getTipoCambioMoneda(req, res) {
    try {
      const { monedaId } = req.params;
      const { fechaInicio, fechaFin } = req.query;
      
      if (!monedaId || isNaN(parseInt(monedaId))) {
        return res.status(400).json({
          success: false,
          error: 'ID de moneda inválido'
        });
      }

      const historial = await banguatSoapService.obtenerHistorialMoneda(
        parseInt(monedaId),
        fechaInicio,
        fechaFin
      );

      res.json(historial);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener historial de tipo de cambio',
        message: error.message
      });
    }
  }

  // Obtener cambio del dólar actual
  async getCambioDolar(req, res) {
    try {
      const cambioDolar = await databaseService.obtenerCambioDolarActual();
      
      if (cambioDolar.length === 0) {
        // Si no hay datos en la BD, devolver datos simulados
        const fechaActual = new Date().toISOString().split('T')[0];
        const datosDolar = {
          fecha: fechaActual,
          referencia: 7.75, // Tipo de cambio típico del quetzal
          fecha_consulta: new Date().toISOString()
        };
        
        return res.json({
          success: true,
          data: [datosDolar],
          message: 'Datos simulados (sin datos reales en BD)'
        });
      }

      res.json({
        success: true,
        data: cambioDolar
      });
    } catch (error) {
      console.error('Error en getCambioDolar:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener cambio del dólar',
        message: error.message
      });
    }
  }

  // Forzar actualización de datos desde la API SOAP
  async actualizarDatos(req, res) {
    try {
      console.log('🔄 Iniciando actualización forzada de datos...');
      const datos = await banguatSoapService.actualizarDatos();
      
      res.json({
        success: true,
        message: 'Datos actualizados correctamente desde la API SOAP',
        data: datos,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error en actualización forzada:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar datos desde la API SOAP',
        message: error.message
      });
    }
  }

  // Endpoint para test del servicio SOAP
  async testSoapService(req, res) {
    try {
      const testResult = await banguatSoapService.testService();
      
      res.json({
        success: testResult.status === 'ok',
        ...testResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error probando servicio SOAP',
        message: error.message
      });
    }
  }

  // Obtener estadísticas generales
  async getEstadisticas(req, res) {
    try {
      const [monedas, tiposCambio, logs] = await Promise.all([
        databaseService.executeQuery('SELECT COUNT(*) as total FROM monedas WHERE activa = TRUE'),
        databaseService.executeQuery('SELECT COUNT(*) as total FROM tipos_cambio_historico WHERE activo = TRUE'),
        databaseService.executeQuery(`
          SELECT 
            COUNT(*) as total_consultas,
            AVG(tiempo_respuesta_ms) as tiempo_promedio,
            MAX(fecha_consulta) as ultima_consulta
          FROM log_consultas_api 
          WHERE DATE(fecha_consulta) = CURDATE()
        `)
      ]);

      const ultimaActualizacion = await databaseService.executeQuery(`
        SELECT MAX(fecha_consulta) as ultima_actualizacion
        FROM tipos_cambio_historico
        WHERE activo = TRUE
      `);

      res.json({
        success: true,
        data: {
          totalMonedas: monedas[0]?.total || 10,
          totalRegistros: tiposCambio[0]?.total || 0,
          consultasHoy: logs[0]?.total_consultas || 0,
          tiempoPromedioMs: Math.round(logs[0]?.tiempo_promedio || 0),
          ultimaConsulta: logs[0]?.ultima_consulta || null,
          ultimaActualizacion: ultimaActualizacion[0]?.ultima_actualizacion || null
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas',
        message: error.message
      });
    }
  }

  // Test de conexión a base de datos
  async testDatabase(req, res) {
    try {
      const isConnected = await databaseService.testConnection();
      
      res.json({
        success: isConnected,
        message: isConnected ? 'Conexión a base de datos exitosa' : 'Error en conexión a base de datos',
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error probando conexión a base de datos',
        message: error.message
      });
    }
  }

  // Método para compatibilidad con el frontend existente (usuarios)
  async getUsers(req, res) {
    try {
      // Devolver las monedas como "usuarios" para mantener compatibilidad
      const monedas = await databaseService.obtenerMonedas();
      
      const usuariosCompatibles = monedas.map(moneda => ({
        id: moneda.codigo_moneda,
        name: moneda.descripcion,
        username: `moneda_${moneda.codigo_moneda}`,
        email: `${moneda.descripcion.toLowerCase().replace(/\s+/g, '')}@banguat.gt`,
        phone: `+502-${moneda.codigo_moneda}000-0000`,
        website: 'www.banguat.gob.gt',
        company: { name: 'Banco de Guatemala' },
        address: { city: 'Guatemala' }
      }));

      res.json({
        success: true,
        data: usuariosCompatibles,
        count: usuariosCompatibles.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener datos (monedas)',
        message: error.message
      });
    }
  }

  // Método para compatibilidad con el frontend existente (posts)
  async getPosts(req, res) {
    try {
      // Devolver los tipos de cambio como "posts" para mantener compatibilidad
      const tiposCambio = await databaseService.obtenerTiposCambioActuales();
      
      const postsCompatibles = tiposCambio.map(cambio => ({
        id: cambio.codigo_moneda,
        userId: cambio.codigo_moneda,
        title: `Tipo de Cambio ${cambio.moneda_descripcion}`,
        body: `Compra: ${cambio.simbolo}${cambio.tipo_compra || 'N/A'} - Venta: ${cambio.simbolo}${cambio.tipo_venta || 'N/A'} - Fecha: ${cambio.fecha}`
      }));

      res.json({
        success: true,
        data: postsCompatibles,
        count: postsCompatibles.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener tipos de cambio (posts)',
        message: error.message
      });
    }
  }

  // Métodos adicionales para compatibilidad
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const monedas = await databaseService.obtenerMonedas();
      const moneda = monedas.find(m => m.codigo_moneda === parseInt(id));
      
      if (!moneda) {
        return res.status(404).json({
          success: false,
          error: 'Moneda no encontrada'
        });
      }

      const usuarioCompatible = {
        id: moneda.codigo_moneda,
        name: moneda.descripcion,
        username: `moneda_${moneda.codigo_moneda}`,
        email: `${moneda.descripcion.toLowerCase().replace(/\s+/g, '')}@banguat.gt`,
        phone: `+502-${moneda.codigo_moneda}000-0000`,
        website: 'www.banguat.gob.gt',
        company: { name: 'Banco de Guatemala' },
        address: { city: 'Guatemala' }
      };

      res.json({
        success: true,
        data: usuarioCompatible
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener moneda por ID',
        message: error.message
      });
    }
  }

  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const tiposCambio = await databaseService.obtenerTiposCambioActuales();
      const cambio = tiposCambio.find(c => c.codigo_moneda === parseInt(id));
      
      if (!cambio) {
        return res.status(404).json({
          success: false,
          error: 'Tipo de cambio no encontrado'
        });
      }

      const postCompatible = {
        id: cambio.codigo_moneda,
        userId: cambio.codigo_moneda,
        title: `Tipo de Cambio ${cambio.moneda_descripcion}`,
        body: `Compra: ${cambio.simbolo}${cambio.tipo_compra || 'N/A'} - Venta: ${cambio.simbolo}${cambio.tipo_venta || 'N/A'} - Fecha: ${cambio.fecha}`
      };

      res.json({
        success: true,
        data: postCompatible
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener tipo de cambio por ID',
        message: error.message
      });
    }
  }

  async getUserPosts(req, res) {
    try {
      const { id } = req.params;
      const historial = await banguatSoapService.obtenerHistorialMoneda(parseInt(id));
      
      res.json({
        success: true,
        data: {
          user: { id: parseInt(id), name: `Moneda ${id}` },
          posts: historial.data || [],
          postsCount: historial.count || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener historial de la moneda',
        message: error.message
      });
    }
  }

  // Probar conexión SOAP
  async testSoapConnection(req, res) {
    try {
      console.log('🧪 Iniciando test de conexión SOAP...');
      const resultado = await banguatSoapService.testService();
      
      if (resultado.status === 'ok') {
        res.json({
          success: true,
          message: 'Conexión SOAP exitosa',
          data: resultado,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error en conexión SOAP',
          error: resultado.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error en test SOAP:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Actualizar datos desde SOAP (implementación real)
  async actualizarDesdeSoap(req, res) {
    try {
      console.log('🔄 Iniciando actualización desde SOAP...');
      const resultado = await banguatSoapService.obtenerTipoCambioDia();
      
      res.json({
        success: true,
        message: 'Datos actualizados correctamente desde SOAP',
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error actualizando desde SOAP:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando datos desde SOAP',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new BanguatController();