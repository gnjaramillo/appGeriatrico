const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { crearRol, obtenerRoles, obtenerHistorialRoles, obtenerDetalleRol, actualizarRol, obtenerRolesAsignados, seleccionarRol} = require('../controllers/roles');
const {validatorCrearRol, validatorDetalleRol, validatorActualizarRol, validarRolSeleccionado } = require('../validators/roles');



router.get('/', sessionMiddleware, authMiddleware, checkRol([1, 2, 3]), obtenerRoles); // los admin los obtienen para poder asignarlos
router.get('/historialGeriatrico/:ge_id', sessionMiddleware, authMiddleware, checkRol([1]), obtenerHistorialRoles);
router.get('/rolesAsignados', sessionMiddleware, authMiddleware,  obtenerRolesAsignados);
router.get('/:rol_id', sessionMiddleware, authMiddleware, checkRol([1]), validatorDetalleRol, obtenerDetalleRol);

router.post('/', sessionMiddleware, authMiddleware, checkRol([1]), validatorCrearRol, crearRol);
router.post('/rolSeleccionado', sessionMiddleware, authMiddleware, validarRolSeleccionado,  seleccionarRol);

router.put('/:rol_id', sessionMiddleware, authMiddleware, checkRol([1]), validatorActualizarRol, actualizarRol);
// ver mis roles asignados como usuario







module.exports = router;





