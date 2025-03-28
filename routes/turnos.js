const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { turnoValidator, turnoUpdateValidator, turnoIdValidator, turnoEnfIdValidator } = require('../validators/turnos');
const { verMisTurnosEnfermeriaVigentes, verMisTurnosEnfermeriaHistorial, verTurnosSedeVigentes, verTurnosSedeHistorialEnfermera, asignarTurnoEnfermeria, actualizarTurnoEnfermeria,  eliminarTurnoEnfermeria } = require('../controllers/turnos');



router.get('/misturnos', sessionMiddleware, authMiddleware, checkRol([5]),  verMisTurnosEnfermeriaVigentes);
router.get('/mihistorial', sessionMiddleware, authMiddleware, checkRol([5]),  verMisTurnosEnfermeriaHistorial);

router.get('/sede', sessionMiddleware, authMiddleware,  checkRol([3]), verTurnosSedeVigentes);
router.get('/historialsede/:enf_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoEnfIdValidator, verTurnosSedeHistorialEnfermera);

router.post('/asignar/:enf_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoValidator, asignarTurnoEnfermeria);
router.put('/actualizar/:tur_id', sessionMiddleware, authMiddleware,checkRol([3]), turnoUpdateValidator, actualizarTurnoEnfermeria);
router.delete('/eliminar/:tur_id', sessionMiddleware, authMiddleware, checkRol([3]), turnoIdValidator, eliminarTurnoEnfermeria);



module.exports = router;


//checkRol([3]),