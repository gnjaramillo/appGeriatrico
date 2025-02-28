const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { pacienteValidator } = require('../validators/pacientes');
const { registrarPaciente, obtenerRolesPacientesActivosSede, obtenerRolesPacientesSede, obtenerDetallePacienteSede } = require('../controllers/pacientes');




router.get('/activosSede', sessionMiddleware, authMiddleware, checkRol([3,5]), obtenerRolesPacientesActivosSede);
router.get('/sede', sessionMiddleware, authMiddleware, checkRol([3]), obtenerRolesPacientesSede);
router.get("/sede/:per_id", sessionMiddleware, authMiddleware, checkRol([3,5]), obtenerDetallePacienteSede);
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), pacienteValidator, registrarPaciente);

module.exports = router;
