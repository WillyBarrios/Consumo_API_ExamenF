const axios = require('axios');
const xml2js = require('xml2js');
const databaseService = require('./databaseService');

class BanguatSoapService {
  constructor() {
    this.soapUrl = 'https://www.banguat.gob.gt/variables/ws/tipocambio.asmx';
    this.namespace = 'http://www.banguat.gob.gt/variables/ws/';
    this.soapAction = 'http://www.banguat.gob.gt/variables/ws/TipoCambioDia';
    this.parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    
    // Template SOAP exactamente como en Postman
    this.soapTemplate = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TipoCambioDia xmlns="http://www.banguat.gob.gt/variables/ws/" />
  </soap:Body>
</soap:Envelope>`;
  }

  async obtenerTipoCambioDia() {
    const startTime = Date.now();
    let statusCode = null;
    let totalRegistros = 0;
    let errorMensaje = null;

    try {
      console.log('🔄 Consultando tipos de cambio del día via SOAP...');
      console.log('📡 URL:', this.soapUrl);
      
      // Configurar headers exactamente como en Postman
      const headers = {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': this.soapAction
      };

      console.log('📋 Headers:', headers);
      console.log('📄 SOAP Body:', this.soapTemplate);

      // Realizar petición POST con axios (como en Postman)
      const response = await axios.post(this.soapUrl, this.soapTemplate, { 
        headers,
        timeout: 30000 // 30 segundos timeout
      });

      statusCode = response.status;
      console.log('✅ Respuesta recibida, status:', statusCode);

      if (!response.data) {
        throw new Error('Respuesta SOAP vacía');
      }

      // Procesar la respuesta XML
      console.log('🔄 Procesando respuesta XML...');
      const processedData = await this.procesarRespuestaXML(response.data);
      totalRegistros = this.contarRegistrosProcesados(processedData);

      // Guardar en base de datos
      console.log('💾 Guardando en base de datos...');
      await this.guardarEnBaseDatos(processedData);

      const tiempoRespuesta = Date.now() - startTime;

      // Registrar log de la consulta
      await databaseService.registrarLogConsulta(
        this.soapUrl,
        'POST',
        statusCode,
        tiempoRespuesta,
        totalRegistros,
        null,
        null
      );

      console.log(`✅ Tipos de cambio obtenidos y guardados: ${totalRegistros} registros en ${tiempoRespuesta}ms`);
      
      return {
        success: true,
        data: processedData,
        totalRegistros,
        tiempoRespuesta,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      statusCode = error.response?.status || 500;
      errorMensaje = error.message;
      const tiempoRespuesta = Date.now() - startTime;

      console.error('❌ Error en consulta SOAP:', {
        message: error.message,
        status: statusCode,
        url: this.soapUrl
      });

      // Registrar error en log
      await databaseService.registrarLogConsulta(
        this.soapUrl,
        'POST',
        statusCode,
        tiempoRespuesta,
        totalRegistros,
        errorMensaje,
        null
      );

      throw new Error(`Error consultando SOAP Banguat: ${error.message}`);
    }
  }

  async procesarRespuestaXML(xmlData) {
    try {
      console.log('🔄 Iniciando procesamiento XML...');
      
      // DEBUG: Mostrar una muestra de la respuesta XML
      console.log('📄 XML Response Preview (first 500 chars):', xmlData.substring(0, 500));
      
      // Parsear la respuesta XML
      const parsed = await this.parser.parseStringPromise(xmlData);
      console.log('✅ XML parseado correctamente');
      
      // DEBUG: Mostrar la estructura parseada
      console.log('🔍 Estructura parseada:', JSON.stringify(parsed, null, 2).substring(0, 1000));

      // Navegar por la estructura SOAP response
      const soapBody = parsed['soap:Envelope']['soap:Body'];
      const tipoCambioResponse = soapBody['TipoCambioDiaResponse'];
      const tipoCambioResult = tipoCambioResponse['TipoCambioDiaResult'];

      console.log('🎯 TipoCambioResult keys:', Object.keys(tipoCambioResult || {}));

      const resultado = {
        monedas: [],
        tiposCambio: [],
        cambioDolar: [],
        totalItems: 0,
        fechaConsulta: new Date().toISOString()
      };

      // Procesar CambioDolar (referencia del dólar - esto SÍ viene en la respuesta)
      if (tipoCambioResult.CambioDolar && tipoCambioResult.CambioDolar.VarDolar) {
        const varDolar = tipoCambioResult.CambioDolar.VarDolar;
        console.log('💰 Procesando CambioDolar:', varDolar);

        // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
        const fechaOriginal = varDolar.fecha || '';
        const fechaConvertida = this.convertirFecha(fechaOriginal);

        resultado.cambioDolar.push({
          fecha: fechaConvertida,
          referencia: parseFloat(varDolar.referencia) || 0
        });

        // También agregamos como tipo de cambio del dólar (moneda 2)
        resultado.tiposCambio.push({
          moneda: 2, // Código del dólar
          fecha: fechaConvertida,
          venta: 0,
          compra: 0,
          referencia: parseFloat(varDolar.referencia) || 0
        });

        console.log('✅ Fecha convertida de', fechaOriginal, 'a', fechaConvertida);
      }

      // Procesar Variables (catálogo de monedas) - NOTA: Este endpoint NO devuelve esto
      if (tipoCambioResult.Variables && tipoCambioResult.Variables.Variable) {
        const variables = Array.isArray(tipoCambioResult.Variables.Variable) 
          ? tipoCambioResult.Variables.Variable 
          : [tipoCambioResult.Variables.Variable];

        console.log(`📝 Procesando ${variables.length} monedas...`);

        for (const variable of variables) {
          resultado.monedas.push({
            codigo: parseInt(variable.moneda) || 0,
            descripcion: variable.descripcion || '',
            simbolo: this.obtenerSimboloMoneda(parseInt(variable.moneda) || 0)
          });
        }
      } else {
        console.log('ℹ️  No se encontraron Variables (monedas) en la respuesta XML');
      }

      // Procesar CambioDia (tipos de cambio del día) - NOTA: Este endpoint NO devuelve esto
      if (tipoCambioResult.CambioDia && tipoCambioResult.CambioDia.Var) {
        const cambios = Array.isArray(tipoCambioResult.CambioDia.Var) 
          ? tipoCambioResult.CambioDia.Var 
          : [tipoCambioResult.CambioDia.Var];

        console.log(`💱 Procesando ${cambios.length} tipos de cambio...`);

        for (const cambio of cambios) {
          resultado.tiposCambio.push({
            moneda: parseInt(cambio.moneda) || 0,
            fecha: this.convertirFecha(cambio.fecha),
            venta: parseFloat(cambio.venta) || 0,
            compra: parseFloat(cambio.compra) || 0,
            referencia: null
          });
        }
      } else {
        console.log('ℹ️  No se encontraron CambioDia (tipos de cambio) en la respuesta XML');
      }

      // Procesar TotalItems
      resultado.totalItems = parseInt(tipoCambioResult.TotalItems) || 0;

      console.log(`✅ Procesamiento completado: ${resultado.monedas.length} monedas, ${resultado.tiposCambio.length} tipos de cambio, ${resultado.cambioDolar.length} cambio dólar`);

      return resultado;

    } catch (error) {
      console.error('❌ Error procesando respuesta XML:', error);
      console.error('📄 XML recibido:', xmlData.substring(0, 500) + '...');
      throw new Error(`Error procesando datos XML: ${error.message}`);
    }
  }

  async guardarEnBaseDatos(data) {
    try {
      console.log('💾 Guardando datos en base de datos...');

      // Guardar monedas (si las hay)
      for (const moneda of data.monedas) {
        try {
          await databaseService.insertarMoneda(
            moneda.codigo,
            moneda.descripcion,
            this.obtenerSimboloMoneda(moneda.codigo)
          );
        } catch (error) {
          console.error(`⚠️  Error guardando moneda ${moneda.codigo}:`, error.message);
        }
      }

      // Guardar tipos de cambio
      for (const cambio of data.tiposCambio) {
        try {
          await databaseService.insertarTipoCambio(
            cambio.moneda,
            cambio.fecha,
            cambio.compra,
            cambio.venta,
            cambio.referencia // Incluir la referencia
          );
        } catch (error) {
          console.error(`⚠️  Error guardando tipo cambio moneda ${cambio.moneda}:`, error.message);
        }
      }

      // Guardar referencias del dólar
      for (const dolar of data.cambioDolar) {
        try {
          await databaseService.insertarCambioDolar(
            dolar.fecha,
            dolar.referencia
          );
        } catch (error) {
          console.error(`⚠️  Error guardando cambio dólar fecha ${dolar.fecha}:`, error.message);
        }
      }

      console.log('✅ Datos guardados correctamente en la base de datos');

    } catch (error) {
      console.error('❌ Error guardando en base de datos:', error);
      throw error;
    }
  }

  contarRegistrosProcesados(data) {
    return (data.monedas?.length || 0) + 
           (data.tiposCambio?.length || 0) + 
           (data.cambioDolar?.length || 0);
  }

  obtenerSimboloMoneda(codigoMoneda) {
    const simbolos = {
      1: 'Q',      // Quetzal
      2: '$',      // Dólar
      3: '€',      // Euro
      4: '£',      // Libra
      5: '¥',      // Yen
      6: '₩',      // Won
      7: '¥',      // Yuan
      8: '$',      // Peso MX
      9: 'R$',     // Real
      10: '$'      // Peso AR
    };
    return simbolos[codigoMoneda] || null;
  }

  // Método para convertir fecha de DD/MM/YYYY a YYYY-MM-DD
  convertirFecha(fechaOriginal) {
    try {
      if (!fechaOriginal) {
        return new Date().toISOString().split('T')[0];
      }

      // Si ya está en formato YYYY-MM-DD, devolverla tal como está
      if (fechaOriginal.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return fechaOriginal;
      }

      // Convertir de DD/MM/YYYY a YYYY-MM-DD
      if (fechaOriginal.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [dia, mes, año] = fechaOriginal.split('/');
        return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }

      // Si no reconoce el formato, usar fecha actual
      console.log('⚠️  Formato de fecha no reconocido:', fechaOriginal);
      return new Date().toISOString().split('T')[0];

    } catch (error) {
      console.error('❌ Error convirtiendo fecha:', error);
      return new Date().toISOString().split('T')[0];
    }
  }

  // Métodos para el controller
  async obtenerDatosBD() {
    try {
      const [monedas, tiposCambio, cambioDolar] = await Promise.all([
        databaseService.obtenerMonedas(),
        databaseService.obtenerTiposCambioActuales(),
        databaseService.obtenerCambioDolarActual()
      ]);

      return {
        success: true,
        data: {
          monedas,
          tiposCambio,
          cambioDolar: cambioDolar[0] || null
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error obteniendo datos de BD:', error);
      throw error;
    }
  }

  async obtenerHistorialMoneda(monedaId, fechaInicio = null, fechaFin = null) {
    try {
      const historial = await databaseService.obtenerHistorialTipoCambio(monedaId, fechaInicio, fechaFin);
      
      return {
        success: true,
        data: historial,
        count: historial.length,
        monedaId,
        fechaInicio,
        fechaFin
      };
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }
  }

  // Método para forzar actualización de datos
  async actualizarDatos() {
    try {
      console.log('🔄 Forzando actualización de datos...');
      return await this.obtenerTipoCambioDia();
    } catch (error) {
      console.error('❌ Error actualizando datos:', error);
      throw error;
    }
  }

  // Test del servicio usando el método directo de axios
  async testService() {
    try {
      console.log('🧪 Probando servicio SOAP...');
      
      const headers = {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': this.soapAction
      };

      const response = await axios.post(this.soapUrl, this.soapTemplate, { 
        headers,
        timeout: 10000
      });

      return {
        status: 'ok',
        message: 'Servicio SOAP funcionando correctamente',
        soapUrl: this.soapUrl,
        statusCode: response.status,
        contentLength: response.data.length
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        soapUrl: this.soapUrl,
        statusCode: error.response?.status || 'No response'
      };
    }
  }
}

module.exports = new BanguatSoapService();