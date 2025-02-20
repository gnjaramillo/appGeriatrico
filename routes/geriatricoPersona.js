const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { vincularPersonaAGeriatrico, personasVinculadasActivasMiGeriatrico } = require('../controllers/geriatricoPersona');
const { validarVincularGeriatrico } = require('../validators/geriatricoPersona'); 




// http://localhost:3000/api/geriatricopersona


// para vincular una persona del sistema a un geriatrico a cargo de los admin geriatrico o admin sede
router.get('/vinculadas', sessionMiddleware, authMiddleware, checkRol([2,3]), personasVinculadasActivasMiGeriatrico);
router.post('/vincular', sessionMiddleware, authMiddleware, checkRol([2,3]), validarVincularGeriatrico, vincularPersonaAGeriatrico);







module.exports = router;
