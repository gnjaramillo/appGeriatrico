const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validarRecomendaciones, validarPacId } = require('../validators/recomendaciones');
const {obtenerRecomendaciones, registrarRecomendacion } = require('../controllers/recomendaciones');





router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5, 6]), validarPacId, obtenerRecomendaciones);
router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5]), validarRecomendaciones, registrarRecomendacion);


module.exports = router;
