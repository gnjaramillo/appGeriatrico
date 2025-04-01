const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validatorCrearFormulacion } = require('../validators/administracionmedicamento');
const { registrarFormulacion } = require('../controllers/administracionmedicamento');






router.post('/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorCrearFormulacion, registrarFormulacion);


module.exports = router;
