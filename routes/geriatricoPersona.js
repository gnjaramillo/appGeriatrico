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


// para vincular una persona del sistema a un geriatrico a cargo de los admin geriatrico o admin sede
router.get('/rolesGeriatrico/:per_id', sessionMiddleware, authMiddleware, checkRol([2,3]),  obtenerPersonaRolesMiGeriatricoSede);
router.get('/vinculadas', sessionMiddleware, authMiddleware, checkRol([2,3]), personasVinculadasMiGeriatrico);
router.post('/vincular', sessionMiddleware, authMiddleware, checkRol([2,3]), validarPersonaGeriatrico, vincularPersonaAGeriatrico);
router.put('/desvincular/:per_id', sessionMiddleware, authMiddleware, checkRol([2]), validarPersonaGeriatrico, inactivarVinculacionGeriatrico );
router.put('/reactivarVinculacion/:per_id', sessionMiddleware, authMiddleware, checkRol([2, 3]), validarPersonaGeriatrico,  reactivarVinculacionGeriatrico);






module.exports = router;
