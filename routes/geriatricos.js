const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    crearGeriatrico, 
    obtenerGeriatricos,
    obtenerDetalleGeriatrico, 
    actualizarGeriatrico, 
    homeMiGeriatrico, 
    inactivarGeriatrico, 
    reactivarGeriatrico } = require('../controllers/geriatricos');

const {
    validatorCrearGeriatrico, 
    validatorIdGeriatrico, 
    validatorActualizarGeriatrico } = require('../validators/geriatricos');

const upload = require('../middleware/multer');


// crear geriatrico lo hace el super admin
router.post('/', sessionMiddleware, authMiddleware,  checkRol([1]), upload.single('ge_logo'), validatorCrearGeriatrico, crearGeriatrico);
router.put('/inactivar/:ge_id', sessionMiddleware, authMiddleware,  checkRol([1]), validatorIdGeriatrico , inactivarGeriatrico);
router.put('/reactivar/:ge_id', sessionMiddleware, authMiddleware,  checkRol([1]), validatorIdGeriatrico, reactivarGeriatrico);
router.get('/',  sessionMiddleware, authMiddleware,  checkRol([1]), obtenerGeriatricos);
router.get('/homeGeriatrico', sessionMiddleware, authMiddleware,  checkRol([ 2, 3, 4, 5, 6]), homeMiGeriatrico);
router.get('/:ge_id',sessionMiddleware, authMiddleware,  checkRol([1]), validatorIdGeriatrico, obtenerDetalleGeriatrico);
router.put('/:ge_id', sessionMiddleware, authMiddleware,  checkRol([1]), upload.single('ge_logo'), validatorActualizarGeriatrico,  actualizarGeriatrico);

module.exports = router;


