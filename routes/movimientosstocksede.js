const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    historialMovimientosMedicamento,
    } = require('../controllers/movimientosstocksede');

    
const {
    validatorMedicamento
    } = require('../validators/movimientosstocksede');


router.get('/:med_sede_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorMedicamento,  historialMovimientosMedicamento);






module.exports = router;