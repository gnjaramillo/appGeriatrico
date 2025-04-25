const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const {
    crearSede, 
    obtenerSedes, 
    obtenerSedesMiGeriatrico,
    obtenerDetalleSede,  
    actualizarSede, 
    obtenerHomeSede,
    inactivarSede,
    reactivarSede } = require('../controllers/sedes');

const {
    validatorCrearSede, 
    validatorIdSede, 
    validatorActualizarSede } = require('../validators/sedes');

const upload = require('../middleware/multer');


router.post('/', sessionMiddleware, authMiddleware,  checkRol([2]), upload.single('se_foto'), validatorCrearSede, crearSede);
router.put('/inactivar/:se_id',   validatorIdSede, inactivarSede);
router.put('/reactivar/:se_id', sessionMiddleware, authMiddleware,  checkRol([2]),  validatorIdSede, reactivarSede);
router.get('/',sessionMiddleware, authMiddleware,  checkRol([1,2]), obtenerSedes);
router.get('/sedesGeriatrico', sessionMiddleware, authMiddleware,  checkRol([2]), obtenerSedesMiGeriatrico);
router.get('/homeSede', sessionMiddleware, authMiddleware,  checkRol([ 2, 3, 4, 5, 6]), obtenerHomeSede);
router.get('/:se_id', sessionMiddleware, authMiddleware,  checkRol([2]), validatorIdSede, obtenerDetalleSede);
router.put('/:se_id',sessionMiddleware, authMiddleware,  checkRol([2]), upload.single('se_foto'), validatorActualizarSede, actualizarSede);



module.exports = router;
