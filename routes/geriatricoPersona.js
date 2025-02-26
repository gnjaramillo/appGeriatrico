const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt');
const sessionMiddleware = require('../middleware/sessionRedis');
const checkRol = require('../middleware/rol');

const { 
    vincularPersonaAGeriatrico, 
    personasVinculadasMiGeriatrico, 
    obtenerPersonaRolesMiGeriatricoSede,
    inactivarVinculacionGeriatrico,
    reactivarVinculacionGeriatrico 
} = require('../controllers/geriatricoPersona');

    const { validarPersonaGeriatrico } = require('../validators/geriatricoPersona'); 




// http://localhost:3000/api/geriatricopersona



router.get('/rolesGeriatrico/:per_id', sessionMiddleware, authMiddleware, checkRol([2,3]),  obtenerPersonaRolesMiGeriatricoSede);
router.get('/vinculadas', sessionMiddleware, authMiddleware, checkRol([2,3]), personasVinculadasMiGeriatrico);

// vinculacion inicial al geriatrico
router.post('/vincular', sessionMiddleware, authMiddleware, checkRol([2,3]), validarPersonaGeriatrico, vincularPersonaAGeriatrico);

// desvincular persona al geriatrico, inactiva todos sus roles en geriatrico y sedes asociadas
router.put('/desvincular/:per_id', sessionMiddleware, authMiddleware, checkRol([2]), validarPersonaGeriatrico, inactivarVinculacionGeriatrico );

// reactivar vinculacion para permitir volver asignar roles, con nuevas fechas
router.put('/reactivarVinculacion/:per_id', sessionMiddleware, authMiddleware, checkRol([2, 3]), validarPersonaGeriatrico,  reactivarVinculacionGeriatrico);






module.exports = router;
