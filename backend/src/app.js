const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const databaseService = require('./services/databaseService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: 'http://localhost:4321', // Puerto del frontend Astro
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.originalUrl}`);
  next();
});

// Rutas
app.use('/api', apiRoutes);

// Ruta de health check
app.get('/health', async (req, res) => {
  try {
    const dbTest = await databaseService.testConnection();
    
    res.json({ 
      status: 'OK', 
      message: 'Backend funcionando correctamente',
      services: {
        database: dbTest ? 'OK' : 'ERROR',
        soap_api: 'OK'
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error en health check',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta para información del sistema
app.get('/info', (req, res) => {
  res.json({
    name: 'API Backend Banguat',
    version: '1.0.0',
    description: 'Backend para consumo de API SOAP del Banco de Guatemala',
    author: 'WillyBarrios',
    endpoints: {
      types_exchange: '/api/tipos-cambio',
      currencies: '/api/monedas',
      dollar_rate: '/api/dolar',
      update_data: 'POST /api/actualizar',
      statistics: '/api/estadisticas',
      health_check: '/health',
      compatibility: {
        users: '/api/users',
        posts: '/api/posts'
      }
    },
    database: {
      host: process.env.DB_HOST,
      name: process.env.DB_NAME,
      charset: process.env.DB_CHARSET
    },
    soap_api: {
      url: process.env.SOAP_API_URL,
      method: process.env.SOAP_METHOD
    },
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.stack}`);
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    suggestion: 'Visite /info para ver endpoints disponibles',
    timestamp: new Date().toISOString()
  });
});

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    console.log('🚀 Iniciando backend API Banguat...');
    
    // Test de conexión a base de datos
    const dbConnected = await databaseService.testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Advertencia: No se pudo conectar a la base de datos');
      console.warn('   El servidor funcionará pero sin persistencia de datos');
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
      console.log(`ℹ️  Información del sistema en http://localhost:${PORT}/info`);
      console.log(`🏦 API SOAP Banguat: ${process.env.SOAP_API_URL}`);
      console.log(`🗄️  Base de datos: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
      console.log('');
      console.log('📋 Endpoints principales:');
      console.log('   GET  /api/tipos-cambio    - Tipos de cambio actuales');
      console.log('   GET  /api/monedas         - Lista de monedas');
      console.log('   GET  /api/dolar           - Cambio del dólar');
      console.log('   POST /api/actualizar      - Actualizar datos desde SOAP');
      console.log('   GET  /api/estadisticas    - Estadísticas del sistema');
      console.log('');
      console.log('🔗 Compatibilidad frontend:');
      console.log('   GET  /api/users           - Monedas (como usuarios)');
      console.log('   GET  /api/posts           - Tipos cambio (como posts)');
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM recibido, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        databaseService.closePool();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🔄 SIGINT recibido (Ctrl+C), cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        databaseService.closePool();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error inicializando la aplicación:', error);
    process.exit(1);
  }
}

// Inicializar la aplicación
initializeApp();

module.exports = app;