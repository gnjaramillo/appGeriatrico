const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    historialMovimientosMedicamentoPac,
    } = require('../controllers/movimientosstockpaciente');

    
const {
    validatorMedicamento
    } = require('../validators/movimientosstockpaciente');


router.get('/:med_pac_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorMedicamento,  historialMovimientosMedicamentoPac);






module.exports = router;