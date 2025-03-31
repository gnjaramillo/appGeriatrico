const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    obtenerMedicamentosSede,
    registrarMedicamentoSede, 
    agregarStockMedicamento, 
    actualizarMedicamento
     } = require('../controllers/inventariomedicamentosede');

const {
    validatorCrearMedicamento, 
    validatorStockMedicamento,
    validatorActualizarMedicamento
     } = require('../validators/inventariomedicamentosede');



router.get('/', sessionMiddleware, authMiddleware,  checkRol([3]),  obtenerMedicamentosSede);
router.post('/', sessionMiddleware, authMiddleware,  checkRol([3]), validatorCrearMedicamento, registrarMedicamentoSede);
router.put('/agregarstock/:med_sede_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorStockMedicamento, agregarStockMedicamento);
router.put('/:med_sede_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorActualizarMedicamento, actualizarMedicamento);


module.exports = router;






