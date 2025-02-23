const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { asignarRolAdminSede, inactivarRolAdminSede, asignarRolesSede, inactivarRolSede } = require('../controllers/sedepersonarol');
const { validarAdminSede, validarAsignarRol, validarInactivarRol } = require('../validators/sedepersonarol');




// http://localhost:3000/api/sedepersonarol


router.post('/asignarRolesAdminSede', sessionMiddleware, authMiddleware,  checkRol([2]), validarAdminSede, asignarRolAdminSede);
router.post('/asignarRolSede', sessionMiddleware, authMiddleware, checkRol([3]), validarAsignarRol,  asignarRolesSede);
router.put('/inactivarRolAdminSede', sessionMiddleware, authMiddleware,  checkRol([2]), validarInactivarRol, inactivarRolAdminSede);
router.put('/inactivarRolSede', sessionMiddleware, authMiddleware,  checkRol([3]), validarInactivarRol, inactivarRolSede);





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