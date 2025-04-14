const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    vincularMedicamentoInvSede,
    obtenerMedicamentosInvSede,     
    entradaStockMedicamentoInvSede,
    salidaStockMedicamentoInvSede, 
    } = require('../controllers/inventariomedicamentosede');

    
const {
    validatorPrimerMovimiento,    
    validatorStockMedicamento,
    validatorSalidaMedicamento,
    } = require('../validators/inventariomedicamentosede');


router.post('/vinculoinicial/:med_id', sessionMiddleware, authMiddleware, checkRol([3]), validatorPrimerMovimiento, vincularMedicamentoInvSede);
router.get('/', sessionMiddleware, authMiddleware,  checkRol([3, 5]),  obtenerMedicamentosInvSede);
router.put('/entradastock/:med_sede_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorStockMedicamento, entradaStockMedicamentoInvSede);
router.put('/salidastock/:med_sede_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorSalidaMedicamento, salidaStockMedicamentoInvSede);






module.exports = router;






