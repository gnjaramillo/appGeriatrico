const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/session')
const { asignarRolSuperUsuario, asignarRolAdminSede,  asignarRol, seleccionarRolYSede } = require('../controllers/sedepersonarol');
const { obtenerRolesAsignados } = require('../controllers/sedepersonarol');
const { validarSuperUsuario, validarAdminSede, validarAsignarRol, validarRolSeleccionado } = require('../validators/sedepersonarol');



router.get('/rolesAsignados',authMiddleware,  obtenerRolesAsignados);


router.post('/rolSeleccionado',authMiddleware, validarRolSeleccionado,  seleccionarRolYSede);
router.post('/superUsuario', validarSuperUsuario,  asignarRolSuperUsuario);
router.post('/asignarAdminSede', validarAdminSede,  asignarRolAdminSede);
router.post('/asignarRol', authMiddleware, validarAsignarRol,  asignarRol);






module.exports = router;
