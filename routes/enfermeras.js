const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validatorEnfermera } = require('../validators/enfermeras');
const { registrarEnfermera, obtenerEnfermerasSede, obtenerRolesEnfermerasSede } = require('../controllers/enfermeras');



router.get('/sede', sessionMiddleware, authMiddleware, checkRol([3]), obtenerEnfermerasSede);
router.get('/roles/:per_id', sessionMiddleware, authMiddleware, checkRol([3]), obtenerRolesEnfermerasSede);
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), validatorEnfermera, registrarEnfermera);

module.exports = router;
