const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validarCuidadosEnfermeria, validarPacId } = require('../validators/cuidadosenfermeria');
const {obtenerCuidadosEnfermeria, registrarCuidadosEnfermeria } = require('../controllers/cuidadosenfermeria');





router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5, 6]), validarPacId, obtenerCuidadosEnfermeria);
router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5]), validarCuidadosEnfermeria, registrarCuidadosEnfermeria);


module.exports = router;
