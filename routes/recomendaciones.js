const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validarRecomendaciones, validarPacId, validarUpdateRecomendaciones } = require('../validators/recomendaciones');
const {obtenerRecomendaciones, registrarRecomendacion, actualizarRecomendacion } = require('../controllers/recomendaciones');





router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]), validarPacId, obtenerRecomendaciones);
router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([3]), validarRecomendaciones, registrarRecomendacion);
router.put('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([3]), validarUpdateRecomendaciones, actualizarRecomendacion);


module.exports = router;
