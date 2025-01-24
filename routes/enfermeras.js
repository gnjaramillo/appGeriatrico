const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validatorEnfermera } = require('../validators/enfermeras');
const { registrarEnfermera } = require('../controllers/enfermeras');


// Ruta para registrar enfermera
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), validatorEnfermera, registrarEnfermera);

module.exports = router;
