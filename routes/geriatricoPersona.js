const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt');
const sessionMiddleware = require('../middleware/sessionRedis');
const checkRol = require('../middleware/rol');

const { 
    vinculoGeriatricoPersona,
    personasVinculadasPorGeriatrico,
    obtenerPersonaRolesPorGeriatrico,
    personasVinculadasMiGeriatrico, 
    obtenerPersonaRolesMiGeriatricoSede,
    inactivarVinculacionGeriatrico,
    reactivarVinculacionGeriatrico 
} = require('../controllers/geriatricoPersona');

    const { validarIdPersona, validarIdGeriatrico } = require('../validators/geriatricoPersona'); 




// http://localhost:3000/api/geriatricopersona


router.get('/vinculos/:per_id', sessionMiddleware, authMiddleware, checkRol([1]),  validarIdPersona, vinculoGeriatricoPersona);

// vistas super admin
router.get('/vinculadas/:ge_id', sessionMiddleware, authMiddleware, checkRol([1]),  validarIdGeriatrico, personasVinculadasPorGeriatrico);
router.get('/roles/:per_id/:ge_id', sessionMiddleware, authMiddleware, checkRol([1]),  validarIdPersona, validarIdGeriatrico, obtenerPersonaRolesPorGeriatrico);

// vistas admin sede y admin geriatrico
router.get('/rolesGeriatrico/:per_id', sessionMiddleware, authMiddleware, checkRol([2,3]), validarIdPersona, obtenerPersonaRolesMiGeriatricoSede);
router.get('/vinculadas', sessionMiddleware, authMiddleware, checkRol([2,3]), personasVinculadasMiGeriatrico);


// desvincular persona al geriatrico, inactiva todos sus roles en geriatrico y sedes asociadas
router.put('/desvincular/:per_id', sessionMiddleware, authMiddleware, checkRol([2]), validarIdPersona, inactivarVinculacionGeriatrico );

// reactivar vinculacion para permitir volver asignar roles, con nuevas fechas
router.put('/reactivarVinculacion/:per_id', sessionMiddleware, authMiddleware, checkRol([2, 3]), validarIdPersona,  reactivarVinculacionGeriatrico);






module.exports = router;
