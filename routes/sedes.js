const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { crearSede, obtenerSedes, obtenerDetalleSede, actualizarSede } = require('../controllers/sedes');
const {validatorCrearSede, validatorDetalleSede, validatorActualizarSede } = require('../validators/sedes');
const upload = require('../middleware/multer');


router.post('/', sessionMiddleware, authMiddleware,  checkRol([2]), upload.single('se_foto'), validatorCrearSede, crearSede);
router.get('/', sessionMiddleware, authMiddleware,  checkRol([2]), obtenerSedes);
router.get('/:se_id', sessionMiddleware, authMiddleware,  checkRol([2]), validatorDetalleSede, obtenerDetalleSede);
router.put('/:se_id',sessionMiddleware, authMiddleware,  checkRol([2]), upload.single('se_foto'), validatorActualizarSede, actualizarSede);



module.exports = router;
