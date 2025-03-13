const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { pacienteValidator, pacienteUpdateValidator } = require('../validators/pacientes');
const { registrarPaciente, obtenerPacientesSede, obtenerRolesPacientesSede, obtenerDetallePaciente, obtenerAcudientesDePaciente, actualizarDetallePaciente } = require('../controllers/pacientes');




router.get('/sede', sessionMiddleware, authMiddleware, checkRol([3, 5]), obtenerPacientesSede);
router.get('/roles/:per_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), obtenerRolesPacientesSede);

router.get("/sede/:per_id", sessionMiddleware, authMiddleware, checkRol([3,5]), obtenerDetallePaciente);
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), pacienteValidator, registrarPaciente);
router.put('/:per_id', sessionMiddleware, authMiddleware, checkRol([2, 3]), pacienteUpdateValidator, actualizarDetallePaciente);



module.exports = router;
