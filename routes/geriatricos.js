const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { crearGeriatrico, obtenerGeriatricos, obtenerDetalleGeriatrico, actualizarGeriatrico, homeMiGeriatrico, obtenerColoresGeriatrico } = require('../controllers/geriatricos');
const {validatorCrearGeriatrico, validatorDetalleGeriatrico, validatorActualizarGeriatrico } = require('../validators/geriatricos');
const upload = require('../middleware/multer');


// crear geriatrico lo hace el super admin
router.post('/', sessionMiddleware, authMiddleware,  checkRol([1]), upload.single('ge_logo'), validatorCrearGeriatrico, crearGeriatrico);
router.get('/', sessionMiddleware, authMiddleware,  checkRol([1]), obtenerGeriatricos);
router.get('/homeGeriatrico', sessionMiddleware, authMiddleware,  checkRol([ 2, 3, 4, 5, 6]), homeMiGeriatrico);
router.get('/colores/:ge_id', sessionMiddleware, authMiddleware,  obtenerColoresGeriatrico);
router.get('/:ge_id',sessionMiddleware, authMiddleware,  checkRol([1]), validatorDetalleGeriatrico ,obtenerDetalleGeriatrico);
router.put('/:ge_id', sessionMiddleware, authMiddleware,  checkRol([1]), upload.single('ge_logo'), validatorActualizarGeriatrico,  actualizarGeriatrico);

module.exports = router;


