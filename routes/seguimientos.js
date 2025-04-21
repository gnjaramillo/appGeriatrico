const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const convertirStringsVaciosANull = require('../middleware/convertirVaciosANull')
const checkRol = require('../middleware/rol');
const { validarSeguimientos, validarPacId, validarSegId, validarUpdateSeguimiento} = require('../validators/seguimientos');
const { registrarSeguimientoPaciente, obtenerHistorialSeguimientos, obtenerSeguimientoPorId, actualizarSeguimientoPaciente } = require('../controllers/seguimientos');





// router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5, 6]), validarPacId, obtenerSeguimientosPaciente);
router.get('/historialpaciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([2,3,4,5,6]), validarPacId, obtenerHistorialSeguimientos);
router.get('/:seg_id', sessionMiddleware, authMiddleware, checkRol([2,3,4,5,6]), validarSegId, obtenerSeguimientoPorId);
router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5]), upload.single('seg_foto'), convertirStringsVaciosANull, validarSeguimientos, registrarSeguimientoPaciente);
router.put('/actualizar/:seg_id', sessionMiddleware, authMiddleware, checkRol([5]), upload.single('seg_foto'), convertirStringsVaciosANull, validarUpdateSeguimiento, actualizarSeguimientoPaciente);


module.exports = router;