const express = require('express');
const router = express.Router();
const banguatController = require('../controllers/apiController');

// ===== RUTAS ESPECÍFICAS PARA API BANGUAT =====

// Tipos de cambio
router.get('/tipos-cambio', banguatController.getTiposCambioActuales);
router.get('/tipos-cambio/:monedaId', banguatController.getTipoCambioMoneda);

// Monedas
router.get('/monedas', banguatController.getMonedas);

// Cambio del dólar
router.get('/dolar', banguatController.getCambioDolar);

// Actualización de datos
router.post('/actualizar', banguatController.actualizarDatos);

// Estadísticas
router.get('/estadisticas', banguatController.getEstadisticas);

// Tests de servicios
router.get('/test/soap', banguatController.testSoapService);
router.get('/test/database', banguatController.testDatabase);

// Nuevas rutas SOAP
router.get('/test/soap-connection', banguatController.testSoapConnection);
router.post('/actualizar-soap', banguatController.actualizarDesdeSoap);

// ===== RUTAS DE COMPATIBILIDAD (para frontend existente) =====

// Estas rutas mantienen compatibilidad con el frontend que ya existe
router.get('/users', banguatController.getUsers);
router.get('/users/:id', banguatController.getUserById);
router.get('/posts', banguatController.getPosts);
router.get('/posts/:id', banguatController.getPostById);
router.get('/users/:id/posts', banguatController.getUserPosts);

module.exports = router;