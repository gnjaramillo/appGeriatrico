const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { pacienteValidator } = require('../validators/pacientes');
const { registrarPaciente, obtenerPacientesPorSede, obtenerDetallePacienteSede } = require('../controllers/pacientes');


// Ruta para registrar enfermera

router.get('/sede', sessionMiddleware, authMiddleware, checkRol([3,5]), obtenerPacientesPorSede);
router.get("/sede/:per_id", sessionMiddleware, authMiddleware, checkRol([3,5]), obtenerDetallePacienteSede);
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), pacienteValidator, registrarPaciente);

module.exports = router;
