const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { crearGeriatrico, obtenerGeriatricos, obtenerDetalleGeriatrico, actualizarGeriatrico } = require('../controllers/geriatricos');
const {validatorCrearGeriatrico, validatorDetalleGeriatrico, validatorActualizarGeriatrico } = require('../validators/geriatricos');
const upload = require('../middleware/multer');



router.post('/', sessionMiddleware, authMiddleware,  checkRol([1]),

upload.single('ge_logo'), validatorCrearGeriatrico, crearGeriatrico);
router.get('/', obtenerGeriatricos);
router.get('/:ge_id', validatorDetalleGeriatrico ,obtenerDetalleGeriatrico);
router.put('/:ge_id', upload.single('ge_logo'), validatorActualizarGeriatrico,  actualizarGeriatrico);

module.exports = router;


