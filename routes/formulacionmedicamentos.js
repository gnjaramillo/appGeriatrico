const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validatorCrearFormulacion } = require('../validators/formulacionmedicamentos');
const { registrarFormulacionMedicamento, formulacionMedicamentoVigente, formulacionMedicamentoHistorial, formulacionMedicamentoSuspendidas } = require('../controllers/formulacionmedicamentos');






router.get('/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  formulacionMedicamentoVigente);
router.get('/historial/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  formulacionMedicamentoHistorial);
router.get('/suspendidas/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  formulacionMedicamentoSuspendidas);
router.post('/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]), validatorCrearFormulacion, registrarFormulacionMedicamento);


module.exports = router;
