const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validarCuidadosEnfermeria } = require('../validators/cuidadosenfermeria');
const { registrarCuidadosEnfermeria } = require('../controllers/cuidadosenfermeria');





router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5]), validarCuidadosEnfermeria, registrarCuidadosEnfermeria);


module.exports = router;
