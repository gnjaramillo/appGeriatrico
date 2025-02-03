const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { crearSede, crearSedeSuperAdmin, obtenerSedes, obtenerSedesPorGeriatrico, obtenerDetalleSede, actualizarSede, obtenerHomeSede } = require('../controllers/sedes');
const {validatorCrearSede, validatorCrearSedeSuperAdmin, validatorDetalleSede, validatorActualizarSede } = require('../validators/sedes');
const upload = require('../middleware/multer');


router.post('/', sessionMiddleware, authMiddleware,  checkRol([2]), upload.single('se_foto'), validatorCrearSede, crearSede);
router.post('/crearSede', sessionMiddleware, authMiddleware,  checkRol([1]), upload.single('se_foto'), validatorCrearSedeSuperAdmin, crearSedeSuperAdmin);
router.get('/', sessionMiddleware, authMiddleware,  checkRol([1]), obtenerSedes);
router.get('/homeSede', sessionMiddleware, authMiddleware,  checkRol([ 2, 3, 4, 5, 6]), obtenerHomeSede);
router.get('/', sessionMiddleware, authMiddleware,  checkRol([2]), obtenerSedesPorGeriatrico);
router.get('/:se_id', sessionMiddleware, authMiddleware,  checkRol([2, 3]), validatorDetalleSede, obtenerDetalleSede);
router.put('/:se_id',sessionMiddleware, authMiddleware,  checkRol([2]), upload.single('se_foto'), validatorActualizarSede, actualizarSede);



module.exports = router;
