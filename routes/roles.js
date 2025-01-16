const express = require('express');
const router = express.Router();
const { crearRol, obtenerRoles, obtenerDetalleRol, actualizarRol, obtenerRolesSede } = require('../controllers/roles');
const {validatorCrearRol, validatorDetalleRol, validatorActualizarRol } = require('../validators/roles');

router.post('/',  validatorCrearRol, crearRol);
router.get('/', obtenerRoles);
router.get('/rolesSede',  obtenerRolesSede);
router.get('/:rol_id', validatorDetalleRol, obtenerDetalleRol);
router.put('/:rol_id', validatorActualizarRol, actualizarRol);


module.exports = router;





