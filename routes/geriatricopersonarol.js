const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { asignarRolGeriatrico, inactivarRolGeriatrico } = require('../controllers/geriatricopersonarol');
const { validarRolGeriatrico, validarInactivarRolGeriatrico } = require('../validators/geriatricopersonarol'); // Asegúrate de que la ruta del archivo sea correcta




// http://localhost:3000/api/geriatricopersonarol


// rol q solo asigna el super administrador
router.post('/rolGeriatrico', sessionMiddleware, authMiddleware, checkRol([1]), validarRolGeriatrico, asignarRolGeriatrico);
router.post('/inactivarRolGeriatrico', sessionMiddleware, authMiddleware, checkRol([1]), validarInactivarRolGeriatrico, inactivarRolGeriatrico);







module.exports = router;
