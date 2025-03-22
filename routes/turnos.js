const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { turnoValidator, turnoIdValidator } = require('../validators/turnos');
const { verMisTurnosEnfermeria, verTurnosSede, asignarTurnoEnfermeria, eliminarTurnoEnfermeria } = require('../controllers/turnos');



router.get('/misturnos', sessionMiddleware, authMiddleware, checkRol([5]),  verMisTurnosEnfermeria);
router.get('/sede', sessionMiddleware, authMiddleware, checkRol([3]),  verTurnosSede);
router.post('/asignar/:enf_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoValidator, asignarTurnoEnfermeria);
router.delete('/eliminar/:tur_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoIdValidator, eliminarTurnoEnfermeria);

module.exports = router;
