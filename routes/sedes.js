const express = require('express');
const router = express.Router();
const { crearSede, obtenerSedes, obtenerDetalleSede, actualizarSede } = require('../controllers/sedes');
const {validatorCrearSede, validatorDetalleSede, validatorActualizarSede } = require('../validators/sedes');
const upload = require('../middleware/multer');


router.post('/', upload.single('se_foto'), validatorCrearSede, crearSede);
router.get('/', obtenerSedes);
router.get('/:se_id', validatorDetalleSede, obtenerDetalleSede);
router.put('/:se_id', upload.single('se_foto'), validatorActualizarSede, actualizarSede);



module.exports = router;
