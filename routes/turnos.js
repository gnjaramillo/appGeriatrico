const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { turnoValidator, turnoUpdateValidator, turnoIdValidator } = require('../validators/turnos');
const { verMisTurnosEnfermeria, verMisTurnosEnfermeriaHistorial, verTurnosSede, verTurnosSedeHistorial, asignarTurnoEnfermeria, actualizarTurnoEnfermeria,  eliminarTurnoEnfermeria } = require('../controllers/turnos');



router.get('/misturnos', sessionMiddleware, authMiddleware, checkRol([5]),  verMisTurnosEnfermeria);
router.get('/mihistorial', sessionMiddleware, authMiddleware, checkRol([5]),  verMisTurnosEnfermeriaHistorial);

router.get('/sede', sessionMiddleware, authMiddleware,  checkRol([3]), verTurnosSede);
router.get('/historialsede', sessionMiddleware, authMiddleware, checkRol([3]),  verTurnosSedeHistorial);

router.post('/asignar/:enf_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoValidator, asignarTurnoEnfermeria);
router.put('/actualizar/:tur_id', sessionMiddleware, authMiddleware,checkRol([3]), turnoUpdateValidator, actualizarTurnoEnfermeria);
router.delete('/eliminar/:tur_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoIdValidator, eliminarTurnoEnfermeria);



module.exports = router;


//checkRol([3]),