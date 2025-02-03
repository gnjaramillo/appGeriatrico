const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { asignarRolAdminSede,  asignarRol } = require('../controllers/sedepersonarol');
const { obtenerPersonasPorSede, obtenerPersonasPorGeriatrico } = require('../controllers/sedepersonarol');
const { validarAdminSede, validarAsignarRol } = require('../validators/sedepersonarol');




// http://localhost:3000/api/sedepersonarol


// rol q asigna el administrador geriatrico
router.post('/asignarRolesAdminSede', sessionMiddleware, authMiddleware,  checkRol([2]), validarAdminSede, asignarRolAdminSede);
router.post('/asignarRolSede', sessionMiddleware, authMiddleware, checkRol([3]), validarAsignarRol,  asignarRol);
router.get('/personasRolesSedes',sessionMiddleware, authMiddleware, checkRol([2,3]), obtenerPersonasPorSede);
router.get('/personasRolesGeriatrico',sessionMiddleware, authMiddleware, checkRol([2,3]), obtenerPersonasPorGeriatrico);







module.exports = router;

/* 
"rol_id": 1,
"rol_nombre": "super administrador",
"rol_id": 2,
"rol_nombre": "administrador geriatrico",
"rol_id": 3,
"rol_nombre": "administrador sede",
"rol_id": 4,
"rol_nombre": "paciente",
"rol_id": 5,
"rol_nombre": "enfermero(a)",
"rol_id": 6,
"rol_nombre": "acudiente",
"rol_id": 7,
"rol_nombre": "colaborador",
*/