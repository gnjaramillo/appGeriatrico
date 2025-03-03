const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { pacienteValidator } = require('../validators/pacientes');
const { registrarPaciente, obtenerRolesPacientesSede, obtenerDetallePaciente, obtenerAcudientesDePaciente } = require('../controllers/pacientes');




router.get('/sede', sessionMiddleware, authMiddleware, checkRol([3, 5]), obtenerRolesPacientesSede);
router.get('/acudientes/:pac_id', sessionMiddleware, authMiddleware, checkRol([3]), obtenerAcudientesDePaciente);

router.get("/sede/:per_id", sessionMiddleware, authMiddleware, checkRol([3,5]), obtenerDetallePaciente);
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), pacienteValidator, registrarPaciente);

module.exports = router;
