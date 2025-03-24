const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validarDiagnostico, validarPacId } = require('../validators/diagnosticos');
const {registrarDiagnostico, obtenerDiagnostico } = require('../controllers/diagnosticos');





router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5, 6]), validarPacId, obtenerDiagnostico);
router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5]), validarDiagnostico, registrarDiagnostico);


module.exports = router;
