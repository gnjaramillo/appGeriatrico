const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validatorCrearFormulacion, validatorUpdateFormulacion, validatorIdFormulacion, validatorSuspenderFormulacion, validatorAmpliarFechaFin } = require('../validators/formulacionmedicamentos');
const { 
    registrarFormulacionMedicamento, 
    formulacionMedicamentoVigente, 
    formulacionMedicamentoHistorial, 
    actualizarFormulacionPendiente, 
    deleteFormulacionPendiente, 
    suspenderFormulacionEnCurso,
    extenderFechaFinFormulacion,
    obtenerFormulacionesDelDia,
 } = require('../controllers/formulacionmedicamentos');






router.get('/diaria/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  obtenerFormulacionesDelDia);
router.get('/historial/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  formulacionMedicamentoHistorial);
router.get('/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]),  formulacionMedicamentoVigente);


router.post('/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorCrearFormulacion, registrarFormulacionMedicamento);


router.put('/:admin_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorUpdateFormulacion, actualizarFormulacionPendiente);
router.put('/suspender/:admin_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorSuspenderFormulacion, suspenderFormulacionEnCurso);
router.put('/extender/:admin_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorAmpliarFechaFin, extenderFechaFinFormulacion);


router.delete('/:admin_id', sessionMiddleware, authMiddleware, checkRol([3, 5]), validatorIdFormulacion, deleteFormulacionPendiente);


module.exports = router;
