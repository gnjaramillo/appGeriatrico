const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    registrarMedicamentoPaciente,
    obtenerMedicamentosInvPaciente,
    agregarStockMedicamentoPac,
    actualizarMedicamentoPac
     } = require('../controllers/inventariomedicamentospaciente');

const {
    validatorCrearMedicamento, validatorStockMedicamento, validatorActualizarMedicamento, validarPacId     
     } = require('../validators/inventariomedicamentospaciente');



router.get('/:pac_id', sessionMiddleware, authMiddleware,  checkRol([3]), validarPacId, obtenerMedicamentosInvPaciente);
router.post('/registrar/:pac_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorCrearMedicamento, registrarMedicamentoPaciente);
router.put('/agregarstock/:med_pac_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorStockMedicamento, agregarStockMedicamentoPac);
router.put('/:med_pac_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorActualizarMedicamento, actualizarMedicamentoPac);



module.exports = router;


