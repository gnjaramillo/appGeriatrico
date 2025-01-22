const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { asignarRolSuperUsuario, asignarRolAdminSede,  asignarRol, seleccionarRolYSede } = require('../controllers/sedepersonarol');
const { obtenerRolesAsignados, obtenerPersonasConRoles } = require('../controllers/sedepersonarol');
const { validarSuperUsuario, validarAdminSede, validarAsignarRol, validarRolSeleccionado } = require('../validators/sedepersonarol');




// http://localhost:3000/api/sedepersonarol


router.post('/superUsuario', validarSuperUsuario,  asignarRolSuperUsuario);
// rol q solo asigna el super administrador
router.post('/asignarAdminSede', sessionMiddleware, authMiddleware,  checkRol([1]), validarAdminSede, checkRol([1]), asignarRolAdminSede);
// ver mis roles asignados como usuario
router.get('/rolesAsignados',sessionMiddleware, authMiddleware,  obtenerRolesAsignados);
router.post('/rolSeleccionado', sessionMiddleware, authMiddleware, validarRolSeleccionado,  seleccionarRolYSede);
router.post('/asignarRol', sessionMiddleware, authMiddleware, checkRol([2]), validarAsignarRol,  asignarRol);
router.get('/listaPersonasRoles',sessionMiddleware, authMiddleware, checkRol([2]), obtenerPersonasConRoles);







module.exports = router;

/* 
"rol_id": 1,
"rol_nombre": "super administrador",
"rol_id": 2,
"rol_nombre": "administrador sede",
"rol_id": 3,
"rol_nombre": "paciente",
"rol_id": 4,
"rol_nombre": "enfermero(a)",
"rol_id": 5,
"rol_nombre": "acudiente",
"rol_id": 7,
"rol_nombre": "colaborador",
*/