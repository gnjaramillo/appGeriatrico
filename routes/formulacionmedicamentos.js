const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validatorCrearFormulacion, validatorUpdateFormulacion } = require('../validators/formulacionmedicamentos');
const { registrarFormulacionMedicamento, formulacionMedicamentoVigente, formulacionMedicamentoHistorial, actualizarFormulacionMedicamento } = require('../controllers/formulacionmedicamentos');






router.get('/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  formulacionMedicamentoVigente);
router.get('/historial/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  formulacionMedicamentoHistorial);
router.post('/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorCrearFormulacion, registrarFormulacionMedicamento);
router.put('/:admin_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorUpdateFormulacion, actualizarFormulacionMedicamento);


module.exports = router;
