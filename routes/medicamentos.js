const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    registrarMedicamento,
    obtenerMedicamentos,
    actualizarMedicamento   
    
     } = require('../controllers/medicamentos');

const {
    validatorCrearMedicamento,
    validatorActualizarMedicamento
     } = require('../validators/medicamentos');



router.get('/', sessionMiddleware, authMiddleware,  checkRol([3, 5]),  obtenerMedicamentos);
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorCrearMedicamento, registrarMedicamento);
router.put('/actualizar/:med_id', sessionMiddleware, authMiddleware,  checkRol([3, 5]), validatorActualizarMedicamento, actualizarMedicamento);



module.exports = router;



