const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    vincularMedicamentoInvPac,
    obtenerMedicamentosInvPaciente,
    entradaStockMedicamentoInvPaciente,
    salidaStockMedicamentoInvPaciente
     } = require('../controllers/inventariomedicamentospaciente');

const {
    validatorPrimerMovimiento,validatorStockMedicamento, validatorSalidaMedicamento, validarPacId     
     } = require('../validators/inventariomedicamentospaciente');



router.get('/:pac_id', sessionMiddleware, authMiddleware,  checkRol([3, 5]), validarPacId, obtenerMedicamentosInvPaciente);
router.post('/vinculoinicial/:med_id/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorPrimerMovimiento, vincularMedicamentoInvPac);
router.put('/entradastock/:med_pac_id', sessionMiddleware, authMiddleware,  checkRol([3, 5]), validatorStockMedicamento, entradaStockMedicamentoInvPaciente);
router.put('/salidastock/:med_pac_id', sessionMiddleware, authMiddleware,  checkRol([3, 5]), validatorSalidaMedicamento, salidaStockMedicamentoInvPaciente);




module.exports = router;








