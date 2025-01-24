const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { asignarRolGeriatrico } = require('../controllers/geriatricopersonarol');
const { validarRolGeriatrico } = require('../validators/geriatricopersonarol'); // Asegúrate de que la ruta del archivo sea correcta




// http://localhost:3000/api/geriatricopersonarol

// console.log({ asignarRolGeriatrico, validarRolGeriatrico });

// rol q solo asigna el super administrador
router.post('/rolGeriatrico', sessionMiddleware, checkRol([1]), validarRolGeriatrico, asignarRolGeriatrico);







module.exports = router;
