const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validarCuidadosEnfermeria, validarPacId, validarUpdateCuidadosEnfermeria } = require('../validators/cuidadosenfermeria');
const {obtenerCuidadosEnfermeria, registrarCuidadosEnfermeria, actualizarCuidadosEnfermeria } = require('../controllers/cuidadosenfermeria');





router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]), validarPacId, obtenerCuidadosEnfermeria);
router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([3]), validarCuidadosEnfermeria, registrarCuidadosEnfermeria);
router.put('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([3]), validarUpdateCuidadosEnfermeria, actualizarCuidadosEnfermeria);


module.exports = router;
