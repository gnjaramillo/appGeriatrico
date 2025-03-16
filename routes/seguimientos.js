const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validarSeguimientos} = require('../validators/seguimientos');
const { registrarSeguimientoPaciente } = require('../controllers/seguimientos');





// router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5, 6]), validarPacId, obtenerSeguimientosPaciente);
router.post('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([5]), upload.single('per_foto'), validarSeguimientos, registrarSeguimientoPaciente);


module.exports = router;