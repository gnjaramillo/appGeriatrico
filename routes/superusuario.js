const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { asignarRolSuperUsuario} = require('../controllers/superusuario');
const { validarSuperUsuario } = require('../validators/superusuario');




router.post('/', validarSuperUsuario,  asignarRolSuperUsuario);




module.exports = router