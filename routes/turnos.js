const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { turnoValidator } = require('../validators/turnos');
const { asignarTurnoEnfermeria } = require('../controllers/turnos');



router.post('/asignar/:enf_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoValidator, asignarTurnoEnfermeria);

module.exports = router;
